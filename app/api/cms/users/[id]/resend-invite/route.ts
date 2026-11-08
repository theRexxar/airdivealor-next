import { eq } from "drizzle-orm";
import { audit } from "@/lib/server/audit";
import { db, schema } from "@/lib/server/db";
import { handle, HttpError, ok, requireUser } from "@/lib/server/http";
import { NOT_CONFIGURED } from "@/lib/server/mail";
import { sendPasswordLink } from "@/lib/server/password-flow";

export const POST = handle(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser("users.manage");
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, Number((await ctx.params).id)) });
  if (!u) throw new HttpError(404, "User not found.");
  if (u.status !== "invited") throw new HttpError(409, "This user already has an active account.");
  let sent = false;
  try {
    sent = (await sendPasswordLink(u, "invite", me.name)).sent;
  } catch (e) {
    console.error("invitation email failed", e);
    throw new HttpError(502, "The invitation email couldn't be sent. Check the email settings (CMS › Email) and try again.");
  }
  if (!sent) throw new HttpError(503, NOT_CONFIGURED);
  await audit(me.id, "user.invite_resent", u.email);
  return ok({ ok: true });
});
