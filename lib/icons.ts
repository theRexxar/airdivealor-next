import type { Metadata } from "next";

/**
 * Favicons for the website and the CMS: favicon.ico (16, 32 and 48 px) for every browser, PNGs at
 * 16 and 32 px, the 180 px Apple touch icon (on the dark brand background, since iOS needs an
 * opaque icon) and the web app manifest with the 192 and 512 px icons.
 */
export const SITE_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/favicon.ico", sizes: "48x48" },
    { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  ],
  apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};
export const SITE_MANIFEST = "/site.webmanifest";
