/**
 * CMS email templates (invitation, password reset, password changed, test). Each email has English and
 * Indonesian text, an HTML version that works in common mail apps (tables, inline styles) and a plain-text
 * version. Templates are pure functions of their data, so the CMS can preview them.
 */

export interface Email {
  subject: string;
  html: string;
  text: string;
}

interface Lang {
  title: string;
  paragraphs: string[];
  button?: string;
  /** A table of details after the paragraphs (label, value). Values are shown as written, line breaks kept. */
  rows?: [string, string][];
  /** Text after the table. */
  after?: string[];
}

interface Layout {
  siteUrl: string;
  /** Short summary shown by mail apps next to the subject. */
  preheader: string;
  en: Lang;
  id: Lang;
  url?: string;
  /** Small print at the bottom, in both languages. */
  note: { en: string; id: string };
  /** Only this language (e.g. a customer's copy in the language they used on the website). */
  only?: "en" | "id";
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Escape, then allow **bold** in template text. */
const rich = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");

const C = { ink: "#202020", body: "#49494a", muted: "#89898a", line: "#e9e9eb", bg: "#f4f5f7", blue: "#2c71f6", dark: "#202020" };

function button(url: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="border-radius:6px;background:${C.blue}">
<a href="${esc(url)}" style="display:inline-block;padding:13px 22px;font:600 15px/1 Roboto,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:6px">${esc(label)}</a>
</td></tr></table>`;
}

/** Label and value rows (e.g. a booking summary). Values are escaped, line breaks kept. */
function rowsTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;border-top:1px solid ${C.line}">
${rows
  .map(
    ([k, v]) => `<tr><td valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.line};font:400 14px/1.5 Roboto,Arial,sans-serif;color:${C.muted};white-space:nowrap">${esc(k)}</td>
<td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font:500 14px/1.5 Roboto,Arial,sans-serif;color:${C.ink};white-space:pre-wrap;word-break:break-word">${esc(v)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

function block(l: Lang, url: string | undefined, lang: "en" | "id") {
  return `<h1 style="margin:0 0 16px;font:600 22px/1.3 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(l.title)}</h1>
${l.paragraphs.map((p) => `<p style="margin:0 0 14px;font:400 15px/1.6 Roboto,Arial,sans-serif;color:${C.body}">${rich(p)}</p>`).join("\n")}
${l.rows?.length ? rowsTable(l.rows) : ""}
${(l.after ?? []).map((p) => `<p style="margin:0 0 14px;font:400 15px/1.6 Roboto,Arial,sans-serif;color:${C.body}">${rich(p)}</p>`).join("\n")}
${url && l.button ? button(url, l.button) : ""}
${url && l.button ? `<p style="margin:8px 0 0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${lang === "en" ? "Or copy this link into your browser:" : "Atau salin link ini ke browser Anda:"}<br><a href="${esc(url)}" style="color:${C.blue};word-break:break-all">${esc(url)}</a></p>` : ""}`;
}

/** The shared layout: logo bar, English, Indonesian, footer. */
function layout(o: Layout): { html: string; text: string } {
  const site = o.siteUrl.replace(/\/$/, "");
  const html = `<!doctype html>
<html lang="${o.only ?? "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o[o.only ?? "en"].title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${C.line};border-radius:10px;overflow:hidden">
<tr><td style="background:${C.dark};padding:20px 28px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px"><img src="${esc(site)}/brand/logo-mark-white.png" alt="Air Dive Alor" width="48" height="30" style="display:block;width:48px;height:30px;border:0"></td>
<td style="font:600 18px/1 Georgia,'Times New Roman',serif;color:#ffffff;white-space:nowrap">Air Dive Alor</td>
</tr></table>
</td></tr>
${
  o.only
    ? `<tr><td style="padding:32px 28px 8px">${block(o[o.only], o.url, o.only)}</td></tr>
<tr><td style="padding:16px 28px 28px"><p style="margin:0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${rich(o.note[o.only])}</p></td></tr>`
    : `<tr><td style="padding:32px 28px 8px">${block(o.en, o.url, "en")}</td></tr>
<tr><td style="padding:16px 28px 0"><div style="border-top:1px solid ${C.line};padding-top:20px;font:600 11px/1 Roboto,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">Bahasa Indonesia</div></td></tr>
<tr><td style="padding:16px 28px 8px">${block(o.id, o.url, "id")}</td></tr>
<tr><td style="padding:24px 28px 28px">
<p style="margin:0 0 6px;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${rich(o.note.en)}</p>
<p style="margin:0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${rich(o.note.id)}</p>
</td></tr>`
}
</table>
<p style="margin:16px 0 0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">Air Dive Alor · Alor Kecil, Nusa Tenggara Timur, Indonesia<br><a href="${esc(site)}" style="color:${C.muted}">${esc(site.replace(/^https?:\/\//, ""))}</a></p>
</td></tr></table>
</body></html>`;

  const section = (l: Lang) => [
    l.title,
    "",
    ...l.paragraphs.map(plain).flatMap((p) => [p, ""]),
    ...(l.rows?.length ? [...l.rows.map(([k, v]) => `${k}: ${v.includes("\n") ? `\n${v}` : v}`), ""] : []),
    ...(l.after ?? []).map(plain).flatMap((p) => [p, ""]),
    ...(o.url && l.button ? [`${l.button}: ${o.url}`, ""] : []),
  ];
  const text = o.only
    ? [...section(o[o.only]), "—", plain(o.note[o.only]), "", `Air Dive Alor · ${site}`].join("\n")
    : [...section(o.en), "—", "", ...section(o.id), "—", plain(o.note.en), plain(o.note.id), "", `Air Dive Alor · ${site}`].join("\n");
  return { html, text };
}

/** "7 Nov 2026, 14:05 WITA" (Alor's time zone). */
export function witaTime(d: Date, lang: "en" | "id" = "en") {
  const s = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Makassar", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${s} WITA`;
}

const list = (xs: string[], and: string) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and} ${xs[xs.length - 1]}`);

/** An administrator invited someone to the CMS. */
export function inviteEmail(d: { siteUrl: string; name: string; inviter: string; roles: string[]; url: string; days: number }): Email {
  const rolesEn = d.roles.length ? ` as **${list(d.roles, "and")}**` : "";
  const rolesId = d.roles.length ? ` sebagai **${list(d.roles, "dan")}**` : "";
  return {
    subject: `${d.inviter} invited you to the Air Dive Alor CMS`,
    ...layout({
      siteUrl: d.siteUrl,
      preheader: `Set your password to start editing the Air Dive Alor website. The link expires in ${d.days} days.`,
      url: d.url,
      en: {
        title: "You're invited to the Air Dive Alor CMS",
        paragraphs: [
          `Hi ${d.name},`,
          `**${d.inviter}** invited you to manage the Air Dive Alor website${rolesEn}.`,
          `Choose a password to activate your account. This link works once and expires in **${d.days} days**.`,
        ],
        button: "Set your password",
      },
      id: {
        title: "Anda diundang ke CMS Air Dive Alor",
        paragraphs: [
          `Halo ${d.name},`,
          `**${d.inviter}** mengundang Anda untuk mengelola website Air Dive Alor${rolesId}.`,
          `Buat password untuk mengaktifkan akun Anda. Link ini hanya bisa dipakai sekali dan berlaku **${d.days} hari**.`,
        ],
        button: "Buat password",
      },
      note: {
        en: "If you weren't expecting this invitation, you can ignore this email. No account is activated until a password is set.",
        id: "Jika Anda tidak merasa diundang, abaikan email ini. Akun tidak aktif sampai password dibuat.",
      },
    }),
  };
}

/** Someone asked to reset the password (forgot password). */
export function resetEmail(d: { siteUrl: string; name: string; url: string; minutes: number; when: Date; ip?: string }): Email {
  const from = d.ip ? ` (IP ${d.ip})` : "";
  return {
    subject: "Reset your Air Dive Alor CMS password",
    ...layout({
      siteUrl: d.siteUrl,
      preheader: `Use this link within ${d.minutes} minutes to choose a new password.`,
      url: d.url,
      en: {
        title: "Reset your password",
        paragraphs: [
          `Hi ${d.name},`,
          `We received a request to reset the password for your Air Dive Alor CMS account on ${witaTime(d.when)}${from}.`,
          `Choose a new password with the button below. This link works once and expires in **${d.minutes} minutes**.`,
        ],
        button: "Choose a new password",
      },
      id: {
        title: "Atur ulang password Anda",
        paragraphs: [
          `Halo ${d.name},`,
          `Kami menerima permintaan untuk mengatur ulang password akun CMS Air Dive Alor Anda pada ${witaTime(d.when, "id")}${from}.`,
          `Buat password baru melalui tombol di bawah. Link ini hanya bisa dipakai sekali dan berlaku **${d.minutes} menit**.`,
        ],
        button: "Buat password baru",
      },
      note: {
        en: "Didn't ask for this? Ignore this email; your password stays the same.",
        id: "Tidak merasa meminta ini? Abaikan email ini; password Anda tidak berubah.",
      },
    }),
  };
}

/** Security notice after a password was set by reset or changed in Account settings. */
export function passwordChangedEmail(d: { siteUrl: string; name: string; when: Date; how: "reset" | "changed"; ip?: string }): Email {
  const site = d.siteUrl.replace(/\/$/, "");
  const from = d.ip ? ` (IP ${d.ip})` : "";
  const howEn = d.how === "reset" ? "with a password reset link" : "from your Account settings";
  const howId = d.how === "reset" ? "melalui link atur ulang password" : "dari pengaturan Akun";
  return {
    subject: "Your Air Dive Alor CMS password was changed",
    ...layout({
      siteUrl: d.siteUrl,
      preheader: "If this wasn't you, reset your password straight away.",
      url: `${site}/cms/forgot-password`,
      en: {
        title: "Your password was changed",
        paragraphs: [
          `Hi ${d.name},`,
          `The password for your Air Dive Alor CMS account was changed on **${witaTime(d.when)}**${from}, ${howEn}.`,
          d.how === "reset" ? "For your security, every other device was signed out." : "If you did this, there's nothing else to do.",
          "**If this wasn't you**, reset your password now and tell an administrator.",
        ],
        button: "Reset my password",
      },
      id: {
        title: "Password Anda telah diganti",
        paragraphs: [
          `Halo ${d.name},`,
          `Password akun CMS Air Dive Alor Anda diganti pada **${witaTime(d.when, "id")}**${from}, ${howId}.`,
          d.how === "reset" ? "Demi keamanan, semua perangkat lain telah dikeluarkan dari akun." : "Jika ini Anda, tidak perlu melakukan apa pun.",
          "**Jika ini bukan Anda**, segera atur ulang password dan beri tahu administrator.",
        ],
        button: "Atur ulang password",
      },
      note: {
        en: "This is an automatic security notice from the Air Dive Alor CMS.",
        id: "Ini adalah pemberitahuan keamanan otomatis dari CMS Air Dive Alor.",
      },
    }),
  };
}

/** Sent from CMS › Email to check that delivery works. */
export function testEmail(d: { siteUrl: string; name: string; when: Date }): Email {
  return {
    subject: "Test email from the Air Dive Alor CMS",
    ...layout({
      siteUrl: d.siteUrl,
      preheader: "Email delivery works.",
      en: { title: "Email delivery works", paragraphs: [`Hi ${d.name},`, `This test was sent from the CMS on ${witaTime(d.when)}. Invitations and password emails will arrive the same way.`] },
      id: { title: "Pengiriman email berfungsi", paragraphs: [`Halo ${d.name},`, `Email uji ini dikirim dari CMS pada ${witaTime(d.when, "id")}. Undangan dan email password akan terkirim dengan cara yang sama.`] },
      note: { en: "You received this because you asked for a test email.", id: "Anda menerima email ini karena meminta email uji." },
    }),
  };
}

/** A booking enquiry as the emails show it (prices already formatted). */
export interface EnquiryEmailData {
  siteUrl: string;
  when: Date;
  lang: "en" | "id";
  name: string;
  email: string;
  phone: string;
  trip: { en: string; id: string };
  /** YYYY-MM-DD */
  arrival: string;
  divers: number;
  cert: string;
  camera: boolean;
  /** e.g. "Rp 9.800.000 × 2 = Rp 19.600.000" in the currency the customer saw. */
  estimate: string;
  /** e.g. "Rp 5.880.000 (30%)" */
  deposit: string;
  /** The estimate in rupiah, for the team (whatever currency the customer used). */
  estimateIdr: string;
  message: string;
  whatsappNumber: string;
  /** The enquiry in the CMS (team email only). */
  cmsUrl?: string;
  /** Enquiry number, shown in the subject. */
  ref?: number;
}

const CERT_ID: Record<string, string> = {
  "Not certified yet": "Belum bersertifikat",
  "Open Water": "Open Water",
  Advanced: "Advanced",
  "Rescue or higher": "Rescue atau lebih tinggi",
  "Dive professional": "Profesional selam",
};

/** "Tue, 10 Nov 2026" / "Sel, 10 Nov 2026" */
export function dateLabelLong(iso: string, lang: "en" | "id") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

const diversLabel = (n: number, lang: "en" | "id") => (lang === "en" ? `${n} ${n === 1 ? "diver" : "divers"}` : `${n} penyelam`);
const waNumber = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0/, "62");

/** The customer's copy of their enquiry, in the language they used on the website. */
export function enquiryCustomerEmail(d: EnquiryEmailData): Email {
  const site = d.siteUrl.replace(/\/$/, "");
  const wa = `https://api.whatsapp.com/send/?phone=${d.whatsappNumber}`;
  const rows = (lang: "en" | "id"): [string, string][] => {
    const L = (en: string, id: string) => (lang === "en" ? en : id);
    return [
      [L("Trip", "Paket"), d.trip[lang] || d.trip.en],
      [L("Arrival", "Tanggal tiba"), dateLabelLong(d.arrival, lang)],
      [L("Group", "Grup"), `${diversLabel(d.divers, lang)} · ${lang === "en" ? d.cert : (CERT_ID[d.cert] ?? d.cert)}`],
      [L("Camera", "Kamera"), d.camera ? L("Yes, bringing a camera", "Ya, bawa kamera") : L("No camera", "Tidak bawa kamera")],
      [L("Estimate", "Perkiraan"), d.estimate],
      [L("Deposit", "DP"), d.deposit],
      [L("Name", "Nama"), d.name],
      ["Email", d.email],
      ...(d.phone ? ([["WhatsApp", d.phone]] as [string, string][]) : []),
      ...(d.message ? ([[L("Message", "Pesan"), d.message]] as [string, string][]) : []),
    ];
  };
  return {
    subject: d.lang === "en" ? "We received your dive enquiry · Air Dive Alor" : "Permintaan selam Anda sudah kami terima · Air Dive Alor",
    ...layout({
      siteUrl: d.siteUrl,
      only: d.lang,
      preheader: d.lang === "en" ? "A copy of your enquiry. We reply within 24 hours with your quote." : "Salinan permintaan Anda. Kami balas dalam 24 jam dengan penawaran harga.",
      url: wa,
      en: {
        title: "We received your enquiry",
        paragraphs: [
          `Hi ${d.name},`,
          "Thank you for planning your dive trip with us. This is a copy of the enquiry you sent from our website.",
          "We reply by email or WhatsApp **within 24 hours** with your quote and a deposit link. You pay the deposit only after we confirm your dates.",
        ],
        rows: rows("en"),
        after: ["Want to change something? Reply to this email or message us on WhatsApp."],
        button: "Chat on WhatsApp",
      },
      id: {
        title: "Permintaan Anda sudah kami terima",
        paragraphs: [
          `Halo ${d.name},`,
          "Terima kasih sudah merencanakan liburan selam bersama kami. Ini salinan permintaan yang Anda kirim dari website kami.",
          "Kami balas lewat email atau WhatsApp **dalam 24 jam**, berisi penawaran harga dan link DP. Anda baru bayar DP setelah kami mengonfirmasi tanggal.",
        ],
        rows: rows("id"),
        after: ["Ingin mengubah sesuatu? Balas email ini atau chat kami di WhatsApp."],
        button: "Chat di WhatsApp",
      },
      note: {
        en: `You received this because this email address was entered in the booking form on ${site.replace(/^https?:\/\//, "")}. If that wasn't you, you can ignore this email.`,
        id: `Anda menerima email ini karena alamat email ini diisi di form pemesanan ${site.replace(/^https?:\/\//, "")}. Jika itu bukan Anda, abaikan email ini.`,
      },
    }),
  };
}

/** The team's notification of a new enquiry (English). Replies go to the customer. */
export function enquiryAdminEmail(d: EnquiryEmailData): Email {
  const site = d.siteUrl.replace(/\/$/, "");
  const phoneDigits = d.phone ? waNumber(d.phone) : "";
  const reply = phoneDigits
    ? `https://api.whatsapp.com/send/?phone=${phoneDigits}&text=${encodeURIComponent(`Hi ${d.name}, thank you for your enquiry for ${d.trip.en} from ${dateLabelLong(d.arrival, "en")}.`)}`
    : `mailto:${d.email}?subject=${encodeURIComponent(`Your Air Dive Alor enquiry: ${d.trip.en}`)}`;
  const rows: [string, string][] = [
    ["Name", d.name],
    ["Email", d.email],
    ["WhatsApp / phone", d.phone || "Not given"],
    ["Trip", d.trip.en],
    ["Arrival", dateLabelLong(d.arrival, "en")],
    ["Divers", String(d.divers)],
    ["Certification", d.cert],
    ["Camera", d.camera ? "Yes" : "No"],
    ["Estimate", d.estimate === d.estimateIdr ? d.estimate : `${d.estimate}\n${d.estimateIdr}`],
    ["Deposit", d.deposit],
    ["Language", d.lang === "en" ? "English" : "Bahasa Indonesia"],
    ["Message", d.message || "None"],
  ];
  return {
    subject: `New enquiry${d.ref ? ` #${d.ref}` : ""}: ${d.trip.en}, ${dateLabelLong(d.arrival, "en")}, ${diversLabel(d.divers, "en")} (${d.name})`,
    ...layout({
      siteUrl: d.siteUrl,
      only: "en",
      preheader: `${d.name} · ${d.trip.en} · arriving ${dateLabelLong(d.arrival, "en")} · ${diversLabel(d.divers, "en")}`,
      url: reply,
      en: {
        title: "New booking enquiry",
        paragraphs: [`**${d.name}** sent an enquiry from the website on ${witaTime(d.when)}. Reply to this email to answer them by email; the customer also received a copy.`],
        rows,
        after: d.cmsUrl ? [`It is saved in the CMS (Enquiries), where you can mark it as contacted or confirmed and keep notes: ${d.cmsUrl}`] : [],
        button: phoneDigits ? "Reply on WhatsApp" : "Reply by email",
      },
      id: { title: "", paragraphs: [] },
      note: { en: `Sent by the booking form on ${site.replace(/^https?:\/\//, "")}. Replies to this email go to ${d.email}.`, id: "" },
    }),
  };
}

const SAMPLE_ENQUIRY = (siteUrl: string, lang: "en" | "id"): EnquiryEmailData => ({
  siteUrl,
  when: new Date(),
  lang,
  name: "Sari Wijaya",
  email: "sari@example.com",
  phone: "+62 812 3456 7890",
  trip: { en: "2 dives a day", id: "2 penyelaman sehari" },
  arrival: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  divers: 2,
  cert: "Open Water",
  camera: true,
  estimate: "Rp 9.800.000 × 2 = Rp 19.600.000",
  deposit: "Rp 5.880.000 (30%)",
  estimateIdr: "Rp 9.800.000 × 2 = Rp 19.600.000",
  message: "We'd love to see pygmy seahorses.\nCan you pick us up at 10:30?",
  whatsappNumber: "6281395505313",
  ref: 128,
  cmsUrl: `${siteUrl.replace(/\/$/, "")}/cms/enquiries/128`,
});

/** Templates with sample data, for the preview in CMS › Email. */
export function sampleEmails(siteUrl: string, me: { name: string }) {
  const site = siteUrl.replace(/\/$/, "");
  const now = new Date();
  const link = `${site}/cms/reset-password?token=preview`;
  return {
    invite: { label: "Invitation", email: inviteEmail({ siteUrl, name: "Sari", inviter: me.name, roles: ["Editor"], url: link, days: 7 }) },
    reset: { label: "Password reset", email: resetEmail({ siteUrl, name: me.name, url: link, minutes: 60, when: now, ip: "203.0.113.7" }) },
    changed: { label: "Password changed", email: passwordChangedEmail({ siteUrl, name: me.name, when: now, how: "reset", ip: "203.0.113.7" }) },
    test: { label: "Test email", email: testEmail({ siteUrl, name: me.name, when: now }) },
    enquiryAdmin: { label: "Booking enquiry: to the team", email: enquiryAdminEmail(SAMPLE_ENQUIRY(siteUrl, "en")) },
    enquiryCustomer: { label: "Booking enquiry: customer copy (EN)", email: enquiryCustomerEmail(SAMPLE_ENQUIRY(siteUrl, "en")) },
    enquiryCustomerId: { label: "Booking enquiry: customer copy (ID)", email: enquiryCustomerEmail(SAMPLE_ENQUIRY(siteUrl, "id")) },
  } as const;
}
export type EmailTemplateKey = keyof ReturnType<typeof sampleEmails>;
