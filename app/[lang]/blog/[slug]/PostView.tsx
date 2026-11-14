"use client";

import { useItemHref } from "@/lib/i18n";
import Link from "@/components/LocalLink";
import { useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { RichText } from "@/components/RichText";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button, ButtonLink, Dot, Icon } from "@/components/ui";
import { dateLabel, readTimeLabel } from "@/lib/blog";
import type { BodyBlock, PostCardData, PublishedPost } from "@/lib/cms/blog-cms-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { ROUTES, waLink } from "@/lib/site";

/** One blog story, rendered from the CMS (published, or the draft in the CMS preview). */
export function PostView({ data }: { data: PublishedPost }) {
  const h = useContent(data.media);
  const { L, img, t, lang } = h;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const p = data.post;
  const x = data.texts;
  const title = L(p.title);
  const cat = data.categories.find((c) => c.slug === p.category);
  const cover = img(p.cover, "(min-width: 1100px) 1040px, 100vw");

  useEffect(() => {
    document.title = `${title} | Air Dive Alor`;
  }, [title]);

  const shareWA = () => window.open("https://api.whatsapp.com/send/?text=" + encodeURIComponent(p.title.en + " " + window.location.href), "_blank", "noopener");
  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  const copyLabel = t(copied ? "Link copied" : "Copy link");
  const cta = (x.ctaMessage || 'Hi Air Dive Alor, I read "{title}" and would like to plan a dive trip.').replace(/\{title\}/g, p.title.en);

  return (
    <div className="page">
      <SiteHeader />

      <article>
        <section className="post-head">
          <div className="post-head__inner">
            <nav aria-label={t("Breadcrumb")} className="breadcrumb">
              <Link href={ROUTES.blog}>Blog</Link>
              {cat && <Icon name="chevron-right" size={14} style={{ color: "var(--neutral-500)" }} />}
              {cat && <span>{L(cat.name)}</span>}
            </nav>
            <h1 className="post-head__title">{title}</h1>
            <p className="post-head__excerpt">{L(p.excerpt)}</p>
            <div className="post-head__byline">
              <div className="byline">
                <span aria-hidden="true" className="byline__avatar">{p.initials}</span>
                <span className="byline__text">
                  <span className="byline__name">{L(p.author)}</span>
                  <span className="byline__meta">
                    <span>{dateLabel(p.date, lang)}</span>
                    <Dot />
                    <span>{readTimeLabel(data.minutes, lang)}</span>
                  </span>
                </span>
              </div>
              <div className="share">
                <Button variant="secondary" icon="message-circle" iconOnly aria-label={t("Share on WhatsApp")} onClick={shareWA} />
                <Button variant="secondary" icon="link" onClick={copyLink}>{copyLabel}</Button>
              </div>
            </div>
          </div>
        </section>

        {cover && (
          <div className="post-cover">
            <div className="post-cover__frame">
              <img src={cover.src} srcSet={cover.srcSet} sizes={cover.sizes} alt={title} fetchPriority="high" />
            </div>
          </div>
        )}

        <section className="post-body">
          <div className="post-body__inner">
            {p.body.length > 0 ? (
              p.body.map((b, k) => <Block key={k} block={b} h={h} media={data.media} fallbackAlt={title} />)
            ) : (
              <>
                <p className="prose-p">{L(p.excerpt)}</p>
                {p.source && (
                  <div className="prose-source">
                    <span>{L(x.sourceNote)}</span>
                    <a href={p.source} target="_blank" rel="noopener noreferrer">
                      <span>{L(x.sourceLink)}</span>
                      <Icon name="external-link" size={16} />
                    </a>
                  </div>
                )}
              </>
            )}

            <div className="share-row">
              <span className="share-row__title">{t("Share this story")}</span>
              <div className="share">
                <Button variant="secondary" icon="message-circle" onClick={shareWA}>WhatsApp</Button>
                <Button variant="secondary" icon="link" onClick={copyLink}>{copyLabel}</Button>
              </div>
            </div>

            <div className="adjacent">
              {data.newer && <AdjacentLink post={data.newer} dir="newer" h={h} />}
              {data.older && <AdjacentLink post={data.older} dir="older" h={h} />}
            </div>

            {L(x.ctaTitle) && (
              <div data-theme="dark" className="post-cta">
                <span className="post-cta__title">{L(x.ctaTitle)}</span>
                {L(x.ctaText) && <p>{L(x.ctaText)}</p>}
                {L(x.ctaLabel) && (
                  <ButtonLink href={waLink(cta)} external variant="primary" size="large" icon="message-circle">
                    {L(x.ctaLabel)}
                  </ButtonLink>
                )}
              </div>
            )}
          </div>
        </section>
      </article>

      {data.more.length > 0 && (
        <section className="section more-stories">
          <div className="more-stories__head">
            <h2 className="h2">{L(x.moreTitle)}</h2>
            {L(x.moreLabel) && (
              <ButtonLink href={ROUTES.blog} variant="secondary" size="large" icon="arrow-right" iconPosition="suffix">
                {L(x.moreLabel)}
              </ButtonLink>
            )}
          </div>
          <div className="card-grid">
            {data.more.map((m) => (
              <PostCard key={m.slug} post={m} h={h} categories={data.categories} label={t("Read story")} />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function AdjacentLink({ post, dir, h }: { post: PostCardData; dir: "newer" | "older"; h: ContentHelpers }) {
  const itemHref = useItemHref();
  const { L, img, t } = h;
  const thumb = img(post.cover, "160px");
  return (
    <Link href={itemHref("posts", post)} className="adjacent__link">
      <span className="adjacent__thumb">{thumb && <img src={thumb.src} srcSet={thumb.srcSet} sizes={thumb.sizes} alt="" loading="lazy" />}</span>
      <span className="adjacent__text">
        <span className="adjacent__label">
          {dir === "newer" && <Icon name="arrow-left" size={14} />}
          <span>{t(dir === "newer" ? "Newer story" : "Older story")}</span>
          {dir === "older" && <Icon name="arrow-right" size={14} />}
        </span>
        <span className="adjacent__title">{L(post.title)}</span>
      </span>
    </Link>
  );
}

function Block({ block: b, h, media, fallbackAlt }: { block: BodyBlock; h: ContentHelpers; media: PublishedPost["media"]; fallbackAlt: string }) {
  const { L, img } = h;
  switch (b.type) {
    case "rich":
      return <RichText html={L(b.text)} media={media} />;
    case "p":
      return <p className="prose-p">{L(b.text)}</p>;
    case "h":
      return <h2 className="prose-h">{L(b.text)}</h2>;
    case "img": {
      const cap = L(b.caption);
      const im = img(b.photo, "(min-width: 760px) 720px, 100vw");
      if (!im) return null;
      return (
        <figure className="prose-figure">
          <span className="prose-figure__frame">
            <img src={im.src} srcSet={im.srcSet} sizes={im.sizes} alt={cap || im.alt || fallbackAlt} loading="lazy" />
          </span>
          {cap && <figcaption>{cap}</figcaption>}
        </figure>
      );
    }
    case "gallery":
      return (
        <div className="prose-gallery">
          {b.items.map((g, k) => {
            const cap = L(g.caption);
            const im = img(g.photo, "(min-width: 760px) 360px, 50vw");
            if (!im) return null;
            return (
              <figure key={k}>
                <span className="prose-gallery__frame">
                  <img src={im.src} srcSet={im.srcSet} sizes={im.sizes} alt={cap || im.alt || fallbackAlt} loading="lazy" />
                </span>
                {cap && <figcaption>{cap}</figcaption>}
              </figure>
            );
          })}
        </div>
      );
    case "list":
      return (
        <ul className="prose-list">
          {b.items.map((it, k) => (
            <li key={k}>
              <Icon name="circle-check" size={20} style={{ color: "var(--icon-primary)", flex: "none", marginTop: 2 }} />
              <span>{L(it.text)}</span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="prose-quote">
          <Icon name="quote" size={28} style={{ color: "var(--icon-primary)" }} />
          <p>{L(b.text)}</p>
          {b.cite && <span className="prose-quote__cite">{b.cite}</span>}
        </blockquote>
      );
    case "facts":
      return (
        <dl className="prose-facts">
          {b.items.map((f, k) => (
            <div key={k}>
              <dt>{L(f.label)}</dt>
              <dd>{L(f.value)}</dd>
            </div>
          ))}
        </dl>
      );
    case "link":
      return b.href ? (
        <div className="prose-link">
          <ButtonLink href={b.href} external={/^https?:/.test(b.href)} variant="secondary" size="large" icon="arrow-right" iconPosition="suffix">
            {L(b.label)}
          </ButtonLink>
        </div>
      ) : null;
  }
}
