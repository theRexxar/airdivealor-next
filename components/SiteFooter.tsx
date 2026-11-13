"use client";

import Link from "@/components/LocalLink";
import { useLang } from "@/lib/i18n";
import { ROUTES, SOCIAL, waLink } from "@/lib/site";
import { Icon } from "./ui";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer data-theme="dark" className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link href={ROUTES.home} aria-label="Air Dive Alor, home" className="site-footer__logo">
            <img src="/brand/logo-air-dive-alor-white.png" srcSet="/brand/logo-air-dive-alor-white.png 600w, /brand/logo-air-dive-alor-white@2x.png 1200w" sizes="98px" alt="Air Dive Alor" width={98} height={88} />
          </Link>
          <p className="site-footer__address">{t("Alor Kecil, Alor Barat Laut, Alor Regency, East Nusa Tenggara, Indonesia")}</p>
          <div className="site-footer__contact">
            <a href={waLink()} target="_blank" rel="noopener noreferrer">
              <Icon name="message-circle" size={18} />
              WhatsApp
            </a>
            <a href={waLink()} target="_blank" rel="noopener noreferrer">
              <Icon name="phone" size={18} />
              0813-9550-5313
            </a>
            <a href="mailto:contact@airdivealor.com">
              <Icon name="mail" size={18} />
              contact@airdivealor.com
            </a>
          </div>
        </div>
        <nav aria-label="Explore" className="site-footer__col">
          <span className="site-footer__heading">{t("Explore")}</span>
          <Link href={ROUTES.home}>{t("Home")}</Link>
          <Link href={ROUTES.diveSites}>{t("Dive sites")}</Link>
          <Link href={ROUTES.facilities}>{t("Facilities and rates")}</Link>
          <Link href={ROUTES.courses}>{t("Dive courses")}</Link>
          <Link href={ROUTES.about}>{t("About us")}</Link>
          <Link href={ROUTES.blog}>{t("Blog")}</Link>
        </nav>
        <nav aria-label="Plan your trip" className="site-footer__col">
          <span className="site-footer__heading">{t("Plan your trip")}</span>
          <Link href={ROUTES.prices}>{t("Prices")}</Link>
          <Link href={ROUTES.faqPages}>{t("FAQ")}</Link>
          <Link href={ROUTES.book}>{t("Book")}</Link>
        </nav>
        <nav aria-label="Follow us" className="site-footer__col">
          <span className="site-footer__heading">{t("Follow us")}</span>
          <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href={SOCIAL.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href={SOCIAL.tripadvisor} target="_blank" rel="noopener noreferrer">TripAdvisor</a>
          <a href={SOCIAL.airdivex} target="_blank" rel="noopener noreferrer" className="site-footer__accent">{t("Air DiveX, our sister brand")}</a>
        </nav>
      </div>
      <div className="site-footer__legal">
        <span>{t("© 2026 Air Dive Alor Team")}</span>
        <Link href={ROUTES.faq}>{t("Safety policy")}</Link>
        <Link href={ROUTES.faq}>{t("Cancellation policy")}</Link>
        <Link href={ROUTES.faq}>{t("Privacy")}</Link>
      </div>
    </footer>
  );
}
