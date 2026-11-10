"use client";

import Link from "@/components/LocalLink";
import { Icon } from "@/components/ui";
import { FAQ_CATEGORIES } from "@/lib/cms/faq-fields";
import type { FaqCard } from "@/lib/cms/faq-types";
import { useItemHref, useLang } from "@/lib/i18n";
import type { ContentHelpers } from "@/lib/cms/use-content";

/** The group's name in the page language. */
export function useFaqGroup() {
  const { lang } = useLang();
  return (value: string) => {
    const c = FAQ_CATEGORIES.find((x) => x.value === value);
    return c ? (lang === "ID" ? c.id : c.en) : "";
  };
}

/** Questions as cards: question, short answer, and a link when there is a full answer. */
export function FaqCards({ faqs, h, readLabel, headingLevel = 3 }: { faqs: FaqCard[]; h: ContentHelpers; readLabel: string; headingLevel?: 2 | 3 }) {
  const itemHref = useItemHref();
  const { L } = h;
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <ul className="faq-cards">
      {faqs.map((f) => (
        <li key={f.slug} className="faq-card" data-page={f.hasPage ? "" : undefined}>
          <H className="faq-card__q">
            {f.hasPage ? (
              <Link href={itemHref("faqs", f)} className="faq-card__link">
                {L(f.question)}
              </Link>
            ) : (
              L(f.question)
            )}
          </H>
          <p className="faq-card__a">{L(f.answer)}</p>
          {f.hasPage && (
            <span className="faq-card__more" aria-hidden="true">
              {readLabel}
              <Icon name="arrow-right" size={16} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
