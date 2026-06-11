/**
 * `/agendas/hoy` — Public view of the agenda for the current Sunday.
 *
 * Uses the same renderer as `/agendas/[id]` but resolves the agenda
 * automatically: today's date if it's a Sunday, otherwise the next/upcoming
 * published agenda. If neither exists, shows a friendly empty state.
 */
import Link from "next/link";
import { requireSessionForPage } from "@/lib/authz";
import { getAgendaByDate, getAgendaById, getNextPublishedAgenda } from "@/lib/agenda/queries";
import { formatSpanishDate, isSunday, nextSunday, todayIso } from "@/lib/agenda/dates";
import { AgendaViewer } from "./AgendaViewer";

export const dynamic = "force-dynamic";

export default async function HoyPage() {
  await requireSessionForPage();
  const today = todayIso();
  const target = isSunday(today) ? today : nextSunday(today);
  // Prefer the agenda anchored to the target Sunday; fall back to the
  // next published agenda (which has full items).
  const byDate = getAgendaByDate(target);
  const agenda = byDate ?? (() => {
    const next = getNextPublishedAgenda(today);
    return next ? getAgendaById(next.id) : null;
  })();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/agendas" className="hover:text-slate-700">
          ← Agendas
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">
        {formatSpanishDate(target)}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {agenda
          ? agenda.status === "published"
            ? "Esta es la agenda publicada para este domingo."
            : agenda.status === "completed"
              ? "Esta reunión ya fue completada."
              : "Hay un borrador para este domingo, pero aún no está publicado."
          : "Aún no hay agenda para este domingo."}
      </p>

      <div className="mt-6">
        {agenda ? (
          <AgendaViewer agenda={agenda} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Pídele a un administrador que cree la agenda del próximo domingo.
          </div>
        )}
      </div>
    </div>
  );
}
