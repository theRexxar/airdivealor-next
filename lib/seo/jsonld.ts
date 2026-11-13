/**
 * Structured data (schema.org JSON-LD) for search engines and AI crawlers. Builders are pure functions of
 * CMS content; pages combine them in one `@graph` and render it with <JsonLd>. English text is used, since
 * the English version is what the server renders at each URL.
 */
import type { BlogContent, CategoryContent, PostCardData, PostContent } from "../cms/blog-cms-types";
import type { CourseContent } from "../cms/courses-types";
import type { SiteContent } from "../cms/dive-sites-types";
import type { FacilitiesContent } from "../cms/facilities-types";
import type { I18n, MediaRef } from "../cms/fields";
import type { ResolvedMedia } from "../cms/home-types";
import { pagePath, type Locale } from "../i18n-routes";
import { SOCIAL } from "../site";

export type Node = Record<string, unknown>;
type Media = Record<string, ResolvedMedia>;

/** Business facts used across the site (also in the footer). */
export const BUSINESS = {
  name: "Air Dive Alor",
  alternateName: "Air Dive Alor Dive Center",
  telephone: "+62 813-9550-5313",
  email: "contact@airdivealor.com",
  foundingDate: "2017-03",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Alor Kecil",
    addressLocality: "Alor Barat Laut",
    addressRegion: "Nusa Tenggara Timur",
    addressCountry: "ID",
  },
  sameAs: [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube, SOCIAL.tripadvisor],
};

const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();
const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export class Ld {
  readonly site: string;
  readonly lang: Locale;
  constructor(siteUrl: string, lang: Locale = "en") {
    this.site = siteUrl.replace(/\/$/, "");
    this.lang = lang;
  }
  /** A fixed label in the page language. */
  w(en: string, id: string) {
    return this.lang === "id" ? id : en;
  }
  /** Text in the page language, English when the Indonesian is empty. */
  tx(v: I18n | undefined) {
    return clean(this.lang === "id" && v?.id?.trim() ? v.id : v?.en);
  }
  /** Absolute URL for a path or URL. */
  url(pathOrUrl: string) {
    return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${this.site}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  }
  /** Absolute image URL for a CMS media reference (library file or external link). */
  image(ref: MediaRef | undefined, media: Media): string | undefined {
    if (!ref) return undefined;
    const u = ref.mediaId ? media[ref.mediaId]?.url : ref.url;
    return u ? this.url(u) : undefined;
  }
  get orgId() {
    return `${this.site}/#organization`;
  }
  get websiteId() {
    return `${this.site}/#website`;
  }
  ref(id: string) {
    return { "@id": id };
  }

  /** The dive center as a local business. On every page. */
  organization(description: string): Node {
    return {
      "@type": ["SportsActivityLocation", "LocalBusiness"],
      "@id": this.orgId,
      name: BUSINESS.name,
      alternateName: BUSINESS.alternateName,
      url: this.url(pagePath(this.lang, "home")),
      logo: { "@type": "ImageObject", url: this.url("/brand/logo-air-dive-alor-white@2x.png") },
      image: this.url("/latest/b-stay-shop.webp"),
      description: trim(description, 300),
      telephone: BUSINESS.telephone,
      email: BUSINESS.email,
      foundingDate: BUSINESS.foundingDate,
      address: BUSINESS.address,
      areaServed: [
        { "@type": "Place", name: "Alor Island, East Nusa Tenggara, Indonesia" },
        { "@type": "Place", name: "Pantar Strait" },
      ],
      knowsLanguage: ["en", "id"],
      sameAs: BUSINESS.sameAs,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "reservations",
        telephone: BUSINESS.telephone,
        email: BUSINESS.email,
        availableLanguage: ["English", "Indonesian"],
        hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "07:00", closes: "21:00" },
      },
    };
  }

  website(): Node {
    return { "@type": "WebSite", "@id": this.websiteId, url: this.url(pagePath(this.lang, "home")), name: BUSINESS.name, inLanguage: ["en", "id"], publisher: this.ref(this.orgId) };
  }

  /** The page itself. `type` is WebPage, CollectionPage, AboutPage, … */
  webPage(o: { type?: string; path: string; name: string; description: string; image?: string; mainEntity?: Node; breadcrumb?: boolean; dateModified?: string | null }): Node {
    const url = this.url(o.path);
    return {
      "@type": o.type ?? "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: o.name,
      description: trim(o.description, 300),
      inLanguage: this.lang,
      isPartOf: this.ref(this.websiteId),
      about: this.ref(this.orgId),
      ...(o.image ? { primaryImageOfPage: { "@type": "ImageObject", url: o.image } } : {}),
      ...(o.breadcrumb ? { breadcrumb: this.ref(`${url}#breadcrumb`) } : {}),
      ...(o.mainEntity ? { mainEntity: o.mainEntity } : {}),
      ...(o.dateModified ? { dateModified: o.dateModified } : {}),
    };
  }

  breadcrumbs(path: string, items: { name: string; path: string }[]): Node {
    return {
      "@type": "BreadcrumbList",
      "@id": `${this.url(path)}#breadcrumb`,
      itemListElement: [{ name: this.lang === "id" ? "Beranda" : "Home", path: pagePath(this.lang, "home") }, ...items].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: this.url(x.path) })),
    };
  }

  /** Questions and answers. `path` (an answer's own page) becomes the answer's URL; `id` defaults to the Home page FAQ. */
  faq(items: { q: I18n; a: I18n; path?: string; text?: string }[], id = `${this.site}/#faq`): Node | null {
    const qs = items.filter((x) => this.tx(x.q) && (x.text || this.tx(x.a)));
    if (!qs.length) return null;
    return {
      "@type": "FAQPage",
      "@id": id,
      inLanguage: this.lang,
      mainEntity: qs.map((x) => ({
        "@type": "Question",
        name: this.tx(x.q),
        acceptedAnswer: { "@type": "Answer", text: trim(x.text || this.tx(x.a), 3000), ...(x.path ? { url: this.url(x.path) } : {}) },
      })),
    };
  }

  itemList(name: string, entries: { path: string; name: string }[]): Node {
    return {
      "@type": "ItemList",
      name,
      numberOfItems: entries.length,
      itemListElement: entries.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: this.url(x.path), name: x.name })),
    };
  }

  /** One dive site. */
  diveSite(s: SiteContent, media: Media, path: string): Node {
    const images = [this.image(s.photo, media), ...s.gallery.map((g) => this.image(g.photo, media))].filter((x): x is string => !!x);
    const facts = [
      [this.w("Depth", "Kedalaman"), s.depth],
      [this.w("Level", "Level"), this.tx(s.level)],
      [this.w("Current", "Arus"), this.tx(s.current)],
      [this.w("Visibility", "Jarak pandang"), s.vis],
      [this.w("Water temperature", "Suhu air"), s.temp],
      [this.w("Best time", "Waktu terbaik"), this.tx(s.bestTime)],
    ].filter(([, v]) => v);
    return {
      "@type": "TouristAttraction",
      "@id": `${this.url(path)}#site`,
      name: s.name,
      ...(s.aka ? { alternateName: s.aka } : {}),
      url: this.url(path),
      description: trim(this.tx(s.intro) || this.tx(s.aboutTopo), 500),
      ...(images.length ? { image: images } : {}),
      touristType: [this.w("Scuba divers", "Penyelam scuba"), this.tx(s.level)].filter(Boolean),
      containedInPlace: { "@type": "Place", name: `${this.tx(s.area) || "Alor"}, ${this.w("East Nusa Tenggara", "Nusa Tenggara Timur")}, Indonesia` },
      additionalProperty: facts.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
      provider: this.ref(this.orgId),
    };
  }

  /** A course with its package price. */
  course(c: CourseContent, media: Media, path: string): Node {
    const price = priceNumber(c.price);
    const days = Number((this.tx(c.days).match(/\d+/) ?? [])[0]);
    return {
      "@type": "Course",
      "@id": `${this.url(path)}#course`,
      name: this.tx(c.name),
      url: this.url(path),
      description: trim(this.tx(c.text), 500),
      ...(this.image(c.photo, media) ? { image: this.image(c.photo, media) } : {}),
      provider: this.ref(this.orgId),
      educationalCredentialAwarded: `${c.agency} ${this.tx(c.name)}`,
      ...(this.tx(c.prereq) ? { coursePrerequisites: this.tx(c.prereq) } : {}),
      ...(c.learn.length ? { teaches: c.learn.map((l) => this.tx(l.text)).filter(Boolean) } : {}),
      inLanguage: ["en", "id"],
      ...(price
        ? { offers: { "@type": "Offer", category: "Paid", price, priceCurrency: "IDR", availability: "https://schema.org/InStock", url: this.url(path) } }
        : {}),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Onsite",
        location: { "@type": "Place", name: "Air Dive Alor, Alor Kecil", address: BUSINESS.address },
        ...(days ? { courseSchedule: { "@type": "Schedule", duration: `P${days}D`, repeatFrequency: "Daily", repeatCount: days } } : {}),
        ...(days ? { courseWorkload: `P${days}D` } : {}),
      },
    };
  }

  /** Diving and stay packages from the Facilities and rates page. */
  rates(f: FacilitiesContent, path: string): Node {
    const pkgs = f.rates.packages.map((p) => {
      const offers = p.rows.length
        ? p.rows.map((r) => ({
            "@type": "Offer",
            name: this.lang === "id" ? `${this.tx(p.name)}: ${r.days} hari, ${r.nights} malam, ${r.dives} kali selam` : `${this.tx(p.name)}: ${r.days} days, ${r.nights} nights, ${r.dives} dives`,
            price: priceNumber(r.price),
            priceCurrency: "IDR",
          }))
        : p.cards.map((c) => ({ "@type": "Offer", name: `${this.tx(c.label)} (${this.tx(c.per)})`, price: priceNumber(c.price), priceCurrency: "IDR" }));
      return { "@type": "OfferCatalog", name: [this.tx(p.name), this.tx(p.sub)].filter(Boolean).join(": "), itemListElement: offers.filter((o) => o.price) };
    });
    return {
      "@type": "Service",
      "@id": `${this.url(path)}#rates`,
      name: this.w("Dive and stay packages in Alor Kecil", "Paket selam dan menginap di Alor Kecil"),
      serviceType: this.w("Scuba diving trips with accommodation", "Trip selam scuba dengan penginapan"),
      provider: this.ref(this.orgId),
      areaServed: { "@type": "Place", name: "Alor, East Nusa Tenggara, Indonesia" },
      hasOfferCatalog: { "@type": "OfferCatalog", name: this.tx(f.rates.title) || this.w("Diving rates", "Tarif selam"), itemListElement: pkgs },
    };
  }

  blogPosting(o: { post: PostContent | PostCardData; path: string; media: Media; categories: CategoryContent[]; author?: I18n; dateModified?: string | null }): Node {
    const p = o.post;
    const image = this.image(p.cover, o.media);
    const author = this.tx(o.author);
    const cat = o.categories.find((c) => c.slug === p.category);
    return {
      "@type": "BlogPosting",
      "@id": `${this.url(o.path)}#article`,
      headline: trim(this.tx(p.title), 110),
      description: trim(this.tx(p.excerpt), 300),
      url: this.url(o.path),
      mainEntityOfPage: this.url(o.path),
      ...(image ? { image } : {}),
      datePublished: p.date,
      dateModified: o.dateModified ?? p.date,
      inLanguage: this.lang,
      ...(cat ? { articleSection: this.tx(cat.name) } : {}),
      ...(author
        ? { author: /team|air dive/i.test(author) ? this.ref(this.orgId) : { "@type": "Person", name: author } }
        : { author: this.ref(this.orgId) }),
      publisher: this.ref(this.orgId),
    };
  }

  blog(content: BlogContent, path: string, posts: { node: Node }[]): Node {
    return { "@type": "Blog", "@id": `${this.url(path)}#blog`, name: this.tx(content.stories.title) || "Air Dive Alor blog", url: this.url(path), inLanguage: this.lang, publisher: this.ref(this.orgId), blogPost: posts.map((p) => p.node) };
  }
}

/** "IDR 14,000,000" → 14000000. */
export function priceNumber(s: string): number | undefined {
  const digits = s.replace(/[^\d]/g, "");
  const n = Number(digits);
  return digits && n > 0 ? n : undefined;
}

/** One JSON-LD document from graph nodes (nulls skipped). */
export function graph(...nodes: (Node | null | undefined)[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
