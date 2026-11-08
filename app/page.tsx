import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getHome } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata } from "@/lib/cms/seo";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { HomeView } from "./_home/HomeView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHome();
  return seoMetadata(data.content.seo, data.media, "/", mediaUrl(data.content.hero.image, data.media));
}

export default async function HomePage() {
  const data = await getHome();
  const L = ld();
  const c = data.content;
  const faq = data.order.includes("faq") ? L.faq(c.faq.items) : null;
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({ path: "/", name: c.seo.title.en, description: c.seo.description.en, image: L.image(c.seo.ogImage, data.media) ?? L.image(c.hero.image, data.media), dateModified: data.publishedAt }),
    faq,
  );
  return (
    <>
      <JsonLd data={doc} />
      <HomeView data={data} />
    </>
  );
}
