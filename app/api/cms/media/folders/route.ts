import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { body, handle, ok, requireUser } from "@/lib/server/http";
import { createFolder, folderPath, folderTree } from "@/lib/server/media-folders";

/** Every folder with its file counts and path, and how many files sit at the top of the library. */
export const GET = handle(async () => {
  const me = await requireUser("media.view");
  return ok({ ...(await folderTree()), can: { manage: me.permissions.has("media.folders"), move: me.permissions.has("media.upload") } });
});

/** New folder, at the top or inside another folder. */
export const POST = handle(async (req) => {
  const me = await requireUser("media.folders");
  const { name, parentId } = await body(req, z.object({ name: z.string().max(200), parentId: z.number().int().positive().nullable() }));
  const f = await createFolder({ name, parentId }, me.id);
  await audit(me.id, "media.folder_created", await folderPath(f.id), { id: f.id });
  return ok({ folder: f }, 201);
});
