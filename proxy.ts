/**
 * Language routing (Next.js proxy):
 * - /en/... and /id/... are the public URLs. Indonesian path segments (/id/titik-selam/...) are rewritten
 *   onto the app's English folders (/id/dive-sites/...); a segment in the wrong language redirects.
 * - URLs without a language (old links, "/") redirect to the visitor's last language, or English.
 * - The language of each visit is remembered in a cookie.
 */
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LANG_COOKIE, localizeHref, SEGMENTS, sectionOf, type Locale } from "./lib/i18n-routes";

const YEAR = 60 * 60 * 24 * 365;

function remember(res: NextResponse, req: NextRequest, lang: Locale) {
  if (req.cookies.get(LANG_COOKIE)?.value !== lang) res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean);

  if (isLocale(parts[0])) {
    const lang = parts[0];
    const seg = parts[1];
    const s = seg ? sectionOf(seg) : null;
    if (s) {
      const want = SEGMENTS[s.section][lang];
      if (seg !== want) {
        // e.g. /id/dive-sites → /id/titik-selam
        const url = req.nextUrl.clone();
        url.pathname = `/${[lang, want, ...parts.slice(2)].join("/")}`;
        return remember(NextResponse.redirect(url, 308), req, lang);
      }
      const folder = SEGMENTS[s.section].en;
      if (seg !== folder) {
        // /id/titik-selam/x → app/[lang]/dive-sites/[slug] with lang=id
        const url = req.nextUrl.clone();
        url.pathname = `/${[lang, folder, ...parts.slice(2)].join("/")}`;
        return remember(NextResponse.rewrite(url), req, lang);
      }
    }
    return remember(NextResponse.next(), req, lang);
  }

  // No language in the URL: use the visitor's last language, else English.
  const saved = req.cookies.get(LANG_COOKIE)?.value;
  const lang: Locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  const target = localizeHref(pathname, lang);
  url.pathname = target;
  url.search = search;
  // Permanent for crawlers and first visits (old links move to /en/...), temporary when a saved choice decided.
  return NextResponse.redirect(url, isLocale(saved) ? 307 : 308);
}

export const config = {
  // Everything except Next.js internals, the CMS, the APIs and files (images, sitemap.xml, robots.txt, llms.txt).
  matcher: ["/((?!_next|api|cms|.*\\..*).*)"],
};
