/** Fields of a blog story ("posts" collection) and a blog category ("categories" collection). */
import { F, schemaFor, type BlockKind, type Field } from "./fields";

export const CATEGORY_FIELDS: Field[] = [
  F.text("slug", "Key", { required: true, max: 40, help: "Lowercase words and dashes, e.g. marine-life. Used internally." }),
  F.i18n("name", "Name", { required: true, max: 40 }),
];
export const CATEGORY_SCHEMA = schemaFor(CATEGORY_FIELDS);

const caption = () => F.i18n("caption", "Caption", { help: "Optional. Also used as the photo's description." });

/** The kinds of blocks a story body is made of. */
export const BODY_BLOCKS: BlockKind[] = [
  {
    type: "rich",
    label: "Rich text",
    fields: [F.richtext("text", "Text", { required: true, help: "Write freely with headings, lists, links, pictures from the media library and YouTube or Vimeo videos." })],
  },
  { type: "p", label: "Paragraph", fields: [F.i18n("text", "Text", { required: true, multiline: true, max: 5000 })] },
  { type: "h", label: "Heading", fields: [F.i18n("text", "Heading", { required: true, max: 200 })] },
  { type: "img", label: "Image", fields: [F.image("photo", "Photo"), caption()], titleKey: "caption" },
  {
    type: "gallery",
    label: "Gallery",
    fields: [F.list("items", "Photos", "Photo", [F.image("photo", "Photo"), caption()], { min: 1, max: 12, titleKey: "caption" })],
  },
  { type: "list", label: "Checklist", fields: [F.list("items", "Items", "Item", [F.i18n("text", "Text", { required: true })], { min: 1, max: 20, titleKey: "text" })] },
  { type: "quote", label: "Quote", fields: [F.i18n("text", "Quote", { required: true, multiline: true }), F.text("cite", "Who said it", { max: 120 })] },
  {
    type: "facts",
    label: "Facts",
    fields: [F.list("items", "Facts", "Fact", [F.i18n("label", "Label", { required: true }), F.i18n("value", "Value", { required: true })], { min: 1, max: 12, titleKey: "label" })],
  },
  { type: "link", label: "Button link", fields: [F.i18n("label", "Button text", { required: true }), F.url("href", "Link")], titleKey: "label" },
];

export const POST_FIELDS: Field[] = [
  F.text("slug", "Web address", { required: true, max: 80, help: "English, lowercase words and dashes: /en/blog/<web-address>. Changing it breaks old links." }),
  F.text("slugId", "Web address (Indonesian)", { max: 80, help: "Lowercase words and dashes: /id/blog/<web-address>. Leave empty to use the English one." }),
  F.i18n("title", "Title", { required: true, max: 200 }),
  F.i18n("excerpt", "Excerpt", { required: true, multiline: true, max: 400, help: "Shown on the story cards and under the title." }),
  F.date("date", "Date", { required: true, help: "Stories are listed newest first. The newest one is featured at the top of the blog." }),
  F.ref("category", "Category", "categories", { required: true }),
  F.i18n("author", "Author", { required: true, max: 80 }),
  F.text("initials", "Author initials", { max: 3, help: "Shown in the round badge, e.g. AD." }),
  F.image("cover", "Cover photo"),
  F.blocks("body", "Story", BODY_BLOCKS, { help: "Leave empty for a story that's still on the old blog: the page then shows the excerpt and a link to the old story." }),
  F.url("source", "Old blog link", "The story on the old WordPress blog, for stories not moved yet."),
];
export const POST_SCHEMA = schemaFor(POST_FIELDS);
