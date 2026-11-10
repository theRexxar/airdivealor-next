/** The FAQ page as the CMS sees it. The questions are the "faqs" collection. */
import { F } from "./fields";
import { seoSection, type SectionDef } from "./sections";

export const FAQ_SECTIONS: SectionDef[] = [
  seoSection(),
  {
    key: "detail",
    label: "Answer pages",
    description: "Shared texts on every full answer page (/faq/…): the closing box and “More questions”.",
    fixed: true,
    fields: [
      F.i18n("backLabel", "Back link"),
      F.i18n("updatedLabel", "“Updated” label", { help: "Shown before the date the answer was last published." }),
      F.i18n("ctaTitle", "Closing box: title"),
      F.i18n("ctaText", "Closing box: text", { multiline: true }),
      F.i18n("ctaLabel", "Closing box: button"),
      F.text("ctaMessage", "Closing box: WhatsApp message", { max: 300, help: "{question} is replaced by the question." }),
      F.i18n("moreTitle", "More questions: title"),
    ],
  },
  {
    key: "hero",
    label: "Intro",
    description: "The title and intro at the top of the FAQ page.",
    fields: [F.i18n("eyebrow", "Eyebrow"), F.i18n("title", "Title", { required: true }), F.i18n("lead", "Intro text", { multiline: true })],
  },
  {
    key: "list",
    label: "Questions",
    description: "All questions, in groups. Questions with a full answer link to their own page.",
    fields: [F.i18n("readLabel", "“Read the full answer” link"), F.i18n("emptyText", "Text when there are no questions yet")],
  },
  {
    key: "cta",
    label: "Help box",
    description: "The WhatsApp box at the end of the FAQ page.",
    fields: [F.i18n("title", "Title"), F.i18n("text", "Text", { multiline: true }), F.i18n("button", "Button"), F.text("message", "WhatsApp message", { max: 300 })],
  },
];
