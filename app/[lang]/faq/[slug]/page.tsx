import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getFaq } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemAlternates, itemPath, itemSlug, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { richFirstImage, richText } from "@/lib/rich-text";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { FaqView } from "./FaqView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getFaq((await params).slug);
  if (!data) return {};
  const f = data.faq;
  return pageMetadata({
    lang,
    alternates: itemAlternates("faqs", f),
    title: `${tl(f.question, lang)} | Air Dive Alor`,
    description: tl(f.answer, lang),
    image: mediaUrl(f.cover, data.media) ?? mediaUrl(richFirstImage(f.body.en) ?? undefined, data.media),
    type: "article",
  });
}

export default async function FaqAnswerPage({ params }: Props) {
  const lang = await pageLang(params);
  const { slug } = await params;
  const data = await getFaq(slug);
  if (!data) notFound();
  const f = data.faq;
  if (slug !== itemSlug(lang, f)) permanentRedirect(itemPath(lang, "faqs", f));
  const L = ld(lang);
  const path = itemPath(lang, "faqs", f);
  const url = L.url(path);
  // The answer for search engines and AI assistants: the short answer, then the full one as plain text.
  const full = `${tl(f.answer, lang)} ${richText(tl(f.body, lang))}`.trim();
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({ path, name: tl(f.question, lang), description: tl(f.answer, lang), image: L.image(f.cover, data.media) ?? L.image(richFirstImage(f.body.en) ?? undefined, data.media), breadcrumb: true, dateModified: data.publishedAt, mainEntity: L.ref(`${url}#faq`) }),
    L.faq([{ q: f.question, a: f.answer, text: full, path }], `${url}#faq`),
    L.breadcrumbs(path, [
      { name: L.w("FAQ", "Tanya jawab"), path: pagePath(lang, "faq") },
      { name: tl(f.question, lang), path },
    ]),
  );
  return (
    <AlternatesProvider value={itemAlternates("faqs", f)}>
      <JsonLd data={doc} />
      <FaqView data={data} />
    </AlternatesProvider>
  );
}
