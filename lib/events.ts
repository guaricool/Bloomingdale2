/**
 * Events module — shared types, validation, and DB query helpers.
 *
 * See `docs/spec/v0.1-mvp.md` section F4 (anuncios auto-generados) and
 * section 6 (modelo de datos: `Event (id, title, description?, eventDate,
 * type, createdBy, createdAt)`).
 *
 * Conventions:
 *  - Dates are stored as `YYYY-MM-DD` strings (no time / TZ) per spec section 6.
 *  - `eventDate` may be in the past (allowed up to ~1 day for late corrections),
 *    but the validation rejects absurd past dates.
 *  - All DB access goes through `getDb()` from `@/lib/db`.
 */
import { z } from "zod";
import { getDb } from "@/lib/db";
import { format, parseISO, isValid } from "date-fns";
import { EVENT_TYPES, type EventType, type EventRow } from "@/lib/events-types";

// Re-export the client-safe types from the split module so server-side
// callers can keep importing them from `@/lib/events` without changes.
export { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/events-types";
export type { EventType, EventRow } from "@/lib/events-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// EVENT_TYPES / EventType / EventRow now live in lib/events-types.ts (client-safe).

/** Public-facing Event shape for API responses (dates unchanged — strings). */
export type EventDto = EventRow;

/** Filter shape for `GET /api/eventos`. All fields optional. */
export interface EventListFilters {
  /** ISO YYYY-MM-DD — inclusive lower bound on eventDate */
  from?: string;
  /** ISO YYYY-MM-DD — inclusive upper bound on eventDate */
  to?: string;
  /** Filter by type */
  type?: EventType;
  /** "upcoming" → eventDate >= today; "past" → eventDate < today; "all" → no time filter */
  range?: "upcoming" | "past" | "all";
}

// ---------------------------------------------------------------------------
// Zod validation
// ---------------------------------------------------------------------------

/** Permissive: eventDate in YYYY-MM-DD, not in the deep past (allow 1 day back). */
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
    // Allow anything from yesterday onward.
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

/**
 * Update is the same shape as create but every field is optional.
 * `eventDate` is allowed to be in the past on update (we keep the same 1-day rule).
 */
export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Today's date in the configured timezone, as YYYY-MM-DD.
 * We use `date-fns` for the local side and accept that the server's system
 * timezone matches the spec's `TIMEZONE` env (America/Chicago by default).
 * For v0.1 this is fine; v0.2 can switch to `date-fns-tz` for explicit TZ.
 */
export function todayIsoDate(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

/** Parse YYYY-MM-DD to a Date at 00:00 local. Throws on invalid. */
export function parseEventDate(s: string): Date {
  const d = parseISO(s);
  if (!isValid(d)) throw new Error(`Fecha inválida: ${s}`);
  return d;
}

/** Format a Date to YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Add N days to a YYYY-MM-DD string, return new YYYY-MM-DD. */
export function addDaysIso(s: string, days: number): string {
  const d = parseEventDate(s);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

// ---------------------------------------------------------------------------
// DB query helpers (use prepared statements; reuse across calls)
// ---------------------------------------------------------------------------

const selectColumns = `id, title, description, eventDate, type, createdBy, createdAt` as const;

export function getEventById(id: number): EventRow | null {
  const row = getDb()
    .prepare(`SELECT ${selectColumns} FROM Event WHERE id = ?`)
    .get(id) as EventRow | undefined;
  return row ?? null;
}

export interface ListEventsOptions {
  filters?: EventListFilters;
  /** When true, order ascending; default false (newest first by eventDate). */
  ascending?: boolean;
  limit?: number;
}

export function listEvents(opts: ListEventsOptions = {}): EventRow[] {
  const { filters = {}, ascending = false, limit } = opts;
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.from) {
    where.push("eventDate >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("eventDate <= ?");
    params.push(filters.to);
  }
  if (filters.type) {
    where.push("type = ?");
    params.push(filters.type);
  }
  if (filters.range === "upcoming") {
    where.push("eventDate >= ?");
    params.push(todayIsoDate());
  } else if (filters.range === "past") {
    where.push("eventDate < ?");
    params.push(todayIsoDate());
  }
  // "all" → no time filter

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const order = ascending ? "ASC" : "DESC";
  const limitSql = typeof limit === "number" ? `LIMIT ${Math.max(1, Math.floor(limit))}` : "";
  const sql = `SELECT ${selectColumns} FROM Event ${whereSql} ORDER BY eventDate ${order}, id ${order} ${limitSql}`.trim();
  return getDb().prepare(sql).all(...params) as EventRow[];
}

export function createEvent(input: CreateEventInput, createdBy: number): EventRow {
  const result = getDb()
    .prepare(
      `INSERT INTO Event (title, description, eventDate, type, createdBy)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.description?.trim() ? input.description.trim() : null,
      input.eventDate,
      input.type,
      createdBy,
    );
  const id = Number(result.lastInsertRowid);
  const created = getEventById(id);
  if (!created) throw new Error("No se pudo leer el evento recién creado");
  return created;
}

export function updateEvent(id: number, patch: UpdateEventInput): EventRow | null {
  const current = getEventById(id);
  if (!current) return null;
  const next = {
    title: patch.title ?? current.title,
    description:
      patch.description === undefined
        ? current.description
        : patch.description?.trim()
          ? patch.description.trim()
          : null,
    eventDate: patch.eventDate ?? current.eventDate,
    type: patch.type ?? current.type,
  };
  getDb()
    .prepare(
      `UPDATE Event
       SET title = ?, description = ?, eventDate = ?, type = ?
       WHERE id = ?`,
    )
    .run(next.title, next.description, next.eventDate, next.type, id);
  return getEventById(id);
}

/**
 * Delete an Event. Returns the number of AgendaItem rows that were also
 * removed by ON DELETE CASCADE … except the schema currently has no FK from
 * AgendaItem.refId → Event.id, so we manually cascade here.
 *
 * Decision: hard delete with manual cascade of AgendaItem rows that reference
 * this event. Soft-delete is not used in v0.1 (no `deletedAt` column).
 */
export function deleteEvent(id: number): {
  ok: boolean;
  agendaItemsDeleted: number;
} {
  const db = getDb();
  const tx = db.transaction(() => {
    const itemDel = db
      .prepare(`DELETE FROM AgendaItem WHERE type = 'announcement' AND refId = ?`)
      .run(id);
    const evDel = db.prepare(`DELETE FROM Event WHERE id = ?`).run(id);
    return {
      agendaItemsDeleted: Number(itemDel.changes ?? 0),
      deleted: Number(evDel.changes ?? 0),
    };
  });
  const r = tx();
  return { ok: r.deleted > 0, agendaItemsDeleted: r.agendaItemsDeleted };
}
