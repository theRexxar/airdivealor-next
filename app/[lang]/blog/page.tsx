import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getBlog } from "@/lib/cms/fetch";
import { mediaUrl, seoMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemPath, pageAlternates, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { BlogIndex } from "./BlogIndex";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
const ALT = pageAlternates("blog");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getBlog();
  return seoMetadata(data.content.seo, data.media, lang, ALT, data.posts[0] ? mediaUrl(data.posts[0].cover, data.media) : undefined);
}

export default async function BlogPage({ params }: Props) {
  const lang = await pageLang(params);
  const data = await getBlog();
  const L = ld(lang);
  const c = data.content;
  const path = pagePath(lang, "blog");
  const posts = data.posts.map((p) => ({ node: L.blogPosting({ post: p, path: itemPath(lang, "posts", p), media: data.media, categories: data.categories }) }));
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
      mainEntity: L.ref(`${L.url(path)}#blog`),
    }),
    L.blog(c, path, posts),
    L.breadcrumbs(path, [{ name: "Blog", path }]),
  );
  return (
    <AlternatesProvider value={ALT}>
      <JsonLd data={doc} />
      <BlogIndex data={data} />
    </AlternatesProvider>
  );
}
