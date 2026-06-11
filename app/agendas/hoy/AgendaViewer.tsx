/**
 * Pure server component: renders an agenda with all items. Used by
 * `/agendas/hoy` and could be reused by the public view if we wanted
 * to keep that page as a thin shell.
 */
import { ITEM_TYPE_LABELS, type AgendaWithItems } from "@/lib/agenda/types";

export function AgendaViewer({ agenda }: { agenda: AgendaWithItems }) {
  if (agenda.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
        Esta agenda aún no tiene items.
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {agenda.items.map((item, idx) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <span className="text-sm font-semibold text-slate-400">{idx + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                {ITEM_TYPE_LABELS[item.type]}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-900">
              {item.type === "hymn" && item.hymn ? (
                <details>
                  <summary className="cursor-pointer text-brand-700 underline hover:text-brand-800">
                    Himno {item.hymn.number} — {item.hymn.titleEs}
                  </summary>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    {item.hymn.titleEn ? (
                      <p>
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          Inglés:
                        </span>{" "}
                        {item.hymn.titleEn}
                      </p>
                    ) : null}
                    <p>
                      <a
                        href={`https://www.churchofjesuschrist.org/study/library/hymns/${item.hymn.number}?lang=spa`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-700 underline hover:text-brand-800"
                      >
                        Ver letra completa (churchofjesuschrist.org) ↗
                      </a>
                    </p>
                  </div>
                </details>
              ) : null}
              {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                <p>
                  <strong>
                    {item.member.firstName} {item.member.lastName}
                  </strong>
                  {item.type === "prayer" ? (
                    <span className="ml-2 text-xs text-slate-500">(Oración)</span>
                  ) : null}
                </p>
              ) : null}
              {item.type === "announcement" && item.event ? (
                <p>
                  <strong>{item.event.title}</strong>
                  <span className="ml-2 text-xs text-slate-500">
                    ({item.event.type})
                  </span>
                  {item.note ? (
                    <span className="ml-2 text-sm text-slate-700">{item.note}</span>
                  ) : null}
                </p>
              ) : null}
              {!item.hymn && !item.member && !item.event && item.note ? (
                <p className="text-sm text-slate-700">{item.note}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
