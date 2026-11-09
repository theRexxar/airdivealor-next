/**
 * Helpers for rich text (HTML written in the CMS's Quill editor). Shared by the server, the CMS and the
 * website, so no server-only imports here. Sanitizing happens on the server (lib/server/rich-sanitize.ts).
 */

/** Media library ids of the pictures in a rich text (<img data-media-id="12">). */
export function richMediaIds(html: string | undefined): number[] {
  if (!html) return [];
  return [...html.matchAll(/data-media-id="(\d+)"/g)].map((m) => Number(m[1])).filter((n) => n > 0);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/** The words of a rich text without tags, e.g. for read times, search descriptions and "is it empty?". */
export function richText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

/** The first picture of a rich text: its media library id, or its address. */
export function richFirstImage(html: string | undefined): { mediaId: number | null; url: string } | null {
  const tag = html?.match(/<img\b[^>]*>/)?.[0];
  if (!tag) return null;
  const id = tag.match(/data-media-id="(\d+)"/)?.[1];
  return { mediaId: id ? Number(id) : null, url: tag.match(/\ssrc="([^"]+)"/)?.[1] ?? "" };
}

/** True when the editor holds nothing but an empty paragraph. */
export const richIsEmpty = (html: string | undefined) => !richText(html) && !/<(img|iframe)\b/i.test(html ?? "");

interface RichMedia {
  url: string;
  srcSet: string;
  width?: number;
  height?: number;
  alt: { en: string; id: string };
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/**
 * Prepare cleaned rich text for a page: media library pictures get their resized versions (srcset) and
 * lazy loading, links inside the site get the page language (/dive-courses → /id/kursus-selam), videos
 * load lazily. `localize` turns a site path into the page language.
 */
export function prepareRich(html: string, media: Record<string, RichMedia>, lang: "en" | "id", localize: (href: string) => string, sizes = "(min-width: 760px) 720px, 100vw"): string {
  return html
    .replace(/<img\b[^>]*>/g, (tag) => {
      const id = attr(tag, "data-media-id");
      const m = id ? media[id] : undefined;
      const alt = attr(tag, "alt") || (m ? (lang === "id" && m.alt.id) || m.alt.en : "") || "";
      if (!m) {
        const src = attr(tag, "src");
        return src ? `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">` : "";
      }
      const dims = m.width && m.height ? ` width="${m.width}" height="${m.height}"` : "";
      const set = m.srcSet ? ` srcset="${esc(m.srcSet)}" sizes="${sizes}"` : "";
      return `<img src="${esc(m.url)}"${set}${dims} alt="${alt}" loading="lazy" decoding="async">`;
    })
    .replace(/<a\s+href="(\/[^"]*)"/g, (_, href: string) => `<a href="${localize(href.replace(/&amp;/g, "&")).replace(/&/g, "&amp;")}"`)
    .replace(/<iframe\b/g, '<iframe loading="lazy"');
}
