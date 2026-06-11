/**
 * POST /api/agendas/[id]/items/reordenar
 *
 * Bulk reorder of AgendaItem rows. Body: `{ items: [{id, order}, ...] }`.
 * Validates that every id belongs to the agenda before any update.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { reorderAgendaItemsSchema } from "@/lib/agenda/validations";
import { getAgendaById, reorderAgendaItems } from "@/lib/agenda/queries";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const agendaId = Number(params.id);
  if (!Number.isInteger(agendaId) || agendaId < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const agenda = getAgendaById(agendaId);
  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = reorderAgendaItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const ok = reorderAgendaItems(agendaId, parsed.data.items);
  if (!ok) {
    return NextResponse.json(
      { error: "Algún item no pertenece a la agenda" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
