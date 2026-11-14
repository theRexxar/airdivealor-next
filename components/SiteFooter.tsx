"use client";

import Link from "@/components/LocalLink";
import { tl } from "@/lib/cms/seo";
import { useLocale } from "@/lib/i18n";
import { useMenus } from "@/lib/menus-context";
import { ROUTES, waLink } from "@/lib/site";
import { MenuLink } from "./SiteHeader";
import { Icon } from "./ui";

export function SiteFooter() {
  const locale = useLocale();
  const { footer } = useMenus();
  const label = (v: { en: string; id: string }) => tl(v, locale);
  return (
    <footer id="site-footer" data-theme="dark" className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link href={ROUTES.home} aria-label="Air Dive Alor, home" className="site-footer__logo">
            <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="98px" alt="Air Dive Alor" width={98} height={88} />
          </Link>
          {label(footer.address) && <p className="site-footer__address">{label(footer.address)}</p>}
          <div className="site-footer__contact">
            <a href={waLink()} target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" size={18} />
              WhatsApp
            </a>
            {footer.phone && (
              <a href={waLink()} target="_blank" rel="noopener noreferrer">
                <Icon name="phone" size={18} />
                {footer.phone}
              </a>
            )}
            {footer.email && (
              <a href={`mailto:${footer.email}`}>
                <Icon name="mail" size={18} />
                {footer.email}
              </a>
            )}
          </div>
        </div>
        {footer.columns.map((col, i) => (
          <nav key={i} aria-label={label(col.heading)} className="site-footer__col">
            <span className="site-footer__heading">{label(col.heading)}</span>
            {col.links.map((l, j) => (
              <MenuLink key={j} href={l.link} className={l.accent ? "site-footer__accent" : undefined}>
                {label(l.label)}
              </MenuLink>
            ))}
          </nav>
        ))}
      </div>
      <div className="site-footer__legal">
        <span>{label(footer.copyright)}</span>
        {footer.legal.map((l, i) => (
          <MenuLink key={i} href={l.link}>
            {label(l.label)}
          </MenuLink>
        ))}
      </div>
    </footer>
  );
}
