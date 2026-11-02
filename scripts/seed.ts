/**
 * Seed the CMS (safe to run again): roles and permissions, the first Super admin, every page in the
 * registry with its sections, every collection (the 33 dive sites), and the local photos they use,
 * imported into the media library. Existing content is never overwritten.
 * Usage: npm run cms:seed
 */
import { and, eq, ne } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { COLLECTION_DEFAULTS, PAGE_DEFAULTS } from "../lib/cms/defaults";
import { COLLECTIONS, PAGES } from "../lib/cms/registry";
import { DEFAULT_ROLES, PERMISSION_KEYS } from "../lib/cms/permissions";
import { db, schema } from "../lib/server/db";
import { env } from "../lib/server/env";
import { importMediaBytes, mapMediaRefs } from "../lib/server/media-import";
import { mediaQueue } from "../lib/server/queue";
import { ensureBucket } from "../lib/server/storage";
import bcrypt from "bcryptjs";

const MIME: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

/**
 * Create the default roles, and give existing roles any default permissions added since the last seed
 * (e.g. a new page). Grants are remembered, so a permission an admin removed is not added back.
 */
async function seedRoles() {
  const memo = await db.query.cmsSettings.findFirst({ where: eq(schema.cmsSettings.key, "seed.granted_permissions") });
  const granted = (memo?.value ?? {}) as Record<string, string[]>;
  for (const r of DEFAULT_ROLES) {
    const perms = r.permissions === "all" ? PERMISSION_KEYS : r.permissions;
    let role = await db.query.roles.findFirst({ where: eq(schema.roles.name, r.name) });
    if (!role) {
      const [res] = await db.insert(schema.roles).values({ name: r.name, description: r.description, isSystem: !!r.system });
      role = (await db.query.roles.findFirst({ where: eq(schema.roles.id, res.insertId) }))!;
      if (perms.length) await db.insert(schema.rolePermissions).values(perms.map((permission) => ({ roleId: role!.id, permission })));
      console.info(`role: ${r.name}`);
    } else if (!role.isSystem) {
      const current = (await db.select().from(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, role.id))).map((x) => x.permission);
      const before = granted[r.name] ?? current; // first run with tracking: treat what the role has now as already granted
      const added = perms.filter((k) => !before.includes(k) && !current.includes(k));
      if (added.length) {
        await db.insert(schema.rolePermissions).values(added.map((permission) => ({ roleId: role!.id, permission })));
        console.info(`role ${r.name}: +${added.length} new permissions`);
      }
    }
    granted[r.name] = [...new Set([...(granted[r.name] ?? []), ...perms])];
  }
  if (memo) await db.update(schema.cmsSettings).set({ value: granted }).where(eq(schema.cmsSettings.key, "seed.granted_permissions"));
  else await db.insert(schema.cmsSettings).values({ key: "seed.granted_permissions", value: granted });
}

async function seedAdmin() {
  const email = env.SEED_ADMIN_EMAIL.toLowerCase();
  if (await db.query.users.findFirst({ where: eq(schema.users.email, email) })) return;
  if (!env.SEED_ADMIN_PASSWORD) throw new Error("Set SEED_ADMIN_PASSWORD to create the first admin.");
  const [res] = await db.insert(schema.users).values({ email, name: "Administrator", passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12), status: "active" });
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.name, "Super admin") });
  await db.insert(schema.userRoles).values({ userId: res.insertId, roleId: role!.id });
  console.info(`admin: ${email}`);
}

/** Upload a local public/ file as a media item and queue it for processing. Returns the media id. */
async function importLocal(url: string, cache: Map<string, number>): Promise<number | null> {
  if (!url.startsWith("/")) return null;
  if (cache.has(url)) return cache.get(url)!;
  const mime = MIME[extname(url).toLowerCase()];
  if (!mime) return null;
  const bytes = await readFile(join(process.cwd(), "public", url));
  const { id, reused } = await importMediaBytes(url.split("/").pop()!, bytes, mime);
  cache.set(url, id);
  if (!reused) console.info(`media ${id}: ${url}`);
  return id;
}

/** Walk section content and swap local image URLs for media library ids. */
const importMedia = (value: unknown, cache: Map<string, number>) =>
  mapMediaRefs(value, async (ref) => {
    const id = ref.mediaId ? null : await importLocal(ref.url, cache);
    return id ? { mediaId: id, url: "" } : ref;
  });

async function seedPages(cache: Map<string, number>) {
  for (const def of PAGES) {
    let page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, def.slug) });
    if (!page) {
      const [res] = await db.insert(schema.pages).values({ slug: def.slug, title: def.label });
      page = (await db.query.pages.findFirst({ where: eq(schema.pages.id, res.insertId) }))!;
    }
    let i = 0;
    for (const s of def.sections) {
      i++;
      const exists = await db.query.pageSections.findFirst({ where: and(eq(schema.pageSections.pageId, page.id), eq(schema.pageSections.key, s.key)) });
      if (exists) continue;
      const content = await importMedia(PAGE_DEFAULTS[def.slug]?.[s.key], cache);
      const now = new Date();
      await db.insert(schema.pageSections).values({ pageId: page.id, key: s.key, sort: i * 10, enabled: true, draft: content, published: content, draftUpdatedAt: now, publishedAt: now });
      console.info(`section: ${def.slug}/${s.key}`);
    }
  }
}

/** Fill an empty collection with its built-in items, all published. */
async function seedCollections(cache: Map<string, number>) {
  for (const c of COLLECTIONS) {
    const any = await db.query.collectionItems.findFirst({ where: eq(schema.collectionItems.collection, c.key) });
    if (any) continue;
    let i = 0;
    for (const item of COLLECTION_DEFAULTS[c.key] ?? []) {
      i++;
      const content = await importMedia(item, cache);
      const now = new Date();
      await db.insert(schema.collectionItems).values({ collection: c.key, slug: item.slug, sort: i * 10, draft: content, published: content, draftUpdatedAt: now, publishedAt: now });
    }
    console.info(`collection ${c.key}: ${i} items`);
  }
}

async function main() {
  await ensureBucket();
  await seedRoles();
  await seedAdmin();
  const cache = new Map<string, number>();
  await seedPages(cache);
  await seedCollections(cache);
  await mediaQueue().close();
  console.info("seed done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
