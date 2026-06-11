/**
 * POST /api/agendas/[id]/publicar
 *
 * Transitions `draft → published`. Idempotent guards: refuses if the agenda
 * is not in 'draft' state.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { transitionAgenda } from "@/lib/agenda/queries";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const result = await transitionAgenda(id, "published");
  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: `No se puede publicar una agenda en estado '${result.current}'`,
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ agenda: result.agenda });
}
