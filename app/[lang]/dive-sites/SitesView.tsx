"use client";

import { useItemHref } from "@/lib/i18n";
import Link from "@/components/LocalLink";
import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Alert, Button, ButtonLink, Eyebrow, Icon, asIcon } from "@/components/ui";
import type { PublishedDiveSites, SiteContent } from "@/lib/cms/dive-sites-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import "./sites.css";

/** The Dive sites page, rendered from CMS content (published, or drafts in the CMS preview). */
export function SitesView({ data }: { data: PublishedDiveSites }) {
  const h = useContent(data.media);
  const c = data.content;
  return (
    <div className="page">
      <SiteHeader />
      {data.order.map((k) => {
        switch (k) {
          case "hero":
            return <Hero key={k} c={c} h={h} />;
          case "highlights":
            return <Highlights key={k} c={c} h={h} overlap={data.order[data.order.indexOf(k) - 1] === "hero"} />;
          case "list":
            return <List key={k} c={c} h={h} sites={data.sites} />;
          case "cta":
            return <Cta key={k} c={c} h={h} />;
          default:
            return null;
        }
      })}
      <SiteFooter />
    </div>
  );
}

type P = { c: PublishedDiveSites["content"]; h: ContentHelpers };

function Hero({ c, h }: P) {
  const { L, img } = h;
  const photo = img(c.hero.image);
  return (
    <section data-theme="dark" className="sites-hero">
      {photo && <img className="sites-hero__img" src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt} fetchPriority="high" />}
      <div aria-hidden="true" className="sites-hero__shade" />
      <div className="sites-hero__body">
        {L(c.hero.eyebrow) && <Eyebrow onDark>{L(c.hero.eyebrow)}</Eyebrow>}
        <h1 className="sites-hero__title">{L(c.hero.title)}</h1>
        {L(c.hero.lead) && <p className="sites-hero__lead">{L(c.hero.lead)}</p>}
      </div>
    </section>
  );
}

function Highlights({ c, h, overlap }: P & { overlap: boolean }) {
  const { L } = h;
  if (!c.highlights.items.length) return null;
  return (
    <section className="sites-known" style={overlap ? undefined : { paddingTop: "clamp(48px, 6vw, 80px)" }}>
      <div data-theme="light" className="sites-known__grid" style={overlap ? undefined : { marginTop: 0 }}>
        {c.highlights.items.map((x, i) => (
          <div key={i} className="sites-known__item">
            <Icon name={asIcon(x.icon)} size={26} style={{ color: "var(--icon-primary)" }} />
            <span className="sites-known__title">{L(x.title)}</span>
            {L(x.text) && <p>{L(x.text)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/** A site matches a filter when one of its dive types (English) contains one of the filter's words. */
const matches = (site: SiteContent, match: string) => {
  const words = match.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  return !words.length || site.diveTypes.some((d) => words.some((w) => d.label.en.toLowerCase().includes(w)));
};

function List({ c, h, sites }: P & { sites: SiteContent[] }) {
  const itemHref = useItemHref();
  const { L, img, t, lang } = h;
  const per = Math.max(1, c.list.pageSize || 9);
  const [filter, setFilter] = useState(0);
  const [shown, setShown] = useState(per);
  const [loading, setLoading] = useState(false);
  const f = c.list.filters[filter];
  const all = sites.map((s, i) => ({ s, i })).filter(({ s }) => !f || matches(s, f.match));
  const left = Math.max(0, all.length - shown);
  const id = lang === "ID";

  const loadMore = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setShown((n) => n + per);
      setLoading(false);
    }, 450);
  };

  return (
    <section id="sites" className="sites-all">
      <div className="stories__head sites-all__head">
        <div className="sites-all__intro">
          {L(c.list.eyebrow) && <Eyebrow>{L(c.list.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(c.list.title)}</h2>
        </div>
        {c.list.filters.length > 1 && (
          <div className="chips">
            {c.list.filters.map((x, k) => (
              <Button
                key={k}
                variant={k === filter ? "primary" : "secondary"}
                size="small"
                onClick={() => {
                  setFilter(k);
                  setShown(per);
                }}
              >
                {L(x.label)}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="site-grid">
        {all.slice(0, shown).map(({ s, i }) => {
          const photo = img(s.photo, "(min-width: 1040px) 33vw, (min-width: 700px) 50vw, 100vw");
          return (
            <Link key={s.slug} href={itemHref("sites", s)} aria-label={`Open site guide: ${s.name}`} className="site-card">
              <div className="site-card__media">
                {photo ? (
                  <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || s.name} loading="lazy" />
                ) : (
                  <div data-theme="dark" className="site-card__nophoto">
                    <Icon name="waves" size={32} style={{ color: "var(--primary-300)" }} />
                    <span>{t("Photo coming soon")}</span>
                  </div>
                )}
                <span className="site-card__num">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="site-card__body">
                <span className="site-card__type">{L(s.type)}</span>
                <span className="site-card__name">{s.name}</span>
                <span className="site-card__area">
                  <Icon name="map-pin" size={15} />
                  {L(s.area) || "Alor"}
                </span>
                <p className="site-card__intro">{L(s.intro)}</p>
              </div>
              <div className="site-card__facts">
                <Fact label={t("Depth")} value={s.depth} />
                <Fact label={t("Level")} value={L(s.level)} />
                <Fact label={t("Current")} value={L(s.current)} />
              </div>
              <div className="site-card__more">
                <span>{t("Site guide")}</span>
                <Icon name="arrow-right" size={18} />
              </div>
            </Link>
          );
        })}
      </div>

      {left > 0 && (
        <div className="sites-more">
          <Button variant="secondary" size="large" icon="chevron-right" iconPosition="suffix" onClick={loadMore}>
            {id ? (loading ? "Memuat…" : `Muat ${Math.min(per, left)} lagi`) : loading ? "Loading…" : `Load ${Math.min(per, left)} more`}
          </Button>
          <span className="sites-more__count">
            {id ? `Menampilkan ${Math.min(shown, all.length)} dari ${all.length} titik` : `Showing ${Math.min(shown, all.length)} of ${all.length} sites`}
          </span>
        </div>
      )}
      {L(c.list.note) && (
        <div data-theme="light" className="sites-note">
          <Alert>{L(c.list.note)}</Alert>
        </div>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="site-card__fact">
      <span className="site-card__fact-label">{label}</span>
      <span className="site-card__fact-value">{value || "—"}</span>
    </div>
  );
}

function Cta({ c, h }: P) {
  const { L } = h;
  return (
    <section className="cta-band">
      <div className="cta-band__text">
        <h2 className="h2">{L(c.cta.title)}</h2>
        {L(c.cta.text) && <p className="lead">{L(c.cta.text)}</p>}
      </div>
      <div className="cta-band__actions">
        {L(c.cta.primaryLabel) && (
          <ButtonLink href={waLink(c.cta.primaryMessage || undefined)} external variant="primary" size="xlarge" icon="message-circle">
            {L(c.cta.primaryLabel)}
          </ButtonLink>
        )}
        {L(c.cta.secondaryLabel) && c.cta.secondaryUrl && (
          <ButtonLink href={c.cta.secondaryUrl} external={/^https?:/.test(c.cta.secondaryUrl)} variant="secondary" size="xlarge" icon="arrow-right" iconPosition="suffix">
            {L(c.cta.secondaryLabel)}
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
