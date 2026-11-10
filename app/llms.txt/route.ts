import { getBlog, getCourses, getDiveSites, getFacilities, getFaqs } from "@/lib/cms/fetch";
import { itemPath, pagePath, type Section } from "@/lib/i18n-routes";
import { BUSINESS } from "@/lib/seo/jsonld";
import { ORG_DESCRIPTION } from "@/lib/seo/site";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

const one = (s: string, n = 200) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

/**
 * /llms.txt (llmstxt.org): a plain Markdown summary of the site for AI assistants and crawlers,
 * built from the published CMS content.
 */
export async function GET() {
  const site = env.SITE_URL.replace(/\/$/, "");
  const u = (p: string) => `${site}${p}`;
  const pg = (s: Section) => u(pagePath("en", s));
  const [sites, courses, fac, blog, faqs] = await Promise.all([getDiveSites(), getCourses(), getFacilities(), getBlog(), getFaqs()]);

  const lines: string[] = [
    "# Air Dive Alor",
    "",
    `> ${ORG_DESCRIPTION}`,
    "",
    `Location: Alor Kecil, Alor Barat Laut, Alor Regency, East Nusa Tenggara, Indonesia. Contact: WhatsApp ${BUSINESS.telephone} (replies 7am to 9pm WITA), ${BUSINESS.email}. The website is in English (${u("/en")}) and Indonesian (${u("/id")}): the same pages, with translated web addresses (for example ${u(pagePath("en", "diveSites"))} and ${u(pagePath("id", "diveSites"))}). Links below are the English versions.`,
    "",
    "## Main pages",
    "",
    `- [Home](${pg("home")}): overview, prices at a glance, why dive Alor, reviews and FAQ`,
    `- [Dive sites](${pg("diveSites")}): ${sites.sites.length} dive sites around Alor, Pantar and Pura, each with a site guide`,
    `- [Facilities and rates](${pg("facilities")}): rooms, boats, gear and dive packages with prices`,
    `- [Dive courses](${pg("courses")}): SDI and TDI courses from Open Water to Divemaster, stay included`,
    `- [About us](${pg("about")}): the six brothers behind the dive center, our name and our boats`,
    `- [Blog](${pg("blog")}): stories from the dive center, the reef and the village`,
    "",
    "## Dive packages",
    "",
  ];
  for (const p of fac.content.rates.packages) {
    const from = p.rows[0] ? `from ${p.rows[0].price} (${p.rows[0].days} days, ${p.rows[0].nights} nights, ${p.rows[0].dives} dives)` : p.cards.map((c) => `${c.label.en} ${c.price} ${c.per.en}`).join("; ");
    lines.push(`- ${p.name.en}${p.sub.en ? ` (${p.sub.en})` : ""}: ${from}. Included: ${p.included.map((i) => i.text.en).join(", ") || "see page"}.`);
  }
  lines.push("", `Details: ${pg("facilities")}`, "", "## Dive courses", "");
  for (const c of courses.courses) lines.push(`- [${c.name.en}](${u(itemPath("en", "courses", c))}): ${c.level}, ${c.agency}, ${c.price}, ${[c.stay.en, c.dives.en].filter(Boolean).join(", ")}. ${one(c.text.en)}`);
  lines.push("", "## Dive sites", "");
  for (const s of sites.sites) lines.push(`- [${s.name}](${u(itemPath("en", "sites", s))}): ${[s.type.en, s.depth && `depth ${s.depth}`, s.level.en].filter(Boolean).join(", ")}. ${one(s.intro.en, 160)}`);
  lines.push("", "## FAQ", "", `All questions: ${pg("faq")}`, "");
  for (const f of faqs.faqs) lines.push(`- ${f.hasPage ? `[${f.question.en}](${u(itemPath("en", "faqs", f))})` : f.question.en}: ${one(f.answer.en, 240)}`);
  lines.push("", "## Blog", "");
  for (const p of blog.posts) lines.push(`- [${p.title.en}](${u(itemPath("en", "posts", p))}) (${p.date}): ${one(p.excerpt.en, 160)}`);
  lines.push("", "## Optional", "", `- [Sitemap](${u("/sitemap.xml")})`, `- [Instagram](https://www.instagram.com/air.dive/)`, `- [Tripadvisor reviews](${BUSINESS.sameAs[3]})`, "");

  return new Response(lines.join("\n"), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
