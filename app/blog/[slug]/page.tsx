import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { postHref } from "@/lib/blog";
import { getPost } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata } from "@/lib/cms/seo";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { PostView } from "./PostView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await getPost((await params).slug);
  if (!data) return {};
  const p = data.post;
  const cat = data.categories.find((c) => c.slug === p.category);
  return pageMetadata({
    title: `${p.title.en} | Air Dive Alor`,
    description: p.excerpt.en,
    path: postHref(p.slug),
    image: mediaUrl(p.cover, data.media),
    type: "article",
    publishedTime: p.date,
    section: cat?.name.en,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getPost((await params).slug);
  if (!data) notFound();
  const L = ld();
  const p = data.post;
  const path = postHref(p.slug);
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({ path, name: p.title.en, description: p.excerpt.en, image: L.image(p.cover, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#article`) }),
    L.blogPosting({ post: p, path, media: data.media, categories: data.categories, author: p.author }),
    L.breadcrumbs(path, [
      { name: "Blog", path: "/blog" },
      { name: p.title.en, path },
    ]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <PostView data={data} />
    </>
  );
}
