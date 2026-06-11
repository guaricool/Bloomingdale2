/**
 * Event CRUD — single-resource route.
 *
 *   GET    /api/eventos/[id]   — read one (any authenticated user)
 *   PUT    /api/eventos/[id]   — partial update (admin only)
 *   DELETE /api/eventos/[id]   — hard delete (admin only) + cascade
 *                                 remove of AgendaItem (type='announcement', refId=id)
 */
import { NextResponse, type NextRequest } from "next/server";
import { deleteEvent, getEventById, updateEvent, updateEventSchema } from "@/lib/events";
import { removeAnnouncementFromAllAgendas } from "@/lib/events-integration";
import { requireAdmin, requireUser } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

function parseId(idStr: string): number | null {
  const n = Number(idStr);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const id = parseId(ctx.params.id);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const evento = await getEventById(id);
  if (!evento) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ evento });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const id = parseId(ctx.params.id);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const existing = await getEventById(id);
  if (!existing) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // We re-use the create schema in partial mode (every field optional).
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const updated = await updateEvent(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ evento: updated });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const id = parseId(ctx.params.id);
  if (id === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const existing = await getEventById(id);
  if (!existing) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  // Manual cascade: remove AgendaItem rows that reference this event.
  // We do this BEFORE the delete so the FK-ish link is broken first.
  const itemsRemoved = await removeAnnouncementFromAllAgendas(id);
  const result = await deleteEvent(id);
  if (!result.ok) {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    id,
    agendaItemsDeleted: result.agendaItemsDeleted + itemsRemoved,
  });
}
