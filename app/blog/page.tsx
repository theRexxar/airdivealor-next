import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { postHref } from "@/lib/blog";
import { getBlog } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata } from "@/lib/cms/seo";
import { graph } from "@/lib/seo/jsonld";
import { ld, ORG_DESCRIPTION } from "@/lib/seo/site";
import { BlogIndex } from "./BlogIndex";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getBlog();
  return seoMetadata(data.content.seo, data.media, "/blog", data.posts[0] ? mediaUrl(data.posts[0].cover, data.media) : undefined);
}

export default async function BlogPage() {
  const data = await getBlog();
  const L = ld();
  const c = data.content;
  const posts = data.posts.map((p) => ({ node: L.blogPosting({ post: p, path: postHref(p.slug), media: data.media, categories: data.categories }) }));
  const doc = graph(
    L.organization(ORG_DESCRIPTION),
    L.website(),
    L.webPage({
      type: "CollectionPage",
      path: "/blog",
      name: c.seo.title.en,
      description: c.seo.description.en,
      image: L.image(c.seo.ogImage, data.media),
      breadcrumb: true,
      dateModified: data.publishedAt,
      mainEntity: L.ref(`${L.url("/blog")}#blog`),
    }),
    L.blog(c, "/blog", posts),
    L.breadcrumbs("/blog", [{ name: "Blog", path: "/blog" }]),
  );
  return (
    <>
      <JsonLd data={doc} />
      <BlogIndex data={data} />
    </>
  );
}
