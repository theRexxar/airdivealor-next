import { and, desc, eq, isNull, like, lt, or } from "drizzle-orm";
import { z } from "zod";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_TYPES, humanSize, kindFor } from "@/lib/cms/media-rules";
import { audit } from "@/lib/server/audit";
import { db, schema } from "@/lib/server/db";
import { body, handle, HttpError, ok, requireUser } from "@/lib/server/http";
import { serializeMedia } from "@/lib/server/media-service";
import { presignUpload } from "@/lib/server/storage";

/**
 * Media library: ?folder=<id>|root (files directly in that folder; root = the top), ?kind=image|video,
 * ?q=name (searches every folder), ?before=<id> for the next page (40 per page).
 */
export const GET = handle(async (req) => {
  await requireUser("media.view");
  const p = new URL(req.url).searchParams;
  const kind = p.get("kind");
  const q = p.get("q")?.trim();
  const before = Number(p.get("before")) || 0;
  const folder = p.get("folder");
  const folderId = folder && folder !== "root" ? Number(folder) || 0 : null;
  const where = and(
    // A search looks in every folder; otherwise only the folder being viewed.
    q || folder === null ? undefined : folderId ? eq(schema.media.folderId, folderId) : isNull(schema.media.folderId),
    kind === "image" || kind === "video" ? eq(schema.media.kind, kind) : undefined,
    q ? or(like(schema.media.originalName, `%${q}%`), like(schema.media.altEn, `%${q}%`)) : undefined,
    before ? lt(schema.media.id, before) : undefined,
  );
  const rows = await db.select().from(schema.media).where(where).orderBy(desc(schema.media.id)).limit(40);
  return ok({ items: rows.map(serializeMedia), next: rows.length === 40 ? rows[rows.length - 1].id : null });
});

/**
 * Step 1 of an upload: register the file and get a presigned URL. The browser PUTs the file straight
 * to MinIO, then calls POST /api/cms/media/:id/complete to queue processing.
 */
export const POST = handle(async (req) => {
  const me = await requireUser("media.upload");
  const f = await body(req, z.object({ name: z.string().trim().min(1).max(200), mime: z.string().max(100), size: z.number().int().positive(), folderId: z.number().int().positive().nullable().optional() }));
  if (f.folderId && !(await db.query.mediaFolders.findFirst({ where: eq(schema.mediaFolders.id, f.folderId) }))) throw new HttpError(404, "That folder no longer exists. Reload the page.");
  const kind = kindFor(f.mime);
  if (!kind) throw new HttpError(415, `This file type isn't supported. Use ${[...IMAGE_TYPES, ...VIDEO_TYPES].map((m) => m.split("/")[1]).join(", ")}.`);
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (f.size > max) throw new HttpError(413, `This ${kind} is too large. The limit is ${humanSize(max)}.`);
  const safe = f.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const [res] = await db.insert(schema.media).values({ kind, status: "uploading", originalKey: "pending", originalName: f.name, mime: f.mime, size: f.size, createdBy: me.id, folderId: f.folderId ?? null });
  const key = `originals/${res.insertId}/${safe}`;
  await db.update(schema.media).set({ originalKey: key }).where(eq(schema.media.id, res.insertId));
  const uploadUrl = await presignUpload(key, f.mime);
  await audit(me.id, "media.upload_started", f.name, { id: res.insertId, kind, size: f.size });
  return ok({ id: res.insertId, uploadUrl, headers: { "Content-Type": f.mime } }, 201);
});
