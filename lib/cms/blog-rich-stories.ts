/**
 * Stories written with the CMS rich text editor, hand-written here (not generated from the prototypes).
 * scripts/gen-blog-defaults.ts puts them in front of the prototype stories; the seed adds them to an
 * existing database as drafts, so an editor can check them before they go live.
 */
import type { PostContent } from "./blog-cms-types";

const PACKING_EN = `<p>Alor is remote, and that is a big part of why the diving is so good. It also means the shops are small and dive gear is hard to buy on the island. Here is what we suggest you bring, from the people who dive these sites every day.</p>
<h2>In the water</h2>
<p>The water in Alor is mostly 25 to 29°C, but cold upwellings in the Pantar Strait can bring it down to about 22°C on some sites, especially from July to September.</p>
<ul>
<li><strong>A 3 mm or 5 mm wetsuit.</strong> If you get cold easily, bring the 5 mm or add a hood or vest.</li>
<li><strong>A surface marker buoy (SMB)</strong> and a whistle. Some of our best sites are drift dives, and we want every diver to be easy to see at the surface.</li>
<li><strong>A dive computer</strong>, or rent one from us.</li>
<li><strong>Your mask</strong>, if you have one that fits you well. Everything else we can rent you: full gear rental is available at the dive center.</li>
</ul>
<p><img src="/latest/b-stay-shop.webp" alt="The Air Dive Alor dive shop in Alor Kecil, where you can rent full dive gear"></p>
<h2>On the boat and in the village</h2>
<ul>
<li><strong>Reef-safe sunscreen</strong>, a hat and sunglasses. The sun is strong between dives.</li>
<li><strong>A light jacket</strong> for the boat ride back after the last dive.</li>
<li><strong>Clothes for the village.</strong> Alor Kecil is a small, traditional village: cover your shoulders and knees when you walk around.</li>
<li><strong>Some cash in rupiah</strong> for small shops in the village. The nearest ATMs are in Kalabahi.</li>
</ul>
<h2>For your camera</h2>
<p>Our boat Kanaloa and the resort both have a camera table with charging points. Indonesia uses European-style plugs (type C and F, 230 V), so bring an adapter if you need one, and spare O-rings for your housing.</p>
<blockquote>Not sure about a piece of gear? Ask us before you pack. We would rather answer a message than have you carry something you won't use.</blockquote>
<h2>Before you fly</h2>
<p>The small planes to Alor allow less checked baggage than international flights, so weigh your bag and buy extra kilos with your ticket if you bring your own gear. Read <a href="/faq/how-to-get-to-alor">how to get to Alor</a> for the whole route.</p>`;

const PACKING_ID = `<p>Alor jauh dari mana-mana, dan justru itu yang membuat penyelamannya begitu bagus. Artinya juga, toko di sini kecil dan alat selam sulit dibeli di pulau ini. Ini barang yang kami sarankan untuk dibawa, dari kami yang menyelam di titik-titik ini setiap hari.</p>
<h2>Di dalam air</h2>
<p>Suhu air di Alor umumnya 25 sampai 29°C, tetapi arus dingin dari dalam (upwelling) di Selat Pantar bisa menurunkannya sampai sekitar 22°C di beberapa titik, terutama Juli sampai September.</p>
<ul>
<li><strong>Wetsuit 3 mm atau 5 mm.</strong> Kalau Anda mudah kedinginan, bawa yang 5 mm atau tambahkan hood atau rompi.</li>
<li><strong>Surface marker buoy (SMB)</strong> dan peluit. Beberapa titik terbaik kami adalah drift dive, dan kami ingin setiap penyelam mudah terlihat di permukaan.</li>
<li><strong>Dive computer</strong>, atau sewa dari kami.</li>
<li><strong>Masker Anda sendiri</strong>, kalau punya yang pas. Selebihnya bisa disewa: sewa alat lengkap tersedia di dive center.</li>
</ul>
<p><img src="/latest/b-stay-shop.webp" alt="Dive shop Air Dive Alor di Alor Kecil, tempat Anda bisa menyewa alat selam lengkap"></p>
<h2>Di perahu dan di desa</h2>
<ul>
<li><strong>Sunscreen yang aman untuk karang</strong>, topi, dan kacamata hitam. Matahari terik di antara penyelaman.</li>
<li><strong>Jaket tipis</strong> untuk perjalanan pulang dengan perahu setelah penyelaman terakhir.</li>
<li><strong>Pakaian yang sopan untuk di desa.</strong> Alor Kecil adalah desa kecil yang masih tradisional: tutupi bahu dan lutut saat berjalan-jalan.</li>
<li><strong>Uang tunai rupiah</strong> untuk warung di desa. ATM terdekat ada di Kalabahi.</li>
</ul>
<h2>Untuk kamera Anda</h2>
<p>Kapal Kanaloa dan resor kami punya meja kamera dengan colokan listrik. Indonesia memakai colokan tipe C dan F (230 V), jadi bawa adaptor kalau perlu, dan O-ring cadangan untuk housing Anda.</p>
<blockquote>Ragu soal satu alat? Tanyakan kepada kami sebelum berkemas. Kami lebih senang menjawab pesan daripada Anda membawa barang yang tidak terpakai.</blockquote>
<h2>Sebelum terbang</h2>
<p>Pesawat kecil ke Alor punya batas bagasi lebih kecil daripada penerbangan internasional, jadi timbang tas Anda dan beli tambahan bagasi bersama tiket kalau membawa alat sendiri. Baca <a href="/faq/how-to-get-to-alor">cara ke Alor</a> untuk rute lengkapnya.</p>`;

export const RICH_STORIES: PostContent[] = [
  {
    slug: "what-to-pack-for-diving-in-alor",
    slugId: "apa-yang-dibawa-untuk-menyelam-di-alor",
    title: { en: "What to pack for diving in Alor", id: "Apa yang dibawa untuk menyelam di Alor" },
    excerpt: {
      en: "Wetsuit thickness, a surface marker buoy, reef-safe sunscreen and village clothes: our packing list for a dive trip to Alor.",
      id: "Ketebalan wetsuit, surface marker buoy, sunscreen yang aman untuk karang, dan pakaian untuk di desa: daftar bawaan kami untuk liburan selam ke Alor.",
    },
    date: "2026-11-09",
    category: "diving",
    author: { en: "Air Dive Alor team", id: "Tim Air Dive Alor" },
    initials: "AD",
    cover: { mediaId: null, url: "/latest/b-boat-drinks.webp" },
    body: [{ type: "rich", text: { en: PACKING_EN, id: PACKING_ID } }],
    source: "",
  },
];
