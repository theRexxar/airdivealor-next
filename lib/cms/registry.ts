/**
 * Everything the CMS manages: pages (made of sections) and collections (lists of items, like dive sites).
 * Permissions, API routes and screens are all derived from this list.
 */
import { ABOUT_SECTIONS } from "./about-sections";
import { BLOG_SECTIONS } from "./blog-sections";
import { COURSE_FIELDS } from "./course-fields";
import { COURSES_SECTIONS } from "./courses-sections";
import type { Field } from "./fields";
import { DIVE_SITES_SECTIONS } from "./dive-sites-sections";
import { FACILITIES_SECTIONS } from "./facilities-sections";
import { FAQ_FIELDS } from "./faq-fields";
import { FAQ_SECTIONS } from "./faq-sections";
import { HOME_SECTIONS } from "./home-sections";
import type { SectionDef } from "./sections";
import { CATEGORY_FIELDS, POST_FIELDS } from "./post-fields";
import { SITE_FIELDS } from "./site-fields";

export interface PageDef {
  slug: string;
  label: string;
  /** Live URL of the page on the website. */
  href: string;
  /** Sidebar icon (lucide name). */
  icon: string;
  sections: SectionDef[];
  /** Element id on the live page for each section (used by the preview to jump to it). */
  anchors?: Record<string, string>;
}

export interface CollectionDef {
  key: string;
  label: string;
  itemLabel: string;
  description: string;
  fields: Field[];
  /** Field shown as the item title in lists. */
  titleField: string;
  /** Live URL for one item. */
  itemHref: (slug: string) => string;
  /** Live page that lists the items. */
  listHref: string;
  /** Sidebar icon (lucide name). */
  icon: string;
  /** Order items by this field, newest (highest) first, instead of by hand. */
  sortField?: string;
  /** Items have no page of their own on the website (no preview or "View live"). */
  noItemPage?: boolean;
}

export const PAGES: PageDef[] = [
  {
    slug: "home",
    label: "Home",
    href: "/",
    icon: "house",
    sections: HOME_SECTIONS,
    anchors: { prices: "b-prices", why: "b-why", sites: "b-sites", stay: "b-stay", reviews: "b-reviews", faq: "b-faq", book: "b-book" },
  },
  { slug: "dive-sites", label: "Dive sites", href: "/dive-sites", icon: "waves", sections: DIVE_SITES_SECTIONS, anchors: { list: "sites" } },
  { slug: "facilities", label: "Facilities and rates", href: "/facilities-and-rates", icon: "bed-double", sections: FACILITIES_SECTIONS, anchors: { stay: "stay", diving: "diving", rates: "rates" } },
  { slug: "dive-courses", label: "Dive courses", href: "/dive-courses", icon: "graduation-cap", sections: COURSES_SECTIONS, anchors: { list: "courses" } },
  { slug: "about-us", label: "About us", href: "/about-us", icon: "info", sections: ABOUT_SECTIONS, anchors: { story: "story", name: "name", boats: "boats" } },
  { slug: "blog", label: "Blog", href: "/blog", icon: "newspaper", sections: BLOG_SECTIONS, anchors: { stories: "stories" } },
  { slug: "faq", label: "FAQ", href: "/faq", icon: "circle-help", sections: FAQ_SECTIONS, anchors: { list: "questions" } },
];

export const COLLECTIONS: CollectionDef[] = [
  {
    key: "sites",
    label: "Dive site guides",
    itemLabel: "dive site",
    description: "Each dive site has a card on the Dive sites page and its own guide page. The Home page site picker uses them too.",
    fields: SITE_FIELDS,
    titleField: "name",
    itemHref: (slug) => `/en/dive-sites/${slug}`,
    listHref: "/dive-sites",
    icon: "map-pin",
  },
  {
    key: "courses",
    label: "Dive course packages",
    itemLabel: "course",
    description: "Each course has a card on the Dive courses page and its own page with what's included, the plan and requirements.",
    fields: COURSE_FIELDS,
    titleField: "name",
    itemHref: (slug) => `/en/dive-courses/${slug}`,
    listHref: "/dive-courses",
    icon: "award",
  },
  {
    key: "posts",
    label: "Blog stories",
    itemLabel: "story",
    description: "Stories on the blog, newest first by date. The newest is featured at the top of the blog unless the Blog page picks another one.",
    fields: POST_FIELDS,
    titleField: "title",
    itemHref: (slug) => `/en/blog/${slug}`,
    listHref: "/blog",
    icon: "notebook-pen",
    sortField: "date",
  },
  {
    key: "faqs",
    label: "FAQ questions",
    itemLabel: "question",
    description: "Questions on the FAQ page, in groups, in this order. A question with a full answer gets its own page; the Home page FAQ can link to it.",
    fields: FAQ_FIELDS,
    titleField: "question",
    itemHref: (slug) => `/en/faq/${slug}`,
    listHref: "/faq",
    icon: "message-circle-question",
  },
  {
    key: "categories",
    label: "Blog categories",
    itemLabel: "category",
    description: "Categories for blog stories. They become the filter buttons on the blog, in this order (only categories with stories are shown).",
    fields: CATEGORY_FIELDS,
    titleField: "name",
    itemHref: () => "/blog",
    listHref: "/blog",
    icon: "tags",
    noItemPage: true,
  },
];

export const pageDef = (slug: string) => PAGES.find((p) => p.slug === slug);
export const collectionDef = (key: string) => COLLECTIONS.find((c) => c.key === key);
export const sectionDefOf = (page: string, key: string) => pageDef(page)?.sections.find((s) => s.key === key);

/** An item's title for CMS lists: its title field, in English when it's a bilingual text. */
export function itemTitle(def: CollectionDef, content: Record<string, unknown> | null | undefined): string {
  const v = content?.[def.titleField];
  if (v && typeof v === "object" && "en" in v) return String((v as { en: string }).en);
  return v == null ? "" : String(v);
}
