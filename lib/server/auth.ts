import { clientIp } from "@/lib/client-ip";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { PERMISSION_KEYS } from "@/lib/cms/permissions";
import { db, schema } from "./db";

export const SESSION_COOKIE = "ada_cms_session";
const SESSION_DAYS = 7;

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const checkPassword = (p: string, hash: string | null) => (hash ? bcrypt.compare(p, hash) : Promise.resolve(false));

/** Password rule shown in the forms: at least 10 characters, with a letter and a number. */
export function passwordProblem(p: string): string | null {
  if (p.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Use at least one letter and one number.";
  return null;
}

export interface CmsUser {
  id: number;
  email: string;
  name: string;
  roles: { id: number; name: string }[];
  permissions: Set<string>;
}

export async function clientInfo() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: (h.get("user-agent") ?? "").slice(0, 255) };
}

export async function createSession(userId: number) {
  const token = newToken();
  const { ip, userAgent } = await clientInfo();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt, ip, userAgent });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Load a user with roles and the union of their permissions. */
export async function loadUser(userId: number): Promise<CmsUser | null> {
  const u = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!u || u.status !== "active") return null;
  const rs = await db
    .select({ id: schema.roles.id, name: schema.roles.name, isSystem: schema.roles.isSystem })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));
  const perms = new Set<string>();
  if (rs.some((r) => r.isSystem)) PERMISSION_KEYS.forEach((k) => perms.add(k));
  else if (rs.length) {
    const rows = await db.select().from(schema.rolePermissions).where(inArray(schema.rolePermissions.roleId, rs.map((r) => r.id)));
    rows.forEach((r) => perms.add(r.permission));
  }
  return { id: u.id, email: u.email, name: u.name, roles: rs.map(({ id, name }) => ({ id, name })), permissions: perms };
}

/** The signed-in CMS user, or null. */
export async function currentUser(): Promise<CmsUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.query.sessions.findFirst({ where: and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date())) });
  return s ? loadUser(s.userId) : null;
}

export const can = (u: CmsUser | null, permission: string) => !!u && u.permissions.has(permission);
