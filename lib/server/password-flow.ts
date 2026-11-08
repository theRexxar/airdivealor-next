import { and, eq, gt, isNull } from "drizzle-orm";
import { clientInfo, hashToken, newToken } from "./auth";
import { db, schema } from "./db";
import { inviteEmail, passwordChangedEmail, resetEmail } from "./emails";
import { env } from "./env";
import { sendMail, type SendResult } from "./mail";

const MINUTES = { reset: 60, invite: 7 * 24 * 60 };
const site = () => env.SITE_URL.replace(/\/$/, "");

/**
 * Create a one-time link (password reset or invitation) and email it. Any earlier unused link of the same
 * kind for this user stops working, so only the newest email is valid.
 */
export async function sendPasswordLink(user: { id: number; email: string; name: string }, kind: "reset" | "invite", invitedBy?: string): Promise<SendResult> {
  const now = new Date();
  await db
    .update(schema.passwordTokens)
    .set({ usedAt: now })
    .where(and(eq(schema.passwordTokens.userId, user.id), eq(schema.passwordTokens.kind, kind), isNull(schema.passwordTokens.usedAt)));
  const token = newToken();
  await db.insert(schema.passwordTokens).values({ userId: user.id, tokenHash: hashToken(token), kind, expiresAt: new Date(now.getTime() + MINUTES[kind] * 60_000) });
  const url = `${site()}/cms/reset-password?token=${encodeURIComponent(token)}`;

  let mail;
  if (kind === "invite") {
    const roles = await db
      .select({ name: schema.roles.name })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
      .where(eq(schema.userRoles.userId, user.id));
    mail = inviteEmail({ siteUrl: site(), name: user.name, inviter: invitedBy ?? "An administrator", roles: roles.map((r) => r.name), url, days: MINUTES.invite / 1440 });
  } else {
    const { ip } = await clientInfo().catch(() => ({ ip: "" }));
    mail = resetEmail({ siteUrl: site(), name: user.name, url, minutes: MINUTES.reset, when: now, ip: ip || undefined });
  }
  return sendMail({ to: { email: user.email, name: user.name }, ...mail });
}

/** Tell the account owner their password changed. Never fails the change itself: problems are only logged. */
export async function notifyPasswordChanged(user: { email: string; name: string }, how: "reset" | "changed") {
  try {
    const { ip } = await clientInfo().catch(() => ({ ip: "" }));
    await sendMail({ to: { email: user.email, name: user.name }, ...passwordChangedEmail({ siteUrl: site(), name: user.name, when: new Date(), how, ip: ip || undefined }) });
  } catch (e) {
    console.error("password-changed email failed", e);
  }
}

/** Find a valid, unused token. */
export async function findToken(token: string) {
  return db.query.passwordTokens.findFirst({
    where: and(eq(schema.passwordTokens.tokenHash, hashToken(token)), isNull(schema.passwordTokens.usedAt), gt(schema.passwordTokens.expiresAt, new Date())),
  });
}
