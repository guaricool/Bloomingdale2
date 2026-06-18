/**
 * GET /admin/diagnostico
 * Endpoint de diagnóstico para la tabla Hymn.
 * NO es una ruta dinámica, no será capturada por [number].
 */
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const diag: Record<string, unknown> = {};

  try {
    // 1. Contar himnos
    const countRow = (await db
      .prepare(`SELECT COUNT(*) AS c FROM "Hymn"`)
      .get()) as { c: number };
    diag.totalHymns = Number(countRow.c);
  } catch (err) {
    diag.countError = err instanceof Error ? err.message : String(err);
  }

  try {
    // 2. Primeros 3 himnos
    const rows = (await db
      .prepare(
        `SELECT number, titlees, titleen FROM "Hymn" ORDER BY number LIMIT 3`
      )
      .all()) as Array<{ number: number; titlees: string; titleen: string | null }>;
    diag.first3 = rows;
  } catch (err) {
    diag.selectError = err instanceof Error ? err.message : String(err);
  }

  try {
    // 3. Buscar himno 105 directamente
    const hymn = (await db
      .prepare(
        `SELECT number, titlees, titleen FROM "Hymn" WHERE number = 105`
      )
      .get()) as { number: number; titlees: string; titleen: string | null } | undefined;
    diag.hymn105 = hymn || "NOT FOUND";
  } catch (err) {
    diag.hymn105Error = err instanceof Error ? err.message : String(err);
  }

  try {
    // 4. Esquema de la tabla
    const schema = (await db
      .prepare(
        `PRAGMA table_info("Hymn")`
      )
      .all()) as Array<{ name: string; type: string }>;
    diag.schema = schema;
  } catch (err) {
    diag.schemaError = err instanceof Error ? err.message : String(err);
  }

  try {
    // 5. Probar searchHymns directamente (captura el error real)
    const { searchHymns } = await import("@/lib/agenda/hymns");
    const results = await searchHymns("2", 8);
    diag.searchHymns2 = results;
  } catch (err) {
    diag.searchError = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
  }

  return NextResponse.json(diag);
}
