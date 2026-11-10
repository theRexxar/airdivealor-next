import { sampleEmails } from "@/lib/server/emails";
import { env } from "@/lib/server/env";
import { handle, ok, requireUser } from "@/lib/server/http";

/** Email settings and every template rendered with sample data, for CMS › Email. */
export const GET = handle(async () => {
  const me = await requireUser("users.manage");
  const samples = sampleEmails(env.SITE_URL, me);
  return ok({
    configured: !!env.BREVO_API_KEY,
    from: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
    siteUrl: env.SITE_URL,
    enquiryTo: env.ENQUIRY_EMAIL,
    me: { email: me.email },
    templates: Object.entries(samples).map(([key, t]) => ({ key, label: t.label, ...t.email })),
  });
});
