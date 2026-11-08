/** Content shapes for the Dive sites page and the dive site guides. Mirrors dive-sites-sections.ts and site-fields.ts. */
import type { I18n, MediaRef } from "./fields";
import type { ResolvedMedia } from "./home-types";

export interface SiteContent {
  slug: string;
  /** Indonesian web address; empty or missing = same as slug. */
  slugId?: string;
  name: string;
  aka: string;
  area: I18n;
  type: I18n;
  depth: string;
  level: I18n;
  current: I18n;
  vis: string;
  temp: string;
  photo: MediaRef;
  gallery: { photo: MediaRef }[];
  diveTypes: { label: I18n }[];
  intro: I18n;
  topo: I18n;
  aboutTopo: I18n;
  aboutLife: I18n;
  see: { name: I18n }[];
  boatTime: I18n;
  entry: I18n;
  minLevel: I18n;
  hazards: I18n;
  bestTime: I18n;
  tips: { text: I18n }[];
  unverified: boolean;
  credit: string;
  creditUrl: string;
}

export interface DiveSitesContent {
  seo: { title: I18n; description: I18n; ogImage: MediaRef };
  guide: { typicalNote: I18n; safetyNote: I18n; draftNote: I18n; ctaTitle: I18n; ctaText: I18n; bookLabel: I18n; bookMessage: string };
  hero: { eyebrow: I18n; title: I18n; lead: I18n; image: MediaRef };
  highlights: { items: { icon: string; title: I18n; text: I18n }[] };
  list: { eyebrow: I18n; title: I18n; pageSize: number; filters: { label: I18n; match: string }[]; note: I18n };
  cta: { title: I18n; text: I18n; primaryLabel: I18n; primaryMessage: string; secondaryLabel: I18n; secondaryUrl: string };
}

/** Public API: the Dive sites page with its published, visible sites in order. */
export interface PublishedDiveSites {
  content: DiveSitesContent;
  order: string[];
  sites: SiteContent[];
  media: Record<string, ResolvedMedia>;
  publishedAt: string | null;
}

/** Public API: one site guide, with the shared guide texts and its neighbours for previous/next links. */
export interface PublishedSite {
  site: SiteContent;
  index: number;
  total: number;
  prev: { slug: string; slugId?: string; name: string };
  next: { slug: string; slugId?: string; name: string };
  guide: DiveSitesContent["guide"];
  media: Record<string, ResolvedMedia>;
}
