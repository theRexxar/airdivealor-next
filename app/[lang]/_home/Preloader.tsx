"use client";

import { useEffect, useState } from "react";

/** Shown once per visit: true after the first home-page load finished, so client-side returns skip it. */
let loadedOnce = false;

/** Full-screen loading screen with the Air Dive Alor logo inside a spinning ring; fades out after the page loads (at least 1.4 s). */
export function Preloader() {
  const [show, setShow] = useState(() => !loadedOnce);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (loadedOnce) return;
    const t0 = Date.now();
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    let started = false;
    const done = () => {
      if (started) return;
      started = true;
      t1 = setTimeout(() => {
        setOut(true);
        t2 = setTimeout(() => {
          loadedOnce = true;
          setShow(false);
        }, 500);
      }, Math.max(0, 1400 - (Date.now() - t0)));
    };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    const tMax = setTimeout(done, 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tMax);
      window.removeEventListener("load", done);
    };
  }, []);

  if (!show) return null;
  return (
    <div role="status" aria-live="polite" aria-label="Loading Air Dive Alor" className="preloader" data-out={out || undefined}>
      <div className="preloader__mark">
        <svg viewBox="0 0 168 168" width={168} height={168} className="preloader__ring">
          <circle cx={84} cy={84} r={78} fill="none" stroke="#e6e6e6" strokeWidth={3} />
          <circle cx={84} cy={84} r={78} fill="none" stroke="#111111" strokeWidth={3} strokeLinecap="round" strokeDasharray="120 370" />
        </svg>
        <img src="/brand/logo-loader.png" alt="Air Dive Alor" className="preloader__logo" />
      </div>
    </div>
  );
}
