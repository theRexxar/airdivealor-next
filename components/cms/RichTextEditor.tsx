"use client";

import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";
import type QuillType from "quill";
import { MediaPicker, type MediaItem } from "./media";

/**
 * Rich text editor (Quill 2) for one language of a rich text field. Stores clean HTML: headings, bold,
 * italic, lists, quotes, links, pictures from the media library and YouTube/Vimeo videos.
 * The website cleans the HTML again before showing it (lib/server/rich-sanitize.ts).
 */

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "link"],
  ["image", "video"],
  ["clean"],
];
const FORMATS = ["header", "bold", "italic", "underline", "strike", "list", "blockquote", "link", "image", "video"];

let registered: Promise<typeof QuillType> | null = null;

/** Load Quill in the browser once, with a picture format that remembers its media library id. */
function loadQuill() {
  registered ??= import("quill").then(({ default: Quill }) => {
    const Image = Quill.import("formats/image") as unknown as {
      new (...a: unknown[]): { domNode: HTMLElement; format(n: string, v: unknown): void };
      formats(n: HTMLElement): Record<string, string>;
      sanitize(u: string): string;
    };
    class MediaImage extends (Image as unknown as typeof Image) {
      static formats(node: HTMLElement) {
        const f = Image.formats(node);
        const id = node.getAttribute("data-media-id");
        if (id) f["data-media-id"] = id;
        return f;
      }
      // http(s) and site paths only: pasted base64 pictures would bloat the page and are dropped on the website.
      static sanitize(url: string) {
        return /^data:/i.test(url) ? "//:0" : Image.sanitize(url);
      }
      format(name: string, value: unknown) {
        if (name === "data-media-id") {
          if (value) this.domNode.setAttribute(name, String(value));
          else this.domNode.removeAttribute(name);
        } else super.format(name, value);
      }
    }
    Quill.register({ "formats/image": MediaImage as never }, true);
    return Quill;
  });
  return registered;
}

/** Quill's HTML without the editor's leftovers ("<p><br></p>" when empty, &nbsp; for spaces). */
function cleanHtml(q: QuillType) {
  if (q.getLength() <= 1 && !q.root.querySelector("img, iframe")) return "";
  return q.getSemanticHTML().replace(/&nbsp;/g, " ");
}

export function RichTextEditor({
  id,
  value,
  onChange,
  readOnly,
  lang,
  onMediaPicked,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
  readOnly: boolean;
  lang: "en" | "id";
  onMediaPicked: (m: MediaItem) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const quill = useRef<QuillType | null>(null);
  const last = useRef(value);
  const change = useRef(onChange);
  change.current = onChange;
  const [picking, setPicking] = useState(false);
  const range = useRef<{ index: number; length: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const el = host.current!;
    loadQuill().then((Quill) => {
      if (!alive) return;
      const editorEl = document.createElement("div");
      el.appendChild(editorEl);
      const q = new Quill(editorEl, {
        theme: "snow",
        formats: FORMATS,
        placeholder: lang === "en" ? "Write in English…" : "Tulis dalam Bahasa Indonesia…",
        modules: {
          toolbar: {
            container: TOOLBAR,
            handlers: {
              // Pictures come from the media library, so the website can serve resized versions.
              image: () => {
                range.current = q.getSelection(true);
                setPicking(true);
              },
            },
          },
          clipboard: { matchVisual: false },
        },
      });
      q.root.id = id;
      q.root.setAttribute("aria-label", lang === "en" ? "English text" : "Indonesian text");
      q.root.lang = lang;
      if (value) q.setContents(q.clipboard.convert({ html: value }), "silent");
      q.enable(!readOnly);
      q.on("text-change", () => {
        const html = cleanHtml(q);
        last.current = html;
        change.current(html);
      });
      quill.current = q;
    });
    return () => {
      alive = false;
      quill.current = null;
      el.innerHTML = "";
    };
    // Created once; later value and readOnly changes are applied below.
  }, []);

  // A new value from outside (e.g. "Undo unsaved edits"): load it into the editor.
  useEffect(() => {
    const q = quill.current;
    if (!q || value === last.current) return;
    last.current = value;
    q.setContents(q.clipboard.convert({ html: value || "" }), "silent");
  }, [value]);

  useEffect(() => {
    quill.current?.enable(!readOnly);
  }, [readOnly]);

  return (
    <div className="cms-rich" data-readonly={readOnly ? "" : undefined}>
      <div ref={host} />
      {picking && (
        <MediaPicker
          accept="image"
          selectedId={null}
          onClose={() => setPicking(false)}
          onChoose={(m) => {
            const q = quill.current;
            setPicking(false);
            if (!q || !m.url) return;
            onMediaPicked(m);
            const at = range.current?.index ?? q.getLength();
            q.insertEmbed(at, "image", m.url, "user");
            q.formatText(at, 1, { alt: (lang === "id" && m.alt.id) || m.alt.en || "", "data-media-id": String(m.id) }, "user");
            q.setSelection(at + 1, 0, "silent");
          }}
        />
      )}
    </div>
  );
}
