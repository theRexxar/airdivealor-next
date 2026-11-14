"use client";

import Link from "@/components/LocalLink";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { tl } from "@/lib/cms/seo";
import { useLocale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n-routes";
import { isExternal, useMenus } from "@/lib/menus-context";
import { LangSwitch } from "./LangSwitch";
import { ROUTES, waLink } from "@/lib/site";
import { ButtonLink, Button, Icon } from "./ui";

/** A menu link: a page of this site in the current language, or another site in a new tab. */
export function MenuLink({ href, children, ...rest }: { href: string; children: ReactNode; className?: string; "aria-current"?: "page" }) {
  if (isExternal(href) || href.startsWith("mailto:"))
    return (
      <a href={href} {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={href || "/"} {...rest}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);

  // Close open dropdowns on an outside click or Escape.
  useEffect(() => {
    const close = (e: Event) => {
      nav.current?.querySelectorAll("details[open]").forEach((d) => {
        if (!(e instanceof MouseEvent && d.contains(e.target as Node))) (d as HTMLDetailsElement).open = false;
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close(e);
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // The mobile menu only exists below 860px; close it when the window grows past that.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 860px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const { header } = useMenus();
  const locale = useLocale();
  const path = usePathname() ?? "";
  // A menu link is current on its own page and the pages under it (a blog story for Blog).
  const isCurrent = (href: string) => {
    if (!href.startsWith("/") || href.includes("#")) return false;
    const p = localizeHref(href, locale).split("?")[0].replace(/\/$/, "");
    return path === p || (p !== `/${locale}` && path.startsWith(p + "/"));
  };
  const cur = (href: string) => (isCurrent(href) ? { "aria-current": "page" as const } : {});
  const label = (v: { en: string; id: string }) => tl(v, locale);
  // One dropdown open at a time.
  const closeOthers = (open: HTMLDetailsElement) =>
    nav.current?.querySelectorAll("details[open]").forEach((d) => d !== open && ((d as HTMLDetailsElement).open = false));

  return (
    <header id="site-header" data-theme="dark" className="site-header">
      <Link href={ROUTES.home} aria-label="Air Dive Alor, home" className="site-header__logo">
        <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="54px" alt="Air Dive Alor" width={54} height={48} />
      </Link>

      <nav ref={nav} aria-label="Main" className="site-nav wide-only">
        {header.items.map((item, i) =>
          item.children.length ? (
            <details key={i} className="site-nav__menu" onToggle={(e) => (e.currentTarget.open ? closeOthers(e.currentTarget) : undefined)}>
              <summary {...(item.children.some((c) => isCurrent(c.link)) ? { "data-current": "" } : {})}>
                <span className="site-nav__label">{label(item.label)}</span>
                <Icon name="chevron-down" size={14} />
              </summary>
              <div className="site-nav__dropdown">
                {item.children.map((c, j) => (
                  <MenuLink key={j} href={c.link} {...cur(c.link)}>{label(c.label)}</MenuLink>
                ))}
              </div>
            </details>
          ) : (
            <MenuLink key={i} href={item.link} {...cur(item.link)}>{label(item.label)}</MenuLink>
          ),
        )}
      </nav>

      <div className="site-header__actions">
        <LangSwitch />
        <span className="wide-only">
          <ButtonLink href={waLink()} external variant="secondary" icon="message-circle" iconOnly aria-label="WhatsApp" />
        </span>
        <ButtonLink href={header.button.link || ROUTES.book} external={isExternal(header.button.link)} variant="primary">
          {label(header.button.label)}
        </ButtonLink>
        <span className="narrow-only">
          <Button variant="secondary" icon={menuOpen ? "x" : "menu"} iconOnly aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
        </span>
      </div>

      {menuOpen && (
        <nav aria-label="Main" className="mobile-nav narrow-only">
          {header.items.map((item, i) =>
            item.children.length ? (
              <Fragment key={i}>
                <span className="mobile-nav__group">{label(item.label)}</span>
                {item.children.map((c, j) => (
                  <MenuLink key={j} href={c.link} className={j === item.children.length - 1 ? "mobile-nav__sub mobile-nav__sub--last" : "mobile-nav__sub"} {...cur(c.link)}>
                    {label(c.label)}
                  </MenuLink>
                ))}
              </Fragment>
            ) : (
              <MenuLink key={i} href={item.link} {...cur(item.link)}>{label(item.label)}</MenuLink>
            ),
          )}
          <a href={waLink()} target="_blank" rel="noopener noreferrer" className="mobile-nav__last">WhatsApp</a>
        </nav>
      )}
    </header>
  );
}
