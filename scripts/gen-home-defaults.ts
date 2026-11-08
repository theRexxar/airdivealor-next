/**
 * One-off: turns the Home page content that was hard-coded in the design build into CMS section
 * values (English + Indonesian), written to lib/cms/home-defaults.ts.
 * The CMS seed stores these as the first draft and published version.
 */
import { writeFileSync } from "node:fs";
import { HOME } from "../lib/home-data";
import { toId } from "../lib/i18n";

const L = (en: string) => ({ en, id: toId(en) });
const M = (url: string) => ({ mediaId: null, url });

const REST = [
  {
    kicker: "Stay · 0 m, on land",
    tabs: [
      ["bed", "Rooms", "https://airdivealor.com/files/large/283/1200/780", "Room types", "Cottage, guesthouse", "Beachside cottages in Alor Kecil", "Cottages and garden guesthouses by the beach. Fans or air-con, hot showers, and a hammock for the hours after diving."],
      ["anchor", "Dive shop", "/latest/b-stay-shop.webp", "Walk to boat", "3 min", "Three minutes to the boat", "Your gear stays at the shop, rinsed and dried for you. Tanks are filled and checked before you wake up."],
      ["plane", "Airport", "/latest/b-stay-airport.webp", "From Mali Airport", "45 min", "Picked up at Mali Airport", "We meet every flight. No diving 24 hours before you fly out, so plan one dry day at the end of your trip."],
      ["utensils", "Meals", "/latest/b-stay-meals.webp", "Breakfast from", "6:30 am", "Early breakfast, big dinners", "Breakfast is ready before the first boat. Dinner is local food: grilled fish, rice and fresh fruit from the market."],
    ],
  },
  {
    kicker: "Kanaloa · Surface interval",
    tabs: [
      ["clock", "Interval", "https://airdivealor.com/files/large/209/1200/780", "Surface interval", "60 min+", "A full hour between dives", "Deeper dives need longer to off-gas. We keep at least an hour on deck between dives, often in a calm bay."],
      ["coffee", "Warm drinks", "/latest/b-boat-drinks.webp", "Water in August", "22–25°C", "Hot ginger tea after cold water", "Mid-year upwellings make the water cool. The crew has hot tea and coffee ready as soon as you climb the ladder."],
      ["utensils", "Lunch", "https://airdivealor.com/files/large/210/1200/780", "Served", "Between dives 2 and 3", "Lunch on deck, music after", "Fresh lunch is cooked on board. Someone usually has a guitar while you swap fish IDs and look out at Pantar."],
      ["camera", "Camera table", "https://airdivealor.com/files/large/268/500/350", "On board", "Rinse tank, charging", "A dry, shaded camera table", "Fresh-water rinse tank, charging points and space to change lenses between dives without rushing."],
    ],
  },
];
const WHY_LATEST: Record<number, string> = { 3: "/latest/b-why-3.webp" };

const cell = (v: boolean | string) => (v === true ? { en: "yes", id: "yes" } : v === false ? { en: "no", id: "no" } : L(v));

const defaults = {
  seo: {
    title: {
      en: "Air Dive Alor | Scuba Diving, Courses & Dive Resort in Alor, Indonesia",
      id: "Air Dive Alor | Selam, Kursus Selam & Dive Resort di Alor, Indonesia",
    },
    description: {
      en: "Dive Alor with Air Dive Alor in Alor Kecil: Pantar Strait walls, muck and pelagics, SDI and TDI courses, and a village stay with three meals a day. Diving March to November.",
      id: "Menyelam di Alor bersama Air Dive Alor di Alor Kecil: dinding karang Selat Pantar, muck dive dan ikan pelagis, kursus selam SDI dan TDI, serta menginap di desa dengan tiga kali makan sehari. Musim selam Maret sampai November.",
    },
    ogImage: M("https://airdivealor.com/files/large/206/1200/780"),
  },
  hero: {
    eyebrow: L("0 m · Surface"),
    title: { en: "Dive.\nExplore.\nBe Surprised.", id: [toId("Dive."), toId("Explore."), toId("Be Surprised.")].join("\n") },
    lead: L("Pantar Strait currents. Rhinopias to hammerheads. Diving in Alor, March to November."),
    primaryCta: L("Book your dive"),
    secondaryCta: L("See prices"),
    image: M("/latest/b-hero.webp"),
    video: M(""),
    caption: "Dinding Bama · 18 m",
  },
  awards: {
    items: [
      { icon: "badge-check", rating: 0, title: L("SDI dive center"), subtitle: L("") },
      { icon: "shield-check", rating: 0, title: L("TDI technical training"), subtitle: L("") },
      { icon: "rating", rating: 4.9, title: L("4.9 on Google"), subtitle: L("From 180+ reviews") },
      { icon: "users", rating: 0, title: L("2,000+ divers"), subtitle: L("") },
    ],
  },
  prices: {
    eyebrow: L("5 m · Prices"),
    title: L("Every price, side by side."),
    lead: L("Compare what each trip includes. Pick one and you're already on step two."),
    tableLabel: L("From, per person"),
    depositNote: L("Pay a 30% deposit to hold your dates."),
    usdRate: HOME.usdRate,
    usdNote: L("USD is indicative. You pay in IDR."),
    rows: HOME.matrixRows.map((r) => ({ label: L(r) })),
    packages: HOME.packages.map((p) => ({
      id: p.id,
      name: L(p.name),
      meta: L(p.meta),
      priceIdr: p.idr,
      unit: L(p.unit),
      tag: L(p.tag),
      highlight: p.id === "stay",
      cells: p.matrix.map((v) => ({ value: cell(v) })),
    })),
    chooseLabel: L("Choose"),
  },
  why: {
    eyebrow: L("10 m · Why Alor"),
    title: L("Four kinds of diving, one island."),
    items: HOME.why.map((w, i) => ({ label: L(w.label), text: L(w.text), photoTitle: L(w.title), photo: M(WHY_LATEST[i] ?? w.photo) })),
  },
  sites: {
    eyebrow: L("15 m · Dive sites"),
    title: L("Pick a site. See what lives there."),
    defaultIndex: 2,
    items: HOME.sites.map((s) => ({ slug: s.slug, photo: M(s.photo) })),
    guideLabel: L("Site guide"),
    seeLabel: L("You'll see"),
  },
  stay: {
    eyebrow: L("18 m · Safety stop"),
    title: L("Come up slowly. We've got the rest."),
    lead: L("Every dive ends with a safety stop and a long surface interval. Tap an icon to see what waits for you on land and on deck."),
    cards: REST.map((c) => ({
      kicker: L(c.kicker),
      tabs: c.tabs.map(([icon, label, photo, statLabel, stat, title, text]) => ({ icon, label: L(label), photo: M(photo), statLabel: L(statLabel), stat: L(stat), title: L(title), text: L(text) })),
    })),
  },
  reviews: {
    eyebrow: L("21 m · Reviews"),
    score: 4.9,
    scoreNote: L("From 180+ reviews on Google and TripAdvisor."),
    googleLabel: L("Google reviews"),
    googleUrl:
      "https://www.google.com.ng/travel/hotels/entity/ChkI1sa0ndHd695tGg0vZy8xMWNzcmx6dzExEAE/reviews?utm_campaign=sharing&utm_medium=link&utm_source=htls&ts=CAEaIAoCGgASGhIUCgcI6g8QChgdEgcI6g8QChgeGAEyAhAAKgQKABoA",
    tripadvisorLabel: L("TripAdvisor reviews"),
    tripadvisorUrl: "https://www.tripadvisor.com/Attraction_Review-g1600794-d12343022-Reviews-Air_Dive_Alor-Alor_Island_East_Nusa_Tenggara.html",
    items: HOME.reviews.map((r) => ({ quote: L(r.quote), name: r.name, place: L(r.country), date: L(r.date), source: r.source })),
  },
  faq: {
    eyebrow: L("27 m · FAQ"),
    title: L("Before you ask."),
    items: HOME.faqs.map((f) => ({ q: L(f.q), a: L(f.a) })),
    help: { title: L("Something else?"), text: L("Message the dive shop. We usually reply within the hour, 7am to 9pm WITA."), button: L("Chat on WhatsApp") },
  },
  book: {
    eyebrow: L("30 m · Book"),
    title: L("Book your Alor dive."),
    lead: L("Three short steps. We confirm within 24 hours, then you pay a 30% deposit online."),
    quote: { rating: 5, text: L("“Safety is their top priority, hospitality is in their heart.”"), cite: { en: "Dwi L · TripAdvisor · Oct 2022", id: "Dwi L · TripAdvisor · " + toId("Oct 2022") } },
    depositPercent: 30,
    depositNote: L("You pay the deposit only after we confirm your dates."),
    cancellation: L("Free cancellation up to 30 days before arrival."),
    successTitle: L("Enquiry sent"),
    successText: L("We reply by email or WhatsApp within 24 hours with your quote and a deposit link."),
  },
};

const out = `// Home page content as CMS section values (EN + ID). Generated by scripts/gen-home-defaults.ts from the
// original design build. Used to seed the CMS and as the fallback when the CMS API is unreachable.
import type { HomeContent } from "./home-types";

export const HOME_DEFAULTS: HomeContent = ${JSON.stringify(defaults, null, 1)};
`;
writeFileSync("lib/cms/home-defaults.ts", out);
console.log("ok", Object.keys(defaults).join(", "));
