/**
 * GET /api/himnos/[number]
 *
 * Returns `{number, titleEs, titleEn}` for the given hymn number, or 404
 * if the number is out of range (1..341) or not present in the DB.
 */
import { NextResponse } from "next/server";
import { getHymn } from "@/lib/agenda/hymns";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { number: string } },
) {
  const num = Number(params.number);
  if (!Number.isInteger(num) || num < 1 || num > 341) {
    return NextResponse.json(
      { error: "Número de himno fuera de rango (1..341)" },
      { status: 404 },
    );
  }
  const hymn = getHymn(num);
  if (!hymn) {
    return NextResponse.json(
      { error: `Himno ${num} no encontrado` },
      { status: 404 },
    );
  }
  return NextResponse.json(hymn);
}
