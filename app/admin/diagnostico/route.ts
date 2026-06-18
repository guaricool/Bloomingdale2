import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const diag: Record<string, unknown> = {};

  try {
    diag.totalHymns = await prisma.hymn.count();
  } catch (err) {
    diag.countError = err instanceof Error ? err.message : String(err);
  }

  try {
    diag.first3 = await prisma.hymn.findMany({ orderBy: { number: 'asc' }, take: 3 });
  } catch (err) {
    diag.selectError = err instanceof Error ? err.message : String(err);
  }

  try {
    diag.hymn105 = await prisma.hymn.findUnique({ where: { number: 105 } }) || "NOT FOUND";
  } catch (err) {
    diag.hymn105Error = err instanceof Error ? err.message : String(err);
  }

  try {
    diag.schema = "Postgres via Prisma does not support PRAGMA table_info";
  } catch (err) {
    diag.schemaError = String(err);
  }

  try {
    const { searchHymns } = await import("@/lib/agenda/hymns");
    diag.searchHymns2 = await searchHymns("2", 8);
  } catch (err) {
    diag.searchError = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
  }

  return NextResponse.json(diag);
}
