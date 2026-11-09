/**
 * Rich text is HTML from the CMS editor. Everything the website shows goes through `sanitizeRich`, so only
 * the tags and attributes the editor makes can reach a page (no scripts, styles, event handlers or frames
 * from unknown sites), whatever was stored.
 */
import sanitizeHtml from "sanitize-html";
import type { Field, I18n } from "@/lib/cms/fields";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "iframe", "hr", "pre", "code"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "data-media-id"],
    iframe: ["src", "title", "allowfullscreen", "frameborder"],
    li: ["data-list"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // Videos only from YouTube and Vimeo.
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  // Frames whose address was refused (not YouTube or Vimeo) are left without src: drop them.
  exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
  transformTags: {
    // Old <b>/<i> become <strong>/<em>; external links open in a new tab.
    b: "strong",
    i: "em",
    a: (tag, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      const out: sanitizeHtml.Attributes = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
      return { tagName: "a", attribs: out };
    },
  },
};

/** Clean one rich text. */
export const sanitizeRich = (html: string | undefined) => (html ? sanitizeHtml(html, OPTIONS) : "");

/** A copy of a value (shaped by `fields`) with every rich text field cleaned. */
export function sanitizeRichFields<T>(fields: Field[], value: T): T {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  const set = (k: string, x: unknown) => {
    if (x === v[k]) return;
    out ??= { ...v };
    out[k] = x;
  };
  for (const f of fields) {
    const x = v[f.key];
    if (f.type === "richtext" && x && typeof x === "object") {
      const t = x as I18n;
      set(f.key, { en: sanitizeRich(t.en), id: sanitizeRich(t.id) });
    } else if (f.type === "group") set(f.key, sanitizeRichFields(f.fields, x));
    else if (f.type === "list" && Array.isArray(x)) {
      const arr = x.map((i) => sanitizeRichFields(f.fields, i));
      if (arr.some((a, i) => a !== x[i])) set(f.key, arr);
    } else if (f.type === "blocks" && Array.isArray(x)) {
      const arr = x.map((i) => sanitizeRichFields(f.kinds.find((k) => k.type === (i as { type?: string })?.type)?.fields ?? [], i));
      if (arr.some((a, i) => a !== x[i])) set(f.key, arr);
    }
  }
  return (out ?? value) as T;
}
