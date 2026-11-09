/** Fields of a question on the FAQ page ("faqs" collection). Questions with a full answer get their own page. */
import { F, schemaFor, type Field } from "./fields";

/** Groups on the FAQ page, in this order. */
export const FAQ_CATEGORIES = [
  { value: "travel", label: "Getting here", en: "Getting here", id: "Menuju Alor" },
  { value: "diving", label: "Diving", en: "Diving", id: "Menyelam" },
  { value: "stay", label: "Your stay", en: "Your stay", id: "Menginap" },
  { value: "booking", label: "Booking and payment", en: "Booking and payment", id: "Pemesanan dan pembayaran" },
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number]["value"];

export const FAQ_FIELDS: Field[] = [
  F.text("slug", "Web address", { required: true, max: 80, help: "English, lowercase words and dashes: /en/faq/<web-address>. Changing it breaks old links." }),
  F.text("slugId", "Web address (Indonesian)", { max: 80, help: "Lowercase words and dashes: /id/tanya-jawab/<web-address>. Leave empty to use the English one." }),
  F.i18n("question", "Question", { required: true, max: 200 }),
  F.i18n("answer", "Short answer", {
    required: true,
    multiline: true,
    max: 600,
    help: "One or two sentences. Shown in the list of questions, under the title of the full answer, and to search engines.",
  }),
  F.select("category", "Group", FAQ_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))),
  F.image("cover", "Cover photo", "Optional. Shown at the top of the full answer and when the page is shared."),
  F.richtext("body", "Full answer", {
    help: "Optional. Write the long answer with headings, lists, links, pictures and videos. With a full answer, the question gets its own page and a “Read the full answer” link.",
  }),
];
export const FAQ_SCHEMA = schemaFor(FAQ_FIELDS);
