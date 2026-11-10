import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getFaqs } from "@/lib/cms/fetch";
import { seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemPath, pageAlternates, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { FaqIndexView } from "./FaqIndexView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("faq");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getFaqs();
  return seoMetadata(data.content.seo, data.media, lang, ALT);
}

export default async function FaqPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getFaqs();
  const L = ld(lang);
  const c = data.content;
  const path = pagePath(lang, "faq");
  const faq = L.faq(
    data.faqs.map((f) => ({ q: f.question, a: f.answer, path: f.hasPage ? itemPath(lang, "faqs", f) : undefined })),
    `${L.url(path)}#faq`,
  );
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({
      path,
      name: tl(c.seo.title, lang),
      description: tl(c.seo.description, lang),
      image: L.image(c.seo.ogImage, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: faq ? L.ref(`${L.url(path)}#faq`) : undefined,
    }),
    faq,
    L.breadcrumbs(path, [{ name: L.w("FAQ", "Tanya jawab"), path }]),
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <FaqIndexView data={data} />
    </AlternatesProvider>
  );
}
