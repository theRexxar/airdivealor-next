import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getAbout } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { pageAlternates, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { AboutView } from "./AboutView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("about");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getAbout();
  return seoMetadata(data.content.seo, data.media, lang, ALT, mediaUrl(data.content.hero.image, data.media));
}

export default async function AboutPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getAbout();
  const L = ld(lang);
  const c = data.content;
  const path = pagePath(lang, "about");
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({
      type: "AboutPage",
      path,
      name: tl(c.seo.title, lang),
      description: tl(c.seo.description, lang),
      image: L.image(c.seo.ogImage, data.media) ?? L.image(c.hero.image, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.ref(L.orgId),
    }),
    L.breadcrumbs(path, [{ name: L.w("About us", "Tentang kami"), path }]),
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <AboutView data={data} />
    </AlternatesProvider>
  );
}
