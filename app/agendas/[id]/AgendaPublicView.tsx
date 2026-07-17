"use client";

/**
 * Vista pública de la agenda — client component.
 *
 * Usa HymnModal para que los miembros puedan ver los himnos
 * sin salir de la app. Al hacer click en un himno se abre
 * el modal con la opción de ver la letra en la Iglesia.
 */
import { useState } from "react";
import { ITEM_TYPE_LABELS, type AgendaWithItems } from "@/lib/agenda/types";
import { HymnModal, type HymnInfo } from "@/components/HymnModal";

interface AgendaPublicViewProps {
  agenda: AgendaWithItems;
  formattedDate: string;
}

export function AgendaPublicView({ agenda, formattedDate }: AgendaPublicViewProps) {
  const [activeHymn, setActiveHymn] = useState<HymnInfo | null>(null);

  return (
    <>
      <ol className="mt-8 space-y-3">
        {agenda.items.length === 0 ? (
          <li className="rounded-card border border-dashed border-slate-300 bg-white px-4 py-8 text-center font-sans text-sm text-slate-500">
            Esta agenda aún no tiene items.
          </li>
        ) : (
          agenda.items.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-soft"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-display text-sm font-semibold text-blue-700">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-pill bg-blue-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-blue-700">
                    {ITEM_TYPE_LABELS[item.type]}
                  </span>
                  {/* Rol del himno (Apertura, Santa Cena, etc.) */}
                  {item.type.includes("hymn") && (
                    <span className={`inline-flex items-center rounded-pill px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                      item.type === "sacrament_hymn" || item.note === "Santa Cena"
                        ? "bg-amber-50 text-amber-700"
                        : item.note?.startsWith("Intermedio")
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.type === "hymn_opening"
                        ? "Apertura"
                        : item.type === "sacrament_hymn"
                        ? "Santa Cena"
                        : item.type === "hymn_closing"
                        ? "Cierre"
                        : item.note || "Himno"}
                    </span>
                  )}
                </div>

                <div className="mt-1.5">
                  {/* HIMNO — botón clickeable que abre el modal */}
                  {item.type.includes("hymn") && item.hymn ? (
                    <button
                      type="button"
                      onClick={() => setActiveHymn({
                        number: item.hymn!.number,
                        titleEs: item.hymn!.titleEs,
                        titleEn: item.hymn!.titleEn,
                      })}
                      className="group flex items-center gap-2 text-left"
                    >
                      <span className="font-display text-base font-medium text-blue-700 underline decoration-blue-200 decoration-2 underline-offset-4 transition-colors group-hover:text-blue-800 group-hover:decoration-blue-400">
                        Himno {item.hymn.number} — {item.hymn.titleEs}
                      </span>
                      <span className="inline-flex items-center rounded-pill bg-blue-50 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase tracking-wider text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                        Ver letra
                      </span>
                    </button>
                  ) : item.type.includes("hymn") && !item.hymn ? (
                    <p className="font-sans text-sm italic text-slate-400">
                      Himno por confirmar
                    </p>
                  ) : null}

                  {/* DISCURSANTE / ORACIÓN */}
                  {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                    <p className="font-sans text-base font-medium text-slate-900">
                      {[item.member.firstName, item.member.middleName, item.member.lastName]
                        .filter(Boolean)
                        .join(" ")}
                      {item.type === "prayer" && (
                        <span className="ml-2 font-sans text-xs font-normal italic text-slate-500">
                          — oración
                        </span>
                      )}
                    </p>
                  ) : null}

                  {/* ANUNCIO */}
                  {item.type === "announcement" && item.event ? (
                    <div>
                      <p className="font-sans text-base font-medium text-slate-900">
                        {item.event.title}
                      </p>
                      {item.note ? (
                        <p className="mt-0.5 font-sans text-sm text-slate-600">{item.note}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* NOTA sin referencia */}
                  {!item.hymn && !item.member && !item.event && item.note &&
                    item.type !== "hymn" ? (
                    <p className="font-sans text-sm text-slate-700">{item.note}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ol>

      {/* Modal de himno */}
      <HymnModal
        hymn={activeHymn}
        onClose={() => setActiveHymn(null)}
      />
    </>
  );
}
