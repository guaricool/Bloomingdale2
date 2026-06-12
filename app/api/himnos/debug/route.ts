/**
 * GET /api/himnos/debug — diagnóstico temporal de la tabla Hymn.
 * BORRAR después de verificar.
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const diag: Record<string, unknown> = {};

  // 1. Contar himnos
  try {
    const countRow = (await db
      .prepare(`SELECT COUNT(*) AS c FROM "Hymn"`)
      .get()) as { c: number };
    diag.totalHymns = Number(countRow.c);
  } catch (err) {
    diag.countError = err instanceof Error ? err.message : String(err);
  }

  // 2. Traer los primeros 3 himnos (raw, sin alias)
  try {
    const rows = await db.prepare(`SELECT * FROM "Hymn" ORDER BY number LIMIT 3`).all();
    diag.first3Raw = rows;
  } catch (err) {
    diag.selectError = err instanceof Error ? err.message : String(err);
  }

  // 3. Probar la query exacta de searchHymns para "100"
  try {
    const rows = await db
      .prepare(`SELECT number, titleEs AS "titleEs", titleEn AS "titleEn" FROM "Hymn" WHERE number = ? LIMIT 1`)
      .all(100);
    diag.hymn100 = rows;
  } catch (err) {
    diag.hymn100Error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(diag);
}
