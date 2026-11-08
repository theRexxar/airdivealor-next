"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Alert, Button, ButtonLink, Eyebrow, Icon, Tag, asIcon } from "@/components/ui";
import type { FacilitiesContent, GalleryPhoto, IconItem, PublishedFacilities } from "@/lib/cms/facilities-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import "../about-us/about.css";
import "./facilities.css";

/** A gallery photo with texts already in the visitor's language. */
interface Photo {
  src?: string;
  srcSet?: string;
  label: string;
  title: string;
}

/** Sections that share the shaded "diving" band when they follow each other. */
const DIVING_BAND = new Set(["diving", "boats", "gear"]);

/** The Facilities and rates page, rendered from CMS content (published, or drafts in the CMS preview). */
export function FacilitiesView({ data }: { data: PublishedFacilities }) {
  const h = useContent(data.media);
  const c = data.content;
  const [tab, setTab] = useState(0);
  const [viewer, setViewer] = useState<{ photos: Photo[]; i: number } | null>(null);

  /** Open a rates tab and scroll to the table. */
  const pick = (k: number) => {
    setTab(Math.max(0, Math.min(k, c.rates.packages.length - 1)));
    const el = document.getElementById("rates");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" });
  };
  const photos = (g: GalleryPhoto[]): Photo[] =>
    g.map((p) => {
      const im = h.img(p.photo, "(min-width: 900px) 60vw, 100vw");
      return { src: im?.src, srcSet: im?.srcSet, label: h.L(p.label), title: h.L(p.title) };
    });
  const openViewer = (list: Photo[]) => (i: number) => setViewer({ photos: list, i });

  // Build the page in section order; consecutive diving/boats/gear sections share one band.
  const blocks: ReactNode[] = [];
  let band: ReactNode[] | null = null;
  let bandHasDiving = false;
  const flush = () => {
    if (band) blocks.push(<section key={`band-${blocks.length}`} id={bandHasDiving ? "diving" : undefined} className="section fr-diving">{band}</section>);
    band = null;
    bandHasDiving = false;
  };
  for (const k of data.order) {
    if (DIVING_BAND.has(k)) {
      const first = !band;
      band ??= [];
      if (k === "diving") {
        bandHasDiving = true;
        band.push(<Diving key={k} c={c} h={h} photos={photos(c.diving.gallery)} onOpen={openViewer} pickRates={() => pick(0)} />);
      } else if (k === "boats") band.push(<Boats key={k} c={c} h={h} first={first} />);
      else band.push(<Gear key={k} c={c} h={h} first={first} />);
      continue;
    }
    flush();
    if (k === "hero") blocks.push(<Hero key={k} c={c} h={h} />);
    else if (k === "glance") blocks.push(<Glance key={k} c={c} h={h} onPick={pick} />);
    else if (k === "stay") blocks.push(<Stay key={k} c={c} h={h} photos={photos(c.stay.gallery)} onOpen={openViewer} />);
    else if (k === "rates") blocks.push(<Rates key={k} c={c} h={h} tab={Math.min(tab, c.rates.packages.length - 1)} setTab={setTab} />);
    else if (k === "cta") blocks.push(<Cta key={k} c={c} h={h} />);
  }
  flush();

  return (
    <div className="page">
      <SiteHeader current="facilities" />
      {blocks}
      {viewer && <PhotoViewer photos={viewer.photos} start={viewer.i} onClose={() => setViewer(null)} />}
      <SiteFooter />
    </div>
  );
}

type P = { c: FacilitiesContent; h: ContentHelpers };

function Hero({ c, h }: P) {
  const { L, img } = h;
  const photo = img(c.hero.image);
  return (
    <section data-theme="dark" className="fr-hero">
      {photo && <img className="about-hero__img" src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || L(c.hero.title)} fetchPriority="high" />}
      <div aria-hidden="true" className="fr-hero__shade" />
      <div className="fr-hero__body">
        {L(c.hero.eyebrow) && <Eyebrow onDark>{L(c.hero.eyebrow)}</Eyebrow>}
        <h1 className="about-hero__title">{L(c.hero.title)}</h1>
        {L(c.hero.lead) && <p className="about-hero__lead fr-hero__lead">{L(c.hero.lead)}</p>}
      </div>
    </section>
  );
}

function Glance({ c, h, onPick }: P & { onPick: (k: number) => void }) {
  const { L } = h;
  if (!c.glance.items.length) return null;
  return (
    <section className="fr-glance">
      <div data-theme="light" className="fr-glance__grid" style={{ gridTemplateColumns: `repeat(${c.glance.items.length}, minmax(0, 1fr))` }}>
        {c.glance.items.map((g, i) => (
          <button key={i} type="button" className="fr-glance__item" onClick={() => onPick((g.package || 1) - 1)}>
            <span className="fr-caps-primary">{L(g.label)}</span>
            <span className="fr-glance__title">{L(g.title)}</span>
            <span className="fr-glance__price">
              {L(g.from) && <span className="fr-glance__from">{L(g.from)}</span>}
              <span className="fr-glance__amount">{g.price}</span>
            </span>
            {L(g.note) && <span className="fr-glance__note">{L(g.note)}</span>}
            {L(c.glance.moreLabel) && (
              <span className="fr-glance__more">
                <span>{L(c.glance.moreLabel)}</span>
                <Icon name="arrow-right" size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Intro({ h, eyebrow, title, paragraphs }: { h: ContentHelpers; eyebrow: FacilitiesContent["stay"]["eyebrow"]; title: FacilitiesContent["stay"]["title"]; paragraphs: FacilitiesContent["stay"]["paragraphs"] }) {
  const { L } = h;
  return (
    <div className="fr-intro">
      <div className="fr-intro__head">
        {L(eyebrow) && <Eyebrow>{L(eyebrow)}</Eyebrow>}
        <h2 className="h2">{L(title)}</h2>
      </div>
      {paragraphs.length > 0 && (
        <div className="fr-intro__text">
          {paragraphs.map((p, i) => (
            <p key={i} className="fr-p">
              {L(p.text)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Stay({ c, h, photos, onOpen }: P & { photos: Photo[]; onOpen: (list: Photo[]) => (i: number) => void }) {
  const { L } = h;
  const s = c.stay;
  return (
    <section id="stay" className="section">
      <Intro h={h} eyebrow={s.eyebrow} title={s.title} paragraphs={s.paragraphs} />
      <div className="fr-split">
        <Gallery photos={photos} onOpen={onOpen(photos)} />
        <div className="fr-side">
          {(L(s.listTitle) || L(s.badge)) && (
            <div className="fr-side__head">
              {L(s.listTitle) && <span className="fr-side__title">{L(s.listTitle)}</span>}
              {L(s.badge) && (
                <Tag tone="primary" icon="house">
                  {L(s.badge)}
                </Tag>
              )}
            </div>
          )}
          <IconList h={h} items={s.items} />
          {L(s.note) && (
            <div data-theme="light">
              <Alert>{L(s.note)}</Alert>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Diving({ c, h, photos, onOpen, pickRates }: P & { photos: Photo[]; onOpen: (list: Photo[]) => (i: number) => void; pickRates: () => void }) {
  const { L } = h;
  const d = c.diving;
  return (
    <>
      <Intro h={h} eyebrow={d.eyebrow} title={d.title} paragraphs={d.paragraphs} />
      <div className="fr-split">
        <div className="fr-side">
          {L(d.listTitle) && (
            <div className="fr-side__head">
              <span className="fr-side__title">{L(d.listTitle)}</span>
            </div>
          )}
          <IconList h={h} items={d.items} />
          {L(d.ratesLabel) && (
            <div className="fr-row">
              <Button variant="secondary" size="large" icon="arrow-right" iconPosition="suffix" onClick={pickRates}>
                {L(d.ratesLabel)}
              </Button>
            </div>
          )}
        </div>
        <Gallery photos={photos} onOpen={onOpen(photos)} />
      </div>
    </>
  );
}

function SubHead({ h, title, lead }: { h: ContentHelpers; title: FacilitiesContent["boats"]["title"]; lead: FacilitiesContent["boats"]["lead"] }) {
  const { L } = h;
  return (
    <div className="fr-sub__head">
      <h3 className="fr-sub__title">{L(title)}</h3>
      {L(lead) && <p className="lead">{L(lead)}</p>}
    </div>
  );
}

function Boats({ c, h, first }: P & { first: boolean }) {
  const { L, img } = h;
  return (
    <div className="fr-sub" style={first ? { marginTop: 0 } : undefined}>
      <SubHead h={h} title={c.boats.title} lead={c.boats.lead} />
      <div className="boats">
        {c.boats.items.map((b, i) => {
          const photo = img(b.photo, "(min-width: 900px) 50vw, 100vw");
          return (
            <article key={i} className="boat fr-boat">
              <div className="boat__media">{photo && <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || `${b.name} dive boat`} loading="lazy" />}</div>
              <div className="boat__body">
                <h4 className="boat__name">{b.name}</h4>
                {L(b.text) && <p className="boat__text fr-boat__text">{L(b.text)}</p>}
                <div className="boat__specs">
                  {b.specs.map((sp, k) => (
                    <div key={k} className="boat__spec">
                      <Icon name={asIcon(sp.icon)} size={18} style={{ color: "var(--icon-primary)" }} />
                      <span className="boat__spec-label fr-boat__label">{L(sp.label)}</span>
                      <span className="boat__spec-value">{L(sp.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Gear({ c, h, first }: P & { first: boolean }) {
  const { L } = h;
  return (
    <div className="fr-sub" style={first ? { marginTop: 0 } : undefined}>
      <SubHead h={h} title={c.gear.title} lead={c.gear.lead} />
      <div className="fr-gear">
        {c.gear.items.map((g, i) => (
          <div key={i} className="fr-gear__item">
            <Icon name={asIcon(g.icon)} size={26} style={{ color: "var(--icon-primary)" }} />
            <span className="fr-gear__title">{L(g.title)}</span>
            {L(g.text) && <p>{L(g.text)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const fill = (tpl: string, v: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));

function Rates({ c, h, tab, setTab }: P & { tab: number; setTab: (k: number) => void }) {
  const { L, t, lang } = h;
  const id = lang === "ID";
  const r = c.rates;
  const P = r.packages[tab];
  if (!P) return null;
  return (
    <section id="rates" className="section fr-rates">
      <div className="stories__head fr-rates__head">
        <div className="fr-rates__intro">
          {L(r.eyebrow) && <Eyebrow>{L(r.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(r.title)}</h2>
          {L(r.lead) && <p className="lead">{L(r.lead)}</p>}
        </div>
        {r.packages.length > 1 && (
          <div role="tablist" aria-label="Rate type" className="chips">
            {r.packages.map((p, k) => (
              <Button key={k} role="tab" aria-selected={k === tab} variant={k === tab ? "primary" : "secondary"} size="small" onClick={() => setTab(k)}>
                {L(p.name)}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="fr-split fr-split--top">
        <div className="fr-rates__main">
          <div className="fr-rates__title">
            <span className="fr-rates__name">{L(P.name)}</span>
            {L(P.sub) && <span className="fr-rates__sub">{L(P.sub)}</span>}
          </div>
          {P.rows.length > 0 ? (
            <div className="fr-table">
              <div className="fr-table__head">
                <span>{t("Trip length")}</span>
                <span>{t("Price")}</span>
                <span />
              </div>
              {P.rows.map((row, k) => (
                <a
                  key={k}
                  className="fr-table__row"
                  href={waLink(fill(r.rowMessage || "Hi Air Dive Alor, I am interested in {package}: {dives} dives, {days} days / {nights} nights ({price}).", { package: P.name.en, ...row }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ask about ${P.name.en}, ${row.dives} dives, ${row.days} days`}
                >
                  <span className="fr-table__len">
                    <span className="fr-table__days">{id ? `${row.days} hari, ${row.nights} malam` : `${row.days} days, ${row.nights} nights`}</span>
                    <span className="fr-table__dives">{id ? `${row.dives} kali selam` : `${row.dives} dives`}</span>
                  </span>
                  <span className="fr-table__price">{row.price}</span>
                  <Icon name="arrow-right" size={18} style={{ color: "var(--icon-primary)" }} />
                </a>
              ))}
            </div>
          ) : (
            <>
              <div className="fr-ala">
                {P.cards.map((cd, k) => (
                  <a key={k} className="fr-ala__card" href={waLink(cd.message || undefined)} target="_blank" rel="noopener noreferrer">
                    <Icon name={asIcon(cd.icon)} size={26} style={{ color: "var(--icon-primary)" }} />
                    <span className="label-caps">{L(cd.label)}</span>
                    <span className="fr-ala__price">{cd.price}</span>
                    {L(cd.per) && <span className="fr-ala__per">{L(cd.per)}</span>}
                  </a>
                ))}
              </div>
            </>
          )}
          {L(P.tag) && (
            <div className="fr-row">
              <Tag tone="primary" icon="percent">
                {L(P.tag)}
              </Tag>
            </div>
          )}
        </div>
        <div className="fr-incl">
          {P.included.length > 0 && <span className="label-caps">{t("Included")}</span>}
          {P.included.map((it, k) => (
            <div key={k} className="fr-incl__row">
              <Icon name="circle-check" size={20} style={{ color: "var(--icon-primary)", flex: "none" }} />
              <span>{L(it.text)}</span>
            </div>
          ))}
          {P.excluded.length > 0 && <span className="label-caps fr-incl__sep">{t("Not included")}</span>}
          {P.excluded.map((it, k) => (
            <div key={k} className="fr-incl__row">
              <Icon name="circle-x" size={20} style={{ color: "var(--neutral-500)", flex: "none" }} />
              <span>{L(it.text)}</span>
            </div>
          ))}
          {L(P.note) && <p className="fr-incl__note">{L(P.note)}</p>}
        </div>
      </div>
      {L(r.note) && (
        <div data-theme="light" className="fr-note">
          <Alert>{L(r.note)}</Alert>
        </div>
      )}
    </section>
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

function IconList({ h, items }: { h: ContentHelpers; items: IconItem[] }) {
  if (!items.length) return null;
  return (
    <div className="fr-list">
      {items.map((it, i) => (
        <div key={i} className="fr-list__row">
          <Icon name={asIcon(it.icon)} size={22} style={{ color: "var(--icon-primary)", flex: "none" }} />
          <span>{h.L(it.text)}</span>
        </div>
      ))}
    </div>
  );
}

/** Large photo with caption and arrows, plus a row of thumbnails. Photos without a source show a placeholder. */
function Gallery({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  const { t } = useContent({});
  const [i, setI] = useState(0);
  const n = photos.length;
  if (!n) return null;
  const x = photos[Math.min(i, n - 1)];
  return (
    <div className="fr-gallery">
      <div className="fr-gallery__main">
        {x.src ? (
          <button type="button" className="fr-gallery__open" aria-label={t("View photo larger")} onClick={() => onOpen(i)}>
            <img src={x.src} srcSet={x.srcSet} sizes={x.srcSet ? "(min-width: 900px) 60vw, 100vw" : undefined} alt={x.title} />
          </button>
        ) : (
          <div className="fr-gallery__empty">
            <Icon name="image-plus" size={32} />
            <span>{t("Photo coming soon")}</span>
          </div>
        )}
        <div data-theme="dark" className="fr-gallery__caption">
          <div className="fr-gallery__text">
            <span className="fr-gallery__label">{x.label}</span>
            <span className="fr-gallery__title">{x.title}</span>
          </div>
          <div className="fr-gallery__controls">
            <span className="fr-gallery__count">
              {i + 1} / {n}
            </span>
            <Button variant="secondary" icon="chevron-left" iconOnly aria-label={t("Previous photo")} onClick={() => setI((i + n - 1) % n)} />
            <Button variant="secondary" icon="chevron-right" iconOnly aria-label={t("Next photo")} onClick={() => setI((i + 1) % n)} />
            {x.src && <Button variant="secondary" icon="maximize-2" iconOnly aria-label={t("View photo larger")} onClick={() => onOpen(i)} />}
          </div>
        </div>
      </div>
      <div className="fr-thumbs" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {photos.map((p, j) => (
          <button key={j} type="button" className="fr-thumb" aria-label={`Show photo: ${p.title}`} aria-pressed={j === i} onClick={() => setI(j)}>
            <span className="fr-thumb__img">
              {p.src ? (
                <img src={p.src} srcSet={p.srcSet} sizes={p.srcSet ? "160px" : undefined} alt="" loading="lazy" />
              ) : (
                <span className="fr-thumb__empty">
                  <Icon name="image-plus" size={22} />
                </span>
              )}
            </span>
            <span className="fr-thumb__label">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Full-screen viewer for a gallery; skips photos that have no source yet. */
function PhotoViewer({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const { t } = useContent({});
  const withSrc = photos.filter((p) => p.src);
  const [i, setI] = useState(Math.max(0, withSrc.indexOf(photos[start])));
  const n = withSrc.length;
  const x = withSrc[i];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((k) => (k + 1) % n);
      if (e.key === "ArrowLeft") setI((k) => (k + n - 1) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [n, onClose]);

  if (!x) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div data-theme="dark" role="dialog" aria-modal="true" aria-label={t("Photo viewer")} className="fr-viewer">
      <div className="fr-viewer__bar">
        <span className="fr-gallery__label">{x.label}</span>
        <span className="fr-viewer__count">
          {i + 1} / {n}
        </span>
        <Button variant="secondary" icon="x" iconOnly aria-label={t("Close")} onClick={onClose} />
      </div>
      <div className="fr-viewer__stage" onClick={onClose}>
        <span onClick={stop}>
          <Button variant="secondary" size="large" icon="chevron-left" iconOnly aria-label={t("Previous photo")} onClick={() => setI((i + n - 1) % n)} />
        </span>
        <img className="fr-viewer__img" src={x.src} srcSet={x.srcSet} sizes={x.srcSet ? "100vw" : undefined} alt={x.title} onClick={stop} />
        <span onClick={stop}>
          <Button variant="secondary" size="large" icon="chevron-right" iconOnly aria-label={t("Next photo")} onClick={() => setI((i + 1) % n)} />
        </span>
      </div>
      <div className="fr-viewer__title">{x.title}</div>
    </div>
  );
}
