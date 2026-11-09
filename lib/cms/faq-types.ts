/** Content shapes for the FAQ page and its questions. Mirrors faq-sections.ts and faq-fields.ts. */
import type { I18n, MediaRef } from "./fields";
import type { FaqCategory } from "./faq-fields";
import type { ResolvedMedia } from "./home-types";
import { richIsEmpty } from "../rich-text";

export interface FaqContent {
  slug: string;
  slugId?: string;
  question: I18n;
  answer: I18n;
  category: FaqCategory;
  cover: MediaRef;
  /** Full answer (rich text HTML, cleaned on the server). Empty: no page of its own. */
  body: I18n;
}

export interface FaqPageContent {
  seo: { title: I18n; description: I18n; ogImage: MediaRef };
  detail: { backLabel: I18n; updatedLabel: I18n; ctaTitle: I18n; ctaText: I18n; ctaLabel: I18n; ctaMessage: string; moreTitle: I18n };
  hero: { eyebrow: I18n; title: I18n; lead: I18n };
  list: { readLabel: I18n; emptyText: I18n };
  cta: { title: I18n; text: I18n; button: I18n; message: string };
}

/** A question as the list and links need it: no full answer, just whether there is one. */
export interface FaqCard {
  slug: string;
  slugId?: string;
  question: I18n;
  answer: I18n;
  category: FaqCategory;
  hasPage: boolean;
}

/** True when a question has a full answer (in English, which every page falls back to), so it gets a page. */
export const hasFaqPage = (f: Pick<FaqContent, "body">) => !richIsEmpty(f.body?.en);

export const toFaqCard = (f: FaqContent): FaqCard => ({ slug: f.slug, slugId: f.slugId || undefined, question: f.question, answer: f.answer, category: f.category, hasPage: hasFaqPage(f) });

/** Public API: the FAQ page with every published question in order. */
export interface PublishedFaqs {
  content: FaqPageContent;
  order: string[];
  faqs: FaqCard[];
  media: Record<string, ResolvedMedia>;
  publishedAt: string | null;
}

/** Public API: one question with its full answer, more questions from the same group and the shared texts. */
export interface PublishedFaq {
  faq: FaqContent;
  more: FaqCard[];
  texts: FaqPageContent["detail"];
  media: Record<string, ResolvedMedia>;
  publishedAt: string | null;
}
