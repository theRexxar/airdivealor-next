import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { body, handle, ok, requireUser } from "@/lib/server/http";
import { deleteFolder, folderPath, updateFolder } from "@/lib/server/media-folders";

type Ctx = { params: Promise<{ id: string }> };
const idOf = async (ctx: Ctx) => Number((await ctx.params).id) || 0;

/** Rename a folder and/or move it (with its subfolders and files) into another folder or to the top. */
export const PATCH = handle(async (req, ctx: Ctx) => {
  const me = await requireUser("media.folders");
  const id = await idOf(ctx);
  const data = await body(req, z.object({ name: z.string().max(200).optional(), parentId: z.number().int().positive().nullable().optional() }));
  const from = await folderPath(id);
  const { before, after } = await updateFolder(id, data);
  const to = await folderPath(id);
  if (before.name !== after.name) await audit(me.id, "media.folder_renamed", `${from} → ${after.name}`, { id });
  if ((before.parentId ?? null) !== (after.parentId ?? null)) await audit(me.id, "media.folder_moved", `${from} → ${to}`, { id });
  return ok({ folder: after });
});

/** Delete a folder and its subfolders. Their files are kept and move to the top of the library. */
export const DELETE = handle(async (_req, ctx: Ctx) => {
  const me = await requireUser("media.folders");
  const id = await idOf(ctx);
  const path = await folderPath(id);
  const r = await deleteFolder(id);
  await audit(me.id, "media.folder_deleted", path, { id, subfolders: r.subfolders, movedFiles: r.movedFiles });
  return ok({ subfolders: r.subfolders, movedFiles: r.movedFiles });
});
