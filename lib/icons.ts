import type { Metadata } from "next";

/**
 * Favicons for the website and the CMS: favicon.ico (16, 32 and 48 px) for every browser, PNGs at
 * 16 and 32 px, the 180 px Apple touch icon and the web app manifest with the 192 and 512 px icons.
 * The white logo sits on a dark #202020 tile so it shows in light and dark browser tabs; tab icons
 * have rounded corners, the Apple and Android icons are square because the system rounds them.
 * At 16 and 32 px (PNGs and the matching sizes inside favicon.ico) only the mark is shown: the
 * "air / dive alor" wordmark is unreadable that small.
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
