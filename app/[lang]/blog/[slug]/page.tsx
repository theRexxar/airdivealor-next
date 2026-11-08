import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/cms/fetch";
import { mediaUrl, pageMetadata, tl } from "@/lib/cms/seo";
import { AlternatesProvider } from "@/lib/i18n";
import { itemAlternates, itemPath, itemSlug, pagePath } from "@/lib/i18n-routes";
import { pageLang } from "@/lib/i18n-server";
import { graph } from "@/lib/seo/jsonld";
import { ld, orgDescription } from "@/lib/seo/site";
import { PostView } from "./PostView";

/** Rendered per request from the cached CMS API response (see lib/cms/fetch.ts). */
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const data = await getPost((await params).slug);
  if (!data) return {};
  const p = data.post;
  const cat = data.categories.find((c) => c.slug === p.category);
  return pageMetadata({
    lang,
    alternates: itemAlternates("posts", p),
    title: `${tl(p.title, lang)} | Air Dive Alor`,
    description: tl(p.excerpt, lang),
    image: mediaUrl(p.cover, data.media),
    type: "article",
    publishedTime: p.date,
    section: cat ? tl(cat.name, lang) : undefined,
  });
}

export default async function PostPage({ params }: Props) {
  const lang = await pageLang(params);
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const p = data.post;
  if (slug !== itemSlug(lang, p)) permanentRedirect(itemPath(lang, "posts", p));
  const L = ld(lang);
  const path = itemPath(lang, "posts", p);
  const doc = graph(
    L.organization(orgDescription(lang)),
    L.website(),
    L.webPage({ path, name: tl(p.title, lang), description: tl(p.excerpt, lang), image: L.image(p.cover, data.media), breadcrumb: true, mainEntity: L.ref(`${L.url(path)}#article`) }),
    L.blogPosting({ post: p, path, media: data.media, categories: data.categories, author: p.author }),
    L.breadcrumbs(path, [
      { name: "Blog", path: pagePath(lang, "blog") },
      { name: tl(p.title, lang), path },
    ]),
  );
  return (
    <AlternatesProvider value={itemAlternates("posts", p)}>
      <JsonLd data={doc} />
      <PostView data={data} />
    </AlternatesProvider>
  );
}
