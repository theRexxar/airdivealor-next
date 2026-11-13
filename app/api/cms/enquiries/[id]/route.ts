import { eq } from "drizzle-orm";
import { z } from "zod";
import { enquiryWhatsAppText } from "@/lib/enquiry";
import { audit } from "@/lib/server/audit";
import { db, schema } from "@/lib/server/db";
import { emailData, getEnquiry } from "@/lib/server/enquiry-service";
import { body, handle, HttpError, ok, requireUser } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

async function target(ctx: Ctx) {
  const e = await getEnquiry(Number((await ctx.params).id) || 0);
  if (!e) throw new HttpError(404, "Enquiry not found.");
  return e;
}

/** One enquiry with its email results, who last changed it, and the estimate as the emails showed it. */
export const GET = handle(async (_req, ctx: Ctx) => {
  const me = await requireUser("enquiries.view");
  const e = await target(ctx);
  const by = e.updatedBy ? await db.query.users.findFirst({ where: eq(schema.users.id, e.updatedBy), columns: { name: true } }) : null;
  const d = emailData(e);
  return ok({
    enquiry: { ...e, updatedByName: by?.name ?? null },
    estimate: d.estimate,
    estimateIdr: d.estimateIdr,
    deposit: d.deposit,
    // What the customer's own WhatsApp message would say, to match it with this enquiry.
    summary: enquiryWhatsAppText("en", { ref: e.id, trip: e.packageName.en, arrival: e.arrival, divers: e.divers, cert: e.cert, camera: e.camera, name: e.name, email: e.email, phone: e.phone, message: e.message }),
    can: { manage: me.permissions.has("enquiries.manage"), delete: me.permissions.has("enquiries.delete") },
  });
});

/** Status and team notes. */
export const PATCH = handle(async (req, ctx: Ctx) => {
  const me = await requireUser("enquiries.manage");
  const e = await target(ctx);
  const data = await body(req, z.object({ status: z.enum(["new", "contacted", "confirmed", "cancelled"]).optional(), notes: z.string().max(5000).optional() }));
  await db.update(schema.enquiries).set({ ...data, updatedBy: me.id }).where(eq(schema.enquiries.id, e.id));
  if (data.status && data.status !== e.status) await audit(me.id, "enquiry.status_changed", `#${e.id} ${e.name}`, { from: e.status, to: data.status });
  if (data.notes !== undefined && data.notes !== e.notes) await audit(me.id, "enquiry.notes_saved", `#${e.id} ${e.name}`);
  return ok({ enquiry: await getEnquiry(e.id) });
});

/** Remove an enquiry and the personal data in it. */
export const DELETE = handle(async (_req, ctx: Ctx) => {
  const me = await requireUser("enquiries.delete");
  const e = await target(ctx);
  await db.delete(schema.enquiries).where(eq(schema.enquiries.id, e.id));
  await audit(me.id, "enquiry.deleted", `#${e.id} ${e.name}`);
  return ok({ ok: true });
});
