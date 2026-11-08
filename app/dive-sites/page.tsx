import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getDiveSites } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata } from "@/lib/cms/seo";
import { siteHref } from "@/lib/sites";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { SitesView } from "./SitesView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getDiveSites();
  return seoMetadata(data.content.seo, data.media, "/dive-sites", mediaUrl(data.content.hero.image, data.media));
}

export default async function SitesPage() {
  const data = await getDiveSites();
  const L = ld();
  const c = data.content;
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({
      type: "CollectionPage",
      path: "/dive-sites",
      name: c.seo.title.en,
      description: c.seo.description.en,
      image: L.image(c.seo.ogImage, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.itemList("Dive sites around Alor and Pantar", data.sites.map((s) => ({ path: siteHref(s.slug), name: s.name }))),
    }),
    L.breadcrumbs("/dive-sites", [{ name: "Dive sites", path: "/dive-sites" }]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <SitesView data={data} />
    </>
  );
}
