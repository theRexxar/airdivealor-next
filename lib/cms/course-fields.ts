/** Fields of one dive course (the "courses" collection): its card on /dive-courses and its page /dive-courses/<web-address>. */
import { F, schemaFor, type Field } from "./fields";
import { ICON_OPTIONS } from "./sections";

export const COURSE_LEVELS = ["Beginner", "Advanced", "Specialty", "Professional", "Technical", "Custom"] as const;
export const LEVEL_OPTIONS = COURSE_LEVELS.map((v) => ({ value: v, label: v }));

const t = (key: string, label: string, help?: string) => F.i18n(key, label, { help });

export const COURSE_FIELDS: Field[] = [
  F.text("slug", "Web address", { required: true, max: 80, help: "English, lowercase words and dashes: /en/dive-courses/<web-address>. Changing it breaks old links." }),
  F.text("slugId", "Web address (Indonesian)", { max: 80, help: "Lowercase words and dashes: /id/kursus-selam/<web-address>. Leave empty to use the English one." }),
  F.i18n("name", "Course name", { required: true, max: 80 }),
  F.select("level", "Level", LEVEL_OPTIONS, "Used by the level filters on the Dive courses page."),
  F.select("agency", "Certifying agency", [
    { value: "SDI", label: "SDI" },
    { value: "TDI", label: "TDI" },
  ]),
  F.text("price", "Price", { required: true, max: 40, help: "e.g. IDR 14,000,000" }),
  t("stay", "Stay", "e.g. 6D/5N stay"),
  t("dives", "Dives (on the card)", "e.g. 1 pool, 8 dives"),
  F.image("photo", "Photo"),
  F.i18n("text", "Intro", { required: true, multiline: true, help: "On the card and at the top of the course page." }),
  F.list(
    "included",
    "What's included",
    "Item",
    [F.select("icon", "Icon", ICON_OPTIONS), F.i18n("title", "Item", { required: true }), F.i18n("text", "Details", { multiline: true })],
    { max: 14, titleKey: "title" },
  ),
  t("days", "Duration", "e.g. 6 days"),
  t("diveCount", "Dives (at a glance)", "e.g. 1 pool + 8 dives"),
  t("depth", "Max depth", "e.g. 18 m"),
  t("age", "Minimum age", "e.g. 10+ years"),
  t("group", "Group size", "e.g. Max 4 students per instructor"),
  F.i18n("prereq", "Prerequisite", { multiline: true }),
  F.list("learn", "What you'll learn", "Skill", [F.i18n("text", "Skill", { required: true })], { max: 12, titleKey: "text" }),
  F.list("plan", "Course plan", "Day", [F.i18n("day", "Day", { required: true, help: "e.g. Day 1, or Day 3 to 4" }), F.i18n("title", "Title", { required: true }), F.i18n("text", "Description", { multiline: true })], {
    max: 14,
    titleKey: "title",
  }),
  F.list("tips", "Instructor tips", "Tip", [F.i18n("text", "Tip", { required: true, multiline: true })], { max: 8, titleKey: "text" }),
];

export const COURSE_SCHEMA = schemaFor(COURSE_FIELDS);
