import { NextResponse } from "next/server";
import { publicFaqPayload } from "@/lib/server/public-payload";

/** Public, read-only: one published FAQ question with its full answer. 404 when it is unpublished, hidden, unknown or has no full answer. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const data = await publicFaqPayload(slug);
    if (!data) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
  } catch (e) {
    console.error(`public faq api (${slug})`, e);
    return NextResponse.json({ error: "Content is unavailable." }, { status: 503 });
  }
}
