"use client";

import { useItemHref } from "@/lib/i18n";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button, ButtonLink, Dot, Eyebrow } from "@/components/ui";
import { dateLabel, readTimeLabel } from "@/lib/blog";
import type { PostCardData, PublishedBlog } from "@/lib/cms/blog-cms-types";
import { useContent, type ContentHelpers } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";

/** The Blog page, rendered from CMS content (published, or drafts in the CMS preview). */
export function BlogIndex({ data }: { data: PublishedBlog }) {
  const h = useContent(data.media);
  // Stories are newest first. The featured story (picked, or the newest) fills the hero, so "All" lists the rest.
  const feat = data.posts.find((p) => p.slug === data.content.hero.featured) ?? data.posts[0] ?? null;
  const heroShown = data.order.includes("hero") && !!feat;
  return (
    <div className="page">
      <SiteHeader current="blog" />
      {data.order.map((k) => {
        if (k === "hero" && feat) return <Hero key={k} data={data} h={h} feat={feat} />;
        if (k === "stories") return <Stories key={k} data={data} h={h} skip={heroShown ? feat : null} />;
        if (k === "cta") return <Cta key={k} data={data} h={h} />;
        return null;
      })}
      <SiteFooter />
    </div>
  );
}

type P = { data: PublishedBlog; h: ContentHelpers };

function Hero({ data, h, feat }: P & { feat: PostCardData }) {
  const itemHref = useItemHref();
  const { L, img, lang } = h;
  const c = data.content.hero;
  const title = L(feat.title);
  const cover = img(feat.cover);
  const cat = data.categories.find((x) => x.slug === feat.category);
  return (
    <section data-theme="dark" className="blog-hero">
      {cover && <img className="blog-hero__img" src={cover.src} srcSet={cover.srcSet} sizes={cover.sizes} alt={title} fetchPriority="high" />}
      <div aria-hidden="true" className="blog-hero__shade" />
      <div className="blog-hero__body">
        {L(c.eyebrow) && <Eyebrow onDark>{L(c.eyebrow)}</Eyebrow>}
        <h1 className="blog-hero__title">{title}</h1>
        <p className="blog-hero__excerpt">{L(feat.excerpt)}</p>
        <div className="blog-hero__meta">
          {cat && <span className="blog-hero__cat">{L(cat.name)}</span>}
          {cat && <Dot light />}
          <span>{dateLabel(feat.date, lang)}</span>
          <Dot light />
          <span>{readTimeLabel(feat.minutes, lang)}</span>
        </div>
        {L(c.buttonLabel) && (
          <div className="blog-hero__cta">
            <ButtonLink href={itemHref("posts", feat)} variant="primary" size="xlarge" icon="arrow-right" iconPosition="suffix">
              {L(c.buttonLabel)}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

function Stories({ data, h, skip }: P & { skip: PostCardData | null }) {
  const { L, t } = h;
  const c = data.content.stories;
  const per = Math.max(1, c.pageSize || 9);
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(0);
  const list = cat ? data.posts.filter((p) => p.category === cat) : data.posts.filter((p) => p !== skip);
  const total = Math.max(1, Math.ceil(list.length / per));
  const pg = Math.min(page, total - 1);
  const shown = list.slice(pg * per, pg * per + per);
  const filters = ["", ...data.categories.filter((k) => data.posts.some((p) => p.category === k.slug)).map((k) => k.slug)];
  const catName = (slug: string) => L(data.categories.find((k) => k.slug === slug)?.name);

  const goPage = (n: number) => {
    setPage(n);
    const el = document.getElementById("stories");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" });
  };

  return (
    <section id="stories" className="section stories">
      <div className="stories__head">
        <div className="stories__intro">
          {L(c.eyebrow) && <Eyebrow>{L(c.eyebrow)}</Eyebrow>}
          <h2 className="h2">{L(c.title)}</h2>
          {L(c.lead) && <p className="lead">{L(c.lead)}</p>}
        </div>
        {filters.length > 1 && (
          <div role="tablist" aria-label="Category" className="chips">
            {filters.map((k) => (
              <Button
                key={k || "all"}
                role="tab"
                aria-selected={k === cat}
                variant={k === cat ? "primary" : "secondary"}
                size="small"
                onClick={() => {
                  setCat(k);
                  setPage(0);
                }}
              >
                {k ? catName(k) : L(c.allLabel) || t("All")}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="card-grid">
        {shown.map((p) => (
          <PostCard key={p.slug} post={p} h={h} categories={data.categories} label={L(c.cardLabel) || t("Read story")} />
        ))}
      </div>

      {list.length > per && (
        <nav aria-label={t("Pagination")} className="pager">
          <Button variant="secondary" icon="arrow-left" disabled={pg === 0} onClick={() => pg > 0 && goPage(pg - 1)}>
            {t("Previous")}
          </Button>
          <div className="pager__pages">
            {Array.from({ length: total }, (_, j) => (
              <Button key={j} variant={j === pg ? "primary" : "secondary"} aria-label={`Page ${j + 1}`} aria-current={j === pg ? "page" : undefined} onClick={() => goPage(j)}>
                {j + 1}
              </Button>
            ))}
          </div>
          <Button variant="secondary" icon="arrow-right" iconPosition="suffix" disabled={pg === total - 1} onClick={() => pg < total - 1 && goPage(pg + 1)}>
            {t("Next")}
          </Button>
        </nav>
      )}
    </section>
  );
}

function Cta({ data, h }: P) {
  const { L } = h;
  const c = data.content.cta;
  return (
    <section className="section cta-band">
      <div className="cta-band__text">
        <h2 className="h2">{L(c.title)}</h2>
        {L(c.text) && <p className="lead">{L(c.text)}</p>}
      </div>
      <div className="cta-band__actions">
        {L(c.primaryLabel) && c.primaryUrl && (
          <ButtonLink href={c.primaryUrl} external={/^https?:/.test(c.primaryUrl)} variant="primary" size="xlarge" icon={/instagram\.com/i.test(c.primaryUrl) ? "instagram" : "arrow-right"}>
            {L(c.primaryLabel)}
          </ButtonLink>
        )}
        {L(c.secondaryLabel) && (
          <ButtonLink href={waLink(c.secondaryMessage || undefined)} external variant="secondary" size="xlarge" icon="message-circle">
            {L(c.secondaryLabel)}
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
