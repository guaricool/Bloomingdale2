/**
 * Seed the Hymn table from a static list of all 341 Spanish hymns using Prisma.
 *
 * Source strategy:
 *  - Numbers 1-209 were extracted from the official churchofjesuschrist.org
 *    hymnal index page (https://www.churchofjesuschrist.org/study/manual/hymns?lang=spa)
 *    which is server-side rendered with the canonical Spanish titles.
 *  - Numbers 210-341 are NOT in the SSR index; the page only ships the first
 *    209 in the initial HTML. The remaining 132 are filled in here with the
 *    canonical Spanish titles from the 1985 Himnario de la Iglesia de
 *    Jesucristo, cross-referenced against multiple public sources.
 *    TODO(verify-himnos-210-341): re-validate each title against the
 *    official hymnal once the church website exposes the full list or we
 *    ship a small worker that fetches the music SPA's data endpoint.
 *
 * The seed is idempotent: it uses upsert so re-running it overwrites stale 
 * titles without duplicating rows.
 */
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { HYMNS } from "../db/hymns-data";
import "dotenv/config";
import * as path from "node:path";

const connectionString = process.env.DATABASE_URL || "./data/bloomingdale.db";
const isPostgres = connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://");

async function main() {
  let n = 0;
  let total = 0;

  if (isPostgres) {
    console.log(`[seed] PostgreSQL DB via Prisma adapter`);
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
      for (const row of HYMNS) {
        await prisma.hymn.upsert({
          where: { number: row.number },
          update: { titleEs: row.titleEs, titleEn: row.titleEn ?? null },
          create: { number: row.number, titleEs: row.titleEs, titleEn: row.titleEn ?? null },
        });
        n++;
      }
      total = await prisma.hymn.count();
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  } else {
    // Seed SQLite via better-sqlite3 directly
    const Database = require("better-sqlite3");
    const cleanedPath = connectionString
      .replace(/^sqlite:\/\//, "")
      .replace(/^file:/, "");
    const resolvedDbPath = path.isAbsolute(cleanedPath)
      ? cleanedPath
      : path.resolve(process.cwd(), cleanedPath);

    console.log(`[seed] SQLite DB directly: ${resolvedDbPath}`);
    const db = new Database(resolvedDbPath);

    const insertStmt = db.prepare(`
      INSERT INTO Hymn (number, titleEs, titleEn)
      VALUES (?, ?, ?)
      ON CONFLICT(number) DO UPDATE SET
        titleEs = excluded.titleEs,
        titleEn = excluded.titleEn
    `);

    const tx = db.transaction(() => {
      for (const row of HYMNS) {
        insertStmt.run(row.number, row.titleEs, row.titleEn ?? null);
        n++;
      }
    });

    tx();
    total = (db.prepare("SELECT COUNT(*) as count").get() as { count: number }).count;
    db.close();
  }

  console.log(`[seed] hymns: wrote/updated ${n}, total in DB: ${total}`);
  if (total < 341) {
    console.warn(
      `[seed] WARN: total hymns (${total}) is less than 341. See db/hymns-data.ts TODO.`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
