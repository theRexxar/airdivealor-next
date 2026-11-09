/**
 * Built-in FAQ content: what the seed starts with and what the website shows if the CMS is unreachable.
 * Hand-written (not generated). The full answers are HTML as the CMS rich text editor writes it.
 */
import type { FaqContent, FaqPageContent } from "./faq-types";

export const FAQ_PAGE_DEFAULTS: FaqPageContent = {
  seo: {
    title: { en: "FAQ: diving and travel in Alor | Air Dive Alor", id: "Tanya jawab: menyelam dan perjalanan ke Alor | Air Dive Alor" },
    description: {
      en: "How to get to Alor, the diving season, currents, gear rental, booking and payment: answers to the questions divers ask Air Dive Alor most.",
      id: "Cara ke Alor, musim selam, arus, sewa alat, pemesanan dan pembayaran: jawaban atas pertanyaan yang paling sering ditanyakan penyelam kepada Air Dive Alor.",
    },
    ogImage: { mediaId: null, url: "/latest/b-stay-airport.webp" },
  },
  detail: {
    backLabel: { en: "All questions", id: "Semua pertanyaan" },
    updatedLabel: { en: "Updated", id: "Diperbarui" },
    ctaTitle: { en: "Still have a question?", id: "Masih ada pertanyaan?" },
    ctaText: { en: "Message the dive shop. We usually reply within the hour, 7am to 9pm WITA.", id: "Chat dive shop kami. Biasanya kami balas dalam satu jam, pukul 07.00 sampai 21.00 WITA." },
    ctaLabel: { en: "Chat on WhatsApp", id: "Chat di WhatsApp" },
    ctaMessage: "Hi Air Dive Alor, I have a question about: {question}",
    moreTitle: { en: "More questions", id: "Pertanyaan lain" },
  },
  hero: {
    eyebrow: { en: "FAQ", id: "Tanya jawab" },
    title: { en: "Questions before you come.", id: "Pertanyaan sebelum Anda datang." },
    lead: {
      en: "Getting to Alor, the season, the currents and how booking works. Some answers have a full page with maps, photos and tips.",
      id: "Cara ke Alor, musim selam, arus, dan cara pemesanan. Beberapa jawaban punya halaman lengkap dengan foto dan tips.",
    },
  },
  list: {
    readLabel: { en: "Read the full answer", id: "Baca jawaban lengkap" },
    emptyText: { en: "No questions here yet. Ask us on WhatsApp.", id: "Belum ada pertanyaan. Tanyakan kepada kami lewat WhatsApp." },
  },
  cta: {
    title: { en: "Something else?", id: "Ada pertanyaan lain?" },
    text: { en: "Message the dive shop. We usually reply within the hour, 7am to 9pm WITA.", id: "Chat dive shop kami. Biasanya kami balas dalam satu jam, pukul 07.00 sampai 21.00 WITA." },
    button: { en: "Chat on WhatsApp", id: "Chat di WhatsApp" },
    message: "Hi Air Dive Alor, I have a question.",
  },
};

const none = { mediaId: null, url: "" };
const empty = { en: "", id: "" };

const HOW_TO_GET_EN = `<p>Alor is an island in East Nusa Tenggara, in the far east of Indonesia, between Flores and Timor. There is no direct international flight: you fly into Indonesia first, then take a domestic flight to Kupang, and from there a short flight to Alor. It takes most guests one or two days. Here is how.</p>
<h2>1. Fly to Bali or Jakarta</h2>
<p>Most international guests arrive in <strong>Bali (Denpasar, DPS)</strong> or <strong>Jakarta (CGK)</strong>. Check the visa rules for your passport before you travel; many nationalities can get a visa on arrival or an e-visa online.</p>
<h2>2. Fly to Kupang</h2>
<p><strong>Kupang (El Tari Airport, KOE)</strong> on Timor is the gateway to Alor. Several airlines fly there every day from Bali, Jakarta and Surabaya. From Bali the flight takes about two hours.</p>
<h2>3. Fly from Kupang to Alor</h2>
<p>From Kupang, a short flight on a small propeller plane takes you to <strong>Mali Airport (ARD)</strong> near Kalabahi, the main town of Alor. There are also flights to Alor from Maumere on Flores on some days.</p>
<p><img src="/latest/b-stay-airport.webp" alt="Mali Airport in Alor from the air, with a small propeller plane on the apron"></p>
<h2>4. We pick you up</h2>
<p>Send us your flight number and we meet you at Mali Airport. The drive to our dive center in Alor Kecil takes about 45 minutes. <a href="/facilities-and-rates">Airport transfers are included in our dive packages.</a></p>
<h2>By sea</h2>
<p>Ferries run between Kupang and Kalabahi a few times a week. The crossing takes most of a day or a night. It is cheap and an adventure, but schedules change often, so ask us for the current one before you plan around it.</p>
<h2>Tips for a smooth trip</h2>
<ul>
<li><strong>Plan a buffer day.</strong> Flight times in eastern Indonesia change at short notice. Many guests spend a night in Kupang or Bali on the way, and we don't plan your first dive for the day you land.</li>
<li><strong>Check your baggage allowance.</strong> The small planes to Alor allow less checked baggage than international flights. If you bring your own dive gear, buy extra kilos with your ticket.</li>
<li><strong>Book the Alor flight separately if needed.</strong> Not every booking site sells the Kupang to Alor flight. Tell us if you can't find it and we help.</li>
<li><strong>Don't fly within 24 hours after your last dive.</strong> Plan your last dive day with your flight home in mind; we help you pick the dates.</li>
</ul>
<blockquote>Tell us your arrival date and we plan the rest: the pick-up, your room and the first dive.</blockquote>
<p>Questions about your route? <a href="https://api.whatsapp.com/send/?phone=6281395505313&amp;text=Hi%20Air%20Dive%20Alor%2C%20I%20need%20help%20planning%20my%20trip%20to%20Alor.">Message us on WhatsApp</a> and we help you plan it.</p>`;

const HOW_TO_GET_ID = `<p>Alor adalah pulau di Nusa Tenggara Timur, di ujung timur Indonesia, di antara Flores dan Timor. Tidak ada penerbangan internasional langsung: Anda masuk ke Indonesia dulu, lalu terbang ke Kupang, dan dari sana lanjut penerbangan singkat ke Alor. Bagi kebanyakan tamu, perjalanannya satu sampai dua hari. Begini caranya.</p>
<h2>1. Terbang ke Bali atau Jakarta</h2>
<p>Kebanyakan tamu dari luar negeri tiba di <strong>Bali (Denpasar, DPS)</strong> atau <strong>Jakarta (CGK)</strong>. Dari kota lain di Indonesia, Anda bisa langsung terbang ke Kupang.</p>
<h2>2. Terbang ke Kupang</h2>
<p><strong>Kupang (Bandara El Tari, KOE)</strong> di Pulau Timor adalah pintu masuk ke Alor. Beberapa maskapai terbang ke sana setiap hari dari Bali, Jakarta, dan Surabaya. Dari Bali, penerbangannya sekitar dua jam.</p>
<h2>3. Terbang dari Kupang ke Alor</h2>
<p>Dari Kupang, penerbangan singkat dengan pesawat baling-baling kecil membawa Anda ke <strong>Bandara Mali (ARD)</strong> dekat Kalabahi, kota utama di Alor. Pada hari tertentu ada juga penerbangan ke Alor dari Maumere di Flores.</p>
<p><img src="/latest/b-stay-airport.webp" alt="Bandara Mali di Alor dari udara, dengan pesawat baling-baling kecil di apron"></p>
<h2>4. Kami jemput Anda</h2>
<p>Kirim nomor penerbangan Anda dan kami jemput di Bandara Mali. Perjalanan ke dive center kami di Alor Kecil sekitar 45 menit. <a href="/facilities-and-rates">Antar-jemput bandara sudah termasuk dalam paket selam kami.</a></p>
<h2>Lewat laut</h2>
<p>Kapal feri berlayar antara Kupang dan Kalabahi beberapa kali seminggu. Perjalanannya hampir seharian atau semalaman. Murah dan seru, tapi jadwalnya sering berubah, jadi tanyakan jadwal terbaru kepada kami sebelum Anda membuat rencana.</p>
<h2>Tips supaya perjalanan lancar</h2>
<ul>
<li><strong>Siapkan satu hari cadangan.</strong> Jadwal penerbangan di Indonesia timur bisa berubah mendadak. Banyak tamu menginap semalam di Kupang atau Bali, dan kami tidak menjadwalkan penyelaman pertama di hari Anda tiba.</li>
<li><strong>Cek batas bagasi.</strong> Pesawat kecil ke Alor punya batas bagasi lebih kecil daripada penerbangan internasional. Kalau membawa alat selam sendiri, beli tambahan bagasi bersama tiket Anda.</li>
<li><strong>Pesan penerbangan ke Alor terpisah kalau perlu.</strong> Tidak semua situs pemesanan menjual penerbangan Kupang ke Alor. Kabari kami kalau Anda tidak menemukannya, kami bantu.</li>
<li><strong>Jangan terbang dalam 24 jam setelah penyelaman terakhir.</strong> Atur hari selam terakhir sesuai jadwal pulang Anda; kami bantu memilih tanggalnya.</li>
</ul>
<blockquote>Beri tahu kami tanggal kedatangan Anda, dan kami siapkan sisanya: penjemputan, kamar, dan penyelaman pertama.</blockquote>
<p>Ada pertanyaan soal rute? <a href="https://api.whatsapp.com/send/?phone=6281395505313&amp;text=Hi%20Air%20Dive%20Alor%2C%20I%20need%20help%20planning%20my%20trip%20to%20Alor.">Chat kami di WhatsApp</a> dan kami bantu merencanakannya.</p>`;

export const FAQS_DEFAULTS: FaqContent[] = [
  {
    slug: "how-to-get-to-alor",
    slugId: "cara-ke-alor",
    question: { en: "How do I get to Alor?", id: "Bagaimana cara ke Alor?" },
    answer: {
      en: "Fly to Kupang, then take a short flight to Mali Airport in Alor. We meet you there; the drive to Alor Kecil takes about 45 minutes.",
      id: "Terbang ke Kupang, lalu lanjut penerbangan singkat ke Bandara Mali di Alor. Kami jemput di sana; perjalanan ke Alor Kecil sekitar 45 menit.",
    },
    category: "travel",
    cover: none,
    body: { en: HOW_TO_GET_EN, id: HOW_TO_GET_ID },
  },
  {
    slug: "diving-season",
    slugId: "musim-selam",
    question: { en: "When is the diving season?", id: "Kapan musim selamnya?" },
    answer: {
      en: "March to November. July to September brings cooler water and the best chance of pelagics; March to May and October are calmer and warmer.",
      id: "Maret sampai November. Juli sampai September airnya lebih dingin dan peluang ikan pelagis paling besar; Maret sampai Mei dan Oktober lebih tenang dan hangat.",
    },
    category: "diving",
    cover: none,
    body: empty,
  },
  {
    slug: "currents",
    slugId: "arus",
    question: { en: "Are the currents too strong for me?", id: "Apakah arusnya terlalu kuat untuk saya?" },
    answer: {
      en: "Not if we match the site to you. Many sites are calm and shallow. We only take divers to drift sites like Kal's Dream once we have seen them dive.",
      id: "Tidak, karena kami pilihkan titik yang sesuai. Banyak titik yang tenang dan dangkal. Kami baru membawa penyelam ke titik drift seperti Kal's Dream setelah melihat cara mereka menyelam.",
    },
    category: "diving",
    cover: none,
    body: empty,
  },
  {
    slug: "gear-and-cameras",
    slugId: "alat-dan-kamera",
    question: { en: "Can I rent gear and charge camera batteries?", id: "Bisakah saya sewa alat dan mengisi baterai kamera?" },
    answer: {
      en: "Yes. Full gear rental is available, and Kanaloa and the resort both have a camera table with charging points.",
      id: "Bisa. Sewa alat lengkap tersedia, dan kapal Kanaloa serta resor punya meja kamera dengan colokan listrik.",
    },
    category: "stay",
    cover: none,
    body: empty,
  },
  {
    slug: "booking-and-payment",
    slugId: "pemesanan-dan-pembayaran",
    question: { en: "How do I book and pay?", id: "Bagaimana cara pesan dan bayar?" },
    answer: {
      en: "Send an enquiry or message us on WhatsApp. We confirm your dates, then you pay a deposit online to hold your place.",
      id: "Kirim permintaan atau chat kami di WhatsApp. Kami konfirmasi tanggal Anda, lalu Anda bayar DP online untuk mengunci tempat.",
    },
    category: "booking",
    cover: none,
    body: empty,
  },
];
