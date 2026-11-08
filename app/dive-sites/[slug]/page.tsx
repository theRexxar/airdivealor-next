import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getSite } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata } from "@/lib/cms/seo";
import { siteHref } from "@/lib/sites";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { SiteGuideView } from "./SiteGuideView";

/** Site guides come from the CMS, so new sites work without a rebuild. */
export const dynamic = "force-dynamic";

const description = (s: { name: string; intro: { en: string }; depth: string; level: { en: string } }) =>
  s.intro.en || `${s.name}: dive site guide${s.depth ? `, depth ${s.depth}` : ""}${s.level.en ? `, ${s.level.en}` : ""}.`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await getSite((await params).slug);
  if (!data) return {};
  const s = data.site;
  return pageMetadata({ title: `${s.name} dive site guide | Air Dive Alor`, description: description(s), path: siteHref(s.slug), image: mediaUrl(s.photo, data.media) });
}

export default async function SiteGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getSite((await params).slug);
  if (!data) notFound();
  const L = ld();
  const s = data.site;
  const path = siteHref(s.slug);
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({ path, name: `${s.name} dive site guide`, description: description(s), image: L.image(s.photo, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#site`) }),
    L.diveSite(s, data.media, path),
    L.breadcrumbs(path, [
      { name: "Dive sites", path: "/dive-sites" },
      { name: s.name, path },
    ]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <SiteGuideView data={data} />
    </>
  );
}
