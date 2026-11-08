"use client";

import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar, ButtonLink, Eyebrow, Icon, asIcon } from "@/components/ui";
import type { AboutContent, PublishedAbout } from "@/lib/cms/about-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import "./about.css";

/** Old Wix hotlinks are stored full size; ask Wix for a 600 px square thumbnail for the gallery grid. */
const wixThumb = (url: string) => url.replace(/\/v1\/fit\/w_\d+,h_\d+,al_c,q_\d+\//, "/v1/fill/w_600,h_600,al_c,q_85/");

/** The About us page, rendered from CMS content (published, or drafts in the CMS preview). */
export function AboutView({ data }: { data: PublishedAbout }) {
  const h = useContent(data.media);
  const c = data.content;
  return (
    <div className="page">
      <SiteHeader current="about" />
      {data.order.map((k) => {
        if (k === "hero") return <Hero key={k} c={c} h={h} />;
        if (k === "story") return <Story key={k} c={c} h={h} />;
        if (k === "name") return <Name key={k} c={c} h={h} />;
        if (k === "boats") return <Boats key={k} c={c} h={h} />;
        if (k === "cta") return <Cta key={k} c={c} h={h} />;
        return null;
      })}
      <SiteFooter />
    </div>
  );
}

type P = { c: AboutContent; h: ContentHelpers };

function Hero({ c, h }: P) {
  const { L, img } = h;
  const x = c.hero;
  const photo = img(x.image);
  return (
    <section data-theme="dark" className="about-hero">
      {photo && <img className="about-hero__img" src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || h.t("Air Dive Alor resort in Alor Kecil")} fetchPriority="high" />}
      <div aria-hidden="true" className="about-hero__shade" />
      <div className="about-hero__body">
        <div className="about-hero__text">
          {L(x.eyebrow) && <Eyebrow onDark>{L(x.eyebrow)}</Eyebrow>}
          <h1 className="about-hero__title">{L(x.title)}</h1>
          {L(x.lead) && <p className="about-hero__lead">{L(x.lead)}</p>}
        </div>
        {x.facts.length > 0 && (
          <div className="about-facts">
            {x.facts.map((f, i) => (
              <div key={i} className="about-facts__item">
                <Icon name={asIcon(f.icon)} size={24} style={{ color: "var(--primary-300)" }} />
                <span className="about-facts__value">{L(f.value)}</span>
                {L(f.label) && <span className="about-facts__label">{L(f.label)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Story({ c, h }: P) {
  const { L, img, t } = h;
  const x = c.story;
  const [zoom, setZoom] = useState<number | null>(null);
  const photos = x.gallery
    .map((g, i) => {
      const im = img(g.photo, "(min-width: 900px) 15vw, 33vw");
      if (!im) return null;
      const alt = im.alt || t(`Air Dive Alor photo ${i + 1}`);
      return { thumb: im.srcSet ? im.src : wixThumb(im.src), srcSet: im.srcSet, sizes: im.sizes, large: im.src, alt };
    })
    .filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <section id="story" className="section">
      <div className="about-split">
        <div className="about-split__text about-split__text--story">
          {L(x.eyebrow) && <Eyebrow>{L(x.eyebrow)}</Eyebrow>}
          <h2 className="h2-tight">{L(x.title)}</h2>
          {x.paragraphs.map((p, i) => (
            <p key={i} className="body-lg">
              {L(p.text)}
            </p>
          ))}
          {L(x.hostsLabel) && (
            <div className="hosts">
              <span className="label-caps">{L(x.hostsLabel)}</span>
              {x.hosts.length > 0 && (
                <div className="hosts__list">
                  {x.hosts.map((p, i) => (
                    <div key={i} className="hosts__person">
                      <Avatar name={p.name} size={40} />
                      <span className="hosts__name">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {L(x.hostsText) && <p>{L(x.hostsText)}</p>}
            </div>
          )}
        </div>
        {photos.length > 0 && (
          <div className="about-gallery">
            {photos.map((p, i) => (
              <button key={i} type="button" className="about-gallery__item" aria-label={t(`Enlarge ${p.alt}`)} onClick={() => setZoom(i)}>
                <img src={p.thumb} srcSet={p.srcSet} sizes={p.sizes} alt={p.alt} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <Lightbox photos={photos.map((p) => ({ src: p.large, alt: p.alt }))} index={zoom} onChange={setZoom} />
    </section>
  );
}

function Name({ c, h }: P) {
  const { L } = h;
  const x = c.name;
  return (
    <section id="name" className="section about-name">
      <div className="about-split about-split--top">
        <div className="about-split__text about-split__text--name">
          {L(x.eyebrow) && <Eyebrow>{L(x.eyebrow)}</Eyebrow>}
          <h2 className="h2-tight">{L(x.title)}</h2>
          {L(x.text) && <p className="body-lg">{L(x.text)}</p>}
        </div>
        {x.cards.length > 0 && (
          <div className="name-cards">
            {x.cards.map((cd, i) => (
              <div key={i} className="name-card">
                <Icon name={asIcon(cd.icon)} size={28} style={{ color: "var(--icon-primary)" }} />
                {L(cd.label) && <span className="label-caps">{L(cd.label)}</span>}
                <span className="name-card__word">{L(cd.word)}</span>
                {L(cd.text) && <p>{L(cd.text)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Boats({ c, h }: P) {
  const { L, img, t } = h;
  const x = c.boats;
  return (
    <section id="boats" data-theme="dark" className="section about-boats">
      <div className="section-intro">
        {L(x.eyebrow) && <Eyebrow onDark>{L(x.eyebrow)}</Eyebrow>}
        <h2 className="h2-tight">{L(x.title)}</h2>
      </div>
      <div className="boats">
        {x.items.map((b, i) => {
          const photo = img(b.photo, "(min-width: 900px) 50vw, 100vw");
          return (
            <article key={i} className="boat">
              <div className="boat__media">{photo && <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || t(`${b.name} dive boat`)} loading="lazy" />}</div>
              <div className="boat__body">
                <h3 className="boat__name">{b.name}</h3>
                {L(b.text) && <p className="boat__text">{L(b.text)}</p>}
                <div className="boat__specs">
                  {b.specs.map((sp, k) => (
                    <div key={k} className="boat__spec">
                      <Icon name={asIcon(sp.icon)} size={18} style={{ color: "var(--primary-300)" }} />
                      <span className="boat__spec-label">{L(sp.label)}</span>
                      <span className="boat__spec-value">{L(sp.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Cta({ c, h }: P) {
  const { L } = h;
  const x = c.cta;
  return (
    <section className="cta-band cta-band--plain">
      <div className="cta-band__text">
        <h2 className="h2">{L(x.title)}</h2>
        {L(x.text) && <p className="lead">{L(x.text)}</p>}
      </div>
      <div className="cta-band__actions">
        {L(x.primaryLabel) && (
          <ButtonLink href={waLink(x.primaryMessage || undefined)} external variant="primary" size="xlarge" icon="message-circle">
            {L(x.primaryLabel)}
          </ButtonLink>
        )}
        {L(x.secondaryLabel) && x.secondaryUrl && (
          <ButtonLink href={x.secondaryUrl} external={/^https?:/.test(x.secondaryUrl)} variant="secondary" size="xlarge" icon="arrow-right" iconPosition="suffix">
            {L(x.secondaryLabel)}
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
