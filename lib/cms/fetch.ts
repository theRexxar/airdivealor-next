import { headers } from "next/headers";
import { ABOUT_DEFAULTS } from "./about-defaults";
import { toCard, type PublishedBlog, type PublishedPost } from "./blog-cms-types";
import { BLOG_DEFAULTS, CATEGORIES_DEFAULTS, POSTS_DEFAULTS } from "./blog-defaults";
import type { PublishedAbout } from "./about-types";
import { COURSES_DEFAULTS, COURSES_PAGE_DEFAULTS } from "./courses-defaults";
import type { PublishedCourse, PublishedCourses } from "./courses-types";
import { DIVE_SITES_DEFAULTS, SITES_DEFAULTS } from "./dive-sites-defaults";
import type { PublishedDiveSites, PublishedSite } from "./dive-sites-types";
import { FACILITIES_DEFAULTS } from "./facilities-defaults";
import type { PublishedFacilities } from "./facilities-types";
import { HOME_DEFAULTS } from "./home-defaults";
import type { PublishedHome } from "./home-types";
import { collectionTag, pageTag } from "./tags";

/** Where the website reaches the CMS API. Defaults to this same app. */
async function apiBase() {
  if (process.env.CMS_API_URL) return process.env.CMS_API_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * GET a public CMS endpoint, cached for 5 minutes and refreshed the moment an editor publishes
 * (the CMS expires these tags). Returns null on 404; throws if the CMS can't be reached.
 */
async function cmsGet<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(`${await apiBase()}${path}`, { cache: "force-cache", next: { revalidate: 300, tags }, signal: AbortSignal.timeout(5000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`CMS API answered ${res.status}`);
  return (await res.json()) as T;
}

const warn = (what: string, e: unknown) => console.error(`[cms] ${what}: using built-in content (${e instanceof Error ? e.message : e})`);

export const FALLBACK_HOME: PublishedHome = {
  content: HOME_DEFAULTS,
  order: ["awards", "prices", "why", "sites", "stay", "reviews", "faq", "book"],
  media: {},
  sites: Object.fromEntries(SITES_DEFAULTS.map((s) => [s.slug, s])),
  publishedAt: null,
};

export const FALLBACK_DIVE_SITES: PublishedDiveSites = {
  content: DIVE_SITES_DEFAULTS,
  order: ["hero", "highlights", "list", "cta"],
  sites: SITES_DEFAULTS,
  media: {},
  publishedAt: null,
};

export const FALLBACK_FACILITIES: PublishedFacilities = {
  content: FACILITIES_DEFAULTS,
  order: ["hero", "glance", "stay", "diving", "boats", "gear", "rates", "cta"],
  media: {},
  publishedAt: null,
};

export async function getFacilities(): Promise<PublishedFacilities> {
  try {
    return (await cmsGet<PublishedFacilities>("/api/public/pages/facilities", [pageTag("facilities")])) ?? FALLBACK_FACILITIES;
  } catch (e) {
    warn("facilities", e);
    return FALLBACK_FACILITIES;
  }
}

export async function getHome(): Promise<PublishedHome> {
  try {
    return (await cmsGet<PublishedHome>("/api/public/pages/home", [pageTag("home"), collectionTag("sites")])) ?? FALLBACK_HOME;
  } catch (e) {
    warn("home", e);
    return FALLBACK_HOME;
  }
}

export async function getDiveSites(): Promise<PublishedDiveSites> {
  try {
    return (await cmsGet<PublishedDiveSites>("/api/public/pages/dive-sites", [pageTag("dive-sites"), collectionTag("sites")])) ?? FALLBACK_DIVE_SITES;
  } catch (e) {
    warn("dive sites", e);
    return FALLBACK_DIVE_SITES;
  }
}

/** One site guide, or null when the site isn't published (the page then shows 404). */
export async function getSite(slug: string): Promise<PublishedSite | null> {
  try {
    return await cmsGet<PublishedSite>(`/api/public/sites/${encodeURIComponent(slug)}`, [pageTag("dive-sites"), collectionTag("sites")]);
  } catch (e) {
    warn(`site ${slug}`, e);
    const i = SITES_DEFAULTS.findIndex((s) => s.slug === slug || (!!s.slugId && s.slugId === slug));
    if (i < 0) return null;
    const n = SITES_DEFAULTS.length;
    const prev = SITES_DEFAULTS[(i + n - 1) % n];
    const next = SITES_DEFAULTS[(i + 1) % n];
    return { site: SITES_DEFAULTS[i], index: i, total: n, prev: { slug: prev.slug, slugId: prev.slugId, name: prev.name }, next: { slug: next.slug, slugId: next.slugId, name: next.name }, guide: DIVE_SITES_DEFAULTS.guide, media: {} };
  }
}

export const FALLBACK_COURSES: PublishedCourses = {
  content: COURSES_PAGE_DEFAULTS,
  order: ["hero", "list", "cta"],
  courses: COURSES_DEFAULTS,
  media: {},
  publishedAt: null,
};

export async function getCourses(): Promise<PublishedCourses> {
  try {
    return (await cmsGet<PublishedCourses>("/api/public/pages/dive-courses", [pageTag("dive-courses"), collectionTag("courses")])) ?? FALLBACK_COURSES;
  } catch (e) {
    warn("dive courses", e);
    return FALLBACK_COURSES;
  }
}

/** One course page, or null when the course isn't published (the page then shows 404). */
export async function getCourse(slug: string): Promise<PublishedCourse | null> {
  try {
    return await cmsGet<PublishedCourse>(`/api/public/courses/${encodeURIComponent(slug)}`, [pageTag("dive-courses"), collectionTag("courses")]);
  } catch (e) {
    warn(`course ${slug}`, e);
    const i = COURSES_DEFAULTS.findIndex((c) => c.slug === slug || (!!c.slugId && c.slugId === slug));
    if (i < 0) return null;
    const n = COURSES_DEFAULTS.length;
    const prev = COURSES_DEFAULTS[(i + n - 1) % n];
    const next = COURSES_DEFAULTS[(i + 1) % n];
    return { course: COURSES_DEFAULTS[i], index: i, total: n, prev: { slug: prev.slug, slugId: prev.slugId, name: prev.name }, next: { slug: next.slug, slugId: next.slugId, name: next.name }, detail: COURSES_PAGE_DEFAULTS.detail, media: {} };
  }
}

export const FALLBACK_ABOUT: PublishedAbout = { content: ABOUT_DEFAULTS, order: ["hero", "story", "name", "boats", "cta"], media: {}, publishedAt: null };

export async function getAbout(): Promise<PublishedAbout> {
  try {
    return (await cmsGet<PublishedAbout>("/api/public/pages/about-us", [pageTag("about-us")])) ?? FALLBACK_ABOUT;
  } catch (e) {
    warn("about us", e);
    return FALLBACK_ABOUT;
  }
}

const BLOG_TAGS = [pageTag("blog"), collectionTag("posts"), collectionTag("categories")];

export const FALLBACK_BLOG: PublishedBlog = {
  content: BLOG_DEFAULTS,
  order: ["hero", "stories", "cta"],
  posts: POSTS_DEFAULTS.map(toCard),
  categories: CATEGORIES_DEFAULTS,
  media: {},
  publishedAt: null,
};

export async function getBlog(): Promise<PublishedBlog> {
  try {
    return (await cmsGet<PublishedBlog>("/api/public/pages/blog", BLOG_TAGS)) ?? FALLBACK_BLOG;
  } catch (e) {
    warn("blog", e);
    return FALLBACK_BLOG;
  }
}

/** One story, or null when it isn't published (the page then shows 404). */
export async function getPost(slug: string): Promise<PublishedPost | null> {
  try {
    return await cmsGet<PublishedPost>(`/api/public/posts/${encodeURIComponent(slug)}`, BLOG_TAGS);
  } catch (e) {
    warn(`story ${slug}`, e);
    const all = POSTS_DEFAULTS;
    const i = all.findIndex((p) => p.slug === slug || (!!p.slugId && p.slugId === slug));
    if (i < 0) return null;
    const post = all[i];
    const others = all.filter((x) => x !== post);
    const more = others.filter((x) => x.category === post.category).concat(others.filter((x) => x.category !== post.category)).slice(0, 3).map(toCard);
    return {
      post,
      minutes: toCard(post).minutes,
      newer: i > 0 ? toCard(all[i - 1]) : null,
      older: i < all.length - 1 ? toCard(all[i + 1]) : null,
      more,
      categories: CATEGORIES_DEFAULTS,
      texts: BLOG_DEFAULTS.post,
      media: {},
    };
  }
}
