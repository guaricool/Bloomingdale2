/**
 * DB access layer for the Hymn table.
 *
 * Async: all functions return Promises. The DB layer can be SQLite (sync
 * semantics wrapped in a resolved Promise) or Postgres (native async). The
 * call sites `await` everything uniformly.
 */
import { getDb } from "@/lib/db";
import type { HymnRow } from "./types";

interface RawHymn {
  number: number;
  titleEs: string;
  titleEn: string | null;
}

function toHymn(r: RawHymn): HymnRow {
  return { number: r.number, titleEs: r.titleEs, titleEn: r.titleEn };
}

export async function getHymn(number: number): Promise<HymnRow | null> {
  const db = getDb();
  const row = (await db
    .prepare(`SELECT number, titleEs AS "titleEs", titleEn AS "titleEn" FROM "Hymn" WHERE number = ?`)
    .get(number)) as RawHymn | undefined;
  return row ? toHymn(row) : null;
}

/**
 * Search hymns by number prefix or title substring (case-insensitive).
 * Returns up to `limit` matches, ordered by exact-number-match first, then
 * number-asc, then title-asc.
 */
export async function searchHymns(q: string, limit = 10): Promise<HymnRow[]> {
  const db = getDb();
  const trimmed = q.trim();
  if (!trimmed) return [];

  const num = Number(trimmed);
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (Number.isInteger(num) && num > 0) {
    conditions.push("number = ?");
    params.push(num);
  }
  // Add a partial-number match: "10" should also surface 100, 101, ...
  if (Number.isInteger(num) && num > 0) {
    // Cast number to text for prefix matching (works on SQLite)
    conditions.push("CAST(number AS TEXT) LIKE ?");
    params.push(`${num}%`);
  }
  conditions.push("LOWER(titleEs) LIKE ?");
  params.push(`%${trimmed.toLowerCase()}%`);

  const sql = `
    SELECT number, titleEs AS "titleEs", titleEn AS "titleEn" FROM "Hymn"
    WHERE ${conditions.join(" OR ")}
    ORDER BY
      CASE WHEN number = ? THEN 0 ELSE 1 END,
      number ASC,
      titleEs ASC
    LIMIT ?
  `;
  // First ? is the exact-match hint, repeated for ORDER BY.
  const rows = (await db
    .prepare(sql)
    .all(num, ...params, Math.max(1, Math.min(50, limit)))) as RawHymn[];
  return rows.map(toHymn);
}
