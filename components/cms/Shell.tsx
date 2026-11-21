"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { Icon, asIcon, type IconName } from "@/components/ui";
import { COLLECTIONS, PAGES } from "@/lib/cms/registry";
import { api } from "@/lib/cms/client";
import { useCmsUser } from "./CmsUser";

const NAV: { group: string; items: { href: string; label: string; icon: IconName; perm: string }[] }[] = [
  { group: "Pages", items: PAGES.filter((p) => !p.site).map((p) => ({ href: `/cms/pages/${p.slug}`, label: p.label, icon: asIcon(p.icon), perm: `${p.slug}.view` })) },
  { group: "Site", items: PAGES.filter((p) => p.site).map((p) => ({ href: `/cms/pages/${p.slug}`, label: p.label, icon: asIcon(p.icon), perm: `${p.slug}.view` })) },
  { group: "Content", items: COLLECTIONS.map((c) => ({ href: `/cms/collections/${c.key}`, label: c.label, icon: asIcon(c.icon), perm: `${c.key}.view` })) },
  { group: "Bookings", items: [{ href: "/cms/enquiries", label: "Enquiries", icon: "inbox", perm: "enquiries.view" }] },
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

const FOLD_KEY = "cms-side-folded";

/** Initials for the folded sidebar, e.g. "Air Dive" → "AD". */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

export function Shell({ children }: { children: ReactNode }) {
  const { user, can } = useCmsUser();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Folded sidebar (wide screens only): icons, with each label in a tooltip. Remembered in this browser.
  const [folded, setFolded] = useState(false);
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  useEffect(() => {
    try {
      setFolded(localStorage.getItem(FOLD_KEY) === "1");
    } catch {}
  }, []);
  const toggleFold = () => {
    const next = !folded;
    setFolded(next);
    setTip(null);
    try {
      localStorage.setItem(FOLD_KEY, next ? "1" : "0");
    } catch {}
  };
  // Tooltips sit outside the sidebar (fixed), so its scrolling can't cut them off.
  const showTip = (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");
    if (!folded || !el || window.matchMedia("(max-width: 900px)").matches) return;
    const r = el.getBoundingClientRect();
    setTip({ label: el.dataset.tip!, top: r.top + r.height / 2, left: r.right + 10 });
  };
  const hideTip = () => setTip(null);
  const signOut = async () => {
    await api("/api/cms/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/cms/login";
  };
  return (
    <div className="cms-shell" data-folded={folded || undefined}>
      <div className="cms-mobilebar">
        <button type="button" className="cms-iconbtn" style={{ color: "#fff" }} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? "x" : "menu"} size={20} />
        </button>
        <span>Air Dive Alor CMS</span>
      </div>
      <aside
        className="cms-side"
        data-open={open || undefined}
        data-folded={folded || undefined}
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        onMouseOver={showTip}
        onFocus={showTip}
        onMouseLeave={hideTip}
        onBlur={hideTip}
        onScroll={hideTip}
      >
        <div className="cms-side__brand">
          <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="54px" alt="Air Dive Alor" />
          <span className="cms-side__text">Content management</span>
        </div>
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <div className="cms-side__group">
                <span className="cms-side__text">{g.group}</span>
              </div>
              {items.map((i) => (
                <Link key={i.href} href={i.href} className="cms-nav" data-tip={i.label} aria-current={path === i.href || path.startsWith(i.href + "/") ? "page" : undefined}>
                  <Icon name={i.icon} size={18} />
                  <span className="cms-side__text">{i.label}</span>
                </Link>
              ))}
            </div>
          );
        })}
        <button
          type="button"
          className="cms-nav cms-side__fold"
          data-tip={folded ? "Expand menu" : undefined}
          aria-expanded={!folded}
          aria-label={folded ? "Expand menu" : "Collapse menu"}
          onClick={toggleFold}
        >
          <Icon name={folded ? "panel-left-open" : "panel-left-close"} size={18} />
          <span className="cms-side__text">Collapse menu</span>
        </button>
        <div className="cms-side__foot">
          <div className="cms-side__who" data-tip={`${user.name} · ${user.roles.join(", ") || "No role"}`} tabIndex={folded ? 0 : -1}>
            <span aria-hidden="true" className="cms-side__avatar">
              {initials(user.name)}
            </span>
            <div className="cms-side__text">
              <div className="cms-side__user">{user.name}</div>
              <div className="cms-side__role">{user.roles.join(", ") || "No role"}</div>
            </div>
          </div>
          <div className="cms-side__links">
            <Link href="/cms/account" data-tip="Account" aria-label="Account">
              <Icon name="circle-user" size={18} className="cms-side__linkicon" />
              <span className="cms-side__text">Account</span>
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" data-tip="View site" aria-label="View site">
              <Icon name="external-link" size={18} className="cms-side__linkicon" />
              <span className="cms-side__text">View site</span>
            </a>
            <button type="button" onClick={signOut} data-tip="Sign out" aria-label="Sign out">
              <Icon name="log-out" size={18} className="cms-side__linkicon" />
              <span className="cms-side__text">Sign out</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="cms-main">{children}</main>
      {tip && (
        <div role="tooltip" className="cms-tip" style={{ top: tip.top, left: tip.left }}>
          {tip.label}
        </div>
      )}
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
