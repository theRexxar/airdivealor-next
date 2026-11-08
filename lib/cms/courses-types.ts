/** Content shapes for the Dive courses page and the courses. Mirrors courses-sections.ts and course-fields.ts. */
import type { I18n, MediaRef } from "./fields";
import type { ResolvedMedia } from "./home-types";

export interface CourseContent {
  slug: string;
  /** Indonesian web address; empty or missing = same as slug. */
  slugId?: string;
  name: I18n;
  level: string;
  agency: string;
  price: string;
  stay: I18n;
  dives: I18n;
  photo: MediaRef;
  text: I18n;
  included: { icon: string; title: I18n; text: I18n }[];
  days: I18n;
  diveCount: I18n;
  depth: I18n;
  age: I18n;
  group: I18n;
  prereq: I18n;
  learn: { text: I18n }[];
  plan: { day: I18n; title: I18n; text: I18n }[];
  tips: { text: I18n }[];
}

export interface CoursesContent {
  seo: { title: I18n; description: I18n; ogImage: MediaRef };
  detail: {
    bookMessage: string;
    bookLabel: I18n;
    includedLead: I18n;
    notIncluded: { text: I18n }[];
    medical: I18n;
    insurance: I18n;
    flying: I18n;
    reqNote: I18n;
    ctaTitle: I18n;
    ctaText: I18n;
    ctaLabel: I18n;
  };
  hero: { eyebrow: I18n; title: I18n; lead: I18n; logos: { image: MediaRef; alt: string }[] };
  list: { filters: { label: I18n; level: string }[]; moreLabel: I18n; bookLabel: I18n };
  cta: { title: I18n; text: I18n; primaryLabel: I18n; primaryMessage: string; secondaryLabel: I18n; secondaryUrl: string };
}

/** Public API: the Dive courses page with its published, visible courses in order. */
export interface PublishedCourses {
  content: CoursesContent;
  order: string[];
  courses: CourseContent[];
  media: Record<string, ResolvedMedia>;
  publishedAt: string | null;
}

/** Public API: one course page, with the shared course-page texts and its neighbours for previous/next links. */
export interface PublishedCourse {
  course: CourseContent;
  index: number;
  total: number;
  prev: { slug: string; slugId?: string; name: I18n };
  next: { slug: string; slugId?: string; name: I18n };
  detail: CoursesContent["detail"];
  media: Record<string, ResolvedMedia>;
}

/** The WhatsApp booking message for a course. */
export const bookMessage = (tpl: string, c: CourseContent) =>
  (tpl || "Hi Air Dive Alor, I would like to book the {course} ({price}).").replace(/\{course\}/g, c.name.en).replace(/\{price\}/g, c.price);
