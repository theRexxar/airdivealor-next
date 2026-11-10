/**
 * Every public URL with its last change, for sitemap.xml and llms.txt: the pages, and the published,
 * visible dive sites, courses and blog stories. Falls back to the built-in content if the database is down.
 */
import { and, eq, isNotNull } from "drizzle-orm";
import { COLLECTION_DEFAULTS } from "@/lib/cms/defaults";
import { PAGES } from "@/lib/cms/registry";
import { COLLECTION_SECTION, itemAlternates, pageAlternates, sectionOf, type Alternates, type PageCollection, type Section } from "@/lib/i18n-routes";
import { hasFaqPage, type FaqContent } from "@/lib/cms/faq-types";
import { db, schema } from "./db";

export interface PublicUrl {
  /** The page in each language (/en/..., /id/...). */
  alternates: Alternates;
  lastModified?: Date;
  kind: "page" | "sites" | "courses" | "posts" | "faqs";
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}

const isPageCollection = (c: string): c is PageCollection => c in COLLECTION_SECTION;
const sectionOfPage = (href: string): Section => (href === "/" ? "home" : sectionOf(href.split("/")[1])!.section);

export async function publicUrls(): Promise<PublicUrl[]> {
  const pages: PublicUrl[] = PAGES.map((p) => ({
    alternates: pageAlternates(sectionOfPage(p.href)),
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
      const slug = PAGES.find((x) => pageAlternates(sectionOfPage(x.href)).en === p.alternates.en)!.slug;
      const times = sections.filter((s) => s.slug === slug && s.publishedAt).map((s) => s.publishedAt!.getTime());
      if (times.length) p.lastModified = new Date(Math.max(...times));
    }
    const rows = await db
      .select({ collection: schema.collectionItems.collection, slug: schema.collectionItems.slug, publishedAt: schema.collectionItems.publishedAt, published: schema.collectionItems.published })
      .from(schema.collectionItems)
      .where(and(isNotNull(schema.collectionItems.published), eq(schema.collectionItems.enabled, true)));
    const items: PublicUrl[] = rows
      .filter((r) => isPageCollection(r.collection) && (r.collection !== "faqs" || hasFaqPage(r.published as Pick<FaqContent, "body">)))
      .map((r) => ({
        alternates: itemAlternates(r.collection as PageCollection, { slug: (r.published as { slug?: string } | null)?.slug || r.slug, slugId: (r.published as { slugId?: string } | null)?.slugId }),
        kind: r.collection as PublicUrl["kind"],
        lastModified: r.publishedAt ?? undefined,
        priority: r.collection === "posts" || r.collection === "faqs" ? 0.6 : 0.7,
        changeFrequency: "monthly" as const,
      }));
    return [...pages, ...items];
  } catch (e) {
    console.error("[sitemap] database unavailable, using built-in content:", e instanceof Error ? e.message : e);
    const items = Object.entries(COLLECTION_DEFAULTS).flatMap(([key, list]) =>
      isPageCollection(key) ? list.filter((x) => key !== "faqs" || hasFaqPage(x as FaqContent)).map((x) => ({ alternates: itemAlternates(key, x as { slug: string; slugId?: string }), kind: key as PublicUrl["kind"], priority: key === "posts" ? 0.6 : 0.7, changeFrequency: "monthly" as const })) : [],
    );
    return [...pages, ...items];
  }
}
