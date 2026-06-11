"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO, isValid, isBefore } from "date-fns";
// isBefore is used for past/upcoming classification.
import { es } from "date-fns/locale";
import { EVENT_TYPES, type EventType, type EventRow } from "@/lib/events-types";

const TYPE_LABELS: Record<EventType, string> = {
  actividad: "Actividad",
  evento_especial: "Evento especial",
  servicio: "Servicio",
  reunion: "Reunión",
  otro: "Otro",
};

const TYPE_BADGE: Record<EventType, string> = {
  actividad: "bg-emerald-100 text-emerald-800",
  evento_especial: "bg-amber-100 text-amber-800",
  servicio: "bg-sky-100 text-sky-800",
  reunion: "bg-violet-100 text-violet-800",
  otro: "bg-slate-100 text-slate-700",
};

interface EventListProps {
  initialEvents: EventRow[];
  initialFilter: "upcoming" | "past" | "all";
}

function formatDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

function isPast(iso: string, now: Date = new Date()): boolean {
  const d = parseISO(iso);
  if (!isValid(d)) return false;
  d.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return isBefore(d, today);
}

export function EventList({ initialEvents, initialFilter }: EventListProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">(initialFilter);
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyFilter(next: "upcoming" | "past" | "all", nextType: EventType | "all") {
    const params = new URLSearchParams();
    if (next !== "all") params.set("range", next);
    if (nextType !== "all") params.set("type", nextType);
    const qs = params.toString();
    router.push(`/admin/eventos${qs ? `?${qs}` : ""}`);
  }

  function onFilterChange(next: "upcoming" | "past" | "all") {
    setFilter(next);
    applyFilter(next, typeFilter);
  }

  function onTypeFilterChange(next: EventType | "all") {
    setTypeFilter(next);
    applyFilter(filter, next);
  }

  async function onDelete(e: FormEvent, id: number, title: string) {
    e.preventDefault();
    if (!confirm(`¿Eliminar el evento "${title}"? También se quitarán los anuncios asociados en agendas.`)) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo eliminar el evento.");
        return;
      }
      setEvents((cur) => cur.filter((ev) => ev.id !== id));
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  const showing = events.filter((ev) => {
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    if (filter === "upcoming") return !isPast(ev.eventDate);
    if (filter === "past") return isPast(ev.eventDate);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-sm shadow-sm" role="tablist" aria-label="Filtrar por fecha">
          {(["upcoming", "past", "all"] as const).map((opt) => {
            const labels: Record<typeof opt, string> = {
              upcoming: "Próximos",
              past: "Pasados",
              all: "Todos",
            };
            return (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={filter === opt}
                onClick={() => onFilterChange(opt)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === opt
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {labels[opt]}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Filtrar por tipo"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as EventType | "all")}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">Todos los tipos</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <Link
          href="/admin/eventos/nuevo"
          className="ml-auto rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Nuevo evento
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {showing.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            {filter === "upcoming"
              ? "No hay eventos próximos. Crea uno para empezar a anunciar."
              : filter === "past"
                ? "No hay eventos pasados en el sistema."
                : "No hay eventos todavía."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {showing.map((ev) => {
            const past = isPast(ev.eventDate);
            return (
              <li
                key={ev.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{ev.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[ev.type]}`}
                      >
                        {TYPE_LABELS[ev.type]}
                      </span>
                      {past ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Pasado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(ev.eventDate)}
                    </p>
                    {ev.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-700">{ev.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/eventos/${ev.id}/editar`}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => onDelete(e, ev.id, ev.title)}
                      disabled={busyId === ev.id}
                      className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === ev.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
