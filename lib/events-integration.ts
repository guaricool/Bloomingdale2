/**
 * Events module — inter-module integration: auto-insert an AgendaItem of
 * type='announcement' into every existing draft/published Agenda that falls
 * between today and the new event's date (inclusive, only Sundays).
 *
 * This is the read-side of F4: when an admin creates an Event, every
 * affected agenda should immediately show the announcement. The agendas
 * module, separately, will call `GET /api/eventos/anuncios-pendientes`
 * when an admin opens the editor for a particular Sunday — that endpoint
 * is the read API; this file is the write side.
 *
 * Idempotency: if an AgendaItem with `type='announcement'` and `refId=eventId`
 * already exists in a given agenda, we do NOT create a duplicate. We do,
 * however, allow multiple announcement items in the same agenda (one per
 * event), so the check is scoped per (agendaId, type='announcement', refId).
 *
 * Failure handling: this integration is best-effort. If the Agenda /
 * AgendaItem tables are missing (carrera paralela con agendas-module), or
 * the integration throws for any reason, we log a warning and let the
 * event creation still succeed. The agendas-module can later call
 * `/api/eventos/anuncios-pendientes?fecha=…` to pick up the event.
 */
import { getDb } from "@/lib/db";
import { todayIsoDate, addDaysIso } from "@/lib/events";

export interface AnnouncementInsertResult {
  /** Number of AgendaItem rows created. */
  created: number;
  /** Number of agendas that already had an announcement for this event. */
  skipped: number;
  /** Number of Sunday agendas in range that we considered. */
  consideredAgendas: number;
  /** If the Agenda / AgendaItem tables are missing. */
  tablesMissing?: boolean;
  /** Error message if integration failed. */
  error?: string;
}

/**
 * Returns true when the Agenda and AgendaItem tables exist in the schema.
 * We use `sqlite_master` to check before touching them — this lets the
 * events module work even before the agendas module's migrations land.
 */
function agendaTablesExist(): boolean {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN ('Agenda', 'AgendaItem')`,
    )
    .all() as { name: string }[];
  return rows.length === 2;
}

/**
 * Insert an `AgendaItem (type='announcement', refId=eventId, order=0)` into
 * every Agenda whose date is in the range [today, eventDate] (inclusive) and
 * whose status is 'draft' or 'published'. We also require that the agenda
 * date is a Sunday (defensive — Agenda.date has no CHECK constraint in v0.1
 * schema; the agendas module is expected to validate this on create).
 */
export function insertAnnouncementIntoExistingAgendas(
  eventId: number,
  eventDate: string,
): AnnouncementInsertResult {
  if (!agendaTablesExist()) {
    // Best-effort logging: the engine console will surface this.
    console.warn(
      `[events-integration] Agenda/AgendaItem tables missing; skipping auto-insert for event ${eventId}. ` +
        `TODO: agendas-module should call /api/eventos/anuncios-pendientes when creating/editing agendas.`,
    );
    return { created: 0, skipped: 0, consideredAgendas: 0, tablesMissing: true };
  }

  const db = getDb();
  const today = todayIsoDate();
  // Defensive upper bound: the event itself. No need to look past eventDate.
  const upper = eventDate;

  let consideredAgendas = 0;
  let created = 0;
  let skipped = 0;

  try {
    const tx = db.transaction(() => {
      // Find candidate agendas.
      // The agenda's date is a YYYY-MM-DD string. SQLite sorts text the same
      // as dates when the format is YYYY-MM-DD, so range compares are safe.
      const agendas = db
        .prepare(
          `SELECT id, date, status FROM Agenda
           WHERE date >= ? AND date <= ?
             AND status IN ('draft', 'published')
           ORDER BY date ASC`,
        )
        .all(today, upper) as { id: number; date: string; status: string }[];

      consideredAgendas = agendas.length;

      // Defensive filter: only Sunday agendas (defensive in case the agendas
      // module hasn't enforced the constraint yet). Sunday = day 0.
      const sundayAgendas = agendas.filter((a) => {
        const d = new Date(a.date + "T00:00:00");
        return d.getDay() === 0;
      });

      const existsStmt = db.prepare(
        `SELECT id FROM AgendaItem
         WHERE agendaId = ? AND type = 'announcement' AND refId = ?
         LIMIT 1`,
      );
      const insertStmt = db.prepare(
        `INSERT INTO AgendaItem (agendaId, type, "order", refId, note)
         VALUES (?, 'announcement', 0, ?, ?)`,
      );

      for (const agenda of sundayAgendas) {
        const existing = existsStmt.get(agenda.id, eventId);
        if (existing) {
          skipped += 1;
          continue;
        }
        // Use event's title as a brief `note` so the announcement is
        // immediately useful in the agenda UI even before the agendas
        // module dereferences refId.
        insertStmt.run(agenda.id, eventId, `(evento) ${eventDate}`);
        created += 1;
      }
    });
    tx();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[events-integration] Failed to auto-insert announcement for event ${eventId}: ${msg}`,
    );
    return {
      created,
      skipped,
      consideredAgendas,
      error: msg,
    };
  }

  return { created, skipped, consideredAgendas };
}

/**
 * Remove the `AgendaItem (type='announcement', refId=eventId)` rows from
 * every agenda. Called when an event is deleted (manual cascade in
 * `lib/events.ts deleteEvent`).
 */
export function removeAnnouncementFromAllAgendas(eventId: number): number {
  if (!agendaTablesExist()) return 0;
  const result = getDb()
    .prepare(`DELETE FROM AgendaItem WHERE type = 'announcement' AND refId = ?`)
    .run(eventId);
  return Number(result.changes ?? 0);
}

// Re-export addDaysIso so callers can use it without a second import.
export { addDaysIso };
