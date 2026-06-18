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

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let n = 0;
  for (const row of HYMNS) {
    await prisma.hymn.upsert({
      where: { number: row.number },
      update: { titleEs: row.titleEs, titleEn: row.titleEn ?? null },
      create: { number: row.number, titleEs: row.titleEs, titleEn: row.titleEn ?? null },
    });
    n++;
  }
  
  const total = await prisma.hymn.count();
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
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
