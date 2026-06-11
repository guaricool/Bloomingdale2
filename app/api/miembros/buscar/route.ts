/**
 * GET /api/miembros/buscar?q=...&limit=10
 *
 * Search members by first/last name (case-insensitive). Used by the
 * agenda editor's speaker picker. Returns up to `limit` matches (max 50,
 * default 10).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/agenda/auth-helpers";
import { searchMembers } from "@/lib/agenda/members";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const raw = {
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Búsqueda inválida" },
      { status: 400 },
    );
  }
  const results = searchMembers(parsed.data.q, parsed.data.limit);
  return NextResponse.json({ results });
}
