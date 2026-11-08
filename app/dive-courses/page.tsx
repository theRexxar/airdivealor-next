import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getCourses } from "@/lib/cms/fetch";
import { seoMetadata } from "@/lib/cms/seo";
import { courseHref } from "@/lib/courses";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { CoursesView } from "./CoursesView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getCourses();
  return seoMetadata(data.content.seo, data.media, "/dive-courses");
}

export default async function CoursesPage() {
  const data = await getCourses();
  const L = ld();
  const c = data.content;
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({
      type: "CollectionPage",
      path: "/dive-courses",
      name: c.seo.title.en,
      description: c.seo.description.en,
      image: L.image(c.seo.ogImage, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.itemList("SDI and TDI dive courses in Alor", data.courses.map((x) => ({ path: courseHref(x.slug), name: x.name.en }))),
    }),
    L.breadcrumbs("/dive-courses", [{ name: "Dive courses", path: "/dive-courses" }]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <CoursesView data={data} />
    </>
  );
}
