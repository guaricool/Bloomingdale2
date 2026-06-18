/**
 * Events module — inter-module integration: auto-insert an AgendaItem of
 * type='announcement' into every existing draft/published Agenda that falls
 * between today and the new event's date (inclusive, only Sundays).
 */
import { prisma } from "@/lib/db";
import { todayIsoDate, addDaysIso } from "@/lib/events";

export interface AnnouncementInsertResult {
  created: number;
  skipped: number;
  consideredAgendas: number;
  tablesMissing?: boolean;
  error?: string;
}

/**
 * Returns true when the Agenda and AgendaItem tables exist in the schema.
 */
async function agendaTablesExist(): Promise<boolean> {
  try {
    await prisma.agenda.findFirst();
    await prisma.agendaItem.findFirst();
    return true;
  } catch {
    return false;
  }
}

export async function insertAnnouncementIntoExistingAgendas(
  eventId: number,
  eventDate: string,
): Promise<AnnouncementInsertResult> {
  if (!(await agendaTablesExist())) {
    console.warn(
      `[events-integration] Agenda/AgendaItem tables missing; skipping auto-insert for event ${eventId}. ` +
        `TODO: agendas-module should call /api/eventos/anuncios-pendientes when creating/editing agendas.`,
    );
    return { created: 0, skipped: 0, consideredAgendas: 0, tablesMissing: true };
  }

  const today = todayIsoDate();
  const upper = eventDate;

  let consideredAgendas = 0;
  let created = 0;
  let skipped = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const agendas = await tx.agenda.findMany({
        where: {
          date: { gte: today, lte: upper },
          status: { in: ['draft', 'published'] }
        },
        orderBy: { date: 'asc' }
      });

      consideredAgendas = agendas.length;

      const sundayAgendas = agendas.filter((a) => {
        const d = new Date(a.date + "T00:00:00");
        return d.getDay() === 0;
      });

      for (const agenda of sundayAgendas) {
        const existing = await tx.agendaItem.findFirst({
          where: {
            agendaId: agenda.id,
            type: 'announcement',
            refId: eventId
          }
        });

        if (existing) {
          skipped += 1;
          continue;
        }

        await tx.agendaItem.create({
          data: {
            agendaId: agenda.id,
            type: 'announcement',
            order: 0,
            refId: eventId,
            note: `(evento) ${eventDate}`
          }
        });
        created += 1;
      }
    });
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

export async function removeAnnouncementFromAllAgendas(eventId: number): Promise<number> {
  if (!(await agendaTablesExist())) return 0;
  try {
    const result = await prisma.agendaItem.deleteMany({
      where: {
        type: 'announcement',
        refId: eventId
      }
    });
    return result.count;
  } catch (e) {
    return 0;
  }
}

export { addDaysIso };
