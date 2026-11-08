import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getAbout } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata } from "@/lib/cms/seo";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { AboutView } from "./AboutView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getAbout();
  return seoMetadata(data.content.seo, data.media, "/about-us", mediaUrl(data.content.hero.image, data.media));
}

export default async function AboutPage() {
  const data = await getAbout();
  const L = ld();
  const c = data.content;
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({
      type: "AboutPage",
      path: "/about-us",
      name: c.seo.title.en,
      description: c.seo.description.en,
      image: L.image(c.seo.ogImage, data.media) ?? L.image(c.hero.image, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.ref(L.orgId),
    }),
    L.breadcrumbs("/about-us", [{ name: "About us", path: "/about-us" }]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <AboutView data={data} />
    </>
  );
}
