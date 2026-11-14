/**
 * Header and footer menus: the CMS "Header and footer" page. Fields, content shapes and built-in content
 * (what the website shows before anything is published, or when the CMS can't be reached).
 */
import { F, type I18n } from "./fields";
import type { SectionDef } from "./sections";
import { ROUTES, SOCIAL } from "../site";

const LINK_HELP = "A page of this site (/dive-sites, /#b-book), a full https:// link (opens in a new tab) or mailto:.";

const link = (label: string, extra: ReturnType<typeof F.bool>[] = []) => [
  F.i18n("label", label, { required: true, max: 80 }),
  F.url("link", "Link", LINK_HELP),
  ...extra,
];

export const MENUS_SECTIONS: SectionDef[] = [
  {
    key: "header",
    label: "Header menu",
    description: "Menu items at the top of every page, and the button on the right. On phones they move into the menu button.",
    fixed: true,
    fields: [
      F.list(
        "items",
        "Menu items",
        "Menu item",
        [
          ...link("Text"),
          F.list("children", "Dropdown items", "Dropdown item", link("Text"), {
            max: 8,
            titleKey: "label",
            help: "With dropdown items, this menu item opens a dropdown (its own link is not used).",
          }),
        ],
        { min: 1, max: 8, titleKey: "label" },
      ),
      F.group("button", "Button", [F.i18n("label", "Button text", { required: true, max: 40 }), F.url("link", "Button link", LINK_HELP)]),
    ],
  },
  {
    key: "footer",
    label: "Footer",
    description: "Address, contact details, link columns and the bottom row of every page.",
    fixed: true,
    fields: [
      F.i18n("address", "Address", { multiline: true, max: 300 }),
      F.text("phone", "Phone number shown", { max: 40, help: "Opens WhatsApp, like the WhatsApp link above it." }),
      F.text("email", "Email address", { max: 120 }),
      F.list(
        "columns",
        "Link columns",
        "Column",
        [
          F.i18n("heading", "Column heading", { required: true, max: 60 }),
          F.list("links", "Links", "Link", link("Text", [F.bool("accent", "Highlight in blue")]), { max: 10, titleKey: "label" }),
        ],
        { max: 4, titleKey: "heading" },
      ),
      F.i18n("copyright", "Copyright line", { max: 120 }),
      F.list("legal", "Bottom row links", "Link", link("Text"), { max: 6, titleKey: "label" }),
    ],
  },
];

export interface MenuLink {
  label: I18n;
  link: string;
}
export interface MenusContent {
  header: { items: (MenuLink & { children: MenuLink[] })[]; button: MenuLink };
  footer: {
    address: I18n;
    phone: string;
    email: string;
    columns: { heading: I18n; links: (MenuLink & { accent: boolean })[] }[];
    copyright: I18n;
    legal: MenuLink[];
  };
}

const l = (en: string, id: string, href: string): MenuLink => ({ label: { en, id }, link: href });
const a = (en: string, id: string, href: string, accent = false) => ({ ...l(en, id, href), accent });

export const MENUS_DEFAULTS: MenusContent = {
  header: {
    items: [
      { ...l("Home", "Beranda", ROUTES.home), children: [] },
      { ...l("Dive sites", "Titik selam", ROUTES.diveSites), children: [] },
      {
        ...l("Pricing", "Harga", ""),
        children: [l("Facilities and rates", "Fasilitas dan tarif", ROUTES.facilities), l("Dive courses", "Kursus selam", ROUTES.courses)],
      },
      { ...l("About us", "Tentang kami", ROUTES.about), children: [] },
      { ...l("Blog", "Blog", ROUTES.blog), children: [] },
    ],
    button: l("Book", "Pesan", ROUTES.book),
  },
  footer: {
    address: { en: "Alor Kecil, Alor Barat Laut, Alor Regency, East Nusa Tenggara, Indonesia", id: "Alor Kecil, Alor Barat Laut, Kabupaten Alor, Nusa Tenggara Timur, Indonesia" },
    phone: "0813-9550-5313",
    email: "contact@airdivealor.com",
    columns: [
      {
        heading: { en: "Explore", id: "Jelajahi" },
        links: [
          a("Home", "Beranda", ROUTES.home),
          a("Dive sites", "Titik selam", ROUTES.diveSites),
          a("Facilities and rates", "Fasilitas dan tarif", ROUTES.facilities),
          a("Dive courses", "Kursus selam", ROUTES.courses),
          a("About us", "Tentang kami", ROUTES.about),
          a("Blog", "Blog", ROUTES.blog),
        ],
      },
      {
        heading: { en: "Plan your trip", id: "Rencanakan perjalanan" },
        links: [a("Prices", "Harga", ROUTES.prices), a("FAQ", "Tanya jawab", ROUTES.faqPages), a("Book", "Pesan", ROUTES.book)],
      },
      {
        heading: { en: "Follow us", id: "Ikuti kami" },
        links: [
          a("Instagram", "Instagram", SOCIAL.instagram),
          a("Facebook", "Facebook", SOCIAL.facebook),
          a("YouTube", "YouTube", SOCIAL.youtube),
          a("TripAdvisor", "TripAdvisor", SOCIAL.tripadvisor),
          a("Air DiveX, our sister brand", "Air DiveX, merek saudara kami", SOCIAL.airdivex, true),
        ],
      },
    ],
    copyright: { en: "© 2026 Air Dive Alor Team", id: "© 2026 Tim Air Dive Alor" },
    legal: [
      l("Safety policy", "Kebijakan keselamatan", ROUTES.faq),
      l("Cancellation policy", "Kebijakan pembatalan", ROUTES.faq),
      l("Privacy", "Privasi", ROUTES.faq),
    ],
  },
};

/** Public API: the header and footer menus. */
export interface PublishedMenus {
  content: MenusContent;
  publishedAt: string | null;
}
