import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getHome } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { pageAlternates, pagePath, itemPath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { HomeView } from "./_home/HomeView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("home");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getHome();
  return seoMetadata(data.content.seo, data.media, lang, ALT, mediaUrl(data.content.hero.image, data.media));
}

export default async function HomePage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getHome();
  const L = ld(lang);
  const c = data.content;
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({ path: pagePath(lang, "home"), name: tl(c.seo.title, lang), description: tl(c.seo.description, lang), image: L.image(c.seo.ogImage, data.media) ?? L.image(c.hero.image, data.media), dateModified: data.publishedAt }),
    data.order.includes("faq") ? L.faq(c.faq.items.map((x) => ({ ...x, path: x.page && data.faqPages?.[x.page] ? itemPath(lang, "faqs", data.faqPages[x.page]) : undefined }))) : null,
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <HomeView data={data} />
    </AlternatesProvider>
  );
}
