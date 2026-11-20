"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * The 404 scene on a canvas: a lost diver searching with a torch in dark water, a big "404" in the
 * background, fish that flee the light, marine snow and bubbles. The visitor's pointer is a second
 * torch; tapping the water sends a sonar ping the diver swims to. `surfacing` makes the diver rise.
 * The depth and heading readouts are written straight into the given elements (no re-render per frame).
 */

type Ping = { x: number; y: number; t: number };
type Bubble = { x: number; y: number; r: number; v: number; ph: number; t0: number };
type Snow = { x: number; y: number; r: number; v: number; ph: number };
type Fish = { x: number; y: number; v: number; s: number; ph: number; flee: number };

export interface SceneHandle {
  /** Make the diver swim up and out of the water. */
  surface: () => void;
}

export function useDiveScene(opts: {
  section: RefObject<HTMLElement | null>;
  canvas: RefObject<HTMLCanvasElement | null>;
  stage: RefObject<HTMLElement | null>;
  depth: RefObject<HTMLElement | null>;
  heading: RefObject<HTMLElement | null>;
  pingText: string;
  handle: RefObject<SceneHandle | null>;
}) {
  const pingText = useRef(opts.pingText);
  pingText.current = opts.pingText;

  useEffect(() => {
    const cv = opts.canvas.current;
    const sec = opts.section.current;
    const stage = opts.stage.current;
    if (!cv || !sec || !stage) return;
    const ctx = cv.getContext("2d");
    const mask = document.createElement("canvas");
    const mx = mask.getContext("2d");
    if (!ctx || !mx) return;

    const css = getComputedStyle(document.documentElement);
    const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const C = { p5: tok("--primary-500", "#2c71f6") };
    const serif = tok("--font-playfair", '"Playfair Display", Georgia, serif');
    const sans = tok("--font-roboto", "Roboto, system-ui, sans-serif");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const S = {
      w: 0, h: 0, dpr: 1, sc: 1, t: 0, last: performance.now(), cx: 0, cy: 0, lx: 0, ly: 0, px: 0, py: 0, ptrT: -9,
      dx: 0, dy: 0, face: 1, faceS: 1, beam: 0, bubT: 0, lookT: 0, up: 0, head: 0,
      pings: [] as Ping[], bubbles: [] as Bubble[], snow: [] as Snow[], fish: [] as Fish[], target: null as Ping | null,
    };
    opts.handle.current = { surface: () => void (S.up = 1) };

    const fit = () => {
      const r = sec.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      S.dpr = Math.min(2, window.devicePixelRatio || 1);
      S.w = r.width;
      S.h = r.height;
      cv.width = mask.width = Math.round(S.w * S.dpr);
      cv.height = mask.height = Math.round(S.h * S.dpr);
      S.cx = st.left - r.left + st.width / 2;
      S.cy = st.top - r.top + st.height / 2;
      S.sc = Math.max(0.62, Math.min(1.15, S.w / 1100));
      if (!S.dx) {
        S.dx = S.cx;
        S.dy = S.cy;
        S.lx = S.cx + 160;
        S.ly = S.cy - 40;
      }
      if (!S.snow.length) for (let i = 0; i < 140; i++) S.snow.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4, v: Math.random() * 0.012 + 0.004, ph: Math.random() * 6.28 });
      if (!S.fish.length)
        for (let i = 0; i < 9; i++)
          S.fish.push({ x: Math.random() * S.w, y: S.cy + (Math.random() - 0.5) * S.h * 0.7, v: (Math.random() * 30 + 22) * (Math.random() < 0.5 ? -1 : 1), s: Math.random() * 0.6 + 0.6, ph: Math.random() * 6.28, flee: 0 });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(sec);
    // Fonts arriving late move the text below the stage.
    document.fonts?.ready.then(fit).catch(() => {});

    const loc = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const move = (e: PointerEvent) => {
      [S.px, S.py] = loc(e);
      S.ptrT = S.t;
    };
    const leave = () => void (S.ptrT = -9);
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest?.('a,button,[role="button"],nav')) return;
      const [x, y] = loc(e);
      S.px = x;
      S.py = y;
      S.ptrT = S.t;
      S.pings.push({ x, y, t: S.t });
      S.target = { x, y, t: S.t };
    };
    sec.addEventListener("pointermove", move);
    sec.addEventListener("pointerdown", down);
    sec.addEventListener("pointerleave", leave);

    let hudT = 0;
    let loop = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - S.last) / 1000);
      S.last = now;
      S.t += reduce ? dt * 0.25 : dt;
      const { w, h, t } = S;
      const k = S.sc;
      const active = t - S.ptrT < 2.6;

      // The visitor's torch follows the pointer; without one it wanders.
      const wx = S.cx + Math.sin(t * 0.37) * Math.min(w * 0.34, 380) + Math.sin(t * 0.91) * 40;
      const wy = S.cy + Math.sin(t * 0.53 + 1) * 110;
      const tx = active ? S.px : wx;
      const ty = active ? S.py : wy;
      const lf = Math.min(1, dt * (active ? 14 : 2.5));
      S.lx += (tx - S.lx) * lf;
      S.ly += (ty - S.ly) * lf;

      // Where the diver swims: up when surfacing, to a sonar ping, or drifting near the torch.
      let gx: number, gy: number;
      if (S.up) {
        gx = S.dx;
        gy = -240;
      } else if (S.target && t - S.target.t < 3.2) {
        gx = S.target.x;
        gy = S.target.y;
      } else {
        S.target = null;
        const lim = Math.min(w * 0.3, 300);
        const ox = active ? (S.lx - S.cx) * 0.35 : Math.sin(t * 0.21) * 90;
        gx = S.cx + Math.max(-lim, Math.min(lim, ox));
        gy = S.cy + Math.sin(t * 0.6) * 18 + (active ? Math.max(-50, Math.min(50, (S.ly - S.cy) * 0.2)) : 0);
      }
      if (!S.up) gy = Math.max(S.cy - 120 * k, Math.min(S.cy + 110 * k, gy));
      gx = Math.max(110 * k, Math.min(w - 110 * k, gx));
      const sp = S.up ? 2.2 : S.target ? 0.9 : 0.6;
      S.dx += (gx - S.dx) * Math.min(1, dt * sp);
      S.dy += (gy - S.dy) * Math.min(1, dt * sp);

      if (S.target) S.face = S.target.x >= S.dx ? 1 : -1;
      else if (active) S.face = S.lx >= S.dx ? 1 : -1;
      else if (t > S.lookT) {
        S.face = -S.face;
        S.lookT = t + 2.4 + Math.random() * 2.2;
      }
      S.faceS += (S.face - S.faceS) * Math.min(1, dt * 5);
      const bx = S.dx;
      const by = S.dy + Math.sin(t * 1.6) * 6;

      // The diver's torch sweeps around, pulled a little toward the visitor's light.
      const hand = { x: bx + S.faceS * 78 * k, y: by + 4 * k };
      const sweep = Math.sin(t * 1.3) * 0.42 + Math.sin(t * 0.47) * 0.2;
      const baseA = S.faceS >= 0 ? 0 : Math.PI;
      const beamA = active && !S.target ? Math.atan2(S.ly - hand.y, S.lx - hand.x) * 0.25 + (baseA + sweep * S.face) * 0.75 : baseA + sweep * S.face;
      S.beam += (beamA - S.beam) * Math.min(1, dt * 4);
      if (Math.abs(beamA - S.beam) > 3) S.beam = beamA;

      S.bubT -= dt;
      if (S.bubT <= 0) {
        const n = S.up ? 5 : 2 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) S.bubbles.push({ x: bx + S.faceS * 70 * k + (Math.random() - 0.5) * 6, y: by - 6 * k, r: (Math.random() * 3 + 2) * k, v: 50 + Math.random() * 40, ph: Math.random() * 6.28, t0: t });
        S.bubT = S.up ? 0.08 : 2.2 + Math.random() * 0.6;
      }

      // Water.
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0b2a63");
      g.addColorStop(0.45, "#071a40");
      g.addColorStop(1, "#030914");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Sun rays from the surface.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const x = w * (0.15 + i * 0.18) + Math.sin(t * 0.2 + i) * 40;
        const rg = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        rg.addColorStop(0, "rgba(120,170,255,0.10)");
        rg.addColorStop(1, "rgba(120,170,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(x - 30, 0);
        ctx.lineTo(x + 30, 0);
        ctx.lineTo(x + 140, h * 0.7);
        ctx.lineTo(x - 20, h * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // "404".
      const fs = Math.min(w * 0.42, 400 * Math.max(0.7, k));
      ctx.font = `600 ${fs}px ${serif}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(160,190,255,0.16)";
      ctx.fillText("404", S.cx, S.cy + fs * 0.04);

      // Seabed.
      ctx.fillStyle = "#020611";
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 20; x += 20) ctx.lineTo(x, h - 46 - Math.sin(x * 0.012) * 18 - Math.sin(x * 0.031 + 2) * 10);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Fish, fleeing the visitor's light.
      for (const f of S.fish) {
        if (Math.hypot(f.x - S.lx, f.y - S.ly) < 140) f.flee = 1;
        f.flee = Math.max(0, f.flee - dt * 0.6);
        f.x += f.v * (1 + f.flee * 4) * dt;
        f.y += Math.sin(t * 2 + f.ph) * 0.3;
        if (f.x < -40) f.x = w + 40;
        if (f.x > w + 40) f.x = -40;
        const dir = f.v > 0 ? 1 : -1;
        const s = f.s * 7;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(dir, 1);
        ctx.fillStyle = "rgba(190,215,255,0.85)";
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.6, s * 0.6, 0, 0, 6.29);
        ctx.fill();
        const wag = Math.sin(t * 12 + f.ph) * s * 0.3;
        ctx.beginPath();
        ctx.moveTo(-s * 1.3, 0);
        ctx.lineTo(-s * 2.4, -s * 0.7 + wag);
        ctx.lineTo(-s * 2.4, s * 0.7 + wag);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Diver.
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(S.faceS * k, k);
      ctx.rotate(Math.sin(t * 0.9) * 0.05 - (S.up ? 0.5 : 0));
      const kick = Math.sin(t * (S.up ? 9 : 4.2)) * 0.32;
      const leg = (off: number, ph: number) => {
        ctx.save();
        ctx.translate(-48, off);
        ctx.rotate(Math.PI + 0.08 + kick * ph);
        ctx.fillStyle = "#16202f";
        ctx.beginPath();
        ctx.roundRect(0, -6, 46, 12, 6);
        ctx.fill();
        ctx.translate(44, 0);
        ctx.rotate(-kick * ph * 0.6);
        ctx.fillStyle = C.p5;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(44, -14);
        ctx.quadraticCurveTo(50, 0, 44, 14);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      leg(-4, 1);
      leg(5, -1);
      ctx.fillStyle = "#8aa0bd";
      ctx.beginPath();
      ctx.roundRect(-34, -30, 58, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#5e7391";
      ctx.fillRect(18, -27, 8, 10);
      ctx.fillStyle = "#1b2638";
      ctx.beginPath();
      ctx.roundRect(-54, -14, 104, 28, 14);
      ctx.fill();
      ctx.fillStyle = C.p5;
      ctx.fillRect(-30, -14, 6, 28);
      ctx.fillStyle = "#111823";
      ctx.fillRect(-8, -14, 9, 28);
      ctx.save();
      ctx.translate(36, 4);
      ctx.rotate(Math.sin(t * 1.3) * 0.2);
      ctx.fillStyle = "#16202f";
      ctx.beginPath();
      ctx.roundRect(0, -5, 40, 10, 5);
      ctx.fill();
      ctx.fillStyle = "#c9d3e0";
      ctx.beginPath();
      ctx.roundRect(36, -6, 16, 12, 3);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#1b2638";
      ctx.beginPath();
      ctx.arc(62, -4, 15, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = "#9fd0ff";
      ctx.beginPath();
      ctx.roundRect(66, -14, 14, 13, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(70, -12, 3, 6);
      ctx.fillStyle = "#c9d3e0";
      ctx.beginPath();
      ctx.arc(74, 5, 4, 0, 6.29);
      ctx.fill();
      // A puzzled "?" now and then.
      const q = (Math.sin(t * 0.8) + 1) / 2;
      if (!S.up) {
        ctx.save();
        ctx.scale(S.faceS < 0 ? -1 : 1, 1);
        ctx.globalAlpha = Math.max(0, q * 1.4 - 0.4);
        ctx.fillStyle = "#ffffff";
        ctx.font = `600 26px ${serif}`;
        ctx.fillText("?", (S.faceS < 0 ? -1 : 1) * 64, -44 - q * 8);
        ctx.restore();
      }
      ctx.restore();

      // Darkness, with holes for the two torches, the diver and sonar rings.
      mx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      mx.globalCompositeOperation = "source-over";
      mx.clearRect(0, 0, w, h);
      mx.fillStyle = "rgba(2,6,16,0.84)";
      mx.fillRect(0, 0, w, h);
      mx.globalCompositeOperation = "destination-out";
      const R = Math.max(120, Math.min(200, w * 0.16));
      let rg = mx.createRadialGradient(S.lx, S.ly, 0, S.lx, S.ly, R);
      rg.addColorStop(0, "rgba(0,0,0,1)");
      rg.addColorStop(0.55, "rgba(0,0,0,0.75)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      mx.fillStyle = rg;
      mx.beginPath();
      mx.arc(S.lx, S.ly, R, 0, 6.29);
      mx.fill();
      const L = Math.min(w * 0.5, 460) * Math.max(0.8, k);
      const spread = 0.28;
      rg = mx.createRadialGradient(hand.x, hand.y, 0, hand.x, hand.y, L);
      rg.addColorStop(0, "rgba(0,0,0,0.95)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      mx.fillStyle = rg;
      mx.beginPath();
      mx.moveTo(hand.x, hand.y);
      mx.arc(hand.x, hand.y, L, S.beam - spread, S.beam + spread);
      mx.closePath();
      mx.fill();
      rg = mx.createRadialGradient(bx, by, 0, bx, by, 120 * k);
      rg.addColorStop(0, "rgba(0,0,0,0.55)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      mx.fillStyle = rg;
      mx.beginPath();
      mx.arc(bx, by, 120 * k, 0, 6.29);
      mx.fill();
      for (const p of S.pings) {
        const a = t - p.t;
        if (a >= 1.6) continue;
        const r = a * 260;
        rg = mx.createRadialGradient(p.x, p.y, Math.max(0, r - 40), p.x, p.y, r);
        rg.addColorStop(0, "rgba(0,0,0,0)");
        rg.addColorStop(0.7, `rgba(0,0,0,${0.5 * (1 - a / 1.6)})`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        mx.fillStyle = rg;
        mx.beginPath();
        mx.arc(p.x, p.y, r, 0, 6.29);
        mx.fill();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(mask, 0, 0);
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);

      // Glow of the diver's torch.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      rg = ctx.createRadialGradient(hand.x, hand.y, 0, hand.x, hand.y, L);
      rg.addColorStop(0, "rgba(255,240,200,0.22)");
      rg.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(hand.x, hand.y);
      ctx.arc(hand.x, hand.y, L, S.beam - spread, S.beam + spread);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,248,225,0.9)";
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, 3.5 * k, 0, 6.29);
      ctx.fill();
      ctx.restore();

      // Marine snow, brighter near the visitor's light.
      for (const p of S.snow) {
        p.y -= p.v * dt * 0.4;
        p.x += Math.sin(t * 0.5 + p.ph) * 0.0002;
        if (p.y < 0) {
          p.y = 1;
          p.x = Math.random();
        }
        const x = p.x * w;
        const y = p.y * h;
        const lit = Math.max(0, 1 - Math.hypot(x - S.lx, y - S.ly) / 220);
        ctx.fillStyle = `rgba(200,220,255,${0.14 + lit * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, 6.29);
        ctx.fill();
      }

      // Bubbles.
      ctx.lineWidth = 1.2;
      S.bubbles = S.bubbles.filter((b) => {
        b.y -= b.v * dt;
        b.x += Math.sin(t * 3 + b.ph) * 0.5;
        b.r += dt * 0.8;
        const a = Math.min(1, (t - b.t0) * 3) * Math.min(1, b.y / 120);
        if (a <= 0) return false;
        ctx.strokeStyle = `rgba(210,230,255,${0.75 * a})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 6.29);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`;
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, 6.29);
        ctx.fill();
        return true;
      });

      // Sonar pings with their label.
      S.pings = S.pings.filter((p) => {
        const a = t - p.t;
        if (a > 2.4) return false;
        for (let i = 0; i < 3; i++) {
          const aa = a - i * 0.18;
          if (aa > 0 && aa < 1.4) {
            ctx.strokeStyle = `rgba(143,176,255,${(1 - aa / 1.4) * 0.9})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, aa * 120, 0, 6.29);
            ctx.stroke();
          }
        }
        const la = a < 0.4 ? a / 0.4 : a > 1.9 ? Math.max(0, (2.4 - a) / 0.5) : 1;
        const msg = pingText.current;
        ctx.font = `500 13px ${sans}`;
        const tw = ctx.measureText(msg).width + 28;
        const lx = Math.max(tw / 2 + 8, Math.min(w - tw / 2 - 8, p.x));
        const ly = p.y - 34 - a * 10;
        ctx.globalAlpha = la;
        ctx.fillStyle = "rgba(4,10,24,0.9)";
        ctx.beginPath();
        ctx.roundRect(lx - tw / 2, ly - 16, tw, 32, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,180,163,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#ffd2c7";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(msg, lx, ly + 1);
        ctx.globalAlpha = 1;
        return true;
      });

      // Depth and heading readouts, a few times a second.
      if (now - hudT > 220) {
        hudT = now;
        const dep = 18 + (S.dy - S.cy) / (40 * k) + Math.sin(t * 1.6) * 0.15;
        if (opts.depth.current) opts.depth.current.textContent = `${Math.max(0, dep).toFixed(1)} m`;
        S.head = (S.head + (Math.sin(t * 0.7) * 40 + Math.sin(t * 2.3) * 25) * 0.22 + 360) % 360;
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        if (opts.heading.current) opts.heading.current.textContent = `${dirs[Math.round(S.head / 45) % 8]} ${Math.round(S.head)}°`;
      }
      loop = requestAnimationFrame(frame);
    };
    loop = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(loop);
      ro.disconnect();
      sec.removeEventListener("pointermove", move);
      sec.removeEventListener("pointerdown", down);
      sec.removeEventListener("pointerleave", leave);
      opts.handle.current = null;
    };
    // The scene is set up once; refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
