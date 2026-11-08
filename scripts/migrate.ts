/**
 * Apply database migrations from ./drizzle (npm run db:migrate). Holds a MySQL lock while it runs, so two
 * services deploying at the same time (web and worker on Railway) never apply the same migration twice.
 */
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "../lib/server/db";
import { env } from "../lib/server/env";

const LOCK = "airdivealor:migrate";

async function main() {
  const conn = await mysql.createConnection(env.DATABASE_URL);
  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT GET_LOCK(?, 120) AS got", [LOCK]);
    if (rows[0]?.got !== 1) throw new Error("another deploy is still migrating (waited 2 minutes)");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.info("migrations applied");
  } finally {
    await conn.query("SELECT RELEASE_LOCK(?)", [LOCK]).catch(() => {});
    await conn.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
