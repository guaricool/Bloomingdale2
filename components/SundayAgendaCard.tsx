"use client";

/**
 * Tarjeta de la próxima agenda dominical para el sidebar.
 *
 * Muestra el domingo próximo y un resumen de los items. Click → modal con
 * la agenda completa (himnos con popup, discursantes, anuncios, etc).
 */
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HymnModal, type HymnInfo } from "@/components/HymnModal";
import type { AgendaWithItems } from "@/lib/agenda/types";

interface SundayAgendaCardProps {
  date: string; // YYYY-MM-DD
  formattedDate: string;
  agenda: AgendaWithItems | null;
  /** When provided, button navigates here instead of opening the modal. */
  publicHref?: string;
}

export function SundayAgendaCard({
  date,
  formattedDate,
  agenda,
  publicHref,
}: SundayAgendaCardProps) {
  const [open, setOpen] = useState(false);
  const [activeHymn, setActiveHymn] = useState<HymnInfo | null>(null);

  return (
    <>
      {/* Modal de himno */}
      <HymnModal hymn={activeHymn} onClose={() => setActiveHymn(null)} />
      <div className="paper-card overflow-hidden">
        <div className="bg-blue-700 px-5 py-4 text-slate-50">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Domingo próximo
          </p>
          <p className="mt-1 font-display text-lg font-medium leading-snug">
            {formattedDate}
          </p>
        </div>
        <div className="px-5 py-4">
          {agenda ? (
            <>
              <div className="flex items-center justify-between">
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Programa
                </p>
                <Badge tone={agenda.status === "published" ? "sage" : "amber"}>
                  {agenda.status === "published" ? "Publicada" : "Borrador"}
                </Badge>
              </div>
              <ol className="mt-3 space-y-1.5">
                {agenda.items.slice(0, 4).map((it, idx) => (
                  <li
                    key={it.id}
                    className="flex items-start gap-2 font-sans text-sm text-slate-700"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 font-display text-[0.7rem] font-medium text-blue-700">
                      {idx + 1}
                    </span>
                    <span className="line-clamp-1">
                      {it.type === "hymn" && it.hymn
                        ? `Himno ${it.hymn.number} — ${it.hymn.titleEs}`
                        : it.type === "speaker" && it.member
                          ? `${[it.member.firstName, it.member.middleName, it.member.lastName].filter(Boolean).join(" ")}`
                          : it.type === "prayer" && it.member
                            ? `Oración — ${[it.member.firstName, it.member.middleName, it.member.lastName].filter(Boolean).join(" ")}`
                            : it.event
                              ? it.event.title
                              : it.note ?? "—"}
                    </span>
                  </li>
                ))}
                {agenda.items.length > 4 ? (
                  <li className="font-sans text-xs italic text-slate-500">
                    + {agenda.items.length - 4} más
                  </li>
                ) : null}
              </ol>
            </>
          ) : (
            <p className="font-sans text-sm italic text-slate-500">
              Aún no hay agenda preparada para este domingo.
            </p>
          )}
        </div>
        <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3">
          {agenda ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => setOpen(true)}
            >
              Ver agenda completa
            </Button>
          ) : publicHref ? (
            <Button as="a" href={publicHref} variant="secondary" size="sm" className="w-full">
              Ver historial
            </Button>
          ) : null}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Domingo"
        title={formattedDate}
        size="xl"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
            {publicHref ? (
              <Button as="a" href={publicHref} variant="secondary" size="sm">
                Vista pública
              </Button>
            ) : null}
          </>
        }
      >
        {agenda ? (
          <AgendaFullBody agenda={agenda} date={date} onHymnClick={setActiveHymn} />
        ) : (
          <p className="text-sm text-slate-500">No hay agenda preparada.</p>
        )}
      </Modal>
    </>
  );
}

function AgendaFullBody({
  agenda,
  onHymnClick,
}: {
  agenda: AgendaWithItems;
  date: string;
  onHymnClick: (hymn: HymnInfo) => void;
}) {
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
        <li key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-display text-base font-medium text-blue-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-pill border border-blue-200 bg-blue-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-blue-700">
                {item.type.includes("hymn") ? "Himno"
                  : item.type === "speaker" ? "Discurso"
                  : item.type === "prayer" ? "Oración"
                  : "Anuncio"}
              </span>
              {item.type.includes("hymn") && (
                <span className={`inline-flex items-center rounded-pill px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                  item.type === "sacrament_hymn" || item.note === "Santa Cena" ? "bg-amber-50 text-amber-700"
                  : item.note?.startsWith("Intermedio") ? "bg-slate-100 text-slate-500"
                  : "bg-blue-100 text-blue-800"
                }`}>
                  {item.type === "hymn_opening" ? "Apertura"
                    : item.type === "sacrament_hymn" ? "Santa Cena"
                    : item.type === "hymn_closing" ? "Cierre"
                    : item.note || "Himno"}
                </span>
              )}
            </div>
            <div className="mt-1.5 font-display text-lg text-slate-900">
              {item.type.includes("hymn") && item.hymn ? (
                <button
                  type="button"
                  onClick={() => onHymnClick({
                    number: item.hymn!.number,
                    titleEs: item.hymn!.titleEs,
                    titleEn: item.hymn!.titleEn,
                  })}
                  className="group text-left"
                >
                  <span className="underline decoration-blue-200 decoration-2 underline-offset-4 transition-colors group-hover:text-blue-700 group-hover:decoration-blue-400">
                    Himno {item.hymn.number}
                  </span>{" "}
                  <span className="text-slate-700">— {item.hymn.titleEs}</span>
                  <span className="ml-2 font-sans text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Ver letra →
                  </span>
                </button>
              ) : null}
              {(item.type === "speaker" || item.type === "prayer") && item.member ? (
                <p>
                  {[item.member.firstName, item.member.middleName, item.member.lastName].filter(Boolean).join(" ")}
                  {item.type === "prayer" ? (
                    <span className="ml-2 font-sans text-sm italic text-slate-500">— oración</span>
                  ) : null}
                </p>
              ) : null}
              {item.type === "announcement" ? (
                <p>
                  {item.event ? item.event.title : item.note ?? "Anuncio"}
                  {item.event ? (
                    <span className="ml-2 font-sans text-sm italic text-slate-500">({item.event.type})</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
