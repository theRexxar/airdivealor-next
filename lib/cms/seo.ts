import type { Metadata } from "next";
import type { I18n, MediaRef } from "./fields";
import type { ResolvedMedia } from "./home-types";

/** Shared image when a page has none of its own (also the site-wide default in app/layout.tsx). */
export const DEFAULT_SHARE_IMAGE = "/sites/don-tupa.jpg";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * Metadata for one page: title, description, canonical URL, Open Graph and Twitter card.
 * Relative URLs are made absolute with `metadataBase` (SITE_URL, set in app/layout.tsx).
 * There is no hreflang: English and Indonesian share one URL (the language switch is on the page).
 */
export function pageMetadata(o: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}): Metadata {
  const description = clip(o.description.replace(/\s+/g, " ").trim(), 300);
  const images = [{ url: o.image || DEFAULT_SHARE_IMAGE, alt: o.title }];
  return {
    title: o.title,
    description,
    alternates: { canonical: o.path },
    openGraph: {
      title: o.title,
      description,
      url: o.path,
      siteName: "Air Dive Alor",
      locale: "en_US",
      alternateLocale: ["id_ID"],
      images,
      ...(o.type === "article"
        ? { type: "article", publishedTime: o.publishedTime, modifiedTime: o.modifiedTime, section: o.section, authors: ["Air Dive Alor"] }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: o.title, description, images: images.map((i) => i.url) },
  };
}

/** Image URL for a CMS media reference (library file or external link). */
export function mediaUrl(ref: MediaRef | undefined, media: Record<string, ResolvedMedia>): string | undefined {
  if (!ref) return undefined;
  return (ref.mediaId ? media[ref.mediaId]?.url : ref.url) || undefined;
}

/** Page metadata from a CMS "SEO and sharing" section. */
export function seoMetadata(seo: { title: I18n; description: I18n; ogImage: MediaRef }, media: Record<string, ResolvedMedia>, path: string, fallbackImage?: string): Metadata {
  return pageMetadata({ title: seo.title.en, description: seo.description.en, path, image: mediaUrl(seo.ogImage, media) || fallbackImage });
}
