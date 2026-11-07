"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon, asIcon, type IconName } from "@/components/ui";
import { COLLECTIONS, PAGES } from "@/lib/cms/registry";
import { api } from "@/lib/cms/client";
import { useCmsUser } from "./CmsUser";

const NAV: { group: string; items: { href: string; label: string; icon: IconName; perm: string }[] }[] = [
  { group: "Pages", items: PAGES.map((p) => ({ href: `/cms/pages/${p.slug}`, label: p.label, icon: asIcon(p.icon), perm: `${p.slug}.view` })) },
  { group: "Content", items: COLLECTIONS.map((c) => ({ href: `/cms/collections/${c.key}`, label: c.label, icon: asIcon(c.icon), perm: `${c.key}.view` })) },
  { group: "Library", items: [{ href: "/cms/media", label: "Media", icon: "images", perm: "media.view" }] },
  {
    group: "Settings",
    items: [
      { href: "/cms/users", label: "Users", icon: "users", perm: "users.view" },
      { href: "/cms/roles", label: "Roles and permissions", icon: "shield-check", perm: "users.view" },
      { href: "/cms/email", label: "Email", icon: "mail", perm: "users.manage" },
      { href: "/cms/audit", label: "Activity log", icon: "history", perm: "audit.view" },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, can } = useCmsUser();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const signOut = async () => {
    await api("/api/cms/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/cms/login";
  };
  return (
    <div className="cms-shell">
      <div className="cms-mobilebar">
        <button type="button" className="cms-iconbtn" style={{ color: "#fff" }} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? "x" : "menu"} size={20} />
        </button>
        <span>Air Dive Alor CMS</span>
      </div>
      <aside className="cms-side" data-open={open || undefined} onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
        <div className="cms-side__brand">
          <img src="/brand/logo-mark-white.png" alt="Air Dive Alor" />
          <span>Content management</span>
        </div>
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <div className="cms-side__group">{g.group}</div>
              {items.map((i) => (
                <Link key={i.href} href={i.href} className="cms-nav" aria-current={path === i.href || path.startsWith(i.href + "/") ? "page" : undefined}>
                  <Icon name={i.icon} size={18} />
                  {i.label}
                </Link>
              ))}
            </div>
          );
        })}
        <div className="cms-side__foot">
          <div>
            <div className="cms-side__user">{user.name}</div>
            <div className="cms-side__role">{user.roles.join(", ") || "No role"}</div>
          </div>
          <div className="cms-side__links">
            <Link href="/cms/account">Account</Link>
            <a href="/" target="_blank" rel="noopener noreferrer">View site</a>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </aside>
      <main className="cms-main">{children}</main>
    </div>
  );
}

/** Page header with breadcrumbs, title, intro and actions. */
export function PageHead({ crumbs, title, sub, actions }: { crumbs?: { href?: string; label: string }[]; title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="cms-head">
      <div className="cms-head__text">
        {crumbs && (
          <div className="cms-crumbs">
            {crumbs.map((c, i) => (
              <span key={c.label} style={{ display: "contents" }}>
                {i > 0 && <Icon name="chevron-right" size={14} />}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="cms-title">{title}</h1>
        {sub && <p className="cms-sub">{sub}</p>}
      </div>
      {actions && <div className="cms-actions">{actions}</div>}
    </div>
  );
}
