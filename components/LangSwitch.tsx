"use client";

import Link from "@/components/LocalLink";
import { useAlternates, useLang } from "@/lib/i18n";
import { otherLocale, pagePath } from "@/lib/i18n-routes";
import { Icon } from "./ui";

/** EN / ID link to the same page in the other language (each page provides it), else the other language's home. */
export function LangSwitch() {
  const { lang, locale } = useLang();
  const alternates = useAlternates();
  const other = otherLocale(locale);
  return (
    <Link
      href={alternates?.[other] ?? pagePath(other, "home")}
      className="lang-toggle"
      hrefLang={other}
      lang={other}
      aria-label={other === "id" ? "Baca dalam Bahasa Indonesia" : "Read in English"}
      title={other === "id" ? "Bahasa Indonesia" : "English"}
    >
      <Icon name="globe" size={18} />
      <span className="lang-toggle__label">{lang === "EN" ? "EN / ID" : "ID / EN"}</span>
    </Link>
  );
}
