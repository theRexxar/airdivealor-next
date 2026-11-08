import type { MetadataRoute } from "next";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

/**
 * Search engines and AI crawlers may read the whole public site. The CMS and the APIs are kept out.
 * AI crawlers are named so that the policy is explicit (they're allowed, like everyone else).
 */
export default function robots(): MetadataRoute.Robots {
  const site = env.SITE_URL.replace(/\/$/, "");
  const disallow = ["/cms", "/cms/", "/api/"];
  const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiBots, allow: ["/", "/llms.txt"], disallow },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
