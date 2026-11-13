import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_ICONS } from "@/lib/icons";
import { LangProvider } from "@/lib/i18n";
import { fontClasses } from "../fonts";
import "../tokens.css";
import "../globals.css";

export const metadata: Metadata = { title: "Air Dive Alor CMS", robots: { index: false, follow: false }, icons: SITE_ICONS };

/** Root layout of the CMS (/cms/...). Previews render the website in English. */
export default function CmsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontClasses}>
      <body>
        <LangProvider lang="en">{children}</LangProvider>
      </body>
    </html>
  );
}
