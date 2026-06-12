/**
 * ComeFollowMeCard — tarjeta de la clase "Ven, sígueme" de la semana.
 *
 * Muestra la lección que corresponde a la fecha actual (lunes→domingo).
 * Es un apartado independiente con su propio botón que lleva directo al
 * manual oficial de la Iglesia (churchofjesuschrist.org).
 *
 * Diseño: bloque con gradiente sage profundo, número de lección como
 * "sello", tema en serif grande, rango de fechas, y un CTA prominente.
 * Toda la tarjeta es clickeable.
 */
import type { ComeFollowMeLesson } from "@/lib/come-follow-me";
import { lessonUrl } from "@/lib/come-follow-me";

interface ComeFollowMeCardProps {
  lesson: ComeFollowMeLesson | null;
}

export function ComeFollowMeCard({ lesson }: ComeFollowMeCardProps) {
  if (!lesson) {
    return (
      <div className="paper-card overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 px-5 py-4 text-slate-50">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Ven, sígueme
          </p>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="font-sans text-sm italic text-slate-500">
            No hay lección programada para esta fecha.
          </p>
        </div>
      </div>
    );
  }

  const href = lessonUrl(lesson);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-card border border-slate-200 bg-slate-50 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:translate-y-0 active:scale-[0.99]"
      aria-label={`Ven, sígueme — ${lesson.title}. Abrir lección en churchofjesuschrist.org`}
    >
      {/* Header con gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-800 px-5 py-4 text-slate-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl transition-transform duration-500 group-hover:scale-125"
        />
        <div className="relative flex items-center justify-between gap-3">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Ven, sígueme
          </p>
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-50/15 px-2 font-display text-xs font-semibold text-slate-50 ring-1 ring-slate-50/20">
            {lesson.lessonNumber}
          </span>
        </div>
        <p className="relative mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-blue-200/80">
          Clase de esta semana
        </p>
      </div>

      {/* Cuerpo */}
      <div className="px-5 py-4">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {lesson.dateRange}
        </p>
        <p className="mt-1.5 font-display text-lg font-medium leading-snug text-slate-900">
          {lesson.title}
        </p>
      </div>

      {/* CTA footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3">
        <span className="font-sans text-sm font-medium text-blue-700 transition-colors group-hover:text-blue-800">
          Abrir la lección
        </span>
        <span
          aria-hidden
          className="text-blue-600 transition-transform duration-200 group-hover:translate-x-1"
        >
          ↗
        </span>
      </div>
    </a>
  );
}
