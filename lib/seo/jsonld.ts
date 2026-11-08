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
const en = (v: I18n | undefined) => clean(v?.en);
const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export class Ld {
  readonly site: string;
  constructor(siteUrl: string) {
    this.site = siteUrl.replace(/\/$/, "");
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
      url: `${this.site}/`,
      logo: { "@type": "ImageObject", url: this.url("/brand/logo-full-white.png") },
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
    return { "@type": "WebSite", "@id": this.websiteId, url: `${this.site}/`, name: BUSINESS.name, inLanguage: ["en", "id"], publisher: this.ref(this.orgId) };
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
      inLanguage: "en",
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
      itemListElement: [{ name: "Home", path: "/" }, ...items].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: this.url(x.path) })),
    };
  }

  faq(items: { q: I18n; a: I18n }[]): Node | null {
    const qs = items.filter((x) => en(x.q) && en(x.a));
    if (!qs.length) return null;
    return {
      "@type": "FAQPage",
      "@id": `${this.site}/#faq`,
      mainEntity: qs.map((x) => ({ "@type": "Question", name: en(x.q), acceptedAnswer: { "@type": "Answer", text: en(x.a) } })),
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
      ["Depth", s.depth],
      ["Level", en(s.level)],
      ["Current", en(s.current)],
      ["Visibility", s.vis],
      ["Water temperature", s.temp],
      ["Best time", en(s.bestTime)],
    ].filter(([, v]) => v);
    return {
      "@type": "TouristAttraction",
      "@id": `${this.url(path)}#site`,
      name: s.name,
      ...(s.aka ? { alternateName: s.aka } : {}),
      url: this.url(path),
      description: trim(en(s.intro) || en(s.aboutTopo), 500),
      ...(images.length ? { image: images } : {}),
      touristType: ["Scuba divers", en(s.level) || "Divers"].filter(Boolean),
      containedInPlace: { "@type": "Place", name: `${en(s.area) || "Alor"}, East Nusa Tenggara, Indonesia` },
      additionalProperty: facts.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
      provider: this.ref(this.orgId),
    };
  }

  /** A course with its package price. */
  course(c: CourseContent, media: Media, path: string): Node {
    const price = priceNumber(c.price);
    const days = Number((en(c.days).match(/\d+/) ?? [])[0]);
    return {
      "@type": "Course",
      "@id": `${this.url(path)}#course`,
      name: en(c.name),
      url: this.url(path),
      description: trim(en(c.text), 500),
      ...(this.image(c.photo, media) ? { image: this.image(c.photo, media) } : {}),
      provider: this.ref(this.orgId),
      educationalCredentialAwarded: `${c.agency} ${en(c.name)}`,
      ...(en(c.prereq) ? { coursePrerequisites: en(c.prereq) } : {}),
      ...(c.learn.length ? { teaches: c.learn.map((l) => en(l.text)).filter(Boolean) } : {}),
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
            name: `${en(p.name)}: ${r.days} days, ${r.nights} nights, ${r.dives} dives`,
            price: priceNumber(r.price),
            priceCurrency: "IDR",
          }))
        : p.cards.map((c) => ({ "@type": "Offer", name: `${en(c.label)} (${en(c.per)})`, price: priceNumber(c.price), priceCurrency: "IDR" }));
      return { "@type": "OfferCatalog", name: [en(p.name), en(p.sub)].filter(Boolean).join(": "), itemListElement: offers.filter((o) => o.price) };
    });
    return {
      "@type": "Service",
      "@id": `${this.url(path)}#rates`,
      name: "Dive and stay packages in Alor Kecil",
      serviceType: "Scuba diving trips with accommodation",
      provider: this.ref(this.orgId),
      areaServed: { "@type": "Place", name: "Alor, East Nusa Tenggara, Indonesia" },
      hasOfferCatalog: { "@type": "OfferCatalog", name: en(f.rates.title) || "Diving rates", itemListElement: pkgs },
    };
  }

  blogPosting(o: { post: PostContent | PostCardData; path: string; media: Media; categories: CategoryContent[]; author?: I18n; dateModified?: string | null }): Node {
    const p = o.post;
    const image = this.image(p.cover, o.media);
    const author = en(o.author);
    const cat = o.categories.find((c) => c.slug === p.category);
    return {
      "@type": "BlogPosting",
      "@id": `${this.url(o.path)}#article`,
      headline: trim(en(p.title), 110),
      description: trim(en(p.excerpt), 300),
      url: this.url(o.path),
      mainEntityOfPage: this.url(o.path),
      ...(image ? { image } : {}),
      datePublished: p.date,
      dateModified: o.dateModified ?? p.date,
      inLanguage: "en",
      ...(cat ? { articleSection: en(cat.name) } : {}),
      ...(author
        ? { author: /team|air dive/i.test(author) ? this.ref(this.orgId) : { "@type": "Person", name: author } }
        : { author: this.ref(this.orgId) }),
      publisher: this.ref(this.orgId),
    };
  }

  blog(content: BlogContent, path: string, posts: { node: Node }[]): Node {
    return { "@type": "Blog", "@id": `${this.url(path)}#blog`, name: en(content.stories.title) || "Air Dive Alor blog", url: this.url(path), publisher: this.ref(this.orgId), blogPost: posts.map((p) => p.node) };
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
