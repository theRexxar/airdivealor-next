import { inArray } from "drizzle-orm";
import type { ResolvedMedia } from "@/lib/cms/home-types";
import { db, schema } from "./db";
import { publicUrl } from "./storage";

type MediaRow = typeof schema.media.$inferSelect;

/** Media row as the admin API returns it. */
export function serializeMedia(m: MediaRow) {
  const variants = m.variants ?? [];
  const best = variants.find((v) => v.format === "mp4") ?? [...variants].sort((a, b) => b.width - a.width)[0];
  const thumb = m.kind === "video" ? (m.posterKey ? publicUrl(m.posterKey) : null) : variants.length ? publicUrl([...variants].sort((a, b) => a.width - b.width)[0].key) : null;
  return {
    id: m.id,
    kind: m.kind,
    status: m.status,
    name: m.originalName,
    mime: m.mime,
    size: m.size,
    width: m.width,
    height: m.height,
    durationSec: m.durationSec,
    url: best ? publicUrl(best.key) : null,
    thumbUrl: thumb,
    posterUrl: m.posterKey ? publicUrl(m.posterKey) : null,
    variants: variants.map((v) => ({ ...v, url: publicUrl(v.key) })),
    alt: { en: m.altEn, id: m.altId },
    folderId: m.folderId ?? null,
    error: m.error,
    createdAt: m.createdAt,
  };
}
export type MediaItem = ReturnType<typeof serializeMedia>;

/** Turn media ids into public URLs. Only ready files are included. */
export async function resolveMedia(ids: Iterable<number>): Promise<Record<string, ResolvedMedia>> {
  const list = [...new Set(ids)];
  if (!list.length) return {};
  const rows = await db.select().from(schema.media).where(inArray(schema.media.id, list));
  const out: Record<string, ResolvedMedia> = {};
  for (const m of rows) {
    if (m.status !== "ready") continue;
    const v = m.variants ?? [];
    if (m.kind === "image") {
      const sorted = [...v].sort((a, b) => a.width - b.width);
      const big = sorted[sorted.length - 1];
      if (!big) continue;
      out[m.id] = {
        url: publicUrl(big.key),
        srcSet: sorted.map((x) => `${publicUrl(x.key)} ${x.width}w`).join(", "),
        width: m.width ?? undefined,
        height: m.height ?? undefined,
        alt: { en: m.altEn, id: m.altId },
      };
    } else {
      const mp4 = v.find((x) => x.format === "mp4");
      if (!mp4) continue;
      out[m.id] = { url: publicUrl(mp4.key), srcSet: "", width: mp4.width, height: mp4.height, poster: m.posterKey ? publicUrl(m.posterKey) : undefined, alt: { en: m.altEn, id: m.altId } };
    }
  }
  return out;
}
