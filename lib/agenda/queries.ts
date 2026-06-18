/**
 * DB access layer for the Agenda + AgendaItem tables using Prisma.
 */
import { prisma } from "@/lib/db";
import type {
  AgendaItemRow,
  AgendaItemWithJoins,
  AgendaRow,
  AgendaStatus,
  AgendaWithItems,
} from "./types";

function rowToAgenda(r: any): AgendaRow {
  return {
    id: r.id,
    date: r.date,
    status: r.status as AgendaStatus,
    createdBy: r.createdBy,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt.toISOString(),
  };
}

function toAgendaItemWithJoins(r: any): AgendaItemWithJoins {
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
  const agendaRow = await prisma.agenda.findUnique({ where: { id } });
  if (!agendaRow) return null;

  const itemRows: any[] = await prisma.$queryRawUnsafe(`
       SELECT
         ai.id, ai."agendaId", ai.type, ai."order", ai."refId", ai.note,
         h."titleEs" AS "hymn_titleEs", h."titleEn" AS "hymn_titleEn",
         m."firstName" AS "member_firstName", m."lastName" AS "member_lastName",
         e.title AS "event_title", e."eventDate" AS "event_eventDate", e.type AS "event_type"
       FROM "AgendaItem" ai
       LEFT JOIN "Hymn" h ON ai.type = 'hymn' AND h.number = ai."refId"
       LEFT JOIN "Member" m ON (ai.type = 'speaker' OR ai.type = 'prayer') AND m.id = ai."refId"
       LEFT JOIN "Event" e ON ai.type = 'announcement' AND e.id = ai."refId"
       WHERE ai."agendaId" = $1
       ORDER BY ai."order" ASC, ai.id ASC
  `, id);

  return {
    ...rowToAgenda(agendaRow),
    items: itemRows.map(toAgendaItemWithJoins),
  };
}

export async function getAgendaByDate(date: string): Promise<AgendaWithItems | null> {
  const row = await prisma.agenda.findFirst({ where: { date } });
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
  const where: any = {};
  if (filter.status) where.status = filter.status;
  
  const today = filter.today;
  if (filter.range === "upcoming" && today) {
    where.date = { gte: today };
  } else if (filter.range === "past" && today) {
    where.date = { lt: today };
  } else {
    if (filter.from) {
      where.date = { ...where.date, gte: filter.from };
    }
    if (filter.to) {
      where.date = { ...where.date, lte: filter.to };
    }
  }

  const rows = await prisma.agenda.findMany({
    where,
    orderBy: { date: "desc" },
    take: filter.limit ? Math.max(1, Math.min(500, filter.limit)) : undefined,
  });

  return rows.map(rowToAgenda);
}

export async function getNextPublishedAgenda(today: string): Promise<AgendaRow | null> {
  const row = await prisma.agenda.findFirst({
    where: {
      status: "published",
      date: { gte: today }
    },
    orderBy: { date: "asc" }
  });
  if (!row) return null;
  return rowToAgenda(row);
}

// --- Create / Update / Delete ---------------------------------------------

export async function createAgenda(input: {
  date: string;
  createdBy: number;
}): Promise<AgendaRow> {
  const row = await prisma.agenda.create({
    data: {
      date: input.date,
      status: "draft",
      createdBy: input.createdBy
    }
  });
  return rowToAgenda(row);
}

export async function updateAgenda(
  id: number,
  patch: { date?: string; status?: AgendaStatus },
): Promise<AgendaRow | null> {
  if (Object.keys(patch).length === 0) {
    const existing = await prisma.agenda.findUnique({ where: { id } });
    return existing ? rowToAgenda(existing) : null;
  }
  
  try {
    const updated = await prisma.agenda.update({
      where: { id },
      data: patch
    });
    return rowToAgenda(updated);
  } catch (e) {
    return null; // Handle record not found implicitly
  }
}

export async function deleteAgenda(id: number): Promise<boolean> {
  try {
    await prisma.agenda.delete({ where: { id } });
    return true;
  } catch (e) {
    return false;
  }
}

export async function transitionAgenda(
  id: number,
  to: AgendaStatus,
): Promise<
  | { ok: true; agenda: AgendaRow }
  | { ok: false; reason: "not_found" | "invalid_transition"; current?: AgendaStatus }
> {
  const current = await prisma.agenda.findUnique({ where: { id } });
  if (!current) return { ok: false, reason: "not_found" };

  const allowed: Record<AgendaStatus, AgendaStatus[]> = {
    draft: ["published"],
    published: ["completed"],
    completed: [],
  };
  
  const currentStatus = current.status as AgendaStatus;
  if (!allowed[currentStatus].includes(to)) {
    return { ok: false, reason: "invalid_transition", current: currentStatus };
  }
  
  const updated = await prisma.agenda.update({
    where: { id },
    data: { status: to }
  });
  
  return { ok: true, agenda: rowToAgenda(updated) };
}

// --- Items ----------------------------------------------------------------

export async function getAgendaItem(
  agendaId: number,
  itemId: number,
): Promise<AgendaItemWithJoins | null> {
  const rowsRaw: any[] = await prisma.$queryRawUnsafe(`
       SELECT
         ai.id, ai."agendaId", ai.type, ai."order", ai."refId", ai.note,
         h."titleEs" AS "hymn_titleEs", h."titleEn" AS "hymn_titleEn",
         m."firstName" AS "member_firstName", m."lastName" AS "member_lastName",
         e.title AS "event_title", e."eventDate" AS "event_eventDate", e.type AS "event_type"
       FROM "AgendaItem" ai
       LEFT JOIN "Hymn" h ON ai.type = 'hymn' AND h.number = ai."refId"
       LEFT JOIN "Member" m ON (ai.type = 'speaker' OR ai.type = 'prayer') AND m.id = ai."refId"
       LEFT JOIN "Event" e ON ai.type = 'announcement' AND e.id = ai."refId"
       WHERE ai."agendaId" = $1 AND ai.id = $2
  `, agendaId, itemId);
  
  if (rowsRaw.length === 0) return null;
  return toAgendaItemWithJoins(rowsRaw[0]);
}

export async function createAgendaItem(input: {
  agendaId: number;
  type: AgendaItemWithJoins["type"];
  refId: number | null;
  note: string | null;
  order?: number;
}): Promise<AgendaItemWithJoins> {
  let order = input.order;
  if (order === undefined) {
    const maxRow = await prisma.agendaItem.findFirst({
      where: { agendaId: input.agendaId },
      orderBy: { order: 'desc' }
    });
    order = maxRow ? maxRow.order + 1 : 0;
  }
  
  const created = await prisma.agendaItem.create({
    data: {
      agendaId: input.agendaId,
      type: input.type,
      order,
      refId: input.refId,
      note: input.note
    }
  });
  
  const item = await getAgendaItem(input.agendaId, created.id);
  if (!item) throw new Error("Failed to load newly-created AgendaItem");
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
  if (Object.keys(patch).length === 0) {
    return getAgendaItem(agendaId, itemId);
  }
  
  try {
    await prisma.agendaItem.update({
      where: {
        id: itemId,
        agendaId // ensure it belongs to the agenda
      },
      data: patch
    });
  } catch (e) {
    return null;
  }
  
  return getAgendaItem(agendaId, itemId);
}

export async function deleteAgendaItem(
  agendaId: number,
  itemId: number,
): Promise<boolean> {
  try {
    await prisma.agendaItem.delete({
      where: {
        id: itemId,
        agendaId // Prisma allows composite unique, but since id is globally unique, we can just do:
      }
    });
    return true;
  } catch (e) {
    // If we want to strictly check agendaId, we use deleteMany or check first
    // Prisma delete with agendaId will throw if id is not found or mismatch.
    try {
        const deleted = await prisma.agendaItem.deleteMany({
            where: { id: itemId, agendaId }
        });
        return deleted.count > 0;
    } catch(err) {
        return false;
    }
  }
}

export async function reorderAgendaItems(
  agendaId: number,
  orderedItems: { id: number; order: number }[],
): Promise<boolean> {
  // Sanity check: every id must belong to the agenda
  const existingIds = await prisma.agendaItem.findMany({
    where: { 
      agendaId,
      id: { in: orderedItems.map(i => i.id) }
    },
    select: { id: true }
  });
  
  if (existingIds.length !== orderedItems.length) {
    return false;
  }
  
  await prisma.$transaction(async (tx: any) => {
    for (const it of orderedItems) {
      await tx.agendaItem.update({
        where: { id: it.id },
        data: { order: it.order }
      });
    }
  });
  
  return true;
}
