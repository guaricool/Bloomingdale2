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
      <div className="rounded-card border border-dashed border-cream-300 bg-cream-50/50 px-6 py-10 text-center font-sans text-sm text-ink-500">
        Esta agenda aún no tiene items.
      </div>
    );
  }
  return (
    <ol className="divide-y divide-cream-200">
      {agenda.items.map((item, idx) => (
        <li
          key={item.id}
          className="group flex items-start gap-4 py-4 transition-colors first:pt-0 last:pb-0"
        >
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-50 font-display text-base font-medium text-sage-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-pill border border-sage-200 bg-sage-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-sage-700">
                {ITEM_TYPE_LABELS[item.type]}
              </span>
            </div>
            <div className="mt-1.5 font-display text-lg text-ink-900">
              {item.type === "hymn" && item.hymn ? (
                <details className="group/hymn">
                  <summary className="cursor-pointer list-none">
                    <span className="underline decoration-sage-200 decoration-2 underline-offset-4 transition-colors group-open/hymn:text-sage-700 hover:decoration-sage-400">
                      Himno {item.hymn.number}
                    </span>{" "}
                    <span className="text-ink-700">— {item.hymn.titleEs}</span>
                    <span className="ml-2 inline-block text-ink-400 transition-transform group-open/hymn:rotate-90">
                      ›
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1 rounded-card bg-cream-50 px-4 py-3 font-sans text-sm text-ink-700">
                    {item.hymn.titleEn ? (
                      <p>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink-500">
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
                        className="inline-flex items-center gap-1 font-medium text-sage-700 underline decoration-sage-200 underline-offset-4 transition-colors hover:text-sage-800 hover:decoration-sage-400"
                      >
                        Ver letra completa (churchofjesuschrist.org) ↗
                      </a>
                    </p>
                  </div>
                </details>
              ) : null}
              {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                <p>
                  {item.member.firstName} {item.member.lastName}
                  {item.type === "prayer" ? (
                    <span className="ml-2 font-sans text-sm italic text-ink-500">
                      — oración
                    </span>
                  ) : null}
                </p>
              ) : null}
              {item.type === "announcement" && item.event ? (
                <p>
                  {item.event.title}
                  <span className="ml-2 font-sans text-sm italic text-ink-500">
                    ({item.event.type})
                  </span>
                  {item.note ? (
                    <span className="ml-2 font-sans text-base text-ink-700">
                      {item.note}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {!item.hymn && !item.member && !item.event && item.note ? (
                <p className="font-sans text-base text-ink-700">{item.note}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
