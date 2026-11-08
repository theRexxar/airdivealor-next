import type { Locale } from "../i18n-routes";
import { env } from "../server/env";
import { Ld } from "./jsonld";

/** JSON-LD builder for this site (SITE_URL) in a language. Server only. */
export const ld = (lang: Locale) => new Ld(env.SITE_URL, lang);

/** Short description of the business, used in the Organization node and llms.txt. */
export const ORG_DESCRIPTION_ID =
  "Dive center milik orang Indonesia di Alor Kecil, Nusa Tenggara Timur, berdiri sejak 2017. Fun dive di lebih dari 30 titik selam di sekitar Alor dan Pantar, kursus SDI dan TDI dari Open Water sampai Divemaster, dan menginap di desa dengan tiga kali makan sehari.";
export const orgDescription = (lang: Locale) => (lang === "id" ? ORG_DESCRIPTION_ID : ORG_DESCRIPTION);
export const ORG_DESCRIPTION =
  "Indonesian-owned dive center in Alor Kecil, East Nusa Tenggara, founded in 2017. Fun dives at 30+ sites around Alor and Pantar, SDI and TDI courses from Open Water to Divemaster, and stays in the village with three meals a day.";
