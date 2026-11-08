import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getCourses } from "@/lib/cms/fetch";
import { seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemPath, pageAlternates, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { CoursesView } from "./CoursesView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("courses");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getCourses();
  return seoMetadata(data.content.seo, data.media, lang, ALT);
}

export default async function CoursesPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getCourses();
  const L = ld(lang);
  const c = data.content;
  const path = pagePath(lang, "courses");
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
      mainEntity: L.itemList(L.w("SDI and TDI dive courses in Alor", "Kursus selam SDI dan TDI di Alor"), data.courses.map((x) => ({ path: itemPath(lang, "courses", x), name: tl(x.name, lang) }))),
    }),
    L.breadcrumbs(path, [{ name: L.w("Dive courses", "Kursus selam"), path }]),
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <CoursesView data={data} />
    </AlternatesProvider>
  );
}
