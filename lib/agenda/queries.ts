/**
 * DB access layer for the Agenda + AgendaItem tables.
 *
 * Thin wrapper around `getDb()` that returns the camelCased shapes
 * defined in `lib/agenda/types.ts`. Pure functions — no Next.js coupling.
 *
 * Caller responsibilities (validated upstream by zod):
 *   - `date` is `YYYY-MM-DD` and a Sunday.
 *   - `refId` matches the `type` (hymn → Hymn.number, speaker/prayer →
 *     Member.id, announcement → Event.id).
 *   - status transitions follow `draft → published → completed`.
 *
 * Async: all functions return Promises. The DB layer can be SQLite (sync
 * semantics wrapped in a resolved Promise) or Postgres (native async). The
 * call sites `await` everything uniformly.
 */
import { getDb } from "@/lib/db";
import type {
  AgendaItemRow,
  AgendaItemWithJoins,
  AgendaRow,
  AgendaStatus,
  AgendaWithItems,
} from "./types";

interface RawAgendaRow {
  id: number;
  date: string;
  status: AgendaStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface RawAgendaItemRow {
  id: number;
  agendaId: number;
  type: "hymn" | "speaker" | "prayer" | "announcement";
  order: number;
  refId: number | null;
  note: string | null;
}

interface JoinedAgendaItemRow extends RawAgendaItemRow {
  // Hymn join (only for type='hymn')
  hymn_titleEs: string | null;
  hymn_titleEn: string | null;
  // Member join (for type='speaker' or 'prayer')
  member_firstName: string | null;
  member_lastName: string | null;
  // Event join (for type='announcement')
  event_title: string | null;
  event_eventDate: string | null;
  event_type: string | null;
}

function toAgendaItemWithJoins(r: JoinedAgendaItemRow): AgendaItemWithJoins {
  const base: AgendaItemRow = {
    id: r.id,
    agendaId: r.agendaId,
    type: r.type,
    order: r.order,
    refId: r.refId,
    note: r.note,
  };
  return {
    ...base,
    hymn:
      r.type === "hymn" && r.refId !== null && r.hymn_titleEs !== null
        ? { number: r.refId, titleEs: r.hymn_titleEs, titleEn: r.hymn_titleEn }
        : null,
    member:
      (r.type === "speaker" || r.type === "prayer") &&
      r.refId !== null &&
      r.member_firstName !== null &&
      r.member_lastName !== null
        ? { id: r.refId, firstName: r.member_firstName, lastName: r.member_lastName }
        : null,
    event:
      r.type === "announcement" && r.refId !== null && r.event_title !== null
        ? {
            id: r.refId,
            title: r.event_title,
            eventDate: r.event_eventDate ?? "",
            type: r.event_type ?? "actividad",
          }
        : null,
  };
}

// --- Read -----------------------------------------------------------------

export async function getAgendaById(id: number): Promise<AgendaWithItems | null> {
  const db = getDb();
  const agendaRow = (await db
    .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
    .get(id)) as RawAgendaRow | undefined;
  if (!agendaRow) return null;
  const itemRows = (await db
    .prepare(
      `SELECT
         ai.id, ai.agendaId, ai.type, ai."order", ai.refId, ai.note,
         h.titleEs AS hymn_titleEs, h.titleEn AS hymn_titleEn,
         m.firstName AS member_firstName, m.lastName AS member_lastName,
         e.title AS event_title, e.eventDate AS event_eventDate, e.type AS event_type
       FROM "AgendaItem" ai
       LEFT JOIN "Hymn" h ON ai.type = 'hymn' AND h.number = ai.refId
       LEFT JOIN "Member" m ON (ai.type = 'speaker' OR ai.type = 'prayer') AND m.id = ai.refId
       LEFT JOIN "Event" e ON ai.type = 'announcement' AND e.id = ai.refId
       WHERE ai.agendaId = ?
       ORDER BY ai."order" ASC, ai.id ASC`,
    )
    .all(id)) as JoinedAgendaItemRow[];
  return {
    id: agendaRow.id,
    date: agendaRow.date,
    status: agendaRow.status,
    createdBy: agendaRow.createdBy,
    createdAt: agendaRow.createdAt,
    updatedAt: agendaRow.updatedAt,
    items: itemRows.map(toAgendaItemWithJoins),
  };
}

export async function getAgendaByDate(date: string): Promise<AgendaWithItems | null> {
  const db = getDb();
  const row = (await db
    .prepare(`SELECT id FROM "Agenda" WHERE date = ?`)
    .get(date)) as { id: number } | undefined;
  if (!row) return null;
  return getAgendaById(row.id);
}

export interface ListAgendaFilter {
  status?: AgendaStatus;
  from?: string;
  to?: string;
  range?: "upcoming" | "past" | "all";
  today?: string;
  limit?: number;
}

export async function listAgendas(filter: ListAgendaFilter = {}): Promise<AgendaRow[]> {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status) {
    where.push("status = ?");
    params.push(filter.status);
  }
  const today = filter.today;
  if (filter.range === "upcoming" && today) {
    where.push("date >= ?");
    params.push(today);
  } else if (filter.range === "past" && today) {
    where.push("date < ?");
    params.push(today);
  } else {
    if (filter.from) {
      where.push("date >= ?");
      params.push(filter.from);
    }
    if (filter.to) {
      where.push("date <= ?");
      params.push(filter.to);
    }
  }
  const sql =
    `SELECT * FROM "Agenda"` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY date DESC" +
    (filter.limit ? ` LIMIT ${Math.max(1, Math.min(500, filter.limit))}` : "");
  const rows = (await db.prepare(sql).all(...params)) as RawAgendaRow[];
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    status: r.status,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/** Returns the most recent published agenda on or after `today`, or null. */
export async function getNextPublishedAgenda(today: string): Promise<AgendaRow | null> {
  const db = getDb();
  const row = (await db
    .prepare(
      `SELECT * FROM "Agenda" WHERE status = 'published' AND date >= ?
       ORDER BY date ASC LIMIT 1`,
    )
    .get(today)) as RawAgendaRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// --- Create / Update / Delete ---------------------------------------------

export async function createAgenda(input: {
  date: string;
  createdBy: number;
}): Promise<AgendaRow> {
  const db = getDb();
  const tx = db.transaction(async () => {
    const result = await db
      .prepare(
        `INSERT INTO "Agenda" (date, status, createdBy) VALUES (?, 'draft', ?)`,
      )
      .run(input.date, input.createdBy);
    return Number(result.lastInsertRowid);
  });
  const txId = await tx();
  let id = Number(txId);
  if (!Number.isFinite(id) || id <= 0) {
    // Postgres path: re-SELECT the most recent agenda for this date.
    const recent = (await db
      .prepare(`SELECT id FROM "Agenda" WHERE date = ? ORDER BY id DESC LIMIT 1`)
      .all(input.date)) as { id: number }[];
    id = Number(recent[0]?.id ?? 0);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("No se pudo crear la agenda");
    }
  }
  const row = (await db
    .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
    .get(id)) as RawAgendaRow | undefined;
  if (!row) throw new Error("No se pudo leer la agenda recién creada");
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateAgenda(
  id: number,
  patch: { date?: string; status?: AgendaStatus },
): Promise<AgendaRow | null> {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.date !== undefined) {
    fields.push("date = ?");
    params.push(patch.date);
  }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    params.push(patch.status);
  }
  if (!fields.length) {
    const existing = (await db
      .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
      .get(id)) as RawAgendaRow | undefined;
    if (!existing) return null;
    return rowToAgenda(existing);
  }
  fields.push("updatedAt = CURRENT_TIMESTAMP");
  params.push(id);
  const sql = `UPDATE "Agenda" SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.prepare(sql).run(...params);
  if (result.changes === 0) {
    // Postgres path: 0 changes can be a no-op (same values) or a missing row.
    // Distinguish by re-SELECTing.
    const existing = (await db
      .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
      .get(id)) as RawAgendaRow | undefined;
    if (!existing) return null;
    return rowToAgenda(existing);
  }
  const updated = (await db
    .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
    .get(id)) as RawAgendaRow | undefined;
  return updated ? rowToAgenda(updated) : null;
}

export async function deleteAgenda(id: number): Promise<boolean> {
  const db = getDb();
  // Confirm the row exists first so the return value is accurate on both
  // backends. ON DELETE CASCADE on AgendaItem handles items.
  const existing = (await db
    .prepare(`SELECT id FROM "Agenda" WHERE id = ?`)
    .get(id)) as { id: number } | undefined;
  if (!existing) return false;
  await db.prepare(`DELETE FROM "Agenda" WHERE id = ?`).run(id);
  return true;
}

export async function transitionAgenda(
  id: number,
  to: AgendaStatus,
): Promise<
  | { ok: true; agenda: AgendaRow }
  | { ok: false; reason: "not_found" | "invalid_transition"; current?: AgendaStatus }
> {
  const db = getDb();
  const current = (await db
    .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
    .get(id)) as RawAgendaRow | undefined;
  if (!current) return { ok: false, reason: "not_found" };

  const allowed: Record<AgendaStatus, AgendaStatus[]> = {
    draft: ["published"],
    published: ["completed"],
    completed: [],
  };
  if (!allowed[current.status].includes(to)) {
    return { ok: false, reason: "invalid_transition", current: current.status };
  }
  await db.prepare(
    `UPDATE "Agenda" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
  ).run(to, id);
  const updated = (await db
    .prepare(`SELECT * FROM "Agenda" WHERE id = ?`)
    .get(id)) as RawAgendaRow | undefined;
  if (!updated) return { ok: false, reason: "not_found" };
  return { ok: true, agenda: rowToAgenda(updated) };
}

function rowToAgenda(r: RawAgendaRow): AgendaRow {
  return {
    id: r.id,
    date: r.date,
    status: r.status,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// --- Items ----------------------------------------------------------------

export async function getAgendaItem(
  agendaId: number,
  itemId: number,
): Promise<AgendaItemWithJoins | null> {
  const db = getDb();
  const row = (await db
    .prepare(
      `SELECT
         ai.id, ai.agendaId, ai.type, ai."order", ai.refId, ai.note,
         h.titleEs AS hymn_titleEs, h.titleEn AS hymn_titleEn,
         m.firstName AS member_firstName, m.lastName AS member_lastName,
         e.title AS event_title, e.eventDate AS event_eventDate, e.type AS event_type
       FROM "AgendaItem" ai
       LEFT JOIN "Hymn" h ON ai.type = 'hymn' AND h.number = ai.refId
       LEFT JOIN "Member" m ON (ai.type = 'speaker' OR ai.type = 'prayer') AND m.id = ai.refId
       LEFT JOIN "Event" e ON ai.type = 'announcement' AND e.id = ai.refId
       WHERE ai.agendaId = ? AND ai.id = ?`,
    )
    .get(agendaId, itemId)) as JoinedAgendaItemRow | undefined;
  return row ? toAgendaItemWithJoins(row) : null;
}

export async function createAgendaItem(input: {
  agendaId: number;
  type: AgendaItemWithJoins["type"];
  refId: number | null;
  note: string | null;
  order?: number;
}): Promise<AgendaItemWithJoins> {
  const db = getDb();
  const tx = db.transaction(async () => {
    let order = input.order;
    if (order === undefined) {
      const max = (await db
        .prepare(
          `SELECT COALESCE(MAX("order"), -1) AS m FROM "AgendaItem" WHERE agendaId = ?`,
        )
        .get(input.agendaId)) as { m: number };
      order = max.m + 1;
    }
    const result = await db
      .prepare(
        `INSERT INTO "AgendaItem" (agendaId, type, "order", refId, note) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.agendaId, input.type, order, input.refId, input.note);
    return Number(result.lastInsertRowid);
  });
  let id = Number(await tx());
  if (!Number.isFinite(id) || id <= 0) {
    // Postgres path: re-SELECT the most recent item for this agenda.
    const items = (await db
      .prepare(
        `SELECT id FROM "AgendaItem" WHERE agendaId = ? ORDER BY id DESC LIMIT 1`,
      )
      .all(input.agendaId)) as { id: number }[];
    id = Number(items[0]?.id ?? 0);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("No se pudo crear el item");
    }
  }
  const item = await getAgendaItem(input.agendaId, id);
  if (!item) {
    // Should be unreachable.
    throw new Error("Failed to load newly-created AgendaItem");
  }
  return item;
}

export async function updateAgendaItem(
  agendaId: number,
  itemId: number,
  patch: {
    type?: AgendaItemWithJoins["type"];
    refId?: number | null;
    note?: string | null;
    order?: number;
  },
): Promise<AgendaItemWithJoins | null> {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.type !== undefined) {
    fields.push("type = ?");
    params.push(patch.type);
  }
  if (patch.refId !== undefined) {
    fields.push("refId = ?");
    params.push(patch.refId);
  }
  if (patch.note !== undefined) {
    fields.push("note = ?");
    params.push(patch.note);
  }
  if (patch.order !== undefined) {
    fields.push(`"order" = ?`);
    params.push(patch.order);
  }
  if (!fields.length) {
    return getAgendaItem(agendaId, itemId);
  }
  params.push(agendaId, itemId);
  const result = await db
    .prepare(`UPDATE "AgendaItem" SET ${fields.join(", ")} WHERE agendaId = ? AND id = ?`)
    .run(...params);
  if (result.changes === 0) {
    // Postgres path: 0 changes can be a no-op (same values) or a missing row.
    const existing = await getAgendaItem(agendaId, itemId);
    return existing;
  }
  return getAgendaItem(agendaId, itemId);
}

export async function deleteAgendaItem(
  agendaId: number,
  itemId: number,
): Promise<boolean> {
  const db = getDb();
  // Confirm the item exists first so the return value is accurate on
  // both backends.
  const existing = (await db
    .prepare(
      `SELECT id FROM "AgendaItem" WHERE agendaId = ? AND id = ?`,
    )
    .get(agendaId, itemId)) as { id: number } | undefined;
  if (!existing) return false;
  await db
    .prepare(`DELETE FROM "AgendaItem" WHERE agendaId = ? AND id = ?`)
    .run(agendaId, itemId);
  return true;
}

export async function reorderAgendaItems(
  agendaId: number,
  orderedItems: { id: number; order: number }[],
): Promise<boolean> {
  const db = getDb();
  // Sanity check: every id must belong to the agenda. Mismatch → refuse.
  const placeholders = orderedItems.map(() => "?").join(",");
  const rows = (await db
    .prepare(
      `SELECT id FROM "AgendaItem" WHERE agendaId = ? AND id IN (${placeholders})`,
    )
    .all(agendaId, ...orderedItems.map((i) => i.id))) as { id: number }[];
  if (rows.length !== orderedItems.length) {
    return false;
  }
  const tx = db.transaction(async () => {
    const stmt = db.prepare(
      `UPDATE "AgendaItem" SET "order" = ? WHERE agendaId = ? AND id = ?`,
    );
    for (const it of orderedItems) {
      await stmt.run(it.order, agendaId, it.id);
    }
  });
  await tx();
  return true;
}
