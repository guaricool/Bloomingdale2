"use client";

/**
 * MonthCalendar — interactive month grid for the landing page sidebar.
 *
 * Server-friendly: the page component fetches all events for the
 * displayed month and passes them as a map keyed by `YYYY-MM-DD`. The
 * client only handles click-to-open-day interactions (small modal or
 * popover) so the JS payload stays tiny.
 *
 *   - Past days are dimmed
 *   - Today has a sage ring
 *   - Days with events show a small dot
 *   - Click a day → modal with the events for that day (title, time, type, description)
 *   - Keyboard navigable: ← / → switch months, Enter on day opens modal
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  eventDate: string; // YYYY-MM-DD
  type: string;
  time?: string | null; // HH:MM (24h) if known
}

interface MonthCalendarProps {
  /** All events to display across the rendered months. Pre-fetched server-side. */
  events: CalendarEvent[];
  /** Initial month (1-12). Defaults to current month. */
  initialMonth?: number;
  /** Initial year. Defaults to current year. */
  initialYear?: number;
  /** Called when the user wants to open the full agenda for a Sunday. */
  onSundayClick?: (agendaId: number) => void;
  /** Optional Sunday agenda id (used to highlight the day cell). */
  sundayAgendaId?: number;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function isSameDay(a: Date, iso: string): boolean {
  return (
    a.getFullYear() === Number(iso.slice(0, 4)) &&
    a.getMonth() + 1 === Number(iso.slice(5, 7)) &&
    a.getDate() === Number(iso.slice(8, 10))
  );
}

export function MonthCalendar({
  events,
  initialMonth,
  initialYear,
}: MonthCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Build the day grid: first day of the month, padded to start on Monday.
  const grid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    let firstWeekday = first.getDay(); // 0 = Sun ... 6 = Sat
    // Shift so Monday = 0 ... Sunday = 6
    firstWeekday = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: { day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, iso: toIso(year, month, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });
    return cells;
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.eventDate) ?? [];
      list.push(e);
      map.set(e.eventDate, list);
    }
    return map;
  }, [events]);

  const todayIso = toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());

  function goto(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  // Close modal on Escape, focus the day cell when closed
  useEffect(() => {
    if (!openDay) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDay(null);
    }
    document.addEventListener("keydown", onKey);
    // Focus the dialog for screen readers
    queueMicrotask(() => dialogRef.current?.focus());
    return () => document.removeEventListener("keydown", onKey);
  }, [openDay]);

  const openEvents = openDay ? eventsByDay.get(openDay) ?? [] : [];
  const openDayNumber = openDay ? Number(openDay.slice(8, 10)) : 0;

  return (
    <div className="paper-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3">
        <button
          type="button"
          onClick={() => goto(-1)}
          aria-label="Mes anterior"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
        >
          ‹
        </button>
        <p className="font-display text-sm font-medium text-ink-900">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button
          type="button"
          onClick={() => goto(1)}
          aria-label="Mes siguiente"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
        >
          ›
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-cream-200 bg-cream-100/40 text-center">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-ink-500"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={idx} className="h-9 border-b border-cream-200/60" />;
          }
          const has = eventsByDay.has(cell.iso!);
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setOpenDay(cell.iso)}
              className={clsx(
                "relative h-9 border-b border-cream-200/60 font-sans text-xs transition-colors",
                "hover:bg-sage-50 focus-visible:bg-sage-50",
                isToday && "ring-1 ring-inset ring-sage-400",
                has && "font-semibold text-ink-900",
                !has && "text-ink-500",
              )}
              aria-label={`${cell.day}${has ? `, ${eventsByDay.get(cell.iso!)?.length ?? 0} evento(s)` : ""}`}
            >
              {cell.day}
              {has ? (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sage-600"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {openDay ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Eventos del ${openDayNumber} de ${MONTH_NAMES[month - 1]}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm"
          onClick={() => setOpenDay(null)}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="document"
            onClick={(e) => e.stopPropagation()}
            className="paper-card mx-4 w-full max-w-md animate-reveal-up"
          >
            <div className="flex items-start justify-between border-b border-cream-200 px-5 py-4">
              <div>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                  {MONTH_NAMES[month - 1]} {openDayNumber}
                </p>
                <h3 className="mt-1 font-display text-xl font-medium text-ink-900">
                  {openEvents.length === 0
                    ? "Sin eventos"
                    : openEvents.length === 1
                      ? "1 evento"
                      : `${openEvents.length} eventos`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenDay(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full font-sans text-lg text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4">
              {openEvents.length === 0 ? (
                <p className="font-sans text-sm text-ink-500">
                  No hay eventos programados para este día.
                </p>
              ) : (
                <ul className="space-y-3">
                  {openEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-card border border-cream-200 bg-cream-50/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base font-medium text-ink-900">
                          {ev.title}
                        </p>
                        <span className="shrink-0 rounded-pill border border-sage-200 bg-sage-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-sage-700">
                          {ev.type}
                        </span>
                      </div>
                      {ev.description ? (
                        <p className="mt-1 font-sans text-sm text-ink-700">
                          {ev.description}
                        </p>
                      ) : null}
                      {ev.time ? (
                        <p className="mt-1 font-sans text-xs text-ink-500">
                          {ev.time}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end border-t border-cream-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpenDay(null)}
                className="rounded-pill border border-cream-300 bg-white px-4 py-1.5 font-sans text-xs font-medium text-ink-700 transition-colors hover:bg-cream-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
