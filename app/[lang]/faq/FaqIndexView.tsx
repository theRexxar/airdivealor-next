"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink, Eyebrow, Icon } from "@/components/ui";
import { FAQ_CATEGORIES } from "@/lib/cms/faq-fields";
import type { PublishedFaqs } from "@/lib/cms/faq-types";
import { useContent } from "@/lib/cms/use-content";
import { waLink } from "@/lib/site";
import { FaqCards, useFaqGroup } from "./FaqCards";
import "./faq.css";

/** The FAQ page: every question in its group, rendered from the CMS (published, or drafts in the preview). */
export function FaqIndexView({ data }: { data: PublishedFaqs }) {
  const h = useContent(data.media);
  const { L } = h;
  const group = useFaqGroup();
  const c = data.content;
  const groups = FAQ_CATEGORIES.map((g) => ({ ...g, faqs: data.faqs.filter((f) => f.category === g.value) })).filter((g) => g.faqs.length);
  const show = (k: string) => data.order.includes(k);

  return (
    <div className="page">
      <SiteHeader />
      <main>
        {show("hero") && (
          <section className="post-head faq-head">
            <div className="post-head__inner">
              {L(c.hero.eyebrow) && <Eyebrow>{L(c.hero.eyebrow)}</Eyebrow>}
              <h1 className="post-head__title">{L(c.hero.title)}</h1>
              {L(c.hero.lead) && <p className="post-head__excerpt">{L(c.hero.lead)}</p>}
              {groups.length > 1 && (
                <nav aria-label={L(c.hero.eyebrow) || "FAQ"} className="faq-jump">
                  {groups.map((g) => (
                    <a key={g.value} href={`#faq-${g.value}`} className="faq-jump__link">
                      {group(g.value)}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </section>
        )}

        {show("list") && (
          <section id="questions" className="faq-groups">
            {groups.length ? (
              groups.map((g) => (
                <section key={g.value} id={`faq-${g.value}`} className="faq-group" aria-labelledby={`faq-${g.value}-title`}>
                  <h2 id={`faq-${g.value}-title`} className="faq-group__title">
                    {group(g.value)}
                  </h2>
                  <FaqCards faqs={g.faqs} h={h} readLabel={L(c.list.readLabel)} />
                </section>
              ))
            ) : (
              <p className="lead">{L(c.list.emptyText)}</p>
            )}
          </section>
        )}

        {show("cta") && L(c.cta.title) && (
          <section className="faq-help-wrap">
            <div className="faq-help">
              <Icon name="message-circle" size={28} style={{ color: "var(--icon-primary)" }} />
              <h2>{L(c.cta.title)}</h2>
              {L(c.cta.text) && <p>{L(c.cta.text)}</p>}
              {L(c.cta.button) && (
                <div>
                  <ButtonLink href={waLink(c.cta.message || undefined)} external variant="primary" size="large" icon="message-circle">
                    {L(c.cta.button)}
                  </ButtonLink>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
