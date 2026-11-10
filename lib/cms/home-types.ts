/** Shape of the Home page content stored in the CMS (one object per section). Mirrors lib/cms/home-sections.ts. */
import type { SiteContent } from "./dive-sites-types";
import type { I18n, MediaRef } from "./fields";

export interface HomeContent {
  seo: { title: I18n; description: I18n; ogImage: MediaRef };
  hero: { eyebrow: I18n; title: I18n; lead: I18n; primaryCta: I18n; secondaryCta: I18n; image: MediaRef; video: MediaRef; caption: string };
  awards: { items: { icon: string; rating: number; title: I18n; subtitle: I18n }[] };
  prices: {
    eyebrow: I18n;
    title: I18n;
    lead: I18n;
    tableLabel: I18n;
    depositNote: I18n;
    usdRate: number;
    usdNote: I18n;
    rows: { label: I18n }[];
    packages: { id: string; name: I18n; meta: I18n; priceIdr: number; unit: I18n; tag: I18n; highlight: boolean; cells: { value: I18n }[] }[];
    chooseLabel: I18n;
  };
  why: { eyebrow: I18n; title: I18n; items: { label: I18n; text: I18n; photoTitle: I18n; photo: MediaRef }[] };
  sites: { eyebrow: I18n; title: I18n; defaultIndex: number; items: { slug: string; photo: MediaRef }[]; guideLabel: I18n; seeLabel: I18n };
  stay: {
    eyebrow: I18n;
    title: I18n;
    lead: I18n;
    cards: { kicker: I18n; tabs: { icon: string; label: I18n; photo: MediaRef; statLabel: I18n; stat: I18n; title: I18n; text: I18n }[] }[];
  };
  reviews: {
    eyebrow: I18n;
    score: number;
    scoreNote: I18n;
    googleLabel: I18n;
    googleUrl: string;
    tripadvisorLabel: I18n;
    tripadvisorUrl: string;
    items: { quote: I18n; name: string; place: I18n; date: I18n; source: string }[];
  };
  faq: { eyebrow: I18n; title: I18n; moreLabel?: I18n; items: { q: I18n; a: I18n; page?: string; moreLabel?: I18n }[]; help: { title: I18n; text: I18n; button: I18n } };
  book: {
    eyebrow: I18n;
    title: I18n;
    lead: I18n;
    quote: { rating: number; text: I18n; cite: I18n };
    depositPercent: number;
    depositNote: I18n;
    cancellation: I18n;
    successTitle: I18n;
    successText: I18n;
  };
}

export type HomeSectionKey = keyof HomeContent;

/** A media reference after the API resolved it: ready-to-use URLs. */
export interface ResolvedMedia {
  url: string;
  /** WebP sizes for responsive images ("url 800w, ..."). Empty for external URLs. */
  srcSet: string;
  width?: number;
  height?: number;
  /** Video poster (videos only). */
  poster?: string;
  alt: I18n;
}

/** What the public API returns for the Home page. */
export interface PublishedHome {
  content: HomeContent;
  /** Section keys in display order, hidden sections left out (SEO is not listed). */
  order: Exclude<HomeSectionKey, "seo">[];
  /** Media library files used by the content, keyed by media id. */
  media: Record<string, ResolvedMedia>;
  /** Dive sites picked in the "sites" section, from the Dive site guides collection, keyed by slug. */
  sites: Record<string, SiteContent>;
  /** FAQ questions with a full answer that the FAQ section links to, keyed by slug (only published ones). */
  faqPages?: Record<string, { slug: string; slugId?: string }>;
  publishedAt: string | null;
}
