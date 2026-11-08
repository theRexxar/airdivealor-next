"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n-routes";

/**
 * next/link that puts site links into the current language: "/dive-courses" on an Indonesian page becomes
 * "/id/kursus-selam". Links that already have a language, external links and /cms or /api links are unchanged.
 */
export default function LocalLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const locale = useLocale();
  const h = typeof href === "string" ? localizeHref(href, locale) : href;
  return <Link href={h} {...rest} />;
}
