/**
 * Booking enquiries: saved in the database (CMS › Enquiries), then emailed to the team and the customer.
 * Each email's result is recorded on the enquiry, so the CMS shows what was delivered and can send it again.
 */
import { and, desc, eq, like, lt, or, sql, type SQL } from "drizzle-orm";
import type { Enquiry } from "@/lib/enquiry";
import { db, schema } from "./db";
import type { EmailStatus } from "./db/schema";
import { enquiryAdminEmail, enquiryCustomerEmail, type EnquiryEmailData } from "./emails";
import { env } from "./env";
import { sendMail } from "./mail";

export type EnquiryRow = typeof schema.enquiries.$inferSelect;
export const WHATSAPP_NUMBER = "6281395505313";

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

/** The email data for a stored enquiry (from its saved price, so a resend matches the first email). */
export function emailData(r: EnquiryRow): EnquiryEmailData {
  const usd = (n: number) => "US$" + Math.round(n / (r.usdRate || 1)).toLocaleString("en-US");
  const money = r.currency === "USD" && r.usdRate ? usd : rp;
  const total = r.priceIdr * r.divers;
  const site = env.SITE_URL.replace(/\/$/, "");
  return {
    siteUrl: env.SITE_URL,
    when: r.createdAt,
    lang: r.lang,
    name: r.name,
    email: r.email,
    phone: r.phone,
    trip: r.packageName,
    arrival: r.arrival,
    divers: r.divers,
    cert: r.cert,
    camera: r.camera,
    estimate: `${money(r.priceIdr)} × ${r.divers} = ${money(total)}`,
    estimateIdr: `${rp(r.priceIdr)} × ${r.divers} = ${rp(total)}`,
    deposit: `${money(Math.round(total * (r.depositPercent / 100)))} (${r.depositPercent}%)`,
    message: r.message,
    whatsappNumber: WHATSAPP_NUMBER,
    ref: r.id,
    cmsUrl: `${site}/cms/enquiries/${r.id}`,
  };
}

/** Save a new enquiry (emails still pending). */
export async function createEnquiry(e: Enquiry, pkg: { id: string; name: { en: string; id: string }; priceIdr: number }, prices: { usdRate: number; depositPercent: number }, client: { ip: string; userAgent: string }) {
  const [res] = await db.insert(schema.enquiries).values({
    lang: e.lang,
    currency: e.currency,
    packageId: pkg.id,
    packageName: pkg.name,
    priceIdr: pkg.priceIdr,
    usdRate: Math.round(prices.usdRate || 0),
    depositPercent: prices.depositPercent,
    arrival: e.arrival,
    divers: e.divers,
    cert: e.cert,
    camera: e.camera,
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    notes: "",
    ip: client.ip || null,
    userAgent: client.userAgent || null,
    teamEmailTo: env.ENQUIRY_EMAIL,
  });
  return getEnquiry(res.insertId);
}

export async function getEnquiry(id: number) {
  return (await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, id) })) ?? null;
}

type Outcome = { status: EmailStatus; messageId?: string; error?: string };

async function send(mail: Parameters<typeof sendMail>[0]): Promise<Outcome> {
  try {
    const r = await sendMail(mail);
    return r.sent ? { status: "sent", messageId: r.messageId } : { status: "not_configured", error: "Email isn't set up on this server (BREVO_API_KEY is missing)." };
  } catch (err) {
    return { status: "failed", error: (err instanceof Error ? err.message : String(err)).slice(0, 500) };
  }
}

/** Email the team (replies go to the customer) and record the result on the enquiry when it was saved. */
export async function sendTeamEmail(r: EnquiryRow, saved = true): Promise<Outcome> {
  const out = await send({ to: { email: env.ENQUIRY_EMAIL, name: "Air Dive Alor" }, replyTo: { email: r.email, name: r.name }, ...enquiryAdminEmail(emailData(r)) });
  if (saved)
    await db
      .update(schema.enquiries)
      .set({ teamEmail: out.status, teamEmailTo: env.ENQUIRY_EMAIL, teamEmailId: out.messageId ?? null, teamEmailError: out.error ?? null, teamEmailAt: new Date() })
      .where(eq(schema.enquiries.id, r.id));
  return out;
}

/** Email the customer their copy (replies go to the team) and record the result. */
export async function sendCustomerEmail(r: EnquiryRow, saved = true): Promise<Outcome> {
  const out = await send({ to: { email: r.email, name: r.name }, replyTo: { email: env.ENQUIRY_EMAIL, name: "Air Dive Alor" }, ...enquiryCustomerEmail(emailData(r)) });
  if (saved)
    await db
      .update(schema.enquiries)
      .set({ customerEmail: out.status, customerEmailId: out.messageId ?? null, customerEmailError: out.error ?? null, customerEmailAt: new Date() })
      .where(eq(schema.enquiries.id, r.id));
  return out;
}

export type EnquiryFilter = { q?: string; status?: string; email?: "problem" | ""; before?: number; limit?: number };

/** Newest first, filtered; `next` is the id to pass as `before` for the next page. */
export async function listEnquiries(f: EnquiryFilter) {
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 200);
  const where: SQL[] = [];
  if (f.q?.trim()) {
    const q = `%${f.q.trim().replace(/[%_\\]/g, "\\$&")}%`;
    const asId = Number(f.q.replace(/^#/, ""));
    where.push(or(like(schema.enquiries.name, q), like(schema.enquiries.email, q), like(schema.enquiries.phone, q), ...(Number.isInteger(asId) && asId > 0 ? [eq(schema.enquiries.id, asId)] : []))!);
  }
  if (f.status && ["new", "contacted", "confirmed", "cancelled"].includes(f.status)) where.push(eq(schema.enquiries.status, f.status as EnquiryRow["status"]));
  if (f.email === "problem") where.push(or(sql`${schema.enquiries.teamEmail} <> 'sent'`, sql`${schema.enquiries.customerEmail} <> 'sent'`)!);
  if (f.before) where.push(lt(schema.enquiries.id, f.before));
  const rows = await db
    .select()
    .from(schema.enquiries)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.enquiries.id))
    .limit(limit + 1);
  const counts = await db.select({ status: schema.enquiries.status, n: sql<number>`count(*)` }).from(schema.enquiries).groupBy(schema.enquiries.status);
  return {
    enquiries: rows.slice(0, limit),
    next: rows.length > limit ? rows[limit - 1].id : null,
    counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])) as Record<string, number>,
  };
}
