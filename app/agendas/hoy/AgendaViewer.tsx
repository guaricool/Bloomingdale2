/**
 * Pure server component: renders an agenda with all items.
 *
 * Diseño editorial: número grande a la izquierda, tipografía con
 * personalidad, himnos con pop-up de detalles (no scrapeamos, linkeamos
 * a churchofjesuschrist.org).
 */
import { ITEM_TYPE_LABELS, type AgendaWithItems } from "@/lib/agenda/types";

export function AgendaViewer({ agenda }: { agenda: AgendaWithItems }) {
  if (agenda.items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center font-sans text-sm text-slate-500">
        Esta agenda aún no tiene items.
      </div>
    );
  }
  return (
    <ol className="divide-y divide-slate-200">
      {agenda.items.map((item, idx) => (
        <li
          key={item.id}
          className="group flex items-start gap-4 py-4 transition-colors first:pt-0 last:pb-0"
        >
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-display text-base font-medium text-blue-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-pill border border-blue-200 bg-blue-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-blue-700">
                {ITEM_TYPE_LABELS[item.type]}
              </span>
            </div>
            <div className="mt-1.5 font-display text-lg text-slate-900">
              {item.type.includes("hymn") && item.hymn ? (
                <details className="group/hymn">
                  <summary className="cursor-pointer list-none">
                    <span className="underline decoration-blue-200 decoration-2 underline-offset-4 transition-colors group-open/hymn:text-blue-700 hover:decoration-blue-400">
                      Himno {item.hymn.number}
                    </span>{" "}
                    <span className="text-slate-700">— {item.hymn.titleEs}</span>
                    <span className="ml-2 inline-block text-slate-400 transition-transform group-open/hymn:rotate-90">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1 rounded-card bg-slate-50 px-4 py-3 font-sans text-sm text-slate-700">
                    {item.hymn.titleEn ? (
                      <p>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
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
                        className="inline-flex items-center gap-1 font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-400"
                      >
                        Ver letra completa (churchofjesuschrist.org) ↗
                      </a>
                    </p>
                  </div>
                </details>
              ) : null}
              {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                <p>
                  {[item.member.firstName, item.member.middleName, item.member.lastName].filter(Boolean).join(" ")}
                  {item.type === "prayer" ? (
                    <span className="ml-2 font-sans text-sm italic text-slate-500">
                      — oración
                    </span>
                  ) : null}
                </p>
              ) : null}
              {item.type === "announcement" && item.event ? (
                <p>
                  {item.event.title}
                  <span className="ml-2 font-sans text-sm italic text-slate-500">
                    ({item.event.type})
                  </span>
                  {item.note ? (
                    <span className="ml-2 font-sans text-base text-slate-700">
                      {item.note}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {!item.hymn && !item.member && !item.event && item.note ? (
                <p className="font-sans text-base text-slate-700">{item.note}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
