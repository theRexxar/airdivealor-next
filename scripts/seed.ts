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
import { emptyValue } from "../lib/cms/fields";
import { COLLECTIONS, PAGES } from "../lib/cms/registry";
import { RICH_STORIES } from "../lib/cms/blog-rich-stories";
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

/** Pictures in rich text (<img src="/latest/x.webp">) get their media library id, so the site serves resized versions. */
async function importRichImages(html: string, cache: Map<string, number>): Promise<string> {
  let out = html;
  for (const tag of new Set(html.match(/<img\b[^>]*>/g) ?? [])) {
    if (/data-media-id=/.test(tag)) continue;
    const src = tag.match(/\ssrc="(\/[^"]+)"/)?.[1];
    const id = src ? await importLocal(src, cache) : null;
    if (id) out = out.split(tag).join(tag.replace(/^<img\b/, `<img data-media-id="${id}"`));
  }
  return out;
}

/** Every string in a value, with rich text pictures imported. */
async function importRich(value: unknown, cache: Map<string, number>): Promise<unknown> {
  if (typeof value === "string") return value.includes("<img") ? importRichImages(value, cache) : value;
  if (Array.isArray(value)) return Promise.all(value.map((v) => importRich(v, cache)));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await importRich(v, cache)])));
  return value;
}

/** Walk section content and swap local image URLs for media library ids (photo fields and rich text pictures). */
const importMedia = async (value: unknown, cache: Map<string, number>) =>
  importRich(
    await mapMediaRefs(value, async (ref) => {
      const id = ref.mediaId ? null : await importLocal(ref.url, cache);
      return id ? { mediaId: id, url: "" } : ref;
    }),
    cache,
  );

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

/**
 * Give existing items fields added since they were created (e.g. the Indonesian web address), in both draft
 * and live content: the built-in value for the same item if there is one, else empty. Nothing else changes.
 */
async function backfillFields() {
  for (const c of COLLECTIONS) {
    const builtIn = new Map((COLLECTION_DEFAULTS[c.key] ?? []).map((x) => [x.slug, x as unknown as Record<string, unknown>]));
    const rows = await db.select().from(schema.collectionItems).where(eq(schema.collectionItems.collection, c.key));
    let n = 0;
    for (const r of rows) {
      const fill = (v: unknown) => {
        if (!v || typeof v !== "object") return v;
        const o = { ...(v as Record<string, unknown>) };
        let changed = false;
        for (const f of c.fields) {
          if (f.key in o) continue;
          o[f.key] = builtIn.get(r.slug)?.[f.key] ?? emptyValue(f);
          changed = true;
        }
        return changed ? o : v;
      };
      const draft = fill(r.draft);
      const published = fill(r.published);
      if (draft !== r.draft || published !== r.published) {
        await db.update(schema.collectionItems).set({ draft, published }).where(eq(schema.collectionItems.id, r.id));
        n++;
      }
    }
    if (n) console.info(`collection ${c.key}: added new fields to ${n} items`);
  }
}

/**
 * Indonesian search titles and descriptions that earlier versions shipped untranslated. Replaced with the
 * new built-in Indonesian text, but only where the page still has exactly the old text (never edited).
 */
const OLD_SEO_ID: Record<string, { title?: string; description?: string }> = {
  home: {
    title: "Air Dive Alor | Scuba Diving, Courses & Dive Resort in Alor, Indonesia",
    description: "Dive Alor with Air Dive Alor in Alor Kecil: Pantar Strait walls, muck and pelagics, SDI and TDI courses, and a village stay with three meals a hari. Diving March to November.",
  },
  "dive-sites": {
    title: "Dive sites | Air Dive Alor",
    description: "33 dive sites around Alor, Pantar and Pura: walls, pinnacles, caverns and muck bays, each with a full site guide.",
  },
  facilities: { description: "Stay in Alor Kecil village with three home-cooked meals a hari, and dive with our two boats. Dive packages from five hari, or pay per dive." },
  "dive-courses": { description: "SDI and TDI dive courses in Alor, from Open Water to Divemaster and technical diving. Every package includes your stay, three meals a hari, gear and airport transfers." },
};

async function upgradeSeoTexts() {
  for (const [slug, old] of Object.entries(OLD_SEO_ID)) {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) });
    const builtIn = PAGE_DEFAULTS[slug]?.seo as Record<string, { id?: string }> | undefined;
    if (!page || !builtIn) continue;
    const row = await db.query.pageSections.findFirst({ where: and(eq(schema.pageSections.pageId, page.id), eq(schema.pageSections.key, "seo")) });
    if (!row) continue;
    const fix = (v: unknown) => {
      if (!v || typeof v !== "object") return v;
      const o = { ...(v as Record<string, { en: string; id: string }>) };
      let changed = false;
      for (const k of ["title", "description"] as const) {
        const want = builtIn[k]?.id;
        if (old[k] && want && o[k]?.id === old[k]) {
          o[k] = { ...o[k], id: want };
          changed = true;
        }
      }
      return changed ? o : v;
    };
    const draft = fix(row.draft);
    const published = fix(row.published);
    if (draft !== row.draft || published !== row.published) {
      await db.update(schema.pageSections).set({ draft, published }).where(eq(schema.pageSections.id, row.id));
      console.info(`page ${slug}: Indonesian search title and description updated`);
    }
  }
}

/**
 * Built-in stories added after a database was seeded (the rich text ones in lib/cms/blog-rich-stories.ts):
 * added as drafts, so an editor can read them and publish them from the CMS. Never overwrites a story.
 */
async function addNewStories(cache: Map<string, number>) {
  const rows = await db.select().from(schema.collectionItems).where(eq(schema.collectionItems.collection, "posts"));
  if (!rows.length) return; // an empty collection is filled (and published) by seedCollections
  for (const story of RICH_STORIES) {
    if (rows.some((r) => r.slug === story.slug)) continue;
    const content = await importMedia(story, cache);
    const sort = Math.max(0, ...rows.map((r) => r.sort)) + 10;
    await db.insert(schema.collectionItems).values({ collection: "posts", slug: story.slug, sort, draft: content, published: null, draftUpdatedAt: new Date() });
    console.info(`story "${story.slug}": added as a draft (publish it in the CMS)`);
  }
}

/** Home FAQ questions saved before they could link to a full answer: link the first one to its FAQ page. */
async function linkHomeFaq() {
  const page = await db.query.pages.findFirst({ where: eq(schema.pages.slug, "home") });
  if (!page) return;
  const row = await db.query.pageSections.findFirst({ where: and(eq(schema.pageSections.pageId, page.id), eq(schema.pageSections.key, "faq")) });
  if (!row) return;
  const link = (v: unknown) => {
    const faq = v as { items?: { q?: { en?: string }; page?: string }[] } | null;
    if (!faq?.items?.some((x) => x.page === undefined)) return v;
    return { ...faq, items: faq.items.map((x) => (x.page !== undefined ? x : { ...x, page: x.q?.en?.trim() === "How do I get to Alor?" ? "how-to-get-to-alor" : "" })) };
  };
  const draft = link(row.draft);
  const published = link(row.published);
  if (draft !== row.draft || published !== row.published) {
    await db.update(schema.pageSections).set({ draft, published }).where(eq(schema.pageSections.id, row.id));
    console.info("page home: FAQ questions can now link to a full answer");
  }
}

async function main() {
  await ensureBucket();
  await seedRoles();
  await seedAdmin();
  const cache = new Map<string, number>();
  await seedPages(cache);
  await seedCollections(cache);
  await backfillFields();
  await upgradeSeoTexts();
  await addNewStories(cache);
  await linkHomeFaq();
  await mediaQueue().close();
  console.info("seed done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
