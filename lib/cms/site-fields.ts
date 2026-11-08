/** Fields of one dive site guide (the "sites" collection). */
import { F, schemaFor, type Field } from "./fields";

const t = (key: string, label: string, help?: string) => F.i18n(key, label, { help });

export const SITE_FIELDS: Field[] = [
  F.text("slug", "Web address", { required: true, max: 80, help: "English, lowercase words and dashes: /en/dive-sites/<web-address>. Changing it breaks old links." }),
  F.text("slugId", "Web address (Indonesian)", { max: 80, help: "Lowercase words and dashes: /id/titik-selam/<web-address>. Leave empty to use the English one." }),
  F.text("name", "Site name", { required: true, max: 80 }),
  F.text("aka", "Also known as", { max: 120 }),
  t("area", "Location", "e.g. Pantar Strait"),
  t("type", "Site type", "e.g. Wall and drop-off"),
  F.text("depth", "Depth", { help: "e.g. 5–40 m" }),
  t("level", "Level", "e.g. Advanced"),
  t("current", "Current", "e.g. Strong"),
  F.text("vis", "Visibility", { help: "e.g. 20–30 m" }),
  F.text("temp", "Water temperature", { help: "e.g. 22–28°C" }),
  F.image("photo", "Main photo", "Used on the site card and at the top of the guide."),
  F.list("gallery", "More photos", "Photo", [F.image("photo", "Photo")], { max: 8 }),
  F.list("diveTypes", "Dive types", "Dive type", [F.i18n("label", "Dive type", { required: true })], { max: 8, titleKey: "label", help: "Used by the filters on the Dive sites page (English words)." }),
  F.i18n("intro", "Short intro", { multiline: true, required: true, help: "Shown on the card and under the guide title." }),
  F.i18n("topo", "Topography (headline)", { multiline: true }),
  F.i18n("aboutTopo", "Topography (details)", { multiline: true }),
  F.i18n("aboutLife", "Marine life (details)", { multiline: true }),
  F.list("see", "Look out for", "Animal", [F.i18n("name", "Name", { required: true })], { max: 12, titleKey: "name" }),
  t("boatTime", "Boat time"),
  t("entry", "Entry"),
  t("minLevel", "Minimum level"),
  t("hazards", "Watch for"),
  t("bestTime", "Best time"),
  F.list("tips", "Guide tips", "Tip", [F.i18n("text", "Tip", { required: true })], { max: 8, titleKey: "text" }),
  F.bool("unverified", "Still being checked", "Shows a note that the details come from public dive guides and the team is checking them."),
  F.text("credit", "Photo credit"),
  F.url("creditUrl", "Photo credit link"),
];

export const SITE_SCHEMA = schemaFor(SITE_FIELDS);
