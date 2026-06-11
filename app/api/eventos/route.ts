/**
 * Event CRUD — collection route.
 *
 *   GET  /api/eventos
 *     Query params (all optional):
 *       from=YYYY-MM-DD   — inclusive lower bound on eventDate
 *       to=YYYY-MM-DD     — inclusive upper bound on eventDate
 *       type=<type>       — one of: actividad, evento_especial, servicio, reunion, otro
 *       range=upcoming|past — shortcut: upcoming → eventDate >= today, past → eventDate < today
 *       limit=N           — 1..500, default 200
 *     Auth: any authenticated user (members can read).
 *     Response: { eventos: EventDto[] }
 *
 *   POST /api/eventos
 *     Body: { title, description?, eventDate, type }
 *     Auth: admin only.
 *     Side effect: inserts an AgendaItem(announcement, refId=newId, order=0)
 *       into every draft/published Sunday agenda in [today, eventDate] (best-effort).
 *     Response: { evento: EventDto, integracion: AnnouncementInsertResult }
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  EVENT_TYPES,
  createEvent,
  createEventSchema,
  listEvents,
  type EventType,
} from "@/lib/events";
import { requireUser, requireAdmin } from "@/lib/api-guard";
import { insertAnnouncementIntoExistingAgendas } from "@/lib/events-integration";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

function parseListParams(searchParams: URLSearchParams): {
  from?: string;
  to?: string;
  type?: EventType;
  range?: "upcoming" | "past" | "all";
  limit: number;
  error?: string;
} {
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const typeRaw = searchParams.get("type") ?? undefined;
  const rangeRaw = searchParams.get("range") ?? undefined;
  const limitRaw = searchParams.get("limit") ?? undefined;

  const result: ReturnType<typeof parseListParams> = { limit: DEFAULT_LIMIT };

  if (from) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(from)) {
      return { ...result, error: "El parámetro 'from' debe ser YYYY-MM-DD" };
    }
    result.from = from;
  }
  if (to) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(to)) {
      return { ...result, error: "El parámetro 'to' debe ser YYYY-MM-DD" };
    }
    result.to = to;
  }
  if (typeRaw) {
    if (!(EVENT_TYPES as readonly string[]).includes(typeRaw)) {
      return { ...result, error: `Tipo no válido. Usa uno de: ${EVENT_TYPES.join(", ")}` };
    }
    result.type = typeRaw as EventType;
  }
  if (rangeRaw) {
    if (rangeRaw !== "upcoming" && rangeRaw !== "past" && rangeRaw !== "all") {
      return { ...result, error: "'range' debe ser 'upcoming', 'past' o 'all'" };
    }
    result.range = rangeRaw;
  }
  if (limitRaw) {
    const n = Number(limitRaw);
    if (!Number.isFinite(n) || n < 1) {
      return { ...result, error: "'limit' debe ser un número >= 1" };
    }
    result.limit = Math.min(MAX_LIMIT, Math.floor(n));
  }
  return result;
}

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const params = parseListParams(req.nextUrl.searchParams);
  if (params.error) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }
  const { limit, ...filters } = params;
  const eventos = listEvents({ filters, limit });
  return NextResponse.json({ eventos });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const evento = createEvent(parsed.data, guard.value);

  // Auto-insert announcement into existing draft/published Sunday agendas
  // in [today, eventDate]. Best-effort; never fails the POST.
  const integracion = insertAnnouncementIntoExistingAgendas(evento.id, evento.eventDate);

  return NextResponse.json({ evento, integracion }, { status: 201 });
}
