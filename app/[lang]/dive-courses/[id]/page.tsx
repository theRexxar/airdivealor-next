import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import type { CourseContent } from "@/lib/cms/courses-types";
import { getCourse } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemAlternates, itemPath, itemSlug, pagePath, type Locale } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { CourseDetailView } from "./CourseDetailView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; id: string }> };

const title = (c: CourseContent, lang: Locale) => (lang === "id" ? `Kursus ${tl(c.name, lang)} di Alor` : `${tl(c.name, lang)} course in Alor`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getCourse((await params).id);
  if (!data) return {};
  const c = data.course;
  return pageMetadata({
    lang,
    alternates: itemAlternates("courses", c),
    title: `${title(c, lang)} | Air Dive Alor`,
    description: `${tl(c.text, lang)} ${c.price}${tl(c.stay, lang) ? `, ${tl(c.stay, lang)}` : ""}.`,
    image: mediaUrl(c.photo, data.media),
  });
}

export default async function CourseDetailPage({ params }: Props) {
  const lang = await pageLang(params);
  const { id } = await params;
  const data = await getCourse(id);
  if (!data) notFound();
  const c = data.course;
  if (id !== itemSlug(lang, c)) permanentRedirect(itemPath(lang, "courses", c));
  const L = ld(lang);
  const path = itemPath(lang, "courses", c);
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({ path, name: title(c, lang), description: tl(c.text, lang), image: L.image(c.photo, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#course`) }),
    L.course(c, data.media, path),
    L.breadcrumbs(path, [
      { name: L.w("Dive courses", "Kursus selam"), path: pagePath(lang, "courses") },
      { name: tl(c.name, lang), path },
    ]),
  );
  return (
    <AlternatesProvider value={itemAlternates("courses", c)}>
      <JsonLd data={doc} />
      <CourseDetailView data={data} />
    </AlternatesProvider>
  );
}
