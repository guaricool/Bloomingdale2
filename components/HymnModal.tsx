"use client";

/**
 * HymnModal — muestra info de un himno y abre la letra en la Iglesia.
 *
 * Estrategia para usuarios no técnicos:
 *   - El modal se queda ABIERTO en Bloomingdale (no cierra la app)
 *   - La letra abre en una PESTAÑA NUEVA de la Iglesia
 *   - Al cerrar esa pestaña, el usuario regresa automáticamente aquí
 *   - Mensaje claro: "Para regresar, cierra la pestaña de la Iglesia"
 */
import { useEffect } from "react";

export interface HymnInfo {
  number: number;
  titleEs: string;
  titleEn?: string | null;
}

interface HymnModalProps {
  hymn: HymnInfo | null;
  onClose: () => void;
}

export function HymnModal({ hymn, onClose }: HymnModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!hymn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hymn, onClose]);

  if (!hymn) return null;

  const churchUrl = `https://www.churchofjesuschrist.org/study/library/hymns/${hymn.number}?lang=spa`;

  function openHymn() {
    window.open(churchUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hymn-modal-title"
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2"
      >
        <div className="overflow-hidden rounded-card bg-white shadow-lift">
          {/* Header azul */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-800 px-6 py-5 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl"
            />
            <div className="relative">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-200">
                Himno {hymn.number}
              </p>
              <h2
                id="hymn-modal-title"
                className="mt-1 font-display text-xl font-medium leading-snug"
              >
                {hymn.titleEs}
              </h2>
              {hymn.titleEn && (
                <p className="mt-0.5 font-sans text-xs text-blue-200/80">
                  {hymn.titleEn}
                </p>
              )}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-6 py-5 space-y-4">
            {/* Instrucción clara para no técnicos */}
            <div className="rounded-card border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="font-sans text-sm font-medium text-blue-900">
                Para ver la letra completa:
              </p>
              <ol className="mt-2 space-y-1 font-sans text-sm text-blue-800">
                <li>1. Presiona el botón azul de abajo</li>
                <li>2. Lee el himno en la página de la Iglesia</li>
                <li className="font-semibold">
                  3. Para regresar aquí, cierra esa pestaña ✕
                </li>
              </ol>
            </div>

            {/* Botón principal */}
            <button
              type="button"
              onClick={openHymn}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-blue-600 px-4 py-3 font-sans text-sm font-semibold text-white shadow-soft transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Abrir letra en churchofjesuschrist.org
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-pill border border-slate-200 bg-white px-4 py-2 font-sans text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
