import type { PublishedAbout } from "@/lib/cms/about-types";
import { toCard, type BlogContent, type CategoryContent, type PostCardData, type PostContent, type PublishedBlog, type PublishedPost } from "@/lib/cms/blog-cms-types";
import type { CourseContent, PublishedCourse, PublishedCourses } from "@/lib/cms/courses-types";
import type { PublishedDiveSites, PublishedSite, SiteContent } from "@/lib/cms/dive-sites-types";
import type { PublishedFacilities } from "@/lib/cms/facilities-types";
import type { HomeContent, PublishedHome } from "@/lib/cms/home-types";
import { hasFaqPage, toFaqCard, type FaqContent, type FaqPageContent, type PublishedFaq, type PublishedFaqs } from "@/lib/cms/faq-types";
import { collectMediaIds } from "@/lib/cms/fields";
import type { PublishedMenus } from "@/lib/cms/menus";
import { POST_FIELDS } from "@/lib/cms/post-fields";
import { listItems, liveItems, requireCollection } from "./collection-service";
import { HttpError } from "./http";
import { resolveMedia } from "./media-service";
import { pageContent } from "./page-service";

type Opts = { draft?: boolean };

/** Home: page content plus the dive sites its site picker refers to. */
async function homePayload(opts: Opts): Promise<PublishedHome> {
  const page = await pageContent("home", opts);
  const content = page.content as unknown as HomeContent;
  const { items } = await liveItems<SiteContent>("sites", opts);
  const wanted = new Set(content.sites.items.map((x) => x.slug));
  const sites = Object.fromEntries(items.filter((x) => wanted.has(x.slug)).map((x) => [x.slug, x]));
  // Only resolve media of the picked sites.
  const ids = new Set(page.mediaIds);
  for (const x of Object.values(sites)) {
    if (x.photo.mediaId) ids.add(x.photo.mediaId);
  }
  // FAQ questions the FAQ section links to, when they are live and have a full answer.
  const wantedFaqs = new Set(content.faq.items.map((x) => x.page).filter(Boolean));
  const faqPages = wantedFaqs.size
    ? Object.fromEntries(
        (await liveItems<FaqContent>("faqs", opts)).items.filter((f) => wantedFaqs.has(f.slug) && hasFaqPage(f)).map((f) => [f.slug, { slug: f.slug, slugId: f.slugId || undefined }]),
      )
    : {};
  return { content, order: page.order as PublishedHome["order"], media: await resolveMedia(ids), sites, faqPages, publishedAt: page.publishedAt };
}

/** Dive sites page: page content plus every published, visible site in order. */
async function diveSitesPayload(opts: Opts): Promise<PublishedDiveSites> {
  const page = await pageContent("dive-sites", opts);
  const { items, mediaIds } = await liveItems<SiteContent>("sites", opts);
  return {
    content: page.content as unknown as PublishedDiveSites["content"],
    order: page.order,
    sites: items,
    media: await resolveMedia(new Set([...page.mediaIds, ...mediaIds])),
    publishedAt: page.publishedAt,
  };
}

/** Dive courses page: page content plus every published, visible course in order. */
async function coursesPayload(opts: Opts): Promise<PublishedCourses> {
  const page = await pageContent("dive-courses", opts);
  const { items, mediaIds } = await liveItems<CourseContent>("courses", opts);
  return {
    content: page.content as unknown as PublishedCourses["content"],
    order: page.order,
    courses: items,
    media: await resolveMedia(new Set([...page.mediaIds, ...mediaIds])),
    publishedAt: page.publishedAt,
  };
}

/** Blog: page content, published stories (newest first, as cards) and categories. */
async function blogPayload(opts: Opts): Promise<PublishedBlog> {
  const page = await pageContent("blog", opts);
  const { items } = await liveItems<PostContent>("posts", opts);
  const { items: categories } = await liveItems<CategoryContent>("categories", opts);
  const posts = items.map(toCard);
  const ids = new Set(page.mediaIds);
  posts.forEach((p) => p.cover.mediaId && ids.add(p.cover.mediaId));
  return { content: page.content as unknown as BlogContent, order: page.order, posts, categories, media: await resolveMedia(ids), publishedAt: page.publishedAt };
}

/** A page that is only its own sections (no collection items). */
async function plainPayload(slug: string, opts: Opts) {
  const page = await pageContent(slug, opts);
  return { content: page.content, order: page.order, media: await resolveMedia(new Set(page.mediaIds)), publishedAt: page.publishedAt };
}

/** FAQ page: page content plus every published question in order. */
async function faqsPayload(opts: Opts): Promise<PublishedFaqs> {
  const page = await pageContent("faq", opts);
  const { items } = await liveItems<FaqContent>("faqs", opts);
  return { content: page.content as unknown as FaqPageContent, order: page.order, faqs: items.map(toFaqCard), media: await resolveMedia(new Set(page.mediaIds)), publishedAt: page.publishedAt };
}

/** One question with a full answer, more questions (same group first) and the shared answer-page texts. Null without a full answer. */
export async function publicFaqPayload(slug: string, opts: Opts = {}): Promise<PublishedFaq | null> {
  const def = requireCollection("faqs");
  const { items } = await liveItems<FaqContent>("faqs", opts);
  const faq = items.find((x) => x.slug === slug || (!!x.slugId && x.slugId === slug));
  if (!faq || !hasFaqPage(faq)) return null;
  const others = items.filter((x) => x !== faq);
  const more = others.filter((x) => x.category === faq.category).concat(others.filter((x) => x.category !== faq.category)).slice(0, 4).map(toFaqCard);
  const page = await pageContent("faq", opts);
  const row = (await listItems("faqs")).find((r) => r.slug === faq.slug);
  return {
    faq,
    more,
    texts: (page.content as unknown as FaqPageContent).detail,
    media: await resolveMedia(collectMediaIds(def.fields, faq)),
    publishedAt: (opts.draft ? row?.draftUpdatedAt : row?.publishedAt)?.toISOString() ?? null,
  };
}

export async function publicPagePayload(slug: string, opts: Opts = {}) {
  if (slug === "faq") return faqsPayload(opts);
  if (slug === "home") return homePayload(opts);
  if (slug === "dive-sites") return diveSitesPayload(opts);
  if (slug === "dive-courses") return coursesPayload(opts);
  if (slug === "blog") return blogPayload(opts);
  if (slug === "about-us") return (await plainPayload(slug, opts)) as unknown as PublishedAbout;
  if (slug === "facilities") return (await plainPayload(slug, opts)) as unknown as PublishedFacilities;
  if (slug === "menus") {
    const page = await pageContent(slug, opts);
    return { content: page.content, publishedAt: page.publishedAt } as unknown as PublishedMenus;
  }
  throw new HttpError(404, "Unknown page.");
}

/** One site guide with shared guide texts and previous/next neighbours. Null when not published or hidden. */
export async function publicSitePayload(slug: string, opts: Opts = {}): Promise<PublishedSite | null> {
  const { items } = await liveItems<SiteContent>("sites", opts);
  const i = items.findIndex((x) => x.slug === slug || (!!x.slugId && x.slugId === slug));
  if (i < 0) return null;
  const site = items[i];
  const n = items.length;
  const page = await pageContent("dive-sites", opts);
  const ids = new Set<number>();
  if (site.photo.mediaId) ids.add(site.photo.mediaId);
  site.gallery.forEach((g) => g.photo.mediaId && ids.add(g.photo.mediaId));
  const prev = items[(i + n - 1) % n];
  const next = items[(i + 1) % n];
  return {
    site,
    index: i,
    total: n,
    prev: { slug: prev.slug, slugId: prev.slugId, name: prev.name },
    next: { slug: next.slug, slugId: next.slugId, name: next.name },
    guide: (page.content as unknown as PublishedDiveSites["content"]).guide,
    media: await resolveMedia(ids),
  };
}

/** One course page with the shared course-page texts and previous/next neighbours. Null when not published or hidden. */
export async function publicCoursePayload(slug: string, opts: Opts = {}): Promise<PublishedCourse | null> {
  const { items } = await liveItems<CourseContent>("courses", opts);
  const i = items.findIndex((x) => x.slug === slug || (!!x.slugId && x.slugId === slug));
  if (i < 0) return null;
  const course = items[i];
  const n = items.length;
  const page = await pageContent("dive-courses", opts);
  const prev = items[(i + n - 1) % n];
  const next = items[(i + 1) % n];
  return {
    course,
    index: i,
    total: n,
    prev: { slug: prev.slug, slugId: prev.slugId, name: prev.name },
    next: { slug: next.slug, slugId: next.slugId, name: next.name },
    detail: (page.content as unknown as PublishedCourses["content"]).detail,
    media: await resolveMedia(new Set(course.photo.mediaId ? [course.photo.mediaId] : [])),
  };
}

/** The public payload of one collection item, as its page on the website uses it. */
export async function publicItemPayload(collection: string, slug: string, opts: Opts = {}) {
  if (collection === "sites") return publicSitePayload(slug, opts);
  if (collection === "courses") return publicCoursePayload(slug, opts);
  if (collection === "posts") return publicPostPayload(slug, opts);
  if (collection === "faqs") return publicFaqPayload(slug, opts);
  throw new HttpError(404, "No public page for this collection.");
}

/** One story with newer/older neighbours, three more stories (same category first) and the shared story-page texts. */
export async function publicPostPayload(slug: string, opts: Opts = {}): Promise<PublishedPost | null> {
  const { items, mediaIds } = await liveItems<PostContent>("posts", opts);
  const i = items.findIndex((x) => x.slug === slug || (!!x.slugId && x.slugId === slug));
  if (i < 0) return null;
  const post = items[i];
  const others = items.filter((x) => x !== post);
  const more = others.filter((x) => x.category === post.category).concat(others.filter((x) => x.category !== post.category)).slice(0, 3).map(toCard);
  const newer = i > 0 ? toCard(items[i - 1]) : null;
  const older = i < items.length - 1 ? toCard(items[i + 1]) : null;
  const { items: categories } = await liveItems<CategoryContent>("categories", opts);
  const page = await pageContent("blog", opts);
  // Only this story's media plus the covers it links to.
  const ids = new Set<number>();
  const own = new Set<number>();
  collectMediaIds(POST_FIELDS, post, own);
  for (const id of own) if (mediaIds.has(id)) ids.add(id);
  [newer, older, ...more].forEach((c: PostCardData | null) => c?.cover.mediaId && ids.add(c.cover.mediaId));
  return {
    post,
    minutes: toCard(post).minutes,
    newer,
    older,
    more,
    categories,
    texts: (page.content as unknown as BlogContent).post,
    media: await resolveMedia(ids),
  };
}
