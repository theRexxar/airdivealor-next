import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./i18n-routes";

/** The page language from the [lang] route segment (404 for anything but en/id). */
export async function pageLang(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}
