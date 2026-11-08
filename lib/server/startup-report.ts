/**
 * Startup report: when the website or the worker starts (e.g. after a Railway deploy), print which
 * deployment is running and whether each service it depends on is reachable. Secrets are never printed:
 * only hosts, names and whether a key is set. Also used by the worker's health endpoint.
 */
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "./db";
import { env } from "./env";
import { mediaQueue } from "./queue";
import { redis } from "./redis";
import { s3 } from "./storage";

export type Role = "web" | "worker";
export interface Check {
  name: string;
  ok: boolean;
  detail: string;
  /** A problem that doesn't stop the service (e.g. email not set up). */
  warning?: boolean;
}

const run = promisify(execFile);

/** Resolve within `ms`, or fail with a timeout. */
function within<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`no answer in ${ms / 1000} s`)), ms))]);
}
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).split("\n")[0].slice(0, 200);

/** "host:port/database" from a connection URL, without user or password. */
function where(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname.length > 1 ? u.pathname : ""}`;
  } catch {
    return "(invalid URL)";
  }
}

export async function checkMysql(): Promise<Check> {
  try {
    await within(db.execute(sql`select 1`));
    let migrations = "";
    try {
      const [rows] = (await within(db.execute(sql`select count(*) as n from __drizzle_migrations`))) as unknown as [{ n: number }[]];
      migrations = `, ${rows[0]?.n ?? 0} migrations applied`;
    } catch {
      migrations = ", migrations table missing (run npm run db:migrate)";
    }
    return { name: "mysql", ok: true, detail: `${where(env.DATABASE_URL)}${migrations}` };
  } catch (e) {
    return { name: "mysql", ok: false, detail: `${where(env.DATABASE_URL)}: ${msg(e)}` };
  }
}

export async function checkRedis(): Promise<Check> {
  try {
    if ((await within(redis().ping())) !== "PONG") throw new Error("no PONG");
    const c = await within(mediaQueue().getJobCounts("waiting", "active", "delayed", "failed"));
    return { name: "redis", ok: true, detail: `${where(env.REDIS_URL)}; media queue: ${c.waiting} waiting, ${c.active} active, ${c.delayed} retrying, ${c.failed} failed` };
  } catch (e) {
    return { name: "redis", ok: false, detail: `${where(env.REDIS_URL)}: ${msg(e)}` };
  }
}

async function checkStorage(): Promise<Check> {
  const detail = `endpoint ${where(env.S3_ENDPOINT)}, bucket ${env.S3_BUCKET}, public ${env.S3_PUBLIC_URL}${env.S3_UPLOAD_ENDPOINT ? `, uploads ${env.S3_UPLOAD_ENDPOINT}` : ""}`;
  try {
    await within(s3().send(new HeadBucketCommand({ Bucket: env.S3_BUCKET })));
    return { name: "storage", ok: true, detail };
  } catch (e) {
    const missing = (e as { name?: string })?.name === "NotFound";
    // A missing bucket is created on the first upload; only a connection problem is an error.
    return missing ? { name: "storage", ok: true, warning: true, detail: `${detail} (bucket not created yet; it is created on the first upload)` } : { name: "storage", ok: false, detail: `${detail}: ${msg(e)}` };
  }
}

/** Checks the Brevo key with a read-only call (also catches "unrecognised IP address"). */
async function checkEmail(): Promise<Check> {
  const from = `from ${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL}>`;
  if (!env.BREVO_API_KEY) return { name: "email", ok: true, warning: true, detail: `BREVO_API_KEY is not set: emails are NOT sent (invitations, password resets), only written to the log` };
  if (env.BREVO_API_KEY.startsWith("xsmtpsib-")) return { name: "email", ok: true, warning: true, detail: `BREVO_API_KEY is an SMTP key (xsmtpsib-…); use an API key (xkeysib-…)` };
  try {
    const res = await within(fetch("https://api.brevo.com/v3/account", { headers: { "api-key": env.BREVO_API_KEY, accept: "application/json" } }));
    if (res.ok) {
      const a = (await res.json().catch(() => ({}))) as { companyName?: string };
      return { name: "email", ok: true, detail: `Brevo connected${a.companyName ? ` (${a.companyName})` : ""}, ${from}` };
    }
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { name: "email", ok: true, warning: true, detail: `Brevo refused the key (${res.status}): ${(body.message ?? "").slice(0, 200)}` };
  } catch (e) {
    return { name: "email", ok: true, warning: true, detail: `couldn't reach Brevo: ${msg(e)}` };
  }
}

async function checkFfmpeg(): Promise<Check> {
  try {
    const [f, p] = await Promise.all([within(run("ffmpeg", ["-version"])), within(run("ffprobe", ["-version"]))]);
    const v = (s: string) => s.split("\n")[0].replace(/ Copyright.*/, "");
    return { name: "ffmpeg", ok: true, detail: `${v(f.stdout)}; ${v(p.stdout).split(" ").slice(0, 3).join(" ")}` };
  } catch (e) {
    return { name: "ffmpeg", ok: false, detail: `not available (videos can't be processed): ${msg(e)}` };
  }
}

/** Which deployment this is, from the variables Railway sets. */
function deployment() {
  const e = process.env;
  const parts = [
    e.RAILWAY_SERVICE_NAME && `service ${e.RAILWAY_SERVICE_NAME}`,
    e.RAILWAY_ENVIRONMENT_NAME && `environment ${e.RAILWAY_ENVIRONMENT_NAME}`,
    e.RAILWAY_GIT_COMMIT_SHA && `commit ${e.RAILWAY_GIT_COMMIT_SHA.slice(0, 7)}${e.RAILWAY_GIT_BRANCH ? ` (${e.RAILWAY_GIT_BRANCH})` : ""}`,
    e.RAILWAY_DEPLOYMENT_ID && `deployment ${e.RAILWAY_DEPLOYMENT_ID.slice(0, 8)}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "local";
}

export async function runChecks(role: Role): Promise<Check[]> {
  // The website sends the emails; the worker processes uploads with ffmpeg.
  const checks = [checkMysql(), checkRedis(), checkStorage(), role === "web" ? checkEmail() : checkFfmpeg()];
  return Promise.all(checks);
}

/** Print the report. Never throws: a broken dependency is reported, not fatal. */
export async function printStartupReport(role: Role, extra: string[] = []) {
  const tag = `[${role}]`;
  try {
    const checks = await runChecks(role);
    const lines = [
      `${tag} ── Air Dive Alor ${role === "web" ? "website + CMS" : "media worker"} started ──`,
      `${tag} deployment: ${deployment()}`,
      `${tag} node ${process.version}, NODE_ENV=${process.env.NODE_ENV ?? "development"}`,
      ...(role === "web" ? [`${tag} site: ${env.SITE_URL}${process.env.CMS_API_URL ? `, CMS API ${process.env.CMS_API_URL}` : ""}, port ${process.env.PORT ?? "3000"}`] : []),
      ...extra.map((x) => `${tag} ${x}`),
      ...checks.map((c) => `${tag} ${c.ok ? (c.warning ? "!" : "✓") : "✗"} ${c.name.padEnd(7)} ${c.detail}`),
    ];
    const bad = checks.filter((c) => !c.ok).map((c) => c.name);
    const warn = checks.filter((c) => c.ok && c.warning).map((c) => c.name);
    lines.push(
      bad.length
        ? `${tag} ✗ started with problems: ${bad.join(", ")}${warn.length ? `; warnings: ${warn.join(", ")}` : ""}`
        : warn.length
          ? `${tag} ✓ ready (warnings: ${warn.join(", ")})`
          : `${tag} ✓ ready: all checks passed`,
    );
    console.info(lines.join("\n"));
  } catch (e) {
    console.error(`${tag} startup report failed: ${msg(e)}`);
  }
}
