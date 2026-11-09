"use client";

import Link from "@/components/LocalLink";
import { useEffect } from "react";
import { RichText } from "@/components/RichText";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink, Icon } from "@/components/ui";
import { dateLabel } from "@/lib/blog";
import type { PublishedFaq } from "@/lib/cms/faq-types";
import { useContent } from "@/lib/cms/use-content";
import { ROUTES, waLink } from "@/lib/site";
import { FaqCards, useFaqGroup } from "../FaqCards";
import "../faq.css";

/** One question with its full answer (rich text), rendered from the CMS (published, or the draft in the preview). */
export function FaqView({ data }: { data: PublishedFaq }) {
  const h = useContent(data.media);
  const { L, img, t, lang } = h;
  const group = useFaqGroup();
  const f = data.faq;
  const x = data.texts;
  const question = L(f.question);
  const cover = img(f.cover, "(min-width: 1100px) 1040px, 100vw");
  const cta = (x.ctaMessage || "Hi Air Dive Alor, I have a question about: {question}").replace(/\{question\}/g, f.question.en);

  useEffect(() => {
    document.title = `${question} | Air Dive Alor`;
  }, [question]);

  return (
    <div className="page">
      <SiteHeader />

      <article>
        <section className="post-head">
          <div className="post-head__inner">
            <nav aria-label={t("Breadcrumb")} className="breadcrumb">
              <Link href={ROUTES.faqPages}>{t("FAQ")}</Link>
              {group(f.category) && <Icon name="chevron-right" size={14} style={{ color: "var(--neutral-500)" }} />}
              {group(f.category) && <Link href={`${ROUTES.faqPages}#faq-${f.category}`}>{group(f.category)}</Link>}
            </nav>
            <h1 className="post-head__title">{question}</h1>
            <p className="post-head__excerpt">{L(f.answer)}</p>
            {data.publishedAt && L(x.updatedLabel) && (
              <p className="faq-updated">
                {L(x.updatedLabel)} <time dateTime={data.publishedAt.slice(0, 10)}>{dateLabel(data.publishedAt.slice(0, 10), lang)}</time>
              </p>
            )}
          </div>
        </section>

        {cover && (
          <div className="post-cover">
            <div className="post-cover__frame">
              <img src={cover.src} srcSet={cover.srcSet} sizes={cover.sizes} alt={cover.alt || question} fetchPriority="high" />
            </div>
          </div>
        )}

        <section className={cover ? "post-body" : "post-body faq-body--no-cover"}>
          <div className="post-body__inner">
            <RichText html={L(f.body)} media={data.media} />

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

            {L(x.backLabel) && (
              <div>
                <ButtonLink href={ROUTES.faqPages} variant="text" icon="arrow-left">
                  {L(x.backLabel)}
                </ButtonLink>
              </div>
            )}
          </div>
        </section>
      </article>

      {data.more.length > 0 && (
        <section className="section faq-more">
          <div className="faq-more__inner">
            <h2 className="h2">{L(x.moreTitle)}</h2>
            <FaqCards faqs={data.more} h={h} readLabel={t("Read the full answer")} />
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
