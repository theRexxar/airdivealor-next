/**
 * Media worker: processes uploads in the background (run with `npm run worker`).
 * Images → WebP in several widths. Videos → web-ready H.264 MP4 (faststart) and a WebP poster.
 */
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { IMAGE_WIDTHS, VIDEO_MAX_WIDTH } from "../lib/cms/media-rules";
import { db, schema } from "../lib/server/db";
import type { MediaVariant } from "../lib/server/db/schema";
import { MEDIA_QUEUE, type MediaJob } from "../lib/server/queue";
import { redis } from "../lib/server/redis";
import { checkMysql, checkRedis, printStartupReport } from "../lib/server/startup-report";
import { ensureBucket, getObjectBytes, putObject } from "../lib/server/storage";

const run = promisify(execFile);

async function processImage(id: number, bytes: Uint8Array) {
  const img = sharp(bytes, { failOn: "error" }).rotate();
  const meta = await img.metadata();
  const w0 = meta.autoOrient?.width ?? meta.width ?? 0;
  const h0 = meta.autoOrient?.height ?? meta.height ?? 0;
  if (!w0 || !h0) throw new Error("Could not read the image size.");
  const widths = IMAGE_WIDTHS.filter((w) => w < w0);
  widths.push(Math.min(w0, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]));
  const variants: MediaVariant[] = [];
  for (const w of [...new Set(widths)].sort((a, b) => a - b)) {
    const out = await sharp(bytes).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const key = `media/${id}/${w}.webp`;
    await putObject(key, out.data, "image/webp");
    variants.push({ key, width: out.info.width, height: out.info.height, format: "webp", size: out.info.size });
  }
  await db.update(schema.media).set({ status: "ready", width: w0, height: h0, variants, error: null }).where(eq(schema.media.id, id));
}

async function processVideo(id: number, bytes: Uint8Array) {
  const dir = await mkdtemp(join(tmpdir(), "ada-media-"));
  try {
    const src = join(dir, "src");
    const mp4 = join(dir, "out.mp4");
    const poster = join(dir, "poster.png");
    await writeFile(src, bytes);
    const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", src]);
    const probe = JSON.parse(stdout);
    const s = probe.streams?.[0];
    if (!s) throw new Error("The file has no video stream.");
    const duration = Math.round(Number(probe.format?.duration ?? 0));
    await run("ffmpeg", [
      "-y", "-i", src,
      "-vf", `scale='min(${VIDEO_MAX_WIDTH},iw)':-2`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4,
    ], { maxBuffer: 1 << 24 });
    await run("ffmpeg", ["-y", "-ss", String(Math.min(1, Math.max(0, duration / 2))), "-i", mp4, "-frames:v", "1", poster]);
    const mp4Bytes = await readFile(mp4);
    const outProbe = JSON.parse((await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", mp4])).stdout).streams[0];
    const mp4Key = `media/${id}/video.mp4`;
    await putObject(mp4Key, mp4Bytes, "video/mp4");
    const posterOut = await sharp(await readFile(poster)).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const posterKey = `media/${id}/poster.webp`;
    await putObject(posterKey, posterOut.data, "image/webp");
    const variants: MediaVariant[] = [{ key: mp4Key, width: outProbe.width, height: outProbe.height, format: "mp4", size: (await stat(mp4)).size }];
    await db.update(schema.media).set({ status: "ready", width: s.width, height: s.height, durationSec: duration, variants, posterKey, error: null }).where(eq(schema.media.id, id));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const CONCURRENCY = 2;
const stats = { startedAt: new Date(), done: 0, failed: 0 };

/**
 * Health endpoint on $PORT (Railway sets it), so Railway can check the worker like the website:
 * any path answers 200 when MySQL and Redis are reachable, 503 otherwise.
 */
function serveHealth() {
  const port = Number(process.env.PORT);
  if (!port) return;
  createServer(async (_req, res) => {
    const [mysql, rds] = await Promise.all([checkMysql(), checkRedis()]);
    const ok = mysql.ok && rds.ok;
    res.writeHead(ok ? 200 : 503, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({ ok, role: "worker", mysql: mysql.ok ? "ok" : "down", redis: rds.ok ? "ok" : "down", queue: rds.detail.split("; ")[1] ?? null, startedAt: stats.startedAt, done: stats.done, failed: stats.failed }));
  }).listen(port, "0.0.0.0", () => console.info(`[worker] health check on port ${port}`));
}

async function main() {
  await ensureBucket().catch((e) => console.error(`[worker] storage not ready yet: ${e instanceof Error ? e.message : e}`));
  const worker = new Worker<MediaJob>(
    MEDIA_QUEUE,
    async (job) => {
      const m = await db.query.media.findFirst({ where: eq(schema.media.id, job.data.mediaId) });
      if (!m) return "missing";
      await db.update(schema.media).set({ status: "processing", attempts: job.attemptsMade + 1 }).where(eq(schema.media.id, m.id));
      const bytes = await getObjectBytes(m.originalKey);
      if (m.kind === "image") await processImage(m.id, bytes);
      else await processVideo(m.id, bytes);
      return "ok";
    },
    { connection: redis(), concurrency: CONCURRENCY },
  );
  worker.on("completed", (job) => {
    stats.done++;
    console.info(`[worker] media ${job.data.mediaId} ready`);
  });
  worker.on("failed", async (job, err) => {
    if (!job) return;
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    stats.failed++;
    console.error(`[worker] media ${job.data.mediaId} failed (attempt ${job.attemptsMade}): ${err.message}`);
    if (final) await db.update(schema.media).set({ status: "failed", error: err.message.slice(0, 1000) }).where(eq(schema.media.id, job.data.mediaId));
  });
  serveHealth();
  await printStartupReport("worker", [`queue "${MEDIA_QUEUE}", ${CONCURRENCY} jobs at a time, 3 attempts per file`]);
  console.info("[worker] waiting for media jobs");
  const stop = async () => {
    await worker.close();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
