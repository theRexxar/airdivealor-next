import { and, asc, eq, ne } from "drizzle-orm";
import { collectMediaIds } from "@/lib/cms/fields";
import { schemaFor, type Field } from "@/lib/cms/fields";
import { collectionDef, COLLECTIONS, itemTitle, PAGES } from "@/lib/cms/registry";
import { db, schema } from "./db";
import { HttpError } from "./http";

export type ItemRow = typeof schema.collectionItems.$inferSelect;

export function requireCollection(key: string) {
  const def = collectionDef(key);
  if (!def) throw new HttpError(404, "Unknown collection.");
  return def;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validate item content with the collection's fields, plus a clean, unique web address. */
export async function validateItem(key: string, content: unknown, selfId?: number) {
  const def = requireCollection(key);
  const r = schemaFor(def.fields).safeParse(content);
  if (!r.success) throw new HttpError(422, "Please check the highlighted fields.", r.error.issues.map((i) => ({ path: i.path, message: i.message })));
  const data = r.data as Record<string, unknown> & { slug: string };
  if (!SLUG_RE.test(data.slug)) throw new HttpError(422, "Use lowercase letters, numbers and dashes only.", [{ path: ["slug"], message: "Use lowercase letters, numbers and dashes only, e.g. kals-dream." }]);
  const clash = await db.query.collectionItems.findFirst({
    where: and(eq(schema.collectionItems.collection, key), eq(schema.collectionItems.slug, data.slug), selfId ? ne(schema.collectionItems.id, selfId) : undefined),
  });
  if (clash) throw new HttpError(409, "Another item already uses this web address.", [{ path: ["slug"], message: "Already used by another item." }]);
  if ("slugId" in data) {
    const sid = String(data.slugId ?? "");
    if (sid && !SLUG_RE.test(sid)) throw new HttpError(422, "Use lowercase letters, numbers and dashes only.", [{ path: ["slugId"], message: "Use lowercase letters, numbers and dashes only." }]);
    // The Indonesian address in use is slugId, or slug when empty; no two items may share one.
    const mine = sid || data.slug;
    const others = await db.select({ id: schema.collectionItems.id, slug: schema.collectionItems.slug, draft: schema.collectionItems.draft }).from(schema.collectionItems).where(eq(schema.collectionItems.collection, key));
    const taken = others.some((o) => o.id !== selfId && (String((o.draft as { slugId?: string }).slugId || "") || o.slug) === mine);
    if (taken) throw new HttpError(409, "Another item already uses this Indonesian web address.", [{ path: [sid ? "slugId" : "slug"], message: "Already used (in Indonesian) by another item." }]);
  }
  return data;
}

/** Newest first by the collection's sort field (e.g. a story's date); ties keep their stored order. */
function bySortField<T>(def: { sortField?: string }, rows: T[], value: (r: T) => Record<string, unknown> | null): T[] {
  const f = def.sortField;
  if (!f) return rows;
  const v = (r: T) => String(value(r)?.[f] ?? "");
  return rows.map((r, i) => ({ r, i })).sort((a, b) => v(b.r).localeCompare(v(a.r)) || a.i - b.i).map((x) => x.r);
}

/** All items of a collection, in website order: by hand (sort column), or newest first when it has a sort field. */
export async function listItems(key: string) {
  const def = requireCollection(key);
  const rows = await db.select().from(schema.collectionItems).where(eq(schema.collectionItems.collection, key)).orderBy(asc(schema.collectionItems.sort), asc(schema.collectionItems.id));
  return bySortField(def, rows, (r) => r.draft as Record<string, unknown>);
}

export async function getItem(key: string, id: number) {
  requireCollection(key);
  const row = await db.query.collectionItems.findFirst({ where: and(eq(schema.collectionItems.collection, key), eq(schema.collectionItems.id, id)) });
  if (!row) throw new HttpError(404, "Item not found.");
  return row;
}

/** Item status for the CMS list. */
export function itemStatus(r: ItemRow): "draft" | "live" | "changed" | "hidden" {
  if (!r.published) return "draft";
  if (!r.enabled) return "hidden";
  return JSON.stringify(r.draft) !== JSON.stringify(r.published) ? "changed" : "live";
}

/** Published, visible items in order (what the website shows). With draft: true, every item's draft (CMS preview). */
export async function liveItems<T = Record<string, unknown>>(key: string, opts: { draft?: boolean } = {}) {
  const def = requireCollection(key);
  const rows = await listItems(key);
  const items = bySortField(
    def,
    rows.filter((r) => (opts.draft ? true : r.enabled && r.published)).map((r) => (opts.draft ? r.draft : r.published) as Record<string, unknown>),
    (x) => x,
  ) as T[];
  const mediaIds = new Set<number>();
  items.forEach((it) => collectMediaIds(def.fields, it, mediaIds));
  return { items, mediaIds };
}

/** True when a value (shaped by `fields`) has a picker pointing at `slug` in `collection`. */
function refersTo(fields: Field[], value: unknown, collection: string, slug: string): boolean {
  const v = (value ?? {}) as Record<string, unknown>;
  return fields.some((f) => {
    const x = v[f.key];
    if (f.type === "ref") return f.collection === collection && x === slug;
    if (f.type === "group") return refersTo(f.fields, x, collection, slug);
    if (f.type === "list") return Array.isArray(x) && x.some((i) => refersTo(f.fields, i, collection, slug));
    if (f.type === "blocks")
      return Array.isArray(x) && x.some((i) => refersTo(f.kinds.find((k) => k.type === (i as { type?: string })?.type)?.fields ?? [], i, collection, slug));
    return false;
  });
}

/** Where an item is still picked (page sections and other items, draft or live), as readable labels. */
export async function itemUsers(collection: string, slug: string): Promise<string[]> {
  const users: string[] = [];
  for (const p of PAGES) {
    const rows = await db.select().from(schema.pageSections).innerJoin(schema.pages, eq(schema.pages.id, schema.pageSections.pageId)).where(eq(schema.pages.slug, p.slug));
    for (const { page_sections: r } of rows) {
      const def = p.sections.find((x) => x.key === r.key);
      if (def && [r.draft, r.published].some((v) => refersTo(def.fields, v, collection, slug))) users.push(`${p.label} › ${def.label}`);
    }
  }
  for (const c of COLLECTIONS) {
    if (!c.fields.some((f) => f.type === "ref" && f.collection === collection)) continue;
    for (const r of await db.select().from(schema.collectionItems).where(eq(schema.collectionItems.collection, c.key))) {
      if ([r.draft, r.published].some((v) => refersTo(c.fields, v, collection, slug))) users.push(`${c.label} › ${itemTitle(c, r.draft as Record<string, unknown>) || r.slug}`);
    }
  }
  return users;
}
