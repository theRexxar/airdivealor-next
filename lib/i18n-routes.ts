/**
 * Language-prefixed URLs: /en/... (default) and /id/..., with translated path segments.
 * Shared by the proxy (redirects and rewrites), the pages, the links and SEO. No server-only imports.
 *
 *   /en/dive-sites/kals-dream          ↔  /id/titik-selam/kals-dream
 *   /en/blog/beach-cleanup              ↔  /id/blog/bersih-bersih-pantai   (item slugs can differ too)
 *
 * The app's folders use the English segments; the proxy rewrites Indonesian URLs onto them.
 */

export const LOCALES = ["en", "id"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const isLocale = (x: string | undefined | null): x is Locale => x === "en" || x === "id";
export const otherLocale = (l: Locale): Locale => (l === "en" ? "id" : "en");
/** Open Graph locale codes. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", id: "id_ID" };
/** The cookie that remembers the visitor's last language (for URLs without a prefix). */
export const LANG_COOKIE = "lang";

export type Section = "home" | "diveSites" | "facilities" | "courses" | "about" | "blog";

/** First path segment per section and language ("" = the home page). */
export const SEGMENTS: Record<Section, Record<Locale, string>> = {
  home: { en: "", id: "" },
  diveSites: { en: "dive-sites", id: "titik-selam" },
  facilities: { en: "facilities-and-rates", id: "fasilitas-dan-tarif" },
  courses: { en: "dive-courses", id: "kursus-selam" },
  about: { en: "about-us", id: "tentang-kami" },
  blog: { en: "blog", id: "blog" },
};

/** Collections that have their own pages, and the section they live under. */
export const COLLECTION_SECTION = { sites: "diveSites", courses: "courses", posts: "blog" } as const satisfies Record<string, Section>;
export type PageCollection = keyof typeof COLLECTION_SECTION;

/** /en, /id/titik-selam, … */
export function pagePath(lang: Locale, section: Section): string {
  const seg = SEGMENTS[section][lang];
  return `/${lang}${seg ? `/${seg}` : ""}`;
}

/** An item's slug in a language: the Indonesian one when set, else the English one. */
export const itemSlug = (lang: Locale, item: { slug: string; slugId?: string }) => (lang === "id" && item.slugId ? item.slugId : item.slug);

/** /id/titik-selam/kals-dream, /en/blog/beach-cleanup, … */
export function itemPath(lang: Locale, collection: PageCollection, item: { slug: string; slugId?: string }): string {
  return `${pagePath(lang, COLLECTION_SECTION[collection])}/${itemSlug(lang, item)}`;
}

/** Both language versions of a page, for the language switch and hreflang. */
export type Alternates = Record<Locale, string>;
export const pageAlternates = (section: Section): Alternates => ({ en: pagePath("en", section), id: pagePath("id", section) });
export const itemAlternates = (collection: PageCollection, item: { slug: string; slugId?: string }): Alternates => ({
  en: itemPath("en", collection, item),
  id: itemPath("id", collection, item),
});

/** The section whose segment (in any language) is `seg`. */
export function sectionOf(seg: string): { section: Section; lang: Locale } | null {
  for (const [section, byLang] of Object.entries(SEGMENTS) as [Section, Record<Locale, string>][]) {
    for (const l of LOCALES) if (byLang[l] && byLang[l] === seg) return { section, lang: l };
  }
  return null;
}

/**
 * Put a site link into a language: "/dive-sites/x#top" → "/id/titik-selam/x#top", "/#b-faq" → "/id#b-faq".
 * Links that already have a language, external links, mailto:, tel: and #anchors are returned unchanged.
 * (Item slugs stay as given; the page redirects to its Indonesian slug if it has one.)
 */
export function localizeHref(href: string, lang: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const m = href.match(/^([^?#]*)(.*)$/)!;
  const [, path, rest] = m;
  const parts = path.split("/").filter(Boolean);
  if (isLocale(parts[0])) return href;
  if (!parts.length) return `/${lang}${rest}`;
  const s = sectionOf(parts[0]);
  // Public files (/sites/x.jpg, /brand/…) and non-page routes stay as they are.
  if (!s) return /\.[a-z0-9]{2,5}$/i.test(path) || ["api", "cms", "_next"].includes(parts[0]) ? href : `/${lang}${path}${rest}`;
  const seg = SEGMENTS[s.section][lang];
  return `/${[lang, seg, ...parts.slice(1)].filter(Boolean).join("/")}${rest}`;
}
