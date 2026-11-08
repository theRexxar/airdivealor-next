"use client";

import { useEffect, useState, type RefObject } from "react";
import { useLang } from "@/lib/i18n";

export interface GaugeStop {
  depth: number;
  /** Section element id; null scrolls to the top. */
  id: string | null;
  label: string;
  info: string;
}

/**
 * Sticky depth gauge on the right edge (wide screens only): fills from 0 to 30 m as the page scrolls.
 * Each dot jumps to its section and shows a tooltip on hover or focus.
 */
export function DepthGauge({ rootRef, stops }: { rootRef: RefObject<HTMLDivElement | null>; stops: GaugeStop[] }) {
  const { t } = useLang();
  const [depth, setDepth] = useState(0);
  const [tip, setTip] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)));
      setDepth(Math.round(p * 30));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rootRef]);

  let cur = 0;
  stops.forEach((s, i) => {
    if (s.depth <= depth) cur = i;
  });
  const go = (id: string | null) => {
    const el = id ? document.getElementById(id) : rootRef.current;
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - (id ? 64 : 0), behavior: "smooth" });
  };
  const tipStop = tip != null ? stops[tip] : null;

  return (
    <div className="gauge">
      <nav aria-label="Depth gauge" className="gauge__bar">
        <div className="gauge__end">0 m</div>
        <div className="gauge__track">
          <div className="gauge__fill" style={{ height: `${Math.round((depth / 30) * 100)}%` }} />
          {stops.map(({ depth: d, id, label }, i) => {
            const on = i === cur;
            const hov = i === tip;
            return (
              <button
                key={d}
                type="button"
                className="gauge__stop"
                style={{ top: `${(d / 30) * 100}%` }}
                aria-label={`${d} m, ${t(label)}`}
                aria-current={on ? "step" : undefined}
                onClick={() => go(id)}
                onMouseEnter={() => setTip(i)}
                onMouseLeave={() => setTip(null)}
                onFocus={() => setTip(i)}
                onBlur={() => setTip(null)}
              >
                <span
                  className="gauge__dot"
                  style={{
                    width: on || hov ? 14 : 10,
                    height: on || hov ? 14 : 10,
                    background: d <= depth ? "var(--primary-400)" : "var(--neutral-600)",
                    boxShadow: hov ? "0 0 0 4px rgba(255,255,255,0.25)" : "none",
                  }}
                />
              </button>
            );
          })}
          {tipStop && (
            <div role="tooltip" className="gauge__tip" style={{ top: `${(tipStop.depth / 30) * 100}%` }}>
              <span className="gauge__tip-depth">{tipStop.depth} m</span>
              <span className="gauge__tip-label">{t(tipStop.label)}</span>
              {tipStop.info && <span className="gauge__tip-info">{tipStop.info}</span>}
            </div>
          )}
        </div>
        <div className="gauge__end">30 m</div>
        <div className="gauge__now">{depth} m</div>
      </nav>
    </div>
  );
}
