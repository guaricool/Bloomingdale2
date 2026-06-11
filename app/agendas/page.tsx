/**
 * `/agendas` — Public listing of upcoming + recent published agendas.
 *
 * Server component: redirects to today's agenda if there's one published,
 * otherwise shows the list. Anyone signed in can read.
 */
import Link from "next/link";
import { requireSessionForPage } from "@/lib/authz";
import { listAgendas, getNextPublishedAgenda } from "@/lib/agenda/queries";
import { formatShortDate, formatSpanishDate, todayIso } from "@/lib/agenda/dates";
import { AgendaList } from "./AgendaList";

export const dynamic = "force-dynamic";

export default async function PublicAgendasPage() {
  await requireSessionForPage();
  const today = todayIso();
  const next = getNextPublishedAgenda(today);
  const upcoming = listAgendas({ range: "upcoming", today });
  const recent = listAgendas({ range: "past", today, limit: 10 });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Agendas
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {next ? formatSpanishDate(next.date) : "No hay agenda publicada"}
          </h1>
          {next ? (
            <p className="mt-1 text-sm text-slate-600">
              <Link
                href={`/agendas/${next.id}`}
                className="text-brand-700 underline hover:text-brand-800"
              >
                Ver la agenda de este domingo →
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Pídele a un administrador que publique la agenda del próximo
              domingo.
            </p>
          )}
        </div>
        <Link
          href="/agendas/hoy"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ir al domingo de hoy
        </Link>
      </div>

      <AgendaList
        upcoming={upcoming.filter((a) => a.id !== next?.id)}
        recent={recent}
      />

      <p className="mt-6 text-xs text-slate-500">
        Mostrando {upcoming.length} próxima(s) y {recent.length} pasada(s).
        Fechas: {formatShortDate(today)}.
      </p>
    </div>
  );
}
