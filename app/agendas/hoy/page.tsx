/**
 * `/agendas/hoy` — Vista pública principal de la agenda del domingo.
 *
 * Es la "vitrine" de la plataforma: lo primero que ven los miembros al
 * iniciar sesión. Diseño editorial — tipografía con personalidad, una
 * cabecera fuerte y los items de la agenda con ritmo.
 */
import Link from "next/link";
import { requireSessionForPage } from "@/lib/authz";
import {
  getAgendaByDate,
  getAgendaById,
  getNextPublishedAgenda,
} from "@/lib/agenda/queries";
import { formatSpanishDate, isSunday, nextSunday, todayIso } from "@/lib/agenda/dates";
import { AgendaViewer } from "./AgendaViewer";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, IconHymn } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function HoyPage() {
  await requireSessionForPage();
  const today = todayIso();
  const target = isSunday(today) ? today : nextSunday(today);
  const byDate = await getAgendaByDate(target);
  let agenda = byDate;
  if (!agenda) {
    const next = await getNextPublishedAgenda(today);
    agenda = next ? await getAgendaById(next.id) : null;
  }

  const isToday = target === today;
  const isPast = target < today;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="reveal space-y-3">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sage-600">
          {isToday ? "Hoy" : isPast ? "Reunión pasada" : "Próximo domingo"}
        </p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">
          {formatSpanishDate(target)}
        </h1>
        <p className="max-w-xl text-base text-ink-500">
          {agenda
            ? agenda.status === "published"
              ? "Esta es la agenda publicada para esta reunión."
              : agenda.status === "completed"
                ? "Esta reunión ya fue completada — queda como registro histórico."
                : "Hay un borrador en preparación. Aún no está visible para los miembros."
            : "Aún no hay agenda preparada para este domingo."}
        </p>
      </div>

      <div className="mt-10">
        {agenda ? (
          <Card>
            <CardBody className="p-0">
              <div className="border-b border-cream-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                      Programa
                    </p>
                    <p className="mt-1 font-display text-base text-ink-900">
                      {agenda.items.length} {agenda.items.length === 1 ? "ítem" : "ítems"}
                    </p>
                  </div>
                  <Badge tone={agenda.status === "published" ? "sage" : agenda.status === "completed" ? "ink" : "amber"}>
                    {agenda.status === "published" ? "Publicada" : agenda.status === "completed" ? "Completada" : "Borrador"}
                  </Badge>
                </div>
              </div>
              <div className="px-6 py-5">
                <AgendaViewer agenda={agenda} />
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={<IconHymn />}
              title="Aún no hay agenda para este domingo"
              description={
                <>
                  <span className="font-display italic text-ink-500">
                    «Todo tiene su tiempo debajo del cielo».
                  </span>{" "}
                  <span className="font-sans text-[0.7rem] uppercase tracking-wider text-ink-400">
                    — Eclesiastés 3:1
                  </span>
                </>
              }
              action={
                <Button as="a" href="/agendas" variant="secondary" size="sm">
                  Ver historial
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
