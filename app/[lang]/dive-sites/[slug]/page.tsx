import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import type { SiteContent } from "@/lib/cms/dive-sites-types";
import { getSite } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemAlternates, itemPath, itemSlug, pagePath, type Locale } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { SiteGuideView } from "./SiteGuideView";

/** Site guides come from the CMS, so new sites work without a rebuild. */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string }> };

const title = (s: SiteContent, lang: Locale) => (lang === "id" ? `Panduan titik selam ${s.name}` : `${s.name} dive site guide`);
const description = (s: SiteContent, lang: Locale) => tl(s.intro, lang) || `${title(s, lang)}${s.depth ? `, ${s.depth}` : ""}.`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getSite((await params).slug);
  if (!data) return {};
  const s = data.site;
  return pageMetadata({ lang, alternates: itemAlternates("sites", s), title: `${title(s, lang)} | Air Dive Alor`, description: description(s, lang), image: mediaUrl(s.photo, data.media) });
}

export default async function SiteGuidePage({ params }: Props) {
  const lang = await pageLang(params);
  const { slug } = await params;
  const data = await getSite(slug);
  if (!data) notFound();
  const s = data.site;
  // One address per language: the other language's slug redirects to this language's.
  if (slug !== itemSlug(lang, s)) permanentRedirect(itemPath(lang, "sites", s));
  const L = ld(lang);
  const path = itemPath(lang, "sites", s);
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({ path, name: title(s, lang), description: description(s, lang), image: L.image(s.photo, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#site`) }),
    L.diveSite(s, data.media, path),
    L.breadcrumbs(path, [
      { name: L.w("Dive sites", "Titik selam"), path: pagePath(lang, "diveSites") },
      { name: s.name, path },
    ]),
  );
  return (
    <AlternatesProvider value={itemAlternates("sites", s)}>
      <JsonLd data={doc} />
      <SiteGuideView data={data} />
    </AlternatesProvider>
  );
}
