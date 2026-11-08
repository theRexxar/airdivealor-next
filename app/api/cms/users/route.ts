import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/audit";
import { db, schema } from "@/lib/server/db";
import { body, handle, HttpError, ok, requireUser } from "@/lib/server/http";
import { NOT_CONFIGURED } from "@/lib/server/mail";
import { sendPasswordLink } from "@/lib/server/password-flow";
import { activeSuperAdmins, listUsers, setUserRoles } from "@/lib/server/users-service";

export const GET = handle(async () => {
  await requireUser("users.view");
  return ok({ users: await listUsers() });
});

/** Invite a user: creates the account and emails a link to set a password. */
export const POST = handle(async (req) => {
  const me = await requireUser("users.manage");
  const data = await body(req, z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address."), name: z.string().trim().min(1, "Enter a name.").max(120), roleIds: z.array(z.number().int()).min(1, "Choose at least one role.") }));
  if (await db.query.users.findFirst({ where: eq(schema.users.email, data.email) })) throw new HttpError(409, "A user with this email already exists.", [{ path: ["email"], message: "Already in use." }]);
  const roles = await db.select().from(schema.roles).where(inArray(schema.roles.id, data.roleIds));
  if (roles.length !== data.roleIds.length) throw new HttpError(422, "Unknown role.");
  // Only a Super admin can hand out the Super admin role.
  if (roles.some((r) => r.isSystem) && !(await activeSuperAdmins()).includes(me.id)) throw new HttpError(403, "Only a Super admin can give the Super admin role.");
  const [res] = await db.insert(schema.users).values({ email: data.email, name: data.name, status: "invited" });
  await setUserRoles(res.insertId, data.roleIds);
  await audit(me.id, "user.invited", data.email, { roles: roles.map((r) => r.name) });
  try {
    const r = await sendPasswordLink({ id: res.insertId, email: data.email, name: data.name }, "invite", me.name);
    if (!r.sent) return ok({ id: res.insertId, emailSent: false, emailError: `The user was added, but no invitation was sent. ${NOT_CONFIGURED}` }, 201);
  } catch (e) {
    console.error("invitation email failed", e);
    return ok({ id: res.insertId, emailSent: false, emailError: "The user was added, but the invitation email couldn't be sent. Check the email settings, then use “Resend invite”." }, 201);
  }
  return ok({ id: res.insertId, emailSent: true }, 201);
});
