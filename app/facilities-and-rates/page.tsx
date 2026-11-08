import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getFacilities } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata } from "@/lib/cms/seo";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { FacilitiesView } from "./FacilitiesView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
const PATH = "/facilities-and-rates";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getFacilities();
  return seoMetadata(data.content.seo, data.media, PATH, mediaUrl(data.content.hero.image, data.media));
}

export default async function FacilitiesPage() {
  const data = await getFacilities();
  const L = ld();
  const c = data.content;
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({
      path: PATH,
      name: c.seo.title.en,
      description: c.seo.description.en,
      image: L.image(c.seo.ogImage, data.media) ?? L.image(c.hero.image, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.ref(`${L.url(PATH)}#rates`),
    }),
    data.order.includes("rates") ? L.rates(c, PATH) : null,
    L.breadcrumbs(PATH, [{ name: "Facilities and rates", path: PATH }]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <FacilitiesView data={data} />
    </>
  );
}
