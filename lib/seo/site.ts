import { env } from "../server/env";
import { Ld } from "./jsonld";

/** JSON-LD builder for this site (SITE_URL). Server only. */
export const ld = () => new Ld(env.SITE_URL);

/** Short description of the business, used in the Organization node. */
export const ORG_DESCRIPTION =
  "Indonesian-owned dive center in Alor Kecil, East Nusa Tenggara, founded in 2017. Fun dives at 30+ sites around Alor and Pantar, SDI and TDI courses from Open Water to Divemaster, and stays in the village with three meals a day.";
