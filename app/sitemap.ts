import type { MetadataRoute } from "next";
import { env } from "@/lib/server/env";
import { publicUrls } from "@/lib/server/sitemap-data";

/** Built per request from the CMS, so new and hidden pages show up (or drop out) straight away. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = env.SITE_URL.replace(/\/$/, "");
  return (await publicUrls()).map((u) => ({
    url: `${site}${u.path === "/" ? "/" : u.path}`,
    ...(u.lastModified ? { lastModified: u.lastModified } : {}),
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}
