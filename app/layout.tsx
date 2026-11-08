import type { Metadata } from "next";
import { Inter, Playfair_Display, Roboto } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { DEFAULT_SHARE_IMAGE } from "@/lib/cms/seo";
import { LangProvider } from "@/lib/i18n";
import { env } from "@/lib/server/env";
import "./tokens.css";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], variable: "--ff-playfair", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-roboto", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-inter", display: "swap" });
// The design system's Lucide icon font: one glyph per icon, drawn in currentColor.
const lucide = localFont({ src: "./fonts/lucide.woff2", variable: "--ff-lucide", display: "block", preload: false });

/** Site-wide defaults; each page sets its own title, description, canonical URL and share image. */
export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: "Air Dive Alor",
  description: "Dive center in Alor Kecil, East Nusa Tenggara, Indonesia: fun dives, SDI and TDI courses, and stays in the village.",
  applicationName: "Air Dive Alor",
  icons: { icon: "/brand/logo-mark-white.png", apple: "/brand/logo-mark-white.png" },
  openGraph: { siteName: "Air Dive Alor", type: "website", locale: "en_US", alternateLocale: ["id_ID"], images: [DEFAULT_SHARE_IMAGE] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${roboto.variable} ${inter.variable} ${lucide.variable}`}>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
