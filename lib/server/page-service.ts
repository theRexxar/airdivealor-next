import { and, asc, eq } from "drizzle-orm";
import { collectMediaIds } from "@/lib/cms/fields";
import { sanitizeRichFields } from "./rich-sanitize";
import { PAGE_DEFAULTS } from "@/lib/cms/defaults";
import { pageDef, sectionDefOf } from "@/lib/cms/registry";
import { db, schema } from "./db";
import { HttpError } from "./http";
import { resolveMedia } from "./media-service";

export function requirePageDef(slug: string) {
  const def = pageDef(slug);
  if (!def) throw new HttpError(404, "Unknown page.");
  return def;
}

export async function pageRow(slug: string) {
  requirePageDef(slug);
  const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
  if (!page) throw new HttpError(404, "This page has not been set up. Run npm run cms:seed.");
  return page;
}

export async function pageSections(slug: string) {
  const page = await pageRow(slug);
  return db.select().from(schema.pageSections).where(eq(schema.pageSections.pageId, page.id)).orderBy(asc(schema.pageSections.sort));
}

export async function pageSection(slug: string, key: string) {
  if (!sectionDefOf(slug, key)) throw new HttpError(404, "Unknown section.");
  const page = await pageRow(slug);
  const row = await db.query.pageSections.findFirst({ where: and(eq(schema.pageSections.pageId, page.id), eq(schema.pageSections.key, key)) });
  if (!row) throw new HttpError(404, "Section not found. Run npm run cms:seed.");
  return row;
}

/** True when the draft differs from what is live. */
export const hasChanges = (r: { draft: unknown; published: unknown }) => JSON.stringify(r.draft) !== JSON.stringify(r.published);

/**
 * A page's content for the website: the published version (or drafts, for the CMS preview), missing
 * sections filled from the built-in defaults, visible sections in order, and the media ids it references.
 */
export async function pageContent(slug: string, opts: { draft?: boolean } = {}) {
  const def = requirePageDef(slug);
  const rows = await pageSections(slug);
  const content: Record<string, unknown> = { ...PAGE_DEFAULTS[slug] };
  const mediaIds = new Set<number>();
  const order: string[] = [];
  let publishedAt: Date | null = null;
  for (const r of rows) {
    const s = def.sections.find((x) => x.key === r.key);
    if (!s) continue;
    const value = opts.draft ? r.draft : r.published;
    // Rich text is cleaned here, so every page and preview gets safe HTML.
    if (value) content[r.key] = sanitizeRichFields(s.fields, value);
    collectMediaIds(s.fields, content[r.key], mediaIds);
    if (r.publishedAt && (!publishedAt || r.publishedAt > publishedAt)) publishedAt = r.publishedAt;
    if (!s.fixed && r.enabled && (value || opts.draft)) order.push(r.key);
  }
  return { content, order, mediaIds, publishedAt: publishedAt?.toISOString() ?? null };
}

export { resolveMedia };
