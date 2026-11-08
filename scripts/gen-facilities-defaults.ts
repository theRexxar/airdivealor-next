/**
 * One-off: turns the Facilities and rates page text into CMS content (English + Indonesian),
 * written to lib/cms/facilities-defaults.ts. Used by the seed and as fallback.
 */
import { writeFileSync } from "node:fs";
import type { FacilitiesContent, RatePackage } from "../lib/cms/facilities-types";
import { toId } from "../lib/i18n";

const L = (en: string) => ({ en, id: en ? toId(en) : "" });
const M = (url: string) => ({ mediaId: null, url });
const WIX = "https://static.wixstatic.com/media/";
const icons = (rows: [string, string][]) => rows.map(([icon, text]) => ({ icon, text: L(text) }));
const photos = (rows: [string, string, string][]) => rows.map(([url, label, title]) => ({ photo: M(url), label: L(label), title: L(title) }));
const lines = (rows: string[]) => rows.map((t) => ({ text: L(t) }));
const SAFETY = { icon: "shield-check", label: L("Safety"), value: L("Emergency oxygen, first aid kit, life jackets and life ring") };

const table = (rows: [number, number, string][]) => rows.map(([days, dives, price]) => ({ days, nights: days - 1, dives, price: `IDR ${price}` }));
const pkgIncluded = lines(["Regular room and 3 meals a day", "Diving equipment", "Airport transfer", "Government tax", "Snacks on the boat"]);
const pkg = (name: string, sub: string, rows: [number, number, string][]): RatePackage => ({
  name: L(name),
  sub: L(sub),
  rows: table(rows),
  cards: [],
  tag: L(""),
  included: pkgIncluded,
  excluded: lines(["Marine park fee"]),
  note: L("Minimum booking is 2 people. If you travel alone, a single-room surcharge applies."),
});

const content: FacilitiesContent = {
  seo: {
    title: { en: "Facilities and rates | Air Dive Alor", id: "Fasilitas dan tarif | Air Dive Alor" },
    description: {
      en: "Stay in Alor Kecil village with three home-cooked meals a day, and dive with our two boats. Dive packages from five days, or pay per dive.",
      id: "Menginap di desa Alor Kecil dengan tiga kali makan masakan rumahan sehari, dan menyelam dengan dua perahu kami. Paket selam mulai lima hari, atau bayar per penyelaman.",
    },
    ogImage: M("/latest/b-stay-shop.webp"),
  },
  hero: {
    eyebrow: L("Pricing · Facilities and rates"),
    title: L("Dive and stay in Alor Kecil."),
    lead: L("Four rooms in the village, three home-cooked meals a day, and dive packages from five days."),
    image: M("/latest/b-stay-shop.webp"),
  },
  glance: {
    items: [
      { label: L("Package A"), title: L("2 dives a day"), from: L("From"), price: "IDR 9,800,000", note: L("5 days, 6 dives"), package: 1 },
      { label: L("Package B"), title: L("3 dives a day"), from: L("From"), price: "IDR 11,825,000", note: L("5 days, 8 dives"), package: 2 },
      { label: L("À la carte"), title: L("Pay per dive"), from: L("Fun dive"), price: "IDR 1,000,000", note: L("per dive, 10% off from 10 dives"), package: 3 },
    ],
    moreLabel: L("See rates"),
  },
  stay: {
    eyebrow: L("01 · Air Dive Stay"),
    title: L("Village life, four good rooms."),
    paragraphs: lines([
      "We are in the heart of Alor Kecil village. Forget the alarm. Wake up to roosters and birds, and enjoy the quiet of the countryside.",
      "Every stay includes three meals a day: breakfast, lunch and dinner. Our cook makes them fresh, with local recipes and food from the market.",
    ]),
    gallery: photos([
      ["", "Rooms", "Four deluxe rooms"],
      ["/latest/b-stay-shop.webp", "Porch", "Our porch in Alor Kecil"],
      ["/latest/b-stay-meals.webp", "Meals", "Three home-cooked meals a day"],
      ["/latest/b-stay-airport.webp", "Airport", "Pick-up at Mali Airport"],
    ]),
    listTitle: L("In every room"),
    items: icons([
      ["bed-double", "Two rooms with a queen bed"],
      ["bed-single", "Two rooms with twin beds"],
      ["shower-head", "Private bathroom with hot shower"],
      ["snowflake", "Air conditioning"],
      ["vault", "Safe deposit box"],
      ["laptop", "Desk and work space"],
      ["coffee", "Kettle, tea, coffee and drinking water"],
      ["tree-palm", "Hammock on the porch"],
      ["utensils", "Breakfast, lunch and dinner"],
    ]),
    badge: L("4 deluxe rooms"),
    note: L("There is no wifi yet. To stay in touch, you can use our office mobile internet at dinner time."),
  },
  diving: {
    eyebrow: L("02 · Air Dive Diving"),
    title: L("Everything ready before you dive."),
    paragraphs: lines(["Our dive shop and boat are three minutes apart. Gear, tanks and the boat are ready each morning, so you only need to come to the briefing."]),
    gallery: photos([
      ["/latest/b-boat-drinks.webp", "Briefing", "Dive briefing on the boat"],
      ["https://airdivealor.com/files/large/220/1200/780", "Dive shop", "Gear room at the dive shop"],
      ["https://airdivealor.com/files/large/209/1200/780", "Kanaloa", "Surface interval on Kanaloa"],
      ["https://airdivealor.com/files/large/210/1200/780", "Lunch", "Lunch cooked on board"],
      ["https://airdivealor.com/files/large/268/500/350", "Camera table", "Camera table and rinse tank"],
    ]),
    listTitle: L("Every dive day"),
    items: icons([
      ["anchor", "Dive shop 3 minutes from the boat"],
      ["gauge", "Tanks filled and checked every morning"],
      ["droplets", "Gear rinsed and dried for you"],
      ["megaphone", "A briefing before every dive"],
      ["clock", "At least 60 minutes between dives"],
      ["coffee", "Hot tea and coffee on board"],
      ["utensils", "Lunch cooked on board"],
    ]),
    ratesLabel: L("See diving rates"),
  },
  boats: {
    title: L("Two boats, built for Alor."),
    lead: L("Both boats carry the same safety equipment, so every group dives with the same standard."),
    items: [
      {
        name: "Kanaloa",
        photo: M(`${WIX}47ffe6_097891455d4c48b989c063b7377c8ee0~mv2.jpg/v1/crop/x_1,y_104,w_1078,h_422/fill/w_1078,h_422,al_c,q_85/47ffe6_097891455d4c48b989c063b7377c8ee0~mv2.jpg`),
        text: L("Kanaloa is based on the Nusa Lembongan dive boat and was built by hand, from scratch, in Alor Kecil village. Safety is part of everything on board."),
        specs: [{ icon: "users", label: L("Capacity"), value: L("8 divers and 3 divemasters") }, { icon: "gauge", label: L("Engines"), value: L("2 outboard engines") }, SAFETY],
      },
      {
        name: "Inara",
        photo: M(`${WIX}47ffe6_e6bfd9cf0ef14ad1874ad244df7356bb~mv2.jpg/v1/crop/x_0,y_231,w_1440,h_579/fill/w_1440,h_579,al_c,q_85/47ffe6_e6bfd9cf0ef14ad1874ad244df7356bb~mv2.jpg`),
        text: L("Inara is our second dive boat. It is bigger and faster than Kanaloa, with the same safety equipment, so every group dives with the same standard."),
        specs: [{ icon: "users", label: L("Capacity"), value: L("12 divers and 3 divemasters") }, { icon: "gauge", label: L("Engines"), value: L("2 outboard engines, faster than Kanaloa") }, SAFETY],
      },
    ],
  },
  gear: {
    title: L("Gear and equipment."),
    lead: L("Everything you need to dive is here. You only need to bring yourself."),
    items: [
      ["backpack", "Dive gear", "BCD, regulator, wetsuit, mask and fins in many sizes. Included in every package."],
      ["shield-check", "Safety gear", "Emergency oxygen, first aid kit, life jackets and a life ring on both boats."],
      ["container", "Tanks", "Tanks are filled and checked every morning, before the boat leaves."],
      ["fan", "Compressor", "Our own compressor at the dive shop, so every tank is filled on site."],
      ["droplets", "Rinse and dry", "Fresh-water rinse tanks and a drying area. We rinse and dry your gear for you."],
      ["camera", "Camera care", "A dry camera table, rinse tank and charging points on the boat."],
    ].map(([icon, title, text]) => ({ icon, title: L(title), text: L(text) })),
  },
  rates: {
    eyebrow: L("03 · Diving rates"),
    title: L("Choose your package."),
    lead: L("Pick a package by how long you stay. Tap a row to ask us on WhatsApp."),
    packages: [
      pkg("Package A", "2 dives a day", [[5, 6, "9,800,000"], [6, 8, "12,700,000"], [7, 10, "15,600,000"], [8, 12, "18,500,000"], [9, 14, "21,400,000"], [10, 16, "24,300,000"], [11, 18, "27,200,000"], [12, 20, "30,000,000"]]),
      pkg("Package B", "3 dives a day", [[5, 8, "11,825,000"], [6, 11, "15,725,000"], [7, 14, "19,625,000"], [8, 17, "23,525,000"], [9, 20, "27,425,000"], [10, 23, "31,325,000"], [11, 26, "35,225,000"], [12, 29, "39,125,000"]]),
      {
        name: L("À la carte"),
        sub: L("Pay per dive"),
        rows: [],
        cards: [
          { icon: "waves", label: L("Fun dive"), price: "IDR 1,000,000", per: L("per dive"), message: "Hi Air Dive Alor, I would like to book fun dives." },
          { icon: "bed-double", label: L("Stay"), price: "IDR 800,000", per: L("per night"), message: "Hi Air Dive Alor, I would like to book a room." },
        ],
        tag: L("10% off from 10 dives"),
        included: lines(["Diving equipment", "Airport transfer", "Snacks on the boat"]),
        excluded: lines(["Lunch", "Local government tax", "Marine park fee"]),
        note: L("Book 10 dives or more and get 10% off."),
      },
    ],
    rowMessage: "Hi Air Dive Alor, I am interested in {package}: {dives} dives, {days} days / {nights} nights ({price}).",
    note: L("These prices are estimates. Your final cost depends on the dives and nights you actually take. Group rates are available on request."),
  },
  cta: {
    title: L("Coming as a group?"),
    text: L("Tell us your dates and group size. We will send you a group rate."),
    primaryLabel: L("Ask for a group rate"),
    primaryMessage: "Hi Air Dive Alor, I would like a group rate. Dates: , group size: ",
    secondaryLabel: L("See dive courses"),
    secondaryUrl: "/dive-courses",
  },
};

const out = `/* Generated by scripts/gen-facilities-defaults.ts. Built-in Facilities and rates content: seed data and fallback. */
import type { FacilitiesContent } from "./facilities-types";

export const FACILITIES_DEFAULTS: FacilitiesContent = ${JSON.stringify(content, null, 1)};
`;
writeFileSync("lib/cms/facilities-defaults.ts", out);
console.info("wrote lib/cms/facilities-defaults.ts");
