import { relations } from "drizzle-orm";
import { bigint, boolean, datetime, index, int, json, mysqlEnum, mysqlTable, primaryKey, uniqueIndex, varchar, text } from "drizzle-orm/mysql-core";

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
};

/* ---------- Users and access control ---------- */

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 100 }),
  /** invited: no password yet; disabled: cannot sign in. */
  status: mysqlEnum("status", ["active", "invited", "disabled"]).notNull().default("invited"),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  ...timestamps,
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 60 }).notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  /** System roles cannot be deleted (Super admin keeps every permission). */
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps,
}, (t) => [uniqueIndex("roles_name_uq").on(t.name)]);

export const rolePermissions = mysqlTable("role_permissions", {
  roleId: int("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permission: varchar("permission", { length: 80 }).notNull(),
}, (t) => [primaryKey({ columns: [t.roleId, t.permission] })]);

export const userRoles = mysqlTable("user_roles", {
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: int("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userId, t.roleId] })]);

export const sessions = mysqlTable("sessions", {
  /** SHA-256 of the session token; the raw token only lives in the cookie. */
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamps.createdAt,
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const passwordTokens = mysqlTable("password_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  kind: mysqlEnum("kind", ["reset", "invite"]).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdAt: timestamps.createdAt,
}, (t) => [uniqueIndex("password_tokens_hash_uq").on(t.tokenHash)]);

/* ---------- Media ---------- */

export interface MediaVariant {
  key: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["image", "video"]).notNull(),
  /** uploading: waiting for the browser upload; processing: queued or in the worker. */
  status: mysqlEnum("status", ["uploading", "processing", "ready", "failed"]).notNull().default("uploading"),
  originalKey: varchar("original_key", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  width: int("width"),
  height: int("height"),
  durationSec: int("duration_sec"),
  /** Processed files: WebP sizes for images, web MP4 for videos. */
  variants: json("variants").$type<MediaVariant[]>().notNull().$defaultFn(() => []),
  posterKey: varchar("poster_key", { length: 255 }),
  altEn: varchar("alt_en", { length: 255 }).notNull().default(""),
  altId: varchar("alt_id", { length: 255 }).notNull().default(""),
  error: text("error"),
  attempts: int("attempts").notNull().default(0),
  createdBy: int("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [index("media_status_idx").on(t.status)]);

/* ---------- Pages and sections ---------- */

export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("pages_slug_uq").on(t.slug)]);

export const pageSections = mysqlTable("page_sections", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 60 }).notNull(),
  sort: int("sort").notNull().default(0),
  /** Hidden sections are left out of the published page. */
  enabled: boolean("enabled").notNull().default(true),
  draft: json("draft").$type<unknown>().notNull(),
  published: json("published").$type<unknown>(),
  draftUpdatedAt: datetime("draft_updated_at", { mode: "date" }),
  draftUpdatedBy: int("draft_updated_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: datetime("published_at", { mode: "date" }),
  publishedBy: int("published_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [uniqueIndex("page_sections_page_key_uq").on(t.pageId, t.key)]);

/* ---------- Audit log ---------- */

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 80 }).notNull(),
  target: varchar("target", { length: 160 }).notNull().default(""),
  meta: json("meta").$type<Record<string, unknown>>(),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamps.createdAt,
}, (t) => [index("audit_created_idx").on(t.createdAt)]);

export const usersRelations = relations(users, ({ many }) => ({ userRoles: many(userRoles) }));
export const rolesRelations = relations(roles, ({ many }) => ({ permissions: many(rolePermissions), userRoles: many(userRoles) }));
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({ role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }) }));
export const pagesRelations = relations(pages, ({ many }) => ({ sections: many(pageSections) }));
export const pageSectionsRelations = relations(pageSections, ({ one }) => ({ page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }) }));

/* ---------- Collections (dive sites, and later courses, blog posts…) ---------- */

export const collectionItems = mysqlTable("collection_items", {
  id: int("id").autoincrement().primaryKey(),
  collection: varchar("collection", { length: 40 }).notNull(),
  /** Web address of the item, unique within its collection. Mirrors the published (or draft) content slug. */
  slug: varchar("slug", { length: 120 }).notNull(),
  sort: int("sort").notNull().default(0),
  /** Hidden items stay in the CMS but are left out of the website. */
  enabled: boolean("enabled").notNull().default(true),
  draft: json("draft").$type<unknown>().notNull(),
  /** Null until the item is first published. */
  published: json("published").$type<unknown>(),
  draftUpdatedAt: datetime("draft_updated_at", { mode: "date" }),
  draftUpdatedBy: int("draft_updated_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: datetime("published_at", { mode: "date" }),
  publishedBy: int("published_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [uniqueIndex("collection_items_slug_uq").on(t.collection, t.slug), index("collection_items_sort_idx").on(t.collection, t.sort)]);

/** Small key/value store for CMS bookkeeping (e.g. which permissions the seed already granted). */
export const cmsSettings = mysqlTable("cms_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: json("value").$type<unknown>().notNull(),
  updatedAt: timestamps.updatedAt,
});

/* ---------- Booking enquiries (Home page form) ---------- */

/** What happened to one email of an enquiry. */
export type EmailStatus = "pending" | "sent" | "failed" | "not_configured";
const emailStatus = (name: string) => mysqlEnum(name, ["pending", "sent", "failed", "not_configured"]).notNull().default("pending");

export const enquiries = mysqlTable("enquiries", {
  id: int("id").autoincrement().primaryKey(),
  /** Where the team is with it: new → contacted → confirmed, or cancelled. */
  status: mysqlEnum("status", ["new", "contacted", "confirmed", "cancelled"]).notNull().default("new"),
  lang: mysqlEnum("lang", ["en", "id"]).notNull(),
  currency: mysqlEnum("currency", ["IDR", "USD"]).notNull(),
  packageId: varchar("package_id", { length: 60 }).notNull(),
  /** The package name and price when the enquiry was sent (prices can change later). */
  packageName: json("package_name").$type<{ en: string; id: string }>().notNull(),
  priceIdr: int("price_idr").notNull(),
  usdRate: int("usd_rate").notNull().default(0),
  depositPercent: int("deposit_percent").notNull(),
  /** YYYY-MM-DD */
  arrival: varchar("arrival", { length: 10 }).notNull(),
  divers: int("divers").notNull(),
  cert: varchar("cert", { length: 40 }).notNull(),
  camera: boolean("camera").notNull().default(false),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  message: text("message").notNull(),
  /** Notes for the team only. */
  notes: text("notes").notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  teamEmail: emailStatus("team_email"),
  teamEmailTo: varchar("team_email_to", { length: 200 }).notNull().default(""),
  teamEmailId: varchar("team_email_id", { length: 200 }),
  teamEmailError: varchar("team_email_error", { length: 500 }),
  teamEmailAt: datetime("team_email_at", { mode: "date" }),
  customerEmail: emailStatus("customer_email"),
  customerEmailId: varchar("customer_email_id", { length: 200 }),
  customerEmailError: varchar("customer_email_error", { length: 500 }),
  customerEmailAt: datetime("customer_email_at", { mode: "date" }),
  updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [index("enquiries_created_idx").on(t.createdAt), index("enquiries_status_idx").on(t.status)]);
