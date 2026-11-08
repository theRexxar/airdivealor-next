/**
 * Every public URL with its last change, for sitemap.xml and llms.txt: the pages, and the published,
 * visible dive sites, courses and blog stories. Falls back to the built-in content if the database is down.
 */
import { and, eq, isNotNull } from "drizzle-orm";
import { COLLECTION_DEFAULTS } from "@/lib/cms/defaults";
import { PAGES } from "@/lib/cms/registry";
import { db, schema } from "./db";

export interface PublicUrl {
  path: string;
  lastModified?: Date;
  kind: "page" | "sites" | "courses" | "posts";
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}

const ITEM_PATH: Record<string, ((slug: string) => string) | undefined> = {
  sites: (s) => `/dive-sites/${s}`,
  courses: (s) => `/dive-courses/${s}`,
  posts: (s) => `/blog/${s}`,
};

export async function publicUrls(): Promise<PublicUrl[]> {
  const pages: PublicUrl[] = PAGES.map((p) => ({
    path: p.href,
    kind: "page",
    priority: p.href === "/" ? 1 : 0.8,
    changeFrequency: p.slug === "blog" ? "weekly" : "monthly",
  }));
  try {
    // Last publish per page.
    const sections = await db
      .select({ slug: schema.pages.slug, publishedAt: schema.pageSections.publishedAt })
      .from(schema.pageSections)
      .innerJoin(schema.pages, eq(schema.pages.id, schema.pageSections.pageId));
    for (const p of pages) {
      const slug = PAGES.find((x) => x.href === p.path)!.slug;
      const times = sections.filter((s) => s.slug === slug && s.publishedAt).map((s) => s.publishedAt!.getTime());
      if (times.length) p.lastModified = new Date(Math.max(...times));
    }
    const rows = await db
      .select({ collection: schema.collectionItems.collection, slug: schema.collectionItems.slug, publishedAt: schema.collectionItems.publishedAt, published: schema.collectionItems.published })
      .from(schema.collectionItems)
      .where(and(isNotNull(schema.collectionItems.published), eq(schema.collectionItems.enabled, true)));
    const items: PublicUrl[] = rows
      .filter((r) => ITEM_PATH[r.collection])
      .map((r) => ({
        path: ITEM_PATH[r.collection]!(r.slug),
        kind: r.collection as PublicUrl["kind"],
        lastModified: r.publishedAt ?? undefined,
        priority: r.collection === "posts" ? 0.6 : 0.7,
        changeFrequency: "monthly" as const,
      }));
    return [...pages, ...items];
  } catch (e) {
    console.error("[sitemap] database unavailable, using built-in content:", e instanceof Error ? e.message : e);
    const items = Object.entries(COLLECTION_DEFAULTS).flatMap(([key, list]) =>
      ITEM_PATH[key] ? list.map((x) => ({ path: ITEM_PATH[key]!(x.slug), kind: key as PublicUrl["kind"], priority: key === "posts" ? 0.6 : 0.7, changeFrequency: "monthly" as const })) : [],
    );
    return [...pages, ...items];
  }
}
