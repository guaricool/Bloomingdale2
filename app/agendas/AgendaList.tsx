/**
 * Server-rendered list of agenda rows. Used by the public index.
 * Pure server component: receives rows as props, renders a list.
 */
import Link from "next/link";
import type { AgendaRow } from "@/lib/agenda/types";
import { formatShortDate } from "@/lib/agenda/dates";

const STATUS_BADGE: Record<AgendaRow["status"], string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-600",
};
const STATUS_LABEL: Record<AgendaRow["status"], string> = {
  draft: "Borrador",
  published: "Publicada",
  completed: "Completada",
};

interface Props {
  upcoming: AgendaRow[];
  recent: AgendaRow[];
}

export function AgendaList({ upcoming, recent }: Props) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Próximas
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            No hay agendas próximas publicadas.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatShortDate(a.date)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Actualizada {a.updatedAt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                  <Link
                    href={`/agendas/${a.id}`}
                    className="text-xs font-medium text-brand-700 underline hover:text-brand-800"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recientes
        </h2>
        {recent.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            Sin historial reciente.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatShortDate(a.date)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Actualizada {a.updatedAt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                  <Link
                    href={`/agendas/${a.id}`}
                    className="text-xs font-medium text-brand-700 underline hover:text-brand-800"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
