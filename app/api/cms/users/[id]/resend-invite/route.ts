import { eq } from "drizzle-orm";
import { audit } from "@/lib/server/audit";
import { db, schema } from "@/lib/server/db";
import { handle, HttpError, ok, requireUser } from "@/lib/server/http";
import { sendPasswordLink } from "@/lib/server/password-flow";

export const POST = handle(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser("users.manage");
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, Number((await ctx.params).id)) });
  if (!u) throw new HttpError(404, "User not found.");
  if (u.status !== "invited") throw new HttpError(409, "This user already has an active account.");
  try {
    await sendPasswordLink(u, "invite", me.name);
  } catch (e) {
    console.error("invitation email failed", e);
    throw new HttpError(502, "The invitation email couldn't be sent. Check the email settings (CMS › Email) and try again.");
  }
  await audit(me.id, "user.invite_resent", u.email);
  return ok({ ok: true });
});
