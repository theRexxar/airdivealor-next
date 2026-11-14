import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getMenus } from "@/lib/cms/fetch";
import { DEFAULT_SHARE_IMAGE } from "@/lib/cms/seo";
import { MenusProvider } from "@/lib/menus-context";
import { SITE_ICONS, SITE_MANIFEST } from "@/lib/icons";
import { LangProvider } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n-routes";
import { env } from "@/lib/server/env";
import { fontClasses } from "../fonts";
import "../tokens.css";
import "../globals.css";

/** Site-wide defaults; each page sets its own title, description, canonical URL, alternates and share image. */
export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: "Air Dive Alor",
  description: "Dive center in Alor Kecil, East Nusa Tenggara, Indonesia: fun dives, SDI and TDI courses, and stays in the village.",
  applicationName: "Air Dive Alor",
  icons: SITE_ICONS,
  manifest: SITE_MANIFEST,
  openGraph: { siteName: "Air Dive Alor", type: "website", images: [DEFAULT_SHARE_IMAGE] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
};

/** Browser UI colour on phones: the dark brand colour of the header. */
export const viewport: Viewport = { themeColor: "#202020" };

/** Root layout of the public website: /en/... and /id/... */
export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const menus = await getMenus();
  return (
    <html lang={lang} className={fontClasses}>
      <body>
        <LangProvider lang={lang}>
          <MenusProvider value={menus.content}>{children}</MenusProvider>
        </LangProvider>
      </body>
    </html>
  );
}
