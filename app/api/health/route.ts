import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { redis } from "@/lib/server/redis";

export const dynamic = "force-dynamic";

/** Resolve to "ok", or "down" if the check fails or takes longer than 2 seconds. */
const check = (p: () => Promise<unknown>) =>
  Promise.race([p().then(() => "ok", () => "down"), new Promise<string>((r) => setTimeout(() => r("down"), 2000))]);

/** Liveness check for Railway and uptime monitors: the app answers and reaches MySQL and Redis. */
export async function GET() {
  const [mysql, rds] = await Promise.all([
    check(() => db.execute(sql`select 1`)),
    check(async () => {
      if ((await redis().ping()) !== "PONG") throw new Error("no PONG");
    }),
  ]);
  const ok = mysql === "ok" && rds === "ok";
  return NextResponse.json({ ok, mysql, redis: rds }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
