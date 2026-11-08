"use client";

import { useItemHref } from "@/lib/i18n";
import { useState } from "react";
import Link from "@/components/LocalLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button, ButtonLink, Eyebrow, Tag } from "@/components/ui";
import { bookMessage, type PublishedCourses } from "@/lib/cms/courses-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import "./courses.css";

/** The Dive courses page, rendered from CMS content (published, or drafts in the CMS preview). */
export function CoursesView({ data }: { data: PublishedCourses }) {
  const h = useContent(data.media);
  return (
    <div className="page">
      <SiteHeader current="courses" />
      {data.order.map((k) => {
        if (k === "hero") return <Hero key={k} data={data} h={h} />;
        if (k === "list") return <List key={k} data={data} h={h} />;
        if (k === "cta") return <Cta key={k} data={data} h={h} />;
        return null;
      })}
      <SiteFooter />
    </div>
  );
}

type P = { data: PublishedCourses; h: ContentHelpers };

function Hero({ data, h }: P) {
  const { L, img } = h;
  const c = data.content.hero;
  const logos = c.logos.map((l) => ({ im: img(l.image, "160px"), alt: l.alt })).filter((l) => l.im);
  return (
    <section data-theme="dark" className="courses-hero">
      <div className="courses-hero__text">
        {L(c.eyebrow) && <Eyebrow onDark>{L(c.eyebrow)}</Eyebrow>}
        <h1 className="courses-hero__title">{L(c.title)}</h1>
        {L(c.lead) && <p className="courses-hero__lead">{L(c.lead)}</p>}
      </div>
      {logos.length > 0 && (
        <div className="courses-hero__logos">
          {logos.map((l, i) => (
            <img key={i} src={l.im!.src} srcSet={l.im!.srcSet} sizes={l.im!.sizes} alt={l.alt || l.im!.alt} />
          ))}
        </div>
      )}
    </section>
  );
}

function List({ data, h }: P) {
  const itemHref = useItemHref();
  const { L, img, t } = h;
  const c = data.content.list;
  const [filter, setFilter] = useState(0);
  const level = c.filters[filter]?.level ?? "";
  const shown = level ? data.courses.filter((x) => x.level === level) : data.courses;
  const tpl = data.content.detail.bookMessage;

  return (
    <section id="courses" className="courses-list">
      {c.filters.length > 1 && (
        <div role="tablist" aria-label={t("Course level")} className="chips courses-list__filters">
          {c.filters.map((f, k) => (
            <Button key={k} variant={k === filter ? "primary" : "secondary"} size="small" aria-pressed={k === filter} onClick={() => setFilter(k)}>
              {L(f.label)}
            </Button>
          ))}
        </div>
      )}
      <div className="courses-grid">
        {shown.map((x) => {
          const photo = img(x.photo, "(min-width: 1040px) 33vw, (min-width: 700px) 50vw, 100vw");
          const meta = [L(x.stay), L(x.dives)].filter(Boolean).join(" · ");
          return (
            <article key={x.slug} className="course-card">
              <Link href={itemHref("courses", x)} className="course-card__media" tabIndex={-1}>
                {photo && <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} alt={photo.alt || L(x.name)} loading="lazy" />}
                <span className="course-card__tag">
                  <Tag tone="primary">{t(x.level)}</Tag>
                </span>
              </Link>
              <div className="course-card__body">
                <h2 className="course-card__name">{L(x.name)}</h2>
                <div className="course-card__price">
                  <span className="course-card__amount">{x.price}</span>
                  {meta && <span className="course-card__meta">{meta}</span>}
                </div>
                <p className="course-card__text">{L(x.text)}</p>
                <div className="course-card__actions">
                  {L(c.moreLabel) && (
                    <ButtonLink href={itemHref("courses", x)} variant="text" icon="arrow-right" iconPosition="suffix">
                      {L(c.moreLabel)}
                    </ButtonLink>
                  )}
                  {L(c.bookLabel) && (
                    <ButtonLink href={waLink(bookMessage(tpl, x))} external variant="primary" icon="message-circle">
                      {L(c.bookLabel)}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Cta({ data, h }: P) {
  const { L } = h;
  const c = data.content.cta;
  const phone = /whatsapp|wa\.me|^tel:/i.test(c.secondaryUrl);
  return (
    <section data-theme="dark" className="cta-band cta-band--dark">
      <div className="cta-band__text">
        <h2 className="h2">{L(c.title)}</h2>
        {L(c.text) && <p className="lead">{L(c.text)}</p>}
      </div>
      <div className="cta-band__actions">
        {L(c.primaryLabel) && (
          <ButtonLink href={waLink(c.primaryMessage || undefined)} external variant="primary" size="xlarge" icon="message-circle">
            {L(c.primaryLabel)}
          </ButtonLink>
        )}
        {L(c.secondaryLabel) && c.secondaryUrl && (
          <ButtonLink
            href={c.secondaryUrl}
            external={/^(https?:|tel:)/.test(c.secondaryUrl)}
            variant="secondary"
            size="xlarge"
            icon={phone ? "phone" : "arrow-right"}
            iconPosition={phone ? undefined : "suffix"}
          >
            {L(c.secondaryLabel)}
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
