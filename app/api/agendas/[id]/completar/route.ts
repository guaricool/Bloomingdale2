/**
 * POST /api/agendas/[id]/completar
 *
 * Transitions `published → completed`. Side effects (DiscourseLog writes)
 * are deferred to the future discourse-tracking task — for now this just
 * flips the status.
 *
 * TODO(agendas-module→discourse-tracking): once the discourse-tracking
 * task ships, on completion write one row per 'speaker' AgendaItem into
 * DiscourseLog(memberId, agendaId, discourseDate, topic).
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { transitionAgenda } from "@/lib/agenda/queries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const result = await transitionAgenda(id, "completed");
  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: `No se puede completar una agenda en estado '${result.current}'`,
      },
      { status: 400 },
    );
  }

  const speakers = await prisma.agendaItem.findMany({
    where: { agendaId: id, type: "speaker", refId: { not: null } }
  });

  if (speakers.length > 0) {
    await prisma.discourseLog.createMany({
      data: speakers.map((item) => ({
        agendaId: id,
        memberId: item.refId!,
        discourseDate: result.agenda.date,
        topic: item.note
      })),
      skipDuplicates: true
    });
  }

  return NextResponse.json({ agenda: result.agenda });
}
