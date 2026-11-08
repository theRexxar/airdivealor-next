/** Content shapes for the Blog page, stories and categories. Mirrors blog-sections.ts and post-fields.ts. */
import type { I18n, MediaRef } from "./fields";
import type { ResolvedMedia } from "./home-types";

export type BodyBlock =
  | { type: "p" | "h"; text: I18n }
  | { type: "img"; photo: MediaRef; caption: I18n }
  | { type: "gallery"; items: { photo: MediaRef; caption: I18n }[] }
  | { type: "list"; items: { text: I18n }[] }
  | { type: "quote"; text: I18n; cite: string }
  | { type: "facts"; items: { label: I18n; value: I18n }[] }
  | { type: "link"; label: I18n; href: string };

export interface PostContent {
  slug: string;
  /** Indonesian web address; empty or missing = same as slug. */
  slugId?: string;
  title: I18n;
  excerpt: I18n;
  date: string;
  category: string;
  author: I18n;
  initials: string;
  cover: MediaRef;
  body: BodyBlock[];
  source: string;
}

export interface CategoryContent {
  slug: string;
  name: I18n;
}

export interface BlogContent {
  seo: { title: I18n; description: I18n; ogImage: MediaRef };
  post: { ctaTitle: I18n; ctaText: I18n; ctaLabel: I18n; ctaMessage: string; moreTitle: I18n; moreLabel: I18n; sourceNote: I18n; sourceLink: I18n };
  hero: { featured: string; eyebrow: I18n; buttonLabel: I18n };
  stories: { eyebrow: I18n; title: I18n; lead: I18n; allLabel: I18n; pageSize: number; cardLabel: I18n };
  cta: { title: I18n; text: I18n; primaryLabel: I18n; primaryUrl: string; secondaryLabel: I18n; secondaryMessage: string };
}

/** A story as cards need it (no body), with its read time worked out on the server. */
export interface PostCardData {
  slug: string;
  slugId?: string;
  title: I18n;
  excerpt: I18n;
  date: string;
  category: string;
  cover: MediaRef;
  minutes: number;
}

/** Public API: the Blog page with published stories (newest first) and categories. */
export interface PublishedBlog {
  content: BlogContent;
  order: string[];
  posts: PostCardData[];
  categories: CategoryContent[];
  media: Record<string, ResolvedMedia>;
  publishedAt: string | null;
}

/** Public API: one story with its neighbours, three more stories and the shared story-page texts. */
export interface PublishedPost {
  post: PostContent;
  minutes: number;
  newer: PostCardData | null;
  older: PostCardData | null;
  more: PostCardData[];
  categories: CategoryContent[];
  texts: BlogContent["post"];
  media: Record<string, ResolvedMedia>;
}

/** Read time in minutes (200 words a minute, at least 2), counted the same way as the original blog. */
export function readMinutes(p: PostContent): number {
  const count = (parts: string[]) => parts.join(" ").split(/\s+/).length;
  let n = 0;
  if (!p.body.length) n = count([p.excerpt.en]) + 1; // excerpt + the "read on the old blog" note
  for (const b of p.body) {
    if (b.type === "p" || b.type === "h" || b.type === "quote") n += count([b.text.en]);
    else if (b.type === "img") n += count([b.caption.en]);
    else if (b.type === "link") n += count([b.label.en]);
    else if (b.type === "gallery") n += count(["", ...b.items.map((i) => i.caption.en)]);
    else if (b.type === "list") n += count(["", ...b.items.map((i) => `${i.text.en} ${i.text.id}`)]);
    else if (b.type === "facts") n += count(["", ...b.items.map((i) => [i.label.en, i.label.id, i.value.en, i.value.id].join(" "))]);
  }
  return Math.max(2, Math.round(n / 200));
}

export const toCard = (p: PostContent): PostCardData => ({ slug: p.slug, slugId: p.slugId || undefined, title: p.title, excerpt: p.excerpt, date: p.date, category: p.category, cover: p.cover, minutes: readMinutes(p) });
