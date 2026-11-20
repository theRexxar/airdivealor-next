"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { LightboxPhoto } from "./Lightbox";

/**
 * Makes every photo inside `root` that matches `selector` open in the Lightbox: a click, Enter or Space
 * opens it, and the viewer moves through all of them in page order (single photos, galleries and
 * pictures in rich text alike). Captions come from the photo's <figcaption>.
 */
export function useZoomPhotos(root: RefObject<HTMLElement | null>, selector: string, deps: unknown[], label: (alt: string) => string) {
  const [photos, setPhotos] = useState<LightboxPhoto[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(selector)).filter((i) => i.getAttribute("src"));
    imgs.forEach((img, i) => {
      img.dataset.zoom = String(i);
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-haspopup", "dialog");
      img.setAttribute("aria-label", label(img.alt));
    });
    setPhotos(
      imgs.map((img) => ({
        src: img.getAttribute("src")!,
        srcSet: img.getAttribute("srcset") || undefined,
        alt: img.alt,
        caption: img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || undefined,
      })),
    );
    const pick = (e: Event) => {
      const img = (e.target as Element).closest?.<HTMLImageElement>("img[data-zoom]");
      if (!img || !el.contains(img)) return;
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      setIndex(Number(img.dataset.zoom));
    };
    el.addEventListener("click", pick);
    el.addEventListener("keydown", pick);
    return () => {
      el.removeEventListener("click", pick);
      el.removeEventListener("keydown", pick);
      imgs.forEach((img) => {
        delete img.dataset.zoom;
        img.removeAttribute("tabindex");
        img.removeAttribute("role");
        img.removeAttribute("aria-haspopup");
        img.removeAttribute("aria-label");
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onChange = useCallback((i: number | null) => setIndex(i), []);
  return { photos, index, onChange };
}
