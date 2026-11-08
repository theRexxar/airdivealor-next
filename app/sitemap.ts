import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n-routes";
import { env } from "@/lib/server/env";
import { publicUrls } from "@/lib/server/sitemap-data";

/** Built per request from the CMS, so new and hidden pages show up (or drop out) straight away. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = env.SITE_URL.replace(/\/$/, "");
  // Every page in both languages, each listing its other-language version (hreflang); x-default is English.
  return (await publicUrls()).flatMap((u) => {
    const languages = { en: `${site}${u.alternates.en}`, id: `${site}${u.alternates.id}`, "x-default": `${site}${u.alternates.en}` };
    return LOCALES.map((l) => ({
      url: `${site}${u.alternates[l]}`,
      ...(u.lastModified ? { lastModified: u.lastModified } : {}),
      changeFrequency: u.changeFrequency,
      priority: u.priority,
      alternates: { languages },
    }));
  });
}
