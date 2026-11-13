import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { getEnquiry, sendCustomerEmail, sendTeamEmail } from "@/lib/server/enquiry-service";
import { body, handle, HttpError, ok, rateLimit, requireUser } from "@/lib/server/http";

/** Send the team email or the customer's copy again; the new result replaces the recorded one. */
export const POST = handle(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser("enquiries.manage");
  const e = await getEnquiry(Number((await ctx.params).id) || 0);
  if (!e) throw new HttpError(404, "Enquiry not found.");
  const { to } = await body(req, z.object({ to: z.enum(["team", "customer"]) }));
  await rateLimit(`enquiry-resend:${e.id}:${to}`, 5, 60 * 60);
  const out = to === "team" ? await sendTeamEmail(e) : await sendCustomerEmail(e);
  await audit(me.id, "enquiry.email_resent", `#${e.id} ${e.name}`, { to, status: out.status });
  return ok({ result: out, enquiry: await getEnquiry(e.id) });
});
