/**
 * DB access layer for the Hymn table using Prisma.
 */
import { prisma } from "@/lib/db";
import type { HymnRow } from "./types";

export async function getHymn(number: number): Promise<HymnRow | null> {
  const row = await prisma.hymn.findUnique({
    where: { number },
  });
  if (!row) return null;
  return { number: row.number, titleEs: row.titleEs, titleEn: row.titleEn };
}

/**
 * Search hymns by number prefix or title substring (case-insensitive).
 * Returns up to `limit` matches, ordered by exact-number-match first, then
 * number-asc, then title-asc.
 */
export async function searchHymns(q: string, limit = 10): Promise<HymnRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const num = Number(trimmed);
  const exactNum = (Number.isInteger(num) && num > 0) ? num : -1;
  const numPrefix = exactNum > 0 ? `${num}%` : "NONE";
  const titleMatch = `%${trimmed.toLowerCase()}%`;
  const lim = Math.max(1, Math.min(50, limit));

  // Postgres native placeholders
  const sql = `
    SELECT number, "titleEs", "titleEn" FROM "Hymn"
    WHERE (number = $1 OR CAST(number AS TEXT) LIKE $2 OR LOWER("titleEs") LIKE $3)
    ORDER BY
      CASE WHEN number = $4 THEN 0 ELSE 1 END,
      number ASC,
      "titleEs" ASC
    LIMIT $5
  `;
  
  const rowsRaw: any[] = await prisma.$queryRawUnsafe(
    sql,
    exactNum,
    numPrefix,
    titleMatch,
    exactNum,
    lim
  );

  return rowsRaw.map((r) => ({
    number: r.number,
    titleEs: r.titleEs,
    titleEn: r.titleEn,
  }));
}
