/**
 * Add a file to the media library from a script (seed, remote import): store the original in the bucket,
 * create the media row and queue it for the worker. A file already imported (same name and size) is reused.
 */
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "./db";
import { enqueueMedia } from "./queue";
import { putObject } from "./storage";

export async function importMediaBytes(name: string, bytes: Uint8Array, mime: string): Promise<{ id: number; reused: boolean }> {
  const existing = await db.query.media.findFirst({ where: and(eq(schema.media.originalName, name), eq(schema.media.size, bytes.length), ne(schema.media.status, "failed")) });
  if (existing) return { id: existing.id, reused: true };
  const kind = mime.startsWith("video/") ? "video" : "image";
  const [res] = await db.insert(schema.media).values({ kind, status: "processing", originalKey: "pending", originalName: name, mime, size: bytes.length });
  const key = `originals/${res.insertId}/${name}`;
  await putObject(key, bytes, mime);
  await db.update(schema.media).set({ originalKey: key }).where(eq(schema.media.id, res.insertId));
  await enqueueMedia(res.insertId);
  return { id: res.insertId, reused: false };
}

/** Walk any CMS content and replace media references, one at a time (so a file used twice is imported once). */
export async function mapMediaRefs(value: unknown, fn: (ref: { mediaId: number | null; url: string }) => Promise<{ mediaId: number | null; url: string }>): Promise<unknown> {
  if (Array.isArray(value)) {
    const out = [];
    for (const v of value) out.push(await mapMediaRefs(v, fn));
    return out;
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if ("mediaId" in o && "url" in o && typeof o.url === "string" && Object.keys(o).length === 2) return fn(o as { mediaId: number | null; url: string });
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) out[k] = await mapMediaRefs(v, fn);
    return out;
  }
  return value;
}
