import { HOME_DEFAULTS } from "@/lib/cms/home-defaults";
import type { HomeContent } from "@/lib/cms/home-types";
import { enquirySchema } from "@/lib/enquiry";
import { clientInfo } from "@/lib/server/auth";
import { createEnquiry, sendCustomerEmail, sendTeamEmail, type EnquiryRow } from "@/lib/server/enquiry-service";
import { body, handle, HttpError, ok, rateLimit } from "@/lib/server/http";
import { pageContent } from "@/lib/server/page-service";

/**
 * A booking enquiry from the Home page form.
 * 1. Saved in the database, so it shows in CMS › Enquiries even if email fails.
 * 2. Emailed to the team (replies go to the customer), then a copy to the customer in their language.
 *    Each email's result is recorded on the enquiry.
 * Prices come from the published Home page, not from the browser. The visitor only sees "sent" when the
 * enquiry reached the team somehow (saved, or emailed); otherwise they are pointed to WhatsApp.
 */
export const POST = handle(async (req) => {
  const client = await clientInfo();
  await rateLimit(`enquiry:${client.ip || "unknown"}`, 5, 15 * 60);
  const e = await body(req, enquirySchema);
  // Bots fill the hidden field: answer as if sent, keep and send nothing.
  if (e.website) return ok({ ok: true, ref: null, copySent: true });

  // The published prices; the built-in ones if the database can't be read (as the website itself does).
  let home: HomeContent;
  try {
    home = (await pageContent("home")).content as unknown as HomeContent;
  } catch (err) {
    console.error("[enquiry] could not read the Home page, using built-in prices:", err instanceof Error ? err.message : err);
    home = HOME_DEFAULTS;
  }
  const pkg = home.prices.packages.find((p) => p.id === e.pkg);
  if (!pkg) throw new HttpError(422, "This package is no longer available. Please choose another one.", [{ path: ["pkg"], message: "Choose a package." }]);
  const prices = { usdRate: home.prices.usdRate, depositPercent: home.book.depositPercent };

  // 1. Save. If the database is down, still try the emails with an unsaved copy.
  let row: EnquiryRow | null = null;
  try {
    row = await createEnquiry(e, pkg, prices, client);
  } catch (err) {
    console.error("[enquiry] could not save:", err instanceof Error ? err.message : err);
  }
  const saved = !!row;
  const r: EnquiryRow =
    row ??
    ({
      id: 0, status: "new", lang: e.lang, currency: e.currency, packageId: pkg.id, packageName: pkg.name, priceIdr: pkg.priceIdr, usdRate: Math.round(prices.usdRate || 0),
      depositPercent: prices.depositPercent, arrival: e.arrival, divers: e.divers, cert: e.cert, camera: e.camera, name: e.name, email: e.email, phone: e.phone, message: e.message,
      notes: "", createdAt: new Date(),
    } as EnquiryRow);

  // 2. The team, then the customer's copy.
  const team = await sendTeamEmail(r, saved);
  if (team.status !== "sent") console.error(`[enquiry] team email ${team.status}${saved ? ` for #${r.id}` : ""}: ${team.error ?? ""}`);
  if (!saved && team.status !== "sent") {
    console.error(`[enquiry] NOT DELIVERED from ${e.name} <${e.email}> ${e.phone} · ${pkg.name.en} · ${e.arrival} · ${e.divers} divers · ${e.message.slice(0, 200)}`);
    throw new HttpError(503, "We couldn't send your enquiry right now. Please message us on WhatsApp instead, or try again in a few minutes.");
  }
  const copy = await sendCustomerEmail(r, saved);
  if (copy.status !== "sent") console.error(`[enquiry] customer copy ${copy.status}${saved ? ` for #${r.id}` : ""}: ${copy.error ?? ""}`);

  return ok({ ok: true, ref: saved ? r.id : null, copySent: copy.status === "sent" });
});
