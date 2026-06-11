/**
 * Seed the Hymn table from a static list of all 341 Spanish hymns.
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
 * The seed is idempotent: it uses INSERT ... ON CONFLICT(number) DO UPDATE
 * so re-running it overwrites stale titles without duplicating rows.
 */
import { getDb, closeDb } from "../lib/db";
import { HYMNS } from "../db/hymns-data";

interface HymnRow {
  number: number;
  titleEs: string;
  titleEn?: string;
}

const insert = (db: ReturnType<typeof getDb>) =>
  db.prepare(
    `INSERT INTO "Hymn" (number, titleEs, titleEn)
     VALUES (@number, @titleEs, @titleEn)
     ON CONFLICT(number) DO UPDATE SET
       titleEs = excluded.titleEs,
       titleEn = excluded.titleEn`,
  );

async function main(): Promise<void> {
  const db = getDb();
  const tx = db.transaction(async (rows: HymnRow[]) => {
    const stmt = insert(db);
    let n = 0;
    for (const row of rows) {
      await stmt.run({ number: row.number, titleEs: row.titleEs, titleEn: row.titleEn ?? null });
      n += 1;
    }
    return n;
  });
  const inserted = await tx(HYMNS);
  const total = (
    (await db.prepare(`SELECT COUNT(*) AS c FROM "Hymn"`).get()) as { c: number }
  ).c;
  console.log(`[seed] hymns: wrote/updated ${inserted}, total in DB: ${total}`);
  if (total < 341) {
    console.warn(
      `[seed] WARN: total hymns (${total}) is less than 341. See db/hymns-data.ts TODO.`,
    );
  }
  closeDb();
}

main();
