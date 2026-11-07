import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { createSession, hashPassword, passwordProblem } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { body, handle, HttpError, ok, rateLimit } from "@/lib/server/http";
import { findToken, notifyPasswordChanged } from "@/lib/server/password-flow";

/** GET checks a link before showing the form; POST sets the password (reset or accepting an invitation). */
export const GET = handle(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const t = token ? await findToken(token) : null;
  if (!t) throw new HttpError(410, "This link is invalid or has expired. Ask for a new one.");
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, t.userId) });
  return ok({ kind: t.kind, email: u?.email, name: u?.name });
});

export const POST = handle(async (req) => {
  const { token, password } = await body(req, z.object({ token: z.string().min(10).max(200), password: z.string().max(200) }));
  await rateLimit(`reset:${token.slice(0, 16)}`, 10, 15 * 60);
  const problem = passwordProblem(password);
  if (problem) throw new HttpError(422, problem, [{ path: ["password"], message: problem }]);
  const t = await findToken(token);
  if (!t) throw new HttpError(410, "This link is invalid or has expired. Ask for a new one.");
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, t.userId) });
  if (!u || u.status === "disabled") throw new HttpError(403, "This account is disabled.");
  await db.update(schema.users).set({ passwordHash: await hashPassword(password), status: "active" }).where(eq(schema.users.id, u.id));
  await db.update(schema.passwordTokens).set({ usedAt: new Date() }).where(eq(schema.passwordTokens.userId, u.id));
  // Sign out every other session for this user, then sign in here.
  await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, u.id), ne(schema.sessions.id, "")));
  await createSession(u.id);
  await audit(u.id, t.kind === "invite" ? "auth.invite_accepted" : "auth.password_reset");
  if (t.kind === "reset") await notifyPasswordChanged(u, "reset");
  return ok({ ok: true });
});
