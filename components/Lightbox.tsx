"use client";

import { useEffect, useRef, type PointerEvent as RPointerEvent } from "react";
import { useLang } from "@/lib/i18n";
import { Button } from "./ui";

export interface LightboxPhoto {
  src: string;
  /** Larger versions, so the zoomed photo is sharp (the browser picks one for the full screen). */
  srcSet?: string;
  alt: string;
  caption?: string;
}

/**
 * Full-screen photo viewer. Move between photos with the previous/next buttons at the sides, the arrow
 * keys, or a swipe. Close with X, Escape or a click on the backdrop. Focus goes back where it was.
 */
export function Lightbox({ photos, index, onChange }: { photos: LightboxPhoto[]; index: number | null; onChange: (i: number | null) => void }) {
  const { t } = useLang();
  const n = photos.length;
  const closeBtn = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  // A drag that ends on the backdrop also fires a click there: it must not close the viewer.
  const swiped = useRef(false);
  const open = index != null;
  const go = (d: number) => index != null && onChange((index + d + n) % n);

  // Lock the page scroll and return focus to the opener while the viewer is open.
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    html.style.overflow = document.body.style.overflow = "hidden";
    closeBtn.current?.querySelector("button")?.focus();
    return () => {
      html.style.overflow = document.body.style.overflow = "";
      back?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (n > 1 && e.key === "ArrowRight") onChange((index + 1) % n);
      if (n > 1 && e.key === "ArrowLeft") onChange((index + n - 1) % n);
    };
    window.addEventListener("keydown", onKey);
    // Load the neighbours, so the next slide appears at once.
    for (const j of [index + 1, index - 1]) {
      const q = photos[(j + n) % n];
      if (n > 1 && q) {
        const im = new Image();
        if (q.srcSet) {
          im.sizes = "100vw";
          im.srcset = q.srcSet;
        }
        im.src = q.src;
      }
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onChange, photos]);

  if (index == null || !photos[index]) return null;
  const p = photos[index];
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // Swipe left or right anywhere on the viewer (touch, pen or mouse drag).
  const down = (e: RPointerEvent) => {
    // Buttons keep their own clicks.
    if ((e.target as Element).closest("button")) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    // Keep getting the pointer wherever it goes, so the swipe's end is seen here.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const up = (e: RPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.hypot(dx, dy) > 10) {
      swiped.current = true;
      setTimeout(() => (swiped.current = false), 0);
    }
    if (n > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={p.caption || p.alt} data-theme="dark" className="lightbox" onClick={() => !swiped.current && onChange(null)} onPointerDown={down} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}>
      <div className="lightbox__top" onClick={stop}>
        {n > 1 && (
          <span className="lightbox__count" aria-live="polite">
            {index + 1} / {n}
          </span>
        )}
        <div ref={closeBtn}>
          <Button variant="secondary" icon="x" iconOnly aria-label={t("Close")} onClick={() => onChange(null)} />
        </div>
      </div>
      <figure className="lightbox__stage">
        <img key={index} className="lightbox__img" src={p.src} srcSet={p.srcSet} sizes={p.srcSet ? "100vw" : undefined} alt={p.alt} draggable={false} onClick={stop} />
        {p.caption && (
          <figcaption className="lightbox__caption" onClick={stop}>
            {p.caption}
          </figcaption>
        )}
      </figure>
      {n > 1 && (
        <>
          <span className="lightbox__side lightbox__side--prev" onClick={stop}>
            <Button variant="secondary" icon="chevron-left" iconOnly aria-label={t("Previous photo")} onClick={() => go(-1)} />
          </span>
          <span className="lightbox__side lightbox__side--next" onClick={stop}>
            <Button variant="secondary" icon="chevron-right" iconOnly aria-label={t("Next photo")} onClick={() => go(1)} />
          </span>
        </>
      )}
    </div>
  );
}
