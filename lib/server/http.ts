import { NextResponse } from "next/server";
import type { z } from "zod";
import { env } from "./env";
import { can, currentUser, type CmsUser } from "./auth";
import { redis } from "./redis";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Wrap a route handler: turns HttpError and validation errors into JSON responses. */
export function handle<A extends unknown[]>(fn: (req: Request, ...a: A) => Promise<Response>) {
  return async (req: Request, ...a: A) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") checkOrigin(req);
      return await fn(req, ...a);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/**
 * Cross-site request protection for cookie-authenticated writes: the browser's Origin must be the host the
 * request was sent to, or SITE_URL. Hosts are compared, not schemes: behind a proxy (Railway, Caddy) HTTPS
 * ends at the edge, so the app sees http:// while the browser sends an https:// Origin. A cross-site page
 * cannot fake Host or X-Forwarded-Host on a browser request, so the check still stops cross-site writes.
 */
function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin fetches from older browsers and server-side calls
  let from: string;
  try {
    from = new URL(origin).host.toLowerCase();
  } catch {
    throw new HttpError(403, "Request blocked: wrong origin.");
  }
  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const allowed = new Set(
    [forwarded, req.headers.get("host"), new URL(req.url).host, new URL(env.SITE_URL).host].filter((h): h is string => !!h).map((h) => h.toLowerCase()),
  );
  if (!allowed.has(from)) throw new HttpError(403, "Request blocked: wrong origin.");
}

export async function body<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new HttpError(422, "Please check the highlighted fields.", r.error.issues.map((i) => ({ path: i.path, message: i.message })));
  return r.data;
}

/** Require a signed-in user, optionally with a permission. */
export async function requireUser(permission?: string): Promise<CmsUser> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Please sign in.");
  if (permission && !can(u, permission)) throw new HttpError(403, "You don't have permission to do this.");
  return u;
}

/** Fixed-window rate limit in Redis. */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const r = redis();
  const k = `rl:${key}`;
  const n = await r.incr(k);
  if (n === 1) await r.expire(k, windowSec);
  if (n > limit) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
}
