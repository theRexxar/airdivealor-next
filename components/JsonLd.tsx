import type { Node } from "@/lib/seo/jsonld";

/**
 * Structured data for search engines and AI crawlers (schema.org JSON-LD). Server-rendered into the HTML.
 * "<" is escaped so content can never close the script tag.
 */
export function JsonLd({ data }: { data: Node }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
