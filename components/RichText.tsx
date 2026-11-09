import type { ResolvedMedia } from "@/lib/cms/home-types";
import { useLocale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n-routes";
import { prepareRich, richIsEmpty } from "@/lib/rich-text";

/**
 * Rich text from the CMS editor on a page. The HTML was cleaned on the server (lib/server/rich-sanitize.ts)
 * before it reached the page, so it is safe to insert.
 */
export function RichText({ html, media, className = "rich", sizes }: { html: string; media: Record<string, ResolvedMedia>; className?: string; sizes?: string }) {
  const lang = useLocale();
  if (richIsEmpty(html)) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: prepareRich(html, media, lang, (h) => localizeHref(h, lang), sizes) }} />;
}
