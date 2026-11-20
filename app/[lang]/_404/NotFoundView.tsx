"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Link from "@/components/LocalLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button, ButtonLink, Icon } from "@/components/ui";
import { useLocale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n-routes";
import { ROUTES, waLink } from "@/lib/site";
import { useDiveScene, type SceneHandle } from "./DiveScene";
import "./not-found.css";

const TEXT = {
  en: {
    title: "Page not found | Air Dive Alor",
    depth: "Depth",
    heading: "Heading",
    checkpoint: "Checkpoint",
    notFound: "Not found",
    eyebrow: "Error 404 · Lost at depth",
    h1: "This page drifted off the map.",
    lead: "Our diver has searched everywhere, but this checkpoint doesn't exist. The link may be old, or the page has moved. Surface safely and pick a new route.",
    surface: "Surface to home",
    sites: "Explore dive sites",
    hint: "Move your torch to search. Tap the water to send a sonar ping.",
    other: "Other checkpoints",
    ping: "No checkpoint here",
    links: [
      ["Dive courses", ROUTES.courses],
      ["Facilities and rates", ROUTES.facilities],
      ["About us", ROUTES.about],
      ["Blog", ROUTES.blog],
    ],
  },
  id: {
    title: "Halaman tidak ditemukan | Air Dive Alor",
    depth: "Kedalaman",
    heading: "Arah",
    checkpoint: "Checkpoint",
    notFound: "Tidak ketemu",
    eyebrow: "Error 404 · Tersesat di kedalaman",
    h1: "Halaman ini hanyut dari peta.",
    lead: "Penyelam kami sudah mencari ke mana-mana, tapi checkpoint ini tidak ada. Link-nya mungkin sudah lama, atau halamannya sudah pindah. Naik ke permukaan dengan aman dan pilih rute baru.",
    surface: "Naik ke beranda",
    sites: "Lihat titik selam",
    hint: "Gerakkan senter untuk mencari. Ketuk air untuk mengirim ping sonar.",
    other: "Checkpoint lain",
    ping: "Checkpoint tidak di sini",
    links: [
      ["Kursus selam", ROUTES.courses],
      ["Fasilitas dan tarif", ROUTES.facilities],
      ["Tentang kami", ROUTES.about],
      ["Blog", ROUTES.blog],
    ],
  },
} as const;

/** 404 page: a lost diver searching dark water with a torch, and routes back to the site. */
export function NotFoundView() {
  const locale = useLocale();
  const T = TEXT[locale];
  const router = useRouter();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const depth = useRef<HTMLElement>(null);
  const heading = useRef<HTMLElement>(null);
  const scene = useRef<SceneHandle>(null);
  useDiveScene({ section, canvas, stage, depth, heading, pingText: T.ping, handle: scene });
  // The server title is English (not-found pages get no language); show the visitor's language.
  useEffect(() => {
    document.title = T.title;
  }, [T.title]);

  // The diver swims up first, then the home page opens.
  const surface = () => {
    scene.current?.surface();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const home = localizeHref(ROUTES.home, locale);
    router.prefetch(home);
    setTimeout(() => router.push(home), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1300);
  };

  return (
    <div className="page">
      <SiteHeader />
      <main>
        <section ref={section} data-theme="dark" className="lost">
          <canvas ref={canvas} aria-hidden="true" className="lost__canvas" />
          <div className="lost__hud" aria-hidden="true">
            <span>
              {T.depth}
              <b ref={depth} className="lost__num">18.0 m</b>
            </span>
            <span>
              {T.heading}
              <b ref={heading} className="lost__num lost__num--wide">N 0°</b>
            </span>
            <span>
              {T.checkpoint}
              <b className="lost__miss">{T.notFound}</b>
            </span>
          </div>
          <div ref={stage} aria-hidden="true" className="lost__stage" />
          <div className="lost__body">
            <div className="lost__eyebrow">
              <span className="lost__rule" />
              {T.eyebrow}
              <span className="lost__rule" />
            </div>
            <h1 className="lost__title">{T.h1}</h1>
            <p className="lost__lead">{T.lead}</p>
            <div className="lost__actions">
              <Button variant="primary" size="xlarge" icon="arrow-up" onClick={surface}>
                {T.surface}
              </Button>
              <ButtonLink href={ROUTES.diveSites} variant="secondary" size="xlarge" icon="map">
                {T.sites}
              </ButtonLink>
            </div>
            <p className="lost__hint">
              <Icon name="flashlight" size={16} />
              <span>{T.hint}</span>
            </p>
            <div className="lost__more">
              <span className="lost__more-label">{T.other}</span>
              <nav aria-label={T.other} className="lost__links">
                {T.links.map(([label, href]) => (
                  <Link key={href} href={href} className="lost__pill">
                    {label}
                  </Link>
                ))}
                <a href={waLink()} target="_blank" rel="noopener noreferrer" className="lost__pill">
                  WhatsApp
                </a>
              </nav>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
