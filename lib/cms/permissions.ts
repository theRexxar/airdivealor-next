/**
 * Permission catalog for role-based access control, generated from the page and collection registry.
 * Pages: <page>.view, <page>.<section>.edit, <page>.layout, <page>.publish.
 * Collections: <collection>.view, .edit, .publish, .delete.
 */
import { COLLECTIONS, PAGES } from "./registry";

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
}

export const PERMISSIONS: PermissionDef[] = [
  ...PAGES.flatMap((p) => {
    const group = `${p.label} page`;
    return [
      { key: `${p.slug}.view`, label: `See the ${p.label} page sections`, group },
      ...p.sections.map((s) => ({ key: `${p.slug}.${s.key}.edit`, label: `Edit “${s.label}”`, group })),
      { key: `${p.slug}.layout`, label: "Show, hide and reorder sections", group },
      { key: `${p.slug}.publish`, label: "Publish changes to the live site", group },
    ];
  }),
  ...COLLECTIONS.flatMap((c) => [
    { key: `${c.key}.view`, label: `See ${c.label.toLowerCase()}`, group: c.label },
    { key: `${c.key}.edit`, label: `Add and edit ${c.itemLabel}s (drafts)`, group: c.label },
    { key: `${c.key}.publish`, label: `Publish, hide, unpublish and reorder ${c.itemLabel}s`, group: c.label },
    { key: `${c.key}.delete`, label: `Delete ${c.itemLabel}s`, group: c.label },
  ]),
  { key: "enquiries.view", label: "See booking enquiries (names, emails, phone numbers)", group: "Enquiries" },
  { key: "enquiries.manage", label: "Change status, add notes and resend emails", group: "Enquiries" },
  { key: "enquiries.delete", label: "Delete enquiries", group: "Enquiries" },
  { key: "media.view", label: "See the media library", group: "Media" },
  { key: "media.upload", label: "Upload photos and videos", group: "Media" },
  { key: "media.delete", label: "Delete media", group: "Media" },
  { key: "users.view", label: "See users", group: "Users and roles" },
  { key: "users.manage", label: "Invite, edit and disable users", group: "Users and roles" },
  { key: "roles.manage", label: "Create and edit roles", group: "Users and roles" },
  { key: "audit.view", label: "See the activity log", group: "Users and roles" },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);
export const sectionEditPermission = (page: string, key: string) => `${page}.${key}.edit`;

const contentKeys = PERMISSION_KEYS.filter((k) => PAGES.some((p) => k.startsWith(`${p.slug}.`)) || COLLECTIONS.some((c) => k.startsWith(`${c.key}.`)));
const isPublishing = (k: string) => k.endsWith(".publish") || k.endsWith(".layout") || k.endsWith(".delete");

/** Roles created by the seed. Super admin always has every permission. */
export const DEFAULT_ROLES: { name: string; description: string; system?: boolean; permissions: string[] | "all" }[] = [
  { name: "Super admin", description: "Full access, including users and roles.", system: true, permissions: "all" },
  { name: "Editor", description: "Edits and publishes all pages and dive site guides, manages media, and handles booking enquiries.", permissions: [...contentKeys, "media.view", "media.upload", "enquiries.view", "enquiries.manage"] },
  { name: "Contributor", description: "Edits drafts and uploads media; cannot publish.", permissions: [...contentKeys.filter((k) => !isPublishing(k)), "media.view", "media.upload"] },
  { name: "Viewer", description: "Read-only access to the CMS.", permissions: [...PAGES.map((p) => `${p.slug}.view`), ...COLLECTIONS.map((c) => `${c.key}.view`), "media.view"] },
];
