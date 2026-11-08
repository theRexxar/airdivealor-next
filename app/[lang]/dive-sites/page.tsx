import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getDiveSites } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemPath, pageAlternates, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { SitesView } from "./SitesView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("diveSites");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getDiveSites();
  return seoMetadata(data.content.seo, data.media, lang, ALT, mediaUrl(data.content.hero.image, data.media));
}

export default async function SitesPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getDiveSites();
  const L = ld(lang);
  const c = data.content;
  const path = pagePath(lang, "diveSites");
  const name = L.w("Dive sites", "Titik selam");
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({
      type: "CollectionPage",
      path,
      name: tl(c.seo.title, lang),
      description: tl(c.seo.description, lang),
      image: L.image(c.seo.ogImage, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.itemList(L.w("Dive sites around Alor and Pantar", "Titik selam di sekitar Alor dan Pantar"), data.sites.map((s) => ({ path: itemPath(lang, "sites", s), name: s.name }))),
    }),
    L.breadcrumbs(path, [{ name, path }]),
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <SitesView data={data} />
    </AlternatesProvider>
  );
}
