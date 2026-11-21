import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Always put <title>, description, canonical, Open Graph and Twitter tags in <head>, for every visitor.
   * Next.js otherwise streams them into <body> for user agents outside its bot list, which leaves out AI
   * crawlers (GPTBot, ClaudeBot, PerplexityBot, …). The metadata reads the same cached CMS data as the
   * page, so waiting for it costs almost nothing.
   */
  htmlLimitedBots: /.*/,

  /** No "X-Powered-By: Next.js": don't advertise the framework. */
  poweredByHeader: false,

  /**
   * Security headers on every response:
   * - frame-ancestors / X-Frame-Options: no other site can show these pages in a frame (clickjacking,
   *   e.g. tricking a signed-in editor into clicking CMS buttons). Our own pages may frame themselves.
   * - base-uri, form-action, object-src: injected markup can't redirect links or forms, or load plugins.
   * - nosniff: files are only used as the type the server says (an image can't run as a script).
   * - Referrer-Policy: other sites see only our domain, never full CMS or preview URLs.
   * - Permissions-Policy: no camera, microphone, location or payment access for any page.
   * - HSTS: browsers use HTTPS only for this domain for a year (ignored on http://localhost).
   * CMS pages are also kept out of search engines and out of shared caches.
   */
  async headers() {
    const security = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];
    const privateArea = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/cms", headers: privateArea },
      { source: "/cms/:path*", headers: privateArea },
      { source: "/api/cms/:path*", headers: privateArea },
    ];
  },

  /** Pages of the old airdivealor.com that now live elsewhere, so old links and search results keep working. */
  async redirects() {
    return [{ source: "/how-to-get-to-alor", destination: "/en/faq/how-to-get-to-alor", permanent: true }];
  },
};

export default nextConfig;
