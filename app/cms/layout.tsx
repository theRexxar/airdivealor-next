import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LangProvider } from "@/lib/i18n";
import { fontClasses } from "../fonts";
import "../tokens.css";
import "../globals.css";

export const metadata: Metadata = { title: "Air Dive Alor CMS", robots: { index: false, follow: false }, icons: { icon: "/brand/logo-mark-white.png" } };

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
