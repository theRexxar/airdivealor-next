/**
 * Folders in the media library (nested). Folders only organise the library: a file's web address doesn't
 * depend on its folder, so moving, renaming or deleting folders never breaks a page.
 * Deleting a folder also deletes its subfolders, and every file inside lands at the top of the library.
 */
import { eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { HttpError } from "./http";

export const MAX_DEPTH = 5;
export type FolderRow = typeof schema.mediaFolders.$inferSelect;

export interface FolderInfo {
  id: number;
  name: string;
  parentId: number | null;
  /** Files directly in this folder. */
  files: number;
  /** Files in this folder and all its subfolders. */
  totalFiles: number;
  /** Subfolders at any depth. */
  subfolders: number;
  /** Names from the top, e.g. ["Dive sites", "Pura"]. */
  path: string[];
}

/** The whole tree with file counts, plus how many files sit at the top. */
export async function folderTree() {
  const rows = await db.select().from(schema.mediaFolders);
  const counts = await db.select({ folderId: schema.media.folderId, n: sql<number>`count(*)` }).from(schema.media).groupBy(schema.media.folderId);
  const direct = new Map(counts.map((c) => [c.folderId ?? 0, Number(c.n)]));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const children = new Map<number, FolderRow[]>();
  for (const r of rows) children.set(r.parentId ?? 0, [...(children.get(r.parentId ?? 0) ?? []), r]);
  const pathOf = (r: FolderRow): string[] => {
    const out: string[] = [];
    for (let cur: FolderRow | undefined = r, guard = 0; cur && guard < 50; cur = cur.parentId ? byId.get(cur.parentId) : undefined, guard++) out.unshift(cur.name);
    return out;
  };
  const totals = (id: number): { files: number; subfolders: number } => {
    let files = direct.get(id) ?? 0;
    let subfolders = 0;
    for (const c of children.get(id) ?? []) {
      const t = totals(c.id);
      files += t.files;
      subfolders += 1 + t.subfolders;
    }
    return { files, subfolders };
  };
  const folders: FolderInfo[] = rows
    .map((r) => {
      const t = totals(r.id);
      return { id: r.id, name: r.name, parentId: r.parentId ?? null, files: direct.get(r.id) ?? 0, totalFiles: t.files, subfolders: t.subfolders, path: pathOf(r) };
    })
    .sort((a, b) => a.path.join("/").localeCompare(b.path.join("/"), undefined, { sensitivity: "base", numeric: true }));
  const total = [...direct.values()].reduce((a, b) => a + b, 0);
  return { folders, rootFiles: direct.get(0) ?? 0, total };
}

async function getFolder(id: number) {
  const f = await db.query.mediaFolders.findFirst({ where: eq(schema.mediaFolders.id, id) });
  if (!f) throw new HttpError(404, "Folder not found. It may have been deleted; reload the page.");
  return f;
}

/** Ids of a folder and everything below it. */
async function subtree(id: number): Promise<number[]> {
  const rows = await db.select({ id: schema.mediaFolders.id, parentId: schema.mediaFolders.parentId }).from(schema.mediaFolders);
  const out = [id];
  for (let i = 0; i < out.length; i++) for (const r of rows) if (r.parentId === out[i]) out.push(r.id);
  return out;
}

/** How deep a folder is (a top folder is 1) and how deep its own subtree goes below it. */
async function depthOf(id: number | null): Promise<number> {
  let d = 0;
  for (let cur = id; cur; d++) {
    const f = await db.query.mediaFolders.findFirst({ where: eq(schema.mediaFolders.id, cur), columns: { parentId: true } });
    cur = f?.parentId ?? null;
    if (d > 50) break;
  }
  return d;
}

function cleanName(name: string) {
  const n = name.replace(/\s+/g, " ").trim();
  if (!n) throw new HttpError(422, "Give the folder a name.", [{ path: ["name"], message: "Give the folder a name." }]);
  if (n.length > 80) throw new HttpError(422, "Keep folder names under 80 characters.", [{ path: ["name"], message: "Keep it under 80 characters." }]);
  if (/[\\/]/.test(n)) throw new HttpError(422, "Folder names can't contain / or \\.", [{ path: ["name"], message: "Don't use / or \\." }]);
  return n;
}

/** Names must be unique among siblings (ignoring case). */
async function assertFreeName(name: string, parentId: number | null, except?: number) {
  const siblings = await db.select().from(schema.mediaFolders).where(parentId ? eq(schema.mediaFolders.parentId, parentId) : isNull(schema.mediaFolders.parentId));
  if (siblings.some((s) => s.id !== except && s.name.toLowerCase() === name.toLowerCase()))
    throw new HttpError(409, `There is already a folder called “${name}” here.`, [{ path: ["name"], message: "This name is already used here." }]);
}

export async function createFolder(input: { name: string; parentId: number | null }, userId: number) {
  const name = cleanName(input.name);
  if (input.parentId) await getFolder(input.parentId);
  if ((await depthOf(input.parentId)) + 1 > MAX_DEPTH) throw new HttpError(422, `Folders can go ${MAX_DEPTH} levels deep.`);
  await assertFreeName(name, input.parentId);
  const [res] = await db.insert(schema.mediaFolders).values({ name, parentId: input.parentId, createdBy: userId });
  return getFolder(res.insertId);
}

/** Rename and/or move a folder (with everything in it). */
export async function updateFolder(id: number, input: { name?: string; parentId?: number | null }) {
  const f = await getFolder(id);
  const name = input.name !== undefined ? cleanName(input.name) : f.name;
  const parentId = input.parentId !== undefined ? input.parentId : (f.parentId ?? null);
  if (parentId !== (f.parentId ?? null)) {
    if (parentId) {
      await getFolder(parentId);
      if ((await subtree(id)).includes(parentId)) throw new HttpError(422, "A folder can't go inside itself or one of its own subfolders.");
    }
    // The deepest folder below this one must still fit.
    const rows = await db.select({ id: schema.mediaFolders.id, parentId: schema.mediaFolders.parentId }).from(schema.mediaFolders);
    const below = (fid: number): number => Math.max(0, ...rows.filter((r) => r.parentId === fid).map((r) => 1 + below(r.id)));
    if ((await depthOf(parentId)) + 1 + below(id) > MAX_DEPTH) throw new HttpError(422, `That would make folders more than ${MAX_DEPTH} levels deep.`);
  }
  await assertFreeName(name, parentId, id);
  await db.update(schema.mediaFolders).set({ name, parentId }).where(eq(schema.mediaFolders.id, id));
  return { before: f, after: await getFolder(id) };
}

/** Delete a folder and its subfolders; their files move to the top of the library. Returns what changed. */
export async function deleteFolder(id: number) {
  const f = await getFolder(id);
  const ids = await subtree(id);
  return db.transaction(async (tx) => {
    const moved = await tx.select({ n: sql<number>`count(*)` }).from(schema.media).where(inArray(schema.media.folderId, ids));
    await tx.update(schema.media).set({ folderId: null }).where(inArray(schema.media.folderId, ids));
    // Children first (a parent can't be deleted while a subfolder points at it).
    for (const fid of [...ids].reverse()) await tx.delete(schema.mediaFolders).where(eq(schema.mediaFolders.id, fid));
    return { folder: f, subfolders: ids.length - 1, movedFiles: Number(moved[0]?.n ?? 0) };
  });
}

/** Move files into a folder (null = the top of the library). */
export async function moveMedia(mediaIds: number[], folderId: number | null) {
  if (folderId) await getFolder(folderId);
  if (!mediaIds.length) return 0;
  const [res] = await db.update(schema.media).set({ folderId }).where(inArray(schema.media.id, mediaIds));
  return res.affectedRows;
}

/** A readable path for the activity log, e.g. "Dive sites / Pura". */
export async function folderPath(id: number | null) {
  if (!id) return "Media library (top)";
  const t = await folderTree();
  return t.folders.find((x) => x.id === id)?.path.join(" / ") ?? `#${id}`;
}
