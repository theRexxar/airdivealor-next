/** Built-in content per page: what the seed starts with and what the website shows if the CMS is unreachable. */
import { ABOUT_DEFAULTS } from "./about-defaults";
import { BLOG_DEFAULTS, CATEGORIES_DEFAULTS, POSTS_DEFAULTS } from "./blog-defaults";
import { COURSES_DEFAULTS, COURSES_PAGE_DEFAULTS } from "./courses-defaults";
import { DIVE_SITES_DEFAULTS, SITES_DEFAULTS } from "./dive-sites-defaults";
import { FACILITIES_DEFAULTS } from "./facilities-defaults";
import { FAQ_PAGE_DEFAULTS, FAQS_DEFAULTS } from "./faq-defaults";
import { HOME_DEFAULTS } from "./home-defaults";

export const PAGE_DEFAULTS: Record<string, Record<string, unknown>> = {
  home: HOME_DEFAULTS as unknown as Record<string, unknown>,
  "dive-sites": DIVE_SITES_DEFAULTS as unknown as Record<string, unknown>,
  facilities: FACILITIES_DEFAULTS as unknown as Record<string, unknown>,
  "dive-courses": COURSES_PAGE_DEFAULTS as unknown as Record<string, unknown>,
  "about-us": ABOUT_DEFAULTS as unknown as Record<string, unknown>,
  blog: BLOG_DEFAULTS as unknown as Record<string, unknown>,
  faq: FAQ_PAGE_DEFAULTS as unknown as Record<string, unknown>,
};

export const COLLECTION_DEFAULTS: Record<string, { slug: string }[]> = { sites: SITES_DEFAULTS, courses: COURSES_DEFAULTS, posts: POSTS_DEFAULTS, categories: CATEGORIES_DEFAULTS, faqs: FAQS_DEFAULTS };
