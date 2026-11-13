"use client";

import Link from "@/components/LocalLink";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { LangSwitch } from "./LangSwitch";
import { ROUTES, waLink } from "@/lib/site";
import { ButtonLink, Button, Icon } from "./ui";

type Current = "home" | "diveSites" | "about" | "blog" | "facilities" | "courses";

export function SiteHeader({ current }: { current?: Current }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const pricing = useRef<HTMLDetailsElement>(null);

  // Close the Pricing dropdown on an outside click or Escape.
  useEffect(() => {
    const close = (e: Event) => {
      const d = pricing.current;
      if (d?.open && !(e instanceof MouseEvent && d.contains(e.target as Node))) d.open = false;
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

  const cur = (k: Current) => (current === k ? { "aria-current": "page" as const } : {});

  return (
    <header data-theme="dark" className="site-header">
      <Link href={ROUTES.home} aria-label="Air Dive Alor, home" className="site-header__logo">
        <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="54px" alt="Air Dive Alor" width={54} height={48} />
      </Link>

      <nav aria-label="Main" className="site-nav wide-only">
        <Link href={ROUTES.home} {...cur("home")}>{t("Home")}</Link>
        <Link href={ROUTES.diveSites} {...cur("diveSites")}>{t("Dive sites")}</Link>
        <details ref={pricing} className="site-nav__menu">
          <summary {...(current === "facilities" || current === "courses" ? { "data-current": "" } : {})}>
            <span className="site-nav__label">{t("Pricing")}</span>
            <Icon name="chevron-down" size={14} />
          </summary>
          <div className="site-nav__dropdown">
            <Link href={ROUTES.facilities} {...cur("facilities")}>{t("Facilities and rates")}</Link>
            <Link href={ROUTES.courses} {...cur("courses")}>{t("Dive courses")}</Link>
          </div>
        </details>
        <Link href={ROUTES.about} {...cur("about")}>{t("About us")}</Link>
        <Link href={ROUTES.blog} {...cur("blog")}>{t("Blog")}</Link>
      </nav>

      <div className="site-header__actions">
        <LangSwitch />
        <span className="wide-only">
          <ButtonLink href={waLink()} external variant="secondary" icon="message-circle" iconOnly aria-label="WhatsApp" />
        </span>
        <ButtonLink href={ROUTES.book} variant="primary">
          {t("Book")}
        </ButtonLink>
        <span className="narrow-only">
          <Button variant="secondary" icon={menuOpen ? "x" : "menu"} iconOnly aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
        </span>
      </div>

      {menuOpen && (
        <nav aria-label="Main" className="mobile-nav narrow-only">
          <Link href={ROUTES.home} {...cur("home")}>{t("Home")}</Link>
          <Link href={ROUTES.diveSites} {...cur("diveSites")}>{t("Dive sites")}</Link>
          <span className="mobile-nav__group">{t("Pricing")}</span>
          <Link href={ROUTES.facilities} className="mobile-nav__sub" {...cur("facilities")}>{t("Facilities and rates")}</Link>
          <Link href={ROUTES.courses} className="mobile-nav__sub mobile-nav__sub--last" {...cur("courses")}>{t("Dive courses")}</Link>
          <Link href={ROUTES.about} {...cur("about")}>{t("About us")}</Link>
          <Link href={ROUTES.blog} {...cur("blog")}>{t("Blog")}</Link>
          <a href={waLink()} target="_blank" rel="noopener noreferrer" className="mobile-nav__last">WhatsApp</a>
        </nav>
      )}
    </header>
  );
}
