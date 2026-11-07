import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { sampleEmails } from "@/lib/server/emails";
import { env } from "@/lib/server/env";
import { body, handle, HttpError, ok, rateLimit, requireUser } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";

/** Send one template (with sample data) to the signed-in admin, to check delivery and how it looks. */
export const POST = handle(async (req) => {
  const me = await requireUser("users.manage");
  const { template } = await body(req, z.object({ template: z.enum(["invite", "reset", "changed", "test"]) }));
  await rateLimit(`email-test:${me.id}`, 10, 60 * 60);
  const t = sampleEmails(env.SITE_URL, me)[template];
  try {
    await sendMail({ to: { email: me.email, name: me.name }, subject: `[Test] ${t.email.subject}`, html: t.email.html, text: t.email.text });
  } catch (e) {
    console.error("test email failed", e);
    throw new HttpError(502, `Sending failed: ${e instanceof Error ? e.message : "unknown error"}`);
  }
  await audit(me.id, "email.test_sent", template);
  return ok({ sent: true, to: me.email, delivered: !!env.BREVO_API_KEY });
});
