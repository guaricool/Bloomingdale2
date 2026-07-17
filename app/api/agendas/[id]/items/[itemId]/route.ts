/**
 * Single-AgendaItem endpoints.
 *
 *   PUT    /api/agendas/[id]/items/[itemId]   — update
 *   DELETE /api/agendas/[id]/items/[itemId]   — remove
 *
 * Both require admin.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { updateAgendaItemSchema } from "@/lib/agenda/validations";
import {
  deleteAgendaItem,
  getAgendaById,
  getAgendaItem,
  updateAgendaItem,
} from "@/lib/agenda/queries";
import { getHymn } from "@/lib/agenda/hymns";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const agendaId = Number(params.id);
  const itemId = Number(params.itemId);
  if (!Number.isInteger(agendaId) || agendaId < 1 || !Number.isInteger(itemId) || itemId < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const agenda = await getAgendaById(agendaId);
  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }
  const existing = await getAgendaItem(agendaId, itemId);
  if (!existing) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = updateAgendaItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  // When changing refId, validate the new refId matches the (possibly new) type.
  const { prisma } = await import("@/lib/db");
  const nextType = parsed.data.type ?? existing.type;
  const nextRefId = parsed.data.refId !== undefined ? parsed.data.refId : existing.refId;
  if (nextType.includes("hymn")) {
    if (!nextRefId || nextRefId < 1 || nextRefId > 341) {
      return NextResponse.json(
        { error: "Número de himno fuera de rango (1..341)" },
        { status: 400 },
      );
    }
    if (!(await getHymn(nextRefId))) {
      return NextResponse.json(
        { error: `Himno ${nextRefId} no encontrado` },
        { status: 400 },
      );
    }
  } else if (nextType === "speaker" || nextType === "prayer") {
    if (!nextRefId) {
      return NextResponse.json(
        { error: `Se requiere un miembro (refId) para '${nextType}'` },
        { status: 400 },
      );
    }
    const member = await prisma.member.findUnique({ where: { id: nextRefId } });
    if (!member) {
      return NextResponse.json(
        { error: `Miembro ${nextRefId} no encontrado` },
        { status: 400 },
      );
    }
  } else if (nextType === "announcement") {
    if (!nextRefId) {
      return NextResponse.json(
        { error: "Se requiere un evento (refId) para 'announcement'" },
        { status: 400 },
      );
    }
    const event = await prisma.event.findUnique({ where: { id: nextRefId } });
    if (!event) {
      return NextResponse.json(
        { error: `Evento ${nextRefId} no encontrado` },
        { status: 400 },
      );
    }
  }

  const updated = await updateAgendaItem(agendaId, itemId, {
    type: parsed.data.type,
    refId: parsed.data.refId,
    note: parsed.data.note,
    order: parsed.data.order,
  });
  if (!updated) {
    return NextResponse.json(
      { error: "No se pudo actualizar el item" },
      { status: 500 },
    );
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const agendaId = Number(params.id);
  const itemId = Number(params.itemId);
  if (!Number.isInteger(agendaId) || agendaId < 1 || !Number.isInteger(itemId) || itemId < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const agenda = await getAgendaById(agendaId);
  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }
  const ok = await deleteAgendaItem(agendaId, itemId);
  if (!ok) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
