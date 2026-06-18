/**
 * Agenda domain types.
 *
 * Mirrors the SQLite schema in db/migrations/0001_init.sql. The DB layer
 * (lib/db.ts) speaks better-sqlite3 row shapes; we re-export a richer,
 * camelCased surface that the rest of the app consumes.
 */

export type AgendaStatus = "draft" | "published" | "completed";

export type AgendaItemType = "hymn" | "speaker" | "prayer" | "announcement";

/**
 * Row shape straight from the Agenda table.
 *
 * `date` is a `YYYY-MM-DD` string. The DB layer enforces a Sunday-only
 * constraint at insert time (see lib/agenda/validations.ts).
 */
export interface AgendaRow {
  id: number;
  date: string;
  status: AgendaStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/** Row shape from AgendaItem. Note `order` is quoted in SQL. */
export interface AgendaItemRow {
  id: number;
  agendaId: number;
  type: AgendaItemType;
  /** Display order within the agenda. Lower = earlier. Ties broken by id. */
  order: number;
  /** Polymorphic reference: hymn.number | member.id | event.id | null */
  refId: number | null;
  /** Topic text, announcement copy, prayer note, etc. */
  note: string | null;
}

export interface AgendaItemWithJoins extends AgendaItemRow {
  /** Joined from Hymn (when type === 'hymn'). */
  hymn: { number: number; titleEs: string; titleEn: string | null } | null;
  /** Joined from Member (when type === 'speaker' or 'prayer'). */
  member: { id: number; firstName: string; lastName: string } | null;
  /** Joined from Event (when type === 'announcement'). */
  event: { id: number; title: string; eventDate: string; type: string } | null;
}

export interface AgendaWithItems extends AgendaRow {
  items: AgendaItemWithJoins[];
}

export interface HymnRow {
  number: number;
  titleEs: string;
  titleEn: string | null;
}

export interface MemberRow {
  id: number;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
  createdAt: string;
  updatedAt: string;
  lastDiscourseDate?: string | null;
}

export interface EventRow {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  type: "actividad" | "evento_especial" | "servicio" | "reunion" | "otro";
  createdBy: number;
  createdAt: string;
}

/** The canonical slot order for a Sunday agenda (F2). */
export const AGENDA_SLOT_ORDER: AgendaItemType[] = [
  "hymn", // 1. Himno de apertura
  "prayer", // 2. Invocación
  "announcement", // 3. Anuncios
  "speaker", // 4. Primer discurso
  "hymn", // 5. Himno intermedio / sacramental
  "speaker", // 6. Segundo discurso
  "hymn", // 7. Himno de cierre
  "prayer", // 8. Bendición
];

/** Human-readable labels for slot types (Spanish). */
export const ITEM_TYPE_LABELS: Record<AgendaItemType, string> = {
  hymn: "Himno",
  speaker: "Discurso",
  prayer: "Oración",
  announcement: "Anuncio",
};

// Re-export the pending-announcement shape from the events module so the
// agendas module can consume it without re-declaring the contract. The
// canonical definition lives in `@/lib/events-pending`; this is a thin
// alias kept for the agendas module's import surface.
export type { PendingAnnouncement } from "@/lib/events-pending";
