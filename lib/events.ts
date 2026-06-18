/**
 * Events module — shared types, validation, and DB query helpers.
 */
import { z } from "zod";
import { prisma } from "@/lib/db";
import { format, parseISO, isValid } from "date-fns";
import { EVENT_TYPES, type EventType, type EventRow } from "@/lib/events-types";

export { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/events-types";
export type { EventType, EventRow } from "@/lib/events-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventDto = EventRow;

export interface EventListFilters {
  from?: string;
  to?: string;
  type?: EventType;
  range?: "upcoming" | "past" | "all";
}

// ---------------------------------------------------------------------------
// Zod validation
// ---------------------------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "La fecha debe tener formato YYYY-MM-DD")
  .refine(
    (s) => isValid(parseISO(s)),
    "La fecha no es válida (revisa día/mes/año)",
  )
  .refine((s) => {
    const d = parseISO(s);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return d.getTime() >= yesterday.getTime();
  }, "La fecha no puede ser anterior a ayer (se permite 1 día de margen para correcciones)");

export const createEventSchema = z.object({
  title: z
    .string()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(200, "El título no puede pasar de 200 caracteres"),
  description: z
    .string()
    .max(2000, "La descripción no puede pasar de 2000 caracteres")
    .optional()
    .or(z.literal("")),
  eventDate: isoDate,
  type: z.enum(EVENT_TYPES, {
    errorMap: () => ({ message: "Tipo de evento no válido" }),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function todayIsoDate(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function parseEventDate(s: string): Date {
  const d = parseISO(s);
  if (!isValid(d)) throw new Error(`Fecha inválida: ${s}`);
  return d;
}

export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function addDaysIso(s: string, days: number): string {
  const d = parseEventDate(s);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

// ---------------------------------------------------------------------------
// DB query helpers
// ---------------------------------------------------------------------------

function mapRow(e: any): EventRow {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
    type: e.type as EventType,
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function getEventById(id: number): Promise<EventRow | null> {
  const row = await prisma.event.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export interface ListEventsOptions {
  filters?: EventListFilters;
  ascending?: boolean;
  limit?: number;
}

export async function listEvents(opts: ListEventsOptions = {}): Promise<EventRow[]> {
  const { filters = {}, ascending = false, limit } = opts;
  const where: any = {};

  if (filters.from && filters.to) {
    where.eventDate = { gte: filters.from, lte: filters.to };
  } else if (filters.from) {
    where.eventDate = { gte: filters.from };
  } else if (filters.to) {
    where.eventDate = { lte: filters.to };
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.range === "upcoming") {
    where.eventDate = { ...where.eventDate, gte: todayIsoDate() };
  } else if (filters.range === "past") {
    where.eventDate = { ...where.eventDate, lt: todayIsoDate() };
  }

  const rowsRaw = await prisma.event.findMany({
    where,
    take: limit,
    orderBy: [
      { eventDate: ascending ? "asc" : "desc" },
      { id: ascending ? "asc" : "desc" },
    ],
  });

  return rowsRaw.map(mapRow);
}

export async function createEvent(
  input: CreateEventInput,
  createdBy: number,
): Promise<EventRow> {
  const row = await prisma.event.create({
    data: {
      title: input.title,
      description: input.description?.trim() ? input.description.trim() : null,
      eventDate: input.eventDate,
      type: input.type,
      createdBy,
    },
  });
  return mapRow(row);
}

export async function updateEvent(
  id: number,
  patch: UpdateEventInput,
): Promise<EventRow | null> {
  try {
    const row = await prisma.event.update({
      where: { id },
      data: {
        title: patch.title,
        description: patch.description === undefined ? undefined : (patch.description?.trim() ? patch.description.trim() : null),
        eventDate: patch.eventDate,
        type: patch.type,
      },
    });
    return mapRow(row);
  } catch (error: any) {
    if (error.code === 'P2025') return null;
    throw error;
  }
}

export async function deleteEvent(id: number): Promise<{
  ok: boolean;
  agendaItemsDeleted: number;
}> {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const itemDel = await tx.agendaItem.deleteMany({
        where: { type: 'announcement', refId: id },
      });
      await tx.event.delete({ where: { id } });
      return { agendaItemsDeleted: itemDel.count };
    });
    return { ok: true, agendaItemsDeleted: result.agendaItemsDeleted };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { ok: false, agendaItemsDeleted: 0 };
    }
    throw error;
  }
}
