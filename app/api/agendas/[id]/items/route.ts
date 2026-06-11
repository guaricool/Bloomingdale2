/**
 * AgendaItem collection endpoints.
 *
 *   POST /api/agendas/[id]/items   — add a new item to the agenda
 *   POST /api/agendas/[id]/items/reordenar — bulk update order
 *
 * Both require admin.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import {
  createAgendaItemSchema,
  reorderAgendaItemsSchema,
} from "@/lib/agenda/validations";
import {
  createAgendaItem,
  getAgendaById,
  reorderAgendaItems,
} from "@/lib/agenda/queries";
import { getHymn } from "@/lib/agenda/hymns";
import { getDb } from "@/lib/db";

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
  const agenda = await getAgendaById(agendaId);
  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createAgendaItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const { type, refId, note } = parsed.data;

  // Validate refId against the relevant table.
  const db = getDb();
  if (type === "hymn") {
    if (!refId || refId < 1 || refId > 341) {
      return NextResponse.json(
        { error: "Número de himno fuera de rango (1..341)" },
        { status: 400 },
      );
    }
    const hymn = await getHymn(refId);
    if (!hymn) {
      return NextResponse.json(
        { error: `Himno ${refId} no encontrado` },
        { status: 400 },
      );
    }
  } else if (type === "speaker" || type === "prayer") {
    if (!refId) {
      return NextResponse.json(
        { error: `Se requiere un miembro (refId) para '${type}'` },
        { status: 400 },
      );
    }
    const member = (await db
      .prepare(`SELECT id FROM "Member" WHERE id = ?`)
      .get(refId)) as { id: number } | undefined;
    if (!member) {
      return NextResponse.json(
        { error: `Miembro ${refId} no encontrado` },
        { status: 400 },
      );
    }
  } else if (type === "announcement") {
    if (!refId) {
      return NextResponse.json(
        { error: "Se requiere un evento (refId) para 'announcement'" },
        { status: 400 },
      );
    }
    const event = (await db
      .prepare(`SELECT id FROM "Event" WHERE id = ?`)
      .get(refId)) as { id: number } | undefined;
    if (!event) {
      return NextResponse.json(
        { error: `Evento ${refId} no encontrado` },
        { status: 400 },
      );
    }
  }

  try {
    const item = await createAgendaItem({
      agendaId,
      type,
      refId: refId ?? null,
      note: note ?? null,
      order: parsed.data.order,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear el item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
