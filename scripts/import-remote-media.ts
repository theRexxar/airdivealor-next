/**
 * Copy images that are still hotlinked from other sites (the old airdivealor.com, Wix) into the media
 * library, and point the content at the library copies. Run this on the new server BEFORE moving the
 * airdivealor.com DNS, while the old site still answers. Safe to run again: imported files are reused.
 *
 * Usage:
 *   npm run cms:import-remote -- --dry-run            # list what would be imported
 *   npm run cms:import-remote                         # import and update drafts and live content
 *   npm run cms:import-remote -- --hosts=a.com,b.com  # other hosts (default: airdivealor.com, www.airdivealor.com, static.wixstatic.com)
 */
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/server/db";
import { importMediaBytes, mapMediaRefs } from "../lib/server/media-import";
import { mediaQueue } from "../lib/server/queue";
import { ensureBucket } from "../lib/server/storage";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const hostsArg = args.find((a) => a.startsWith("--hosts="))?.slice(8);
const HOSTS = new Set((hostsArg ?? "airdivealor.com,www.airdivealor.com,static.wixstatic.com").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean));
const MAX_BYTES = 25 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };

const wanted = (url: string) => {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
};

/** A readable, unique-enough file name from the URL (Wix URLs end in the original name). */
function fileName(url: string, mime: string) {
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  let base = parts.reverse().find((p) => /\.(jpe?g|png|webp|gif|avif)$/i.test(p)) ?? parts.join("-");
  base = base.replace(/[^\w.~-]+/g, "-").slice(-100) || "image";
  if (!/\.\w{3,4}$/.test(base)) base += EXT[mime] ?? "";
  return base;
}

const cache = new Map<string, number | null>();
const report = { imported: 0, reused: 0, failed: [] as string[], planned: new Set<string>() };

async function fetchImage(url: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(60_000), headers: { "User-Agent": "AirDiveAlor-CMS-import/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!mime.startsWith("image/")) throw new Error(`not an image (${mime || "no content type"})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`too large (${Math.round(bytes.length / 1024 / 1024)} MB)`);
  return { bytes, mime };
}

async function importUrl(url: string): Promise<number | null> {
  if (cache.has(url)) return cache.get(url)!;
  let id: number | null = null;
  if (dryRun) report.planned.add(url);
  else {
    try {
      const { bytes, mime } = await fetchImage(url);
      const r = await importMediaBytes(fileName(url, mime), bytes, mime);
      id = r.id;
      if (r.reused) report.reused++;
      else {
        report.imported++;
        console.info(`media ${r.id}: ${url}`);
      }
    } catch (e) {
      report.failed.push(`${url}  (${e instanceof Error ? e.message : e})`);
    }
  }
  cache.set(url, id);
  return id;
}

const swap = (value: unknown) =>
  mapMediaRefs(value, async (ref) => {
    if (ref.mediaId || !wanted(ref.url)) return ref;
    const id = await importUrl(ref.url);
    return id ? { mediaId: id, url: "" } : ref;
  });

/** Links (not images) on the old hosts, e.g. blog stories that point at the old WordPress blog. */
const oldLinks = new Set<string>();
function findLinks(value: unknown) {
  const json = JSON.stringify(value ?? null);
  for (const m of json.matchAll(/"(https?:\/\/[^"]+)"/g)) {
    if (!wanted(m[1])) continue;
    if (!new RegExp(`"url":"${m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(json)) oldLinks.add(m[1]);
  }
}

async function main() {
  console.info(`${dryRun ? "[dry run] " : ""}hosts: ${[...HOSTS].join(", ")}`);
  if (!dryRun) await ensureBucket();
  let changed = 0;

  for (const r of await db.select().from(schema.pageSections)) {
    const draft = await swap(r.draft);
    const published = await swap(r.published);
    findLinks(draft);
    if (!dryRun && (JSON.stringify(draft) !== JSON.stringify(r.draft) || JSON.stringify(published) !== JSON.stringify(r.published))) {
      await db.update(schema.pageSections).set({ draft, published }).where(eq(schema.pageSections.id, r.id));
      changed++;
    }
  }
  for (const r of await db.select().from(schema.collectionItems)) {
    const draft = await swap(r.draft);
    const published = await swap(r.published);
    findLinks(draft);
    if (!dryRun && (JSON.stringify(draft) !== JSON.stringify(r.draft) || JSON.stringify(published) !== JSON.stringify(r.published))) {
      await db.update(schema.collectionItems).set({ draft, published }).where(eq(schema.collectionItems.id, r.id));
      changed++;
    }
  }

  if (dryRun) {
    console.info(`\n${report.planned.size} images would be imported:`);
    for (const u of report.planned) console.info(`  ${u}`);
  } else {
    console.info(`\nimported ${report.imported}, reused ${report.reused}, failed ${report.failed.length}; updated ${changed} sections/items`);
    for (const f of report.failed) console.warn(`  failed: ${f}`);
    if (changed) console.info("The website picks up the new image addresses within 5 minutes (its CMS cache), once the worker has processed them.");
  }
  if (oldLinks.size) {
    console.info(`\n${oldLinks.size} links still point at the old site (not images; they stop working when the DNS moves):`);
    for (const u of oldLinks) console.info(`  ${u}`);
  }
  await mediaQueue().close();
  process.exit(report.failed.length ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
