/** Check that the built-in default content passes the CMS validation (npm run cms:check). */
import { ABOUT_DEFAULTS } from "../lib/cms/about-defaults";
import { ABOUT_SCHEMAS } from "../lib/cms/about-sections";
import { BLOG_DEFAULTS, CATEGORIES_DEFAULTS, POSTS_DEFAULTS } from "../lib/cms/blog-defaults";
import { BLOG_SCHEMAS } from "../lib/cms/blog-sections";
import { CATEGORY_SCHEMA, POST_SCHEMA } from "../lib/cms/post-fields";
import { COURSE_SCHEMA } from "../lib/cms/course-fields";
import { COURSES_DEFAULTS, COURSES_PAGE_DEFAULTS } from "../lib/cms/courses-defaults";
import { COURSES_SCHEMAS } from "../lib/cms/courses-sections";
import { DIVE_SITES_DEFAULTS, SITES_DEFAULTS } from "../lib/cms/dive-sites-defaults";
import { DIVE_SITES_SCHEMAS } from "../lib/cms/dive-sites-sections";
import { FACILITIES_DEFAULTS } from "../lib/cms/facilities-defaults";
import { FACILITIES_SCHEMAS } from "../lib/cms/facilities-sections";
import { HOME_DEFAULTS } from "../lib/cms/home-defaults";
import { HOME_SCHEMAS } from "../lib/cms/home-sections";
import { SITE_SCHEMA } from "../lib/cms/site-fields";
import { schemaFor } from "../lib/cms/fields";
import { MENUS_DEFAULTS, MENUS_SECTIONS } from "../lib/cms/menus";

let ok = true;
const check = (label: string, schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: unknown[] } } }, value: unknown) => {
  const r = schema.safeParse(value);
  if (!r.success) {
    ok = false;
    console.log(label, JSON.stringify(r.error!.issues.slice(0, 3)));
  }
};
for (const [k, s] of Object.entries(HOME_SCHEMAS)) check(`home.${k}`, s, (HOME_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const [k, s] of Object.entries(DIVE_SITES_SCHEMAS)) check(`dive-sites.${k}`, s, (DIVE_SITES_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const [k, s] of Object.entries(FACILITIES_SCHEMAS)) check(`facilities.${k}`, s, (FACILITIES_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const [k, s] of Object.entries(COURSES_SCHEMAS)) check(`dive-courses.${k}`, s, (COURSES_PAGE_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const [k, s] of Object.entries(ABOUT_SCHEMAS)) check(`about-us.${k}`, s, (ABOUT_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const [k, s] of Object.entries(BLOG_SCHEMAS)) check(`blog.${k}`, s, (BLOG_DEFAULTS as unknown as Record<string, unknown>)[k]);
for (const s of MENUS_SECTIONS) check(`menus.${s.key}`, schemaFor(s.fields), (MENUS_DEFAULTS as unknown as Record<string, unknown>)[s.key]);
POSTS_DEFAULTS.forEach((x) => check(`post ${x.slug}`, POST_SCHEMA, x));
CATEGORIES_DEFAULTS.forEach((x) => check(`category ${x.slug}`, CATEGORY_SCHEMA, x));
COURSES_DEFAULTS.forEach((x) => check(`course ${x.slug}`, COURSE_SCHEMA, x));
SITES_DEFAULTS.forEach((x) => check(`site ${x.slug}`, SITE_SCHEMA, x));
console.log(ok ? "all defaults valid" : "invalid defaults");
process.exit(ok ? 0 : 1);
