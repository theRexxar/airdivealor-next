/**
 * The Home page as the CMS sees it: one entry per section, in page order.
 * Each section has its own fields and its own edit permission (`home.<key>.edit`). Registered in lib/cms/registry.ts.
 */
import { F, schemaFor } from "./fields";
import { eyebrowTitle, ICON_OPTIONS as ICONS, seoSection, type SectionDef } from "./sections";

export type { SectionDef };

export const HOME_SECTIONS: SectionDef[] = [
  seoSection(),
  {
    key: "hero",
    label: "Hero",
    depth: 0,
    description: "The first screen: photo or video, headline and the two buttons.",
    fields: [
      F.i18n("eyebrow", "Eyebrow"),
      F.i18n("title", "Headline", { required: true, multiline: true, help: "Each line break starts a new line." }),
      F.i18n("lead", "Intro text", { multiline: true }),
      F.i18n("primaryCta", "Main button", { required: true }),
      F.i18n("secondaryCta", "Second button"),
      F.image("image", "Background photo", "Also used as the still frame when a video is set."),
      F.video("video", "Background video (optional)", "Short loop, 10–15 seconds. The worker makes a web-ready MP4 and a poster."),
      F.text("caption", "Photo caption", { help: "Bottom-right label, e.g. “Dinding Bama · 18 m”." }),
    ],
  },
  {
    key: "awards",
    label: "Awards card",
    description: "The card that overlaps the bottom of the hero.",
    fields: [
      F.list("items", "Items", "Item", [
        F.select("icon", "Icon", [{ value: "rating", label: "Star rating" }, ...ICONS]),
        F.number("rating", "Rating (for the star rating icon)", { min: 0, max: 5, step: 0.1 }),
        F.i18n("title", "Title", { required: true }),
        F.i18n("subtitle", "Subtitle"),
      ], { min: 1, max: 4, titleKey: "title" }),
    ],
  },
  {
    key: "prices",
    label: "Prices",
    depth: 5,
    description: "Package comparison table with the IDR / USD switch.",
    fields: [
      ...eyebrowTitle(),
      F.i18n("lead", "Intro text", { multiline: true }),
      F.i18n("tableLabel", "Table corner label"),
      F.i18n("depositNote", "Deposit note"),
      F.number("usdRate", "IDR per US dollar", { min: 1, help: "Used to show indicative USD prices." }),
      F.i18n("usdNote", "Currency note"),
      F.list("rows", "Comparison rows", "Row", [F.i18n("label", "Row label", { required: true })], { min: 1, titleKey: "label", help: "Each package lists one value per row, in this order." }),
      F.list("packages", "Packages", "Package", [
        F.text("id", "Package code", { required: true, max: 40, help: "Short code used in the booking form, e.g. stay." }),
        F.i18n("name", "Name", { required: true }),
        F.i18n("meta", "Length and dives"),
        F.number("priceIdr", "Price (IDR)", { min: 0 }),
        F.i18n("unit", "Price unit", { help: "e.g. per diver, twin share" }),
        F.i18n("tag", "Tag"),
        F.bool("highlight", "Show the tag"),
        F.list("cells", "Values per row", "Value", [F.i18n("value", "Value", { help: "Type yes or no for a tick or dash, or any short text." })], { titleKey: "value" }),
      ], { min: 1, max: 4, titleKey: "name" }),
      F.i18n("chooseLabel", "Choose button"),
    ],
  },
  {
    key: "why",
    label: "Why Alor",
    depth: 10,
    description: "Kinds of diving, each with its own background photo.",
    fields: [
      ...eyebrowTitle(),
      F.list("items", "Kinds of diving", "Item", [
        F.i18n("label", "Label", { required: true }),
        F.i18n("text", "Description", { multiline: true }),
        F.i18n("photoTitle", "Photo label"),
        F.image("photo", "Photo"),
      ], { min: 1, max: 6, titleKey: "label" }),
    ],
  },
  {
    key: "sites",
    label: "Dive sites",
    depth: 15,
    description: "The site picker. Site details come from the Dive sites data; pick which sites to show and their photos.",
    fields: [
      ...eyebrowTitle(),
      F.number("defaultIndex", "Site selected at first (1 = first)", { min: 1 }),
      F.list("items", "Sites", "Site", [
        F.ref("slug", "Site", "sites", { required: true }),
        F.image("photo", "Photo"),
      ], { min: 1, max: 12, titleKey: "slug" }),
      F.i18n("guideLabel", "Site guide link"),
      F.i18n("seeLabel", "“You'll see” label"),
    ],
  },
  {
    key: "stay",
    label: "Safety stop",
    depth: 18,
    description: "Stay and boat cards with tabs.",
    fields: [
      ...eyebrowTitle(),
      F.i18n("lead", "Intro text", { multiline: true }),
      F.list("cards", "Cards", "Card", [
        F.i18n("kicker", "Card label", { required: true }),
        F.list("tabs", "Tabs", "Tab", [
          F.select("icon", "Icon", ICONS),
          F.i18n("label", "Tab label", { required: true }),
          F.image("photo", "Photo"),
          F.i18n("statLabel", "Badge label"),
          F.i18n("stat", "Badge value"),
          F.i18n("title", "Title", { required: true }),
          F.i18n("text", "Text", { multiline: true }),
        ], { min: 1, max: 6, titleKey: "label" }),
      ], { min: 1, max: 3, titleKey: "kicker" }),
    ],
  },
  {
    key: "reviews",
    label: "Reviews",
    depth: 21,
    description: "Score, review links and the review carousel.",
    fields: [
      F.i18n("eyebrow", "Eyebrow"),
      F.number("score", "Score", { min: 0, max: 5, step: 0.1 }),
      F.i18n("scoreNote", "Score note"),
      F.i18n("googleLabel", "Google link label"),
      F.url("googleUrl", "Google reviews URL"),
      F.i18n("tripadvisorLabel", "TripAdvisor link label"),
      F.url("tripadvisorUrl", "TripAdvisor URL"),
      F.list("items", "Reviews", "Review", [
        F.i18n("quote", "Quote", { required: true, multiline: true }),
        F.text("name", "Name", { required: true }),
        F.i18n("place", "Place"),
        F.i18n("date", "Date", { help: "e.g. Sep 2024" }),
        F.text("source", "Source", { help: "e.g. TripAdvisor" }),
      ], { min: 1, titleKey: "name" }),
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    depth: 27,
    description: "Questions and answers, and the WhatsApp help box. A question can link to its full answer on the FAQ page.",
    fields: [
      ...eyebrowTitle(),
      F.i18n("moreLabel", "Link to the full answer: text", { help: "Shown under questions that link to a full answer, e.g. “Read the full answer”. A question can use its own text instead." }),
      F.list(
        "items",
        "Questions",
        "Question",
        [
          F.i18n("q", "Question", { required: true }),
          F.i18n("a", "Answer", { required: true, multiline: true }),
          F.ref("page", "Full answer", "faqs", { help: "Optional. A question from FAQ questions with a full answer: adds a link to it under the answer." }),
          F.i18n("moreLabel", "Link text", { help: "Optional. Leave empty to use the section's link text." }),
        ],
        { titleKey: "q" },
      ),
      F.group("help", "Help box", [F.i18n("title", "Title"), F.i18n("text", "Text", { multiline: true }), F.i18n("button", "Button")]),
    ],
  },
  {
    key: "book",
    label: "Book",
    depth: 30,
    description: "Booking intro, quote and the three-step form.",
    fields: [
      ...eyebrowTitle(),
      F.i18n("lead", "Intro text", { multiline: true }),
      F.group("quote", "Quote", [F.number("rating", "Stars", { min: 0, max: 5, step: 0.5 }), F.i18n("text", "Quote"), F.i18n("cite", "Who and where")]),
      F.number("depositPercent", "Deposit (%)", { min: 0, max: 100 }),
      F.i18n("depositNote", "Deposit note"),
      F.i18n("cancellation", "Cancellation note"),
      F.i18n("successTitle", "Sent: title"),
      F.i18n("successText", "Sent: text", { multiline: true }),
    ],
  },
];

export const HOME_SECTION_KEYS = HOME_SECTIONS.map((s) => s.key);
export const sectionDef = (key: string) => HOME_SECTIONS.find((s) => s.key === key);

/** Validation schemas, built once. */
export const HOME_SCHEMAS = Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, schemaFor(s.fields)]));
