"use client";

import { EXACT, FRAG } from "./i18n-dict";
import { FACILITIES_ID } from "./page-dicts";
import { SITES_ID, SITES_PAGE_ID } from "./sites-data";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { itemPath, localizeHref, type Alternates, type Locale, type PageCollection } from "./i18n-routes";

export type Lang = "EN" | "ID";

/** EN → ID strings added on top of the design dictionary (lib/i18n-dict.ts), from the page prototypes. */
const EXTRA: Record<string, string> = {
  // Header and footer
  Home: "Beranda",
  "Dive sites": "Titik selam",
  Pricing: "Harga",
  "Facilities and rates": "Fasilitas dan tarif",
  "Dive courses": "Kursus selam",
  "About us": "Tentang kami",
  Book: "Pesan",
  Explore: "Jelajahi",
  "Plan your trip": "Rencanakan perjalanan",
  "Follow us": "Ikuti kami",
  Prices: "Harga",
  FAQ: "Tanya jawab",
  "Safety policy": "Kebijakan keselamatan",
  "Cancellation policy": "Kebijakan pembatalan",
  Privacy: "Privasi",
  "Air DiveX, our sister brand": "Air DiveX, merek saudara kami",
  "© 2026 Air Dive Alor Team": "© 2026 Tim Air Dive Alor",
  "Alor Kecil, Alor Barat Laut, Alor Regency, East Nusa Tenggara, Indonesia":
    "Alor Kecil, Alor Barat Laut, Kabupaten Alor, Nusa Tenggara Timur, Indonesia",
  // Booking form
  diver: "penyelam",
  divers: "penyelam",
  Email: "Email",
  "We send a copy of your enquiry here.": "Kami kirim salinan permintaan Anda ke sini.",
  "WhatsApp or phone": "WhatsApp atau telepon",
  "(optional)": "(opsional)",
  "With country code.": "Dengan kode negara.",
  Message: "Pesan",
  "Anything else we should know? Flexible dates, dive experience, special requests…": "Ada yang perlu kami tahu? Tanggal yang fleksibel, pengalaman menyelam, permintaan khusus…",
  Contact: "Kontak",
  "Sending…": "Mengirim…",
  "We sent a copy to {email}.": "Kami sudah kirim salinannya ke {email}.",
  "Your enquiry number is #{ref}.": "Nomor permintaan Anda #{ref}.",
  "We couldn't email you a copy, but your enquiry reached us.": "Salinan belum bisa kami kirim ke email Anda, tetapi permintaan Anda sudah kami terima.",
  "Choose your arrival date.": "Pilih tanggal tiba Anda.",
  "The arrival date can't be in the past.": "Tanggal tiba tidak boleh sebelum hari ini.",
  "Enter at least 1 diver.": "Isi minimal 1 penyelam.",
  "For more than 50 divers, message us on WhatsApp.": "Untuk lebih dari 50 penyelam, chat kami di WhatsApp.",
  "Enter your name.": "Isi nama Anda.",
  "Enter your email address.": "Isi alamat email Anda.",
  "Enter a valid email address, e.g. you@email.com.": "Isi alamat email yang benar, misalnya anda@email.com.",
  "Enter a phone number with country code, e.g. +62 812 3456 7890.": "Isi nomor telepon dengan kode negara, misalnya +62 812 3456 7890.",
  "Keep the message under 2000 characters.": "Tulis pesan kurang dari 2000 karakter.",
  "Please check the date and your details.": "Periksa lagi tanggal dan data Anda.",
  "Too many enquiries from this connection. Please wait a few minutes, or message us on WhatsApp.": "Terlalu banyak permintaan dari koneksi ini. Tunggu beberapa menit, atau chat kami di WhatsApp.",
  "We couldn't send your enquiry right now. Please message us on WhatsApp instead, or try again in a few minutes.": "Permintaan Anda belum bisa terkirim. Silakan chat kami di WhatsApp, atau coba lagi beberapa menit lagi.",
  "We couldn't send your enquiry. Check your connection and try again, or message us on WhatsApp.": "Permintaan Anda gagal terkirim. Periksa koneksi lalu coba lagi, atau chat kami di WhatsApp.",
  // Blog list
  "Read story": "Baca cerita",
  // FAQ
  "Read the full answer": "Baca jawaban lengkap",
  "All questions": "Semua pertanyaan",
  "Plan your dive": "Rencanakan penyelaman",
  All: "Semua",
  "Blog · Latest story": "Blog · Cerita terbaru",
  "Read the story": "Baca ceritanya",
  Stories: "Cerita",
  "Stories from Alor Kecil.": "Cerita dari Alor Kecil.",
  "News from the dive center, the reef and the village, written by our team.":
    "Kabar dari dive center, terumbu karang, dan desa, ditulis oleh tim kami.",
  "Follow our dives.": "Ikuti penyelaman kami.",
  "More photos and videos from Alor, from our team and our guests.":
    "Lebih banyak foto dan video dari Alor, dari tim dan tamu kami.",
  "Follow on Instagram": "Ikuti di Instagram",
  Previous: "Sebelumnya",
  Next: "Berikutnya",
  Pagination: "Halaman",
  // Story page
  "Share on WhatsApp": "Bagikan lewat WhatsApp",
  "Copy link": "Salin tautan",
  "Link copied": "Tautan disalin",
  "Share this story": "Bagikan cerita ini",
  "Older story": "Cerita sebelumnya",
  "Newer story": "Cerita berikutnya",
  "More stories": "Cerita lainnya",
  "See all stories": "Lihat semua cerita",
  "Want to see it for yourself?": "Ingin melihatnya sendiri?",
  "Tell us your dates. We will plan the dives and the stay.":
    "Beri tahu kami tanggal Anda. Kami akan atur penyelaman dan tempat menginap.",
  "We are still moving this story from our old blog.": "Cerita ini masih kami pindahkan dari blog lama kami.",
  "Read the full story on airdivealor.com": "Baca cerita lengkap di airdivealor.com",
  Breadcrumb: "Navigasi",
  // Dive courses (UI labels the prototype left in English)
  "Dive courses · SDI and TDI": "Kursus selam · SDI dan TDI",
  "From your first breath underwater to Divemaster. Every package includes your stay, three meals a day, gear and airport transfers. Ask us about group rates with a private boat.":
    "Dari napas pertama Anda di bawah air sampai Divemaster. Setiap paket sudah termasuk menginap, tiga kali makan sehari, alat selam, dan antar-jemput bandara. Tanyakan tarif grup dengan perahu pribadi.",
  "Course level": "Level kursus",
  "What's included": "Yang sudah termasuk",
  "Book now": "Pesan sekarang",
  "Contact us for a special group rate and dive with your own private boat. We reply within the hour, 7am to 9pm WITA.":
    "Hubungi kami untuk tarif grup khusus dan menyelam dengan perahu pribadi Anda. Kami membalas dalam satu jam, pukul 07.00 sampai 21.00 WITA.",
  "Previous course": "Kursus sebelumnya",
  "Next course": "Kursus berikutnya",
  Course: "Kursus",
  "The package price covers your training, stay, food and transfers. You only need to get to Alor.":
    "Harga paket sudah mencakup pelatihan, menginap, makan, dan antar-jemput. Anda hanya perlu datang ke Alor.",
  "Course plan": "Rencana kursus",
  "Instructor tips": "Tips dari instruktur",
  "Requirements follow SDI and TDI standards. Your instructor confirms your plan before the course starts.":
    "Persyaratan mengikuti standar SDI dan TDI. Instruktur Anda akan memastikan rencana Anda sebelum kursus dimulai.",
  "Send us your dates on WhatsApp. We reply within the hour, 7am to 9pm WITA.":
    "Kirim tanggal Anda lewat WhatsApp. Kami membalas dalam satu jam, pukul 07.00 sampai 21.00 WITA.",
  Duration: "Durasi",
  Dives: "Penyelaman",
  "Max depth": "Kedalaman maks.",
  "Minimum age": "Usia minimum",
  Prerequisite: "Syarat awal",
  Medical: "Medis",
  "Fill in the diver medical form. Some answers need a doctor's sign-off before you dive.":
    "Isi formulir medis penyelam. Beberapa jawaban perlu tanda tangan dokter sebelum Anda menyelam.",
  Insurance: "Asuransi",
  "Dive insurance is required for every course.": "Asuransi selam wajib untuk setiap kursus.",
  "Flying after": "Terbang setelahnya",
  "No diving 24 hours before your flight out.": "Tidak menyelam 24 jam sebelum penerbangan pulang.",
  // Home awards card (added after the prototype's dictionary)
  "4.9 on Google": "4,9 di Google",
  "From 180+ reviews": "Dari 180+ ulasan",
  "2,000+ divers": "2.000+ penyelam",
  Deposit: "Uang muka",
  Photo: "Foto",
};

const ID: Record<string, string> = { ...EXACT, ...SITES_ID, ...SITES_PAGE_ID, ...FACILITIES_ID, ...EXTRA };
const FRAG_RE = FRAG.map(([en, id]) => [new RegExp("\\b" + en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), id] as const);

/** Translate to Indonesian: exact match first, then word-level fragments (same rules as the prototypes). */
export function toId(en: string): string {
  const hit = ID[en];
  if (hit != null) return hit;
  let out = en;
  for (const [re, id] of FRAG_RE) out = out.replace(re, id);
  return out;
}

interface LangCtx {
  /** "EN" or "ID": the language of the current URL (/en/... or /id/...). */
  lang: Lang;
  /** "en" or "id", as in URLs. */
  locale: Locale;
  /** Translate a fixed UI string. */
  t: (en: string) => string;
  /** Pick between an English and an Indonesian value. */
  pick: <T>(en: T, id: T | undefined) => T;
}

const Ctx = createContext<LangCtx | null>(null);

/** The language comes from the URL (app/[lang]); switching language means going to the other URL. */
export function LangProvider({ lang: locale, children }: { lang: Locale; children: ReactNode }) {
  const lang: Lang = locale === "id" ? "ID" : "EN";
  const t = useCallback((en: string) => (lang === "ID" ? toId(en) : en), [lang]);
  const pick = useCallback(<T,>(en: T, id: T | undefined) => (lang === "ID" && id != null ? id : en), [lang]);
  const value = useMemo(() => ({ lang, locale, t, pick }), [lang, locale, t, pick]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used inside <LangProvider>");
  return v;
}

/** The same page in each language, set by each page for the language switch. */
const AltCtx = createContext<Alternates | null>(null);
export function AlternatesProvider({ value, children }: { value: Alternates; children: ReactNode }) {
  return <AltCtx.Provider value={value}>{children}</AltCtx.Provider>;
}
export const useAlternates = () => useContext(AltCtx);

/** The current URL language, or English outside a LangProvider. */
export function useLocale(): Locale {
  return useContext(Ctx)?.locale ?? "en";
}

/** Link to an item page (dive site, course, story) in the current language, with its slug in that language. */
export function useItemHref() {
  const locale = useLocale();
  return useCallback((collection: PageCollection, item: { slug: string; slugId?: string }) => itemPath(locale, collection, item), [locale]);
}

/** Put a site link into the current language (see localizeHref). */
export function useLocalize() {
  const locale = useLocale();
  return useCallback((href: string) => localizeHref(href, locale), [locale]);
}
