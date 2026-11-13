import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { body, handle, ok, requireUser } from "@/lib/server/http";
import { folderPath, moveMedia } from "@/lib/server/media-folders";

/** Move files into a folder (null = the top of the library). Their web addresses don't change. */
export const POST = handle(async (req) => {
  const me = await requireUser("media.upload");
  const { ids, folderId } = await body(req, z.object({ ids: z.array(z.number().int().positive()).min(1).max(500), folderId: z.number().int().positive().nullable() }));
  const moved = await moveMedia(ids, folderId);
  await audit(me.id, "media.moved", `${moved} file${moved === 1 ? "" : "s"} → ${await folderPath(folderId)}`, { ids, folderId });
  return ok({ moved });
});
