/**
 * Single-agenda endpoints.
 *
 *   GET    /api/agendas/[id]   — read full agenda (with all items + joins)
 *   PUT    /api/agendas/[id]   — update date and/or status
 *   DELETE /api/agendas/[id]   — delete (only if status === 'draft')
 *
 * All require admin role.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { updateAgendaSchema } from "@/lib/agenda/validations";
import {
  deleteAgenda,
  getAgendaById,
  updateAgenda,
} from "@/lib/agenda/queries";
import { isSunday } from "@/lib/agenda/dates";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const agenda = await getAgendaById(id);
  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ agenda });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateAgendaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  if (parsed.data.date !== undefined && !isSunday(parsed.data.date)) {
    return NextResponse.json(
      { error: "La fecha debe ser un domingo" },
      { status: 400 },
    );
  }

  const updated = await updateAgenda(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ agenda: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const existing = await getAgendaById(id);
  if (!existing) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar agendas en estado 'draft'" },
      { status: 400 },
    );
  }
  const ok = await deleteAgenda(id);
  if (!ok) {
    return NextResponse.json(
      { error: "No se pudo eliminar la agenda" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
