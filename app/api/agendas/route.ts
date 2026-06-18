/**
 * Agenda collection endpoints.
 *
 *   GET  /api/agendas   — list with filters (status, from, to, range)
 *   POST /api/agendas   — create new draft agenda for a Sunday
 *
 * Both require admin role.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import {
  createAgendaSchema,
  listAgendasQuerySchema,
} from "@/lib/agenda/validations";
import { createAgenda, listAgendas } from "@/lib/agenda/queries";
import { isSunday, todayIso } from "@/lib/agenda/dates";
import { appUserIdToNumber } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const raw = {
    status: url.searchParams.get("status") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
  };
  const parsed = listAgendasQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Filtros inválidos" },
      { status: 400 },
    );
  }
  const rows = await listAgendas({ ...parsed.data, today: todayIso() });
  return NextResponse.json({ agendas: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createAgendaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const { date } = parsed.data;

  if (!isSunday(date)) {
    return NextResponse.json(
      { error: "La fecha debe ser un domingo" },
      { status: 400 },
    );
  }

  // Uniqueness: one agenda per Sunday. The DB has UNIQUE(date) on Agenda.
  const { prisma } = await import("@/lib/db");
  const existing = await prisma.agenda.findUnique({ where: { date } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una agenda para ese domingo" },
      { status: 409 },
    );
  }

  const userId = appUserIdToNumber(auth.user);
  if (!userId) {
    return NextResponse.json(
      { error: "Sesión inválida (sin userId)" },
      { status: 401 },
    );
  }

  try {
    const agenda = await createAgenda({ date, createdBy: userId });
    return NextResponse.json({ agenda }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear la agenda";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
