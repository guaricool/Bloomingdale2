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
    diag.first3Raw = await prisma.$queryRawUnsafe(`SELECT * FROM "Hymn" ORDER BY number LIMIT 3`);
  } catch (err) {
    diag.selectError = err instanceof Error ? err.message : String(err);
  }

  try {
    diag.hymn100 = await prisma.$queryRawUnsafe(`SELECT number, "titleEs", "titleEn" FROM "Hymn" WHERE number = $1 LIMIT 1`, 100);
  } catch (err) {
    diag.hymn100Error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(diag);
}
