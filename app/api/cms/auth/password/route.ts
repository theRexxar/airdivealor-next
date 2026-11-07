import { eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { checkPassword, hashPassword, passwordProblem } from "@/lib/server/auth";
import { db, schema } from "@/lib/server/db";
import { notifyPasswordChanged } from "@/lib/server/password-flow";
import { body, handle, HttpError, ok, requireUser } from "@/lib/server/http";

/** Change your own password. */
export const POST = handle(async (req) => {
  const me = await requireUser();
  const { current, next } = await body(req, z.object({ current: z.string().max(200), next: z.string().max(200) }));
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, me.id) });
  if (!(await checkPassword(current, u?.passwordHash ?? null))) throw new HttpError(422, "Your current password is incorrect.", [{ path: ["current"], message: "Incorrect password." }]);
  const problem = passwordProblem(next);
  if (problem) throw new HttpError(422, problem, [{ path: ["next"], message: problem }]);
  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, me.id));
  await audit(me.id, "auth.password_changed");
  await notifyPasswordChanged(u!, "changed");
  return ok({ ok: true });
});
