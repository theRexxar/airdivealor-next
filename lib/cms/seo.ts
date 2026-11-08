import type { Metadata } from "next";
import { OG_LOCALE, otherLocale, type Alternates, type Locale } from "../i18n-routes";
import type { I18n, MediaRef } from "./fields";
import type { ResolvedMedia } from "./home-types";

/** Shared image when a page has none of its own (also the site-wide default in app/layout.tsx). */
export const DEFAULT_SHARE_IMAGE = "/sites/don-tupa.jpg";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * Metadata for one page in one language: title, description, canonical URL (this language's URL), hreflang
 * alternates (en, id, and x-default = English), Open Graph (with this language's locale) and Twitter card.
 * Relative URLs are made absolute with `metadataBase` (SITE_URL, set in app/[lang]/layout.tsx).
 */
export function pageMetadata(o: {
  lang: Locale;
  alternates: Alternates;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}): Metadata {
  const description = clip(o.description.replace(/\s+/g, " ").trim(), 300);
  const images = [{ url: o.image || DEFAULT_SHARE_IMAGE, alt: o.title }];
  const url = o.alternates[o.lang];
  return {
    title: o.title,
    description,
    alternates: { canonical: url, languages: { en: o.alternates.en, id: o.alternates.id, "x-default": o.alternates.en } },
    openGraph: {
      title: o.title,
      description,
      url,
      siteName: "Air Dive Alor",
      locale: OG_LOCALE[o.lang],
      alternateLocale: [OG_LOCALE[otherLocale(o.lang)]],
      images,
      ...(o.type === "article"
        ? { type: "article", publishedTime: o.publishedTime, modifiedTime: o.modifiedTime, section: o.section, authors: ["Air Dive Alor"] }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: o.title, description, images: images.map((i) => i.url) },
  };
}

/** Text in a language, English when the Indonesian is empty. */
export const tl = (v: I18n | undefined, lang: Locale) => (lang === "id" && v?.id?.trim() ? v.id : (v?.en ?? ""));

/** Image URL for a CMS media reference (library file or external link). */
export function mediaUrl(ref: MediaRef | undefined, media: Record<string, ResolvedMedia>): string | undefined {
  if (!ref) return undefined;
  return (ref.mediaId ? media[ref.mediaId]?.url : ref.url) || undefined;
}

/** Page metadata from a CMS "SEO and sharing" section, in the page language. */
export function seoMetadata(
  seo: { title: I18n; description: I18n; ogImage: MediaRef },
  media: Record<string, ResolvedMedia>,
  lang: Locale,
  alternates: Alternates,
  fallbackImage?: string,
): Metadata {
  return pageMetadata({ lang, alternates, title: tl(seo.title, lang), description: tl(seo.description, lang), image: mediaUrl(seo.ogImage, media) || fallbackImage });
}
