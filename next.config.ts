import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Always put <title>, description, canonical, Open Graph and Twitter tags in <head>, for every visitor.
   * Next.js otherwise streams them into <body> for user agents outside its bot list, which leaves out AI
   * crawlers (GPTBot, ClaudeBot, PerplexityBot, …). The metadata reads the same cached CMS data as the
   * page, so waiting for it costs almost nothing.
   */
  htmlLimitedBots: /.*/,

  /** Pages of the old airdivealor.com that now live elsewhere, so old links and search results keep working. */
  async redirects() {
    return [{ source: "/how-to-get-to-alor", destination: "/en/faq/how-to-get-to-alor", permanent: true }];
  },
};

export default nextConfig;
