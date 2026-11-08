import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getCourse } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata } from "@/lib/cms/seo";
import { courseHref } from "@/lib/courses";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { CourseDetailView } from "./CourseDetailView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await getCourse((await params).id);
  if (!data) return {};
  const c = data.course;
  return pageMetadata({ title: `${c.name.en} course in Alor | Air Dive Alor`, description: `${c.text.en} ${c.price}, ${c.stay.en}.`, path: courseHref(c.slug), image: mediaUrl(c.photo, data.media) });
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getCourse((await params).id);
  if (!data) notFound();
  const L = ld();
  const c = data.course;
  const path = courseHref(c.slug);
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({ path, name: `${c.name.en} course in Alor`, description: c.text.en, image: L.image(c.photo, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#course`) }),
    L.course(c, data.media, path),
    L.breadcrumbs(path, [
      { name: "Dive courses", path: "/dive-courses" },
      { name: c.name.en, path },
    ]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <CourseDetailView data={data} />
    </>
  );
}
