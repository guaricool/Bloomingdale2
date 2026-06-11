/**
 * GET /api/himnos/buscar?q=...&limit=10
 *
 * Searches the Hymn table by number prefix or title substring (case-
 * insensitive). Returns up to `limit` matches (max 50, default 10).
 */
import { NextResponse, type NextRequest } from "next/server";
import { searchHymns } from "@/lib/agenda/hymns";
import { hymnSearchQuerySchema } from "@/lib/agenda/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = {
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = hymnSearchQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Búsqueda inválida" },
      { status: 400 },
    );
  }
  const results = await searchHymns(parsed.data.q, parsed.data.limit);
  return NextResponse.json({ results });
}
