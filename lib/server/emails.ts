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

function block(l: Lang, url: string | undefined, lang: "en" | "id") {
  return `<h1 style="margin:0 0 16px;font:600 22px/1.3 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(l.title)}</h1>
${l.paragraphs.map((p) => `<p style="margin:0 0 14px;font:400 15px/1.6 Roboto,Arial,sans-serif;color:${C.body}">${rich(p)}</p>`).join("\n")}
${url && l.button ? button(url, l.button) : ""}
${url && l.button ? `<p style="margin:8px 0 0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${lang === "en" ? "Or copy this link into your browser:" : "Atau salin link ini ke browser Anda:"}<br><a href="${esc(url)}" style="color:${C.blue};word-break:break-all">${esc(url)}</a></p>` : ""}`;
}

/** The shared layout: logo bar, English, Indonesian, footer. */
function layout(o: Layout): { html: string; text: string } {
  const site = o.siteUrl.replace(/\/$/, "");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.en.title)}</title></head>
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
<tr><td style="padding:32px 28px 8px">${block(o.en, o.url, "en")}</td></tr>
<tr><td style="padding:16px 28px 0"><div style="border-top:1px solid ${C.line};padding-top:20px;font:600 11px/1 Roboto,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">Bahasa Indonesia</div></td></tr>
<tr><td style="padding:16px 28px 8px">${block(o.id, o.url, "id")}</td></tr>
<tr><td style="padding:24px 28px 28px">
<p style="margin:0 0 6px;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${rich(o.note.en)}</p>
<p style="margin:0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">${rich(o.note.id)}</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font:400 12px/1.5 Roboto,Arial,sans-serif;color:${C.muted}">Air Dive Alor · Alor Kecil, Nusa Tenggara Timur, Indonesia<br><a href="${esc(site)}" style="color:${C.muted}">${esc(site.replace(/^https?:\/\//, ""))}</a></p>
</td></tr></table>
</body></html>`;

  const section = (l: Lang) => [l.title, "", ...l.paragraphs.map(plain).flatMap((p) => [p, ""]), ...(o.url && l.button ? [`${l.button}: ${o.url}`, ""] : [])];
  const text = [...section(o.en), "—", "", ...section(o.id), "—", plain(o.note.en), plain(o.note.id), "", `Air Dive Alor · ${site}`].join("\n");
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
  } as const;
}
export type EmailTemplateKey = keyof ReturnType<typeof sampleEmails>;
