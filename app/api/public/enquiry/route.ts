import type { HomeContent } from "@/lib/cms/home-types";
import { enquirySchema } from "@/lib/enquiry";
import { clientInfo } from "@/lib/server/auth";
import { enquiryAdminEmail, enquiryCustomerEmail } from "@/lib/server/emails";
import { env } from "@/lib/server/env";
import { body, handle, HttpError, ok, rateLimit } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";
import { pageContent } from "@/lib/server/page-service";

const WHATSAPP = "6281395505313";
const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

/**
 * A booking enquiry from the Home page form. The team gets an email (replies go to the customer) and the
 * customer gets a copy in their language. Prices come from the published Home page, not from the browser.
 * When the team's email can't be sent, the visitor is told so (and pointed to WhatsApp) instead of a false "sent".
 */
export const POST = handle(async (req) => {
  const { ip } = await clientInfo();
  await rateLimit(`enquiry:${ip || "unknown"}`, 5, 15 * 60);
  const e = await body(req, enquirySchema);
  // Bots fill the hidden field: answer as if sent, send nothing.
  if (e.website) return ok({ ok: true, copySent: true });

  const home = (await pageContent("home")).content as unknown as HomeContent;
  const pkg = home.prices.packages.find((p) => p.id === e.pkg);
  if (!pkg) throw new HttpError(422, "This package is no longer available. Please choose another one.", [{ path: ["pkg"], message: "Choose a package." }]);
  const usd = (n: number) => "US$" + Math.round(n / (home.prices.usdRate || 1)).toLocaleString("en-US");
  const money = e.currency === "IDR" ? rp : usd;
  const total = pkg.priceIdr * e.divers;
  const pct = home.book.depositPercent;
  const data = {
    siteUrl: env.SITE_URL,
    when: new Date(),
    lang: e.lang,
    name: e.name,
    email: e.email,
    phone: e.phone,
    trip: pkg.name,
    arrival: e.arrival,
    divers: e.divers,
    cert: e.cert,
    camera: e.camera,
    estimate: `${money(pkg.priceIdr)} × ${e.divers} = ${money(total)}`,
    estimateIdr: `${rp(pkg.priceIdr)} × ${e.divers} = ${rp(total)}`,
    deposit: `${money(Math.round(total * (pct / 100)))} (${pct}%)`,
    message: e.message,
    whatsappNumber: WHATSAPP,
  };

  // 1. The team. Without this the enquiry is lost, so a failure is reported to the visitor.
  let teamSent = false;
  try {
    teamSent = (await sendMail({ to: { email: env.ENQUIRY_EMAIL, name: "Air Dive Alor" }, replyTo: { email: e.email, name: e.name }, ...enquiryAdminEmail(data) })).sent;
  } catch (err) {
    console.error("[enquiry] team email failed:", err instanceof Error ? err.message : err);
  }
  if (!teamSent) {
    console.error(`[enquiry] NOT DELIVERED from ${e.name} <${e.email}> ${e.phone} · ${pkg.name.en} · ${e.arrival} · ${e.divers} divers · ${e.message.slice(0, 200)}`);
    throw new HttpError(503, "We couldn't send your enquiry right now. Please message us on WhatsApp instead, or try again in a few minutes.");
  }

  // 2. The customer's copy. The enquiry already reached the team, so a failure here only changes the message.
  let copySent = false;
  try {
    copySent = (await sendMail({ to: { email: e.email, name: e.name }, replyTo: { email: env.ENQUIRY_EMAIL, name: "Air Dive Alor" }, ...enquiryCustomerEmail(data) })).sent;
  } catch (err) {
    console.error("[enquiry] customer copy failed:", err instanceof Error ? err.message : err);
  }
  return ok({ ok: true, copySent });
});
