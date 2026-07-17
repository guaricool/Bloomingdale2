"use client";
/**
 * Client-side table for the admin agenda list.
 *
 * Receives the initial dataset from the server component and lets the admin
 *   - filter by range (upcoming / past / all)
 *   - filter by status (draft / published / completed / all)
 *   - click through to edit
 *   - delete a draft agenda (with confirm)
 *
 * Filter changes update the URL so the views are shareable. The list is
 * re-fetched by `router.refresh()` (server component re-runs).
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { formatShortDate } from "@/lib/agenda/dates";
import type { AgendaRow } from "@/lib/agenda/types";
import { useToast } from "@/components/ui/Toast";
import { deleteAgendaAction } from "./actions";

export type AgendaStatusFilter = "draft" | "published" | "completed" | "all";
export type AgendaRangeFilter = "upcoming" | "past" | "all";

interface AgendasTableProps {
  initialRows: AgendaRow[];
  initialRange: AgendaRangeFilter;
  initialStatus: AgendaStatusFilter;
}

const STATUS_LABEL: Record<AgendaStatusFilter, string> = {
  all: "Todos",
  draft: "Borrador",
  published: "Publicada",
  completed: "Completada",
};

const STATUS_BADGE: Record<AgendaStatusFilter, string> = {
  all: "bg-charcoal-500/10 text-charcoal-700 dark:text-charcoal-400",
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "bg-charcoal-500/10 text-charcoal-500",
};

export function AgendasTable({
  initialRows,
  initialRange,
  initialStatus,
}: AgendasTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function setFilter(next: { range?: AgendaRangeFilter; status?: AgendaStatusFilter }) {
    const sp = new URLSearchParams(searchParams.toString());
    if (next.range !== undefined) {
      if (next.range === "upcoming") sp.delete("range");
      else sp.set("range", next.range);
    }
    if (next.status !== undefined) {
      if (next.status === "all") sp.delete("status");
      else sp.set("status", next.status);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  async function onDelete(row: AgendaRow) {
    if (row.status !== "draft") return; // guard (UI also disables the button)
    const ok = window.confirm(
      `¿Eliminar la agenda del ${formatShortDate(row.date)}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    const res = await deleteAgendaAction(row.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar la agenda");
      return;
    }
    toast.success("Agenda eliminada");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
            Rango
          </span>
          <div className="inline-flex rounded-pill border border-border bg-card p-0.5 text-xs shadow-soft">
            {(["upcoming", "past", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilter({ range: r })}
                className={`rounded-pill px-3 py-1 font-medium transition-colors ${
                  initialRange === r
                    ? "bg-primary text-primary-foreground"
                    : "text-charcoal-700 hover:bg-canvas-100 dark:text-charcoal-400 dark:hover:bg-canvas-200"
                }`}
              >
                {r === "upcoming" ? "Próximas" : r === "past" ? "Pasadas" : "Todas"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
            Estado
          </span>
          <select
            value={initialStatus}
            onChange={(e) =>
              setFilter({ status: e.target.value as AgendaStatusFilter })
            }
            className="rounded-card border border-border bg-card text-charcoal-900 px-2.5 py-1 text-xs shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {(Object.keys(STATUS_LABEL) as AgendaStatusFilter[]).map((s) => (
              <option key={s} value={s} className="bg-card text-charcoal-900">
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {isPending ? (
          <span className="font-sans text-xs text-charcoal-500">Actualizando…</span>
        ) : null}
      </div>

      <div className="paper-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-canvas-100 text-left">
              <tr>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Fecha
                </th>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Estado
                </th>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Actualizada
                </th>
                <th scope="col" className="px-5 py-3 text-right font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center font-sans text-sm text-charcoal-500">
                    No hay agendas para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-canvas-50/50">
                    <td className="px-5 py-3 font-display text-base font-medium text-charcoal-900">
                      {formatShortDate(row.date)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-pill px-2.5 py-0.5 font-sans text-[0.7rem] font-semibold uppercase tracking-wider ${STATUS_BADGE[row.status]}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-charcoal-500">{row.updatedAt}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/agendas/${row.id}/editar`}
                          className="rounded-pill border border-border bg-card px-3 py-1 font-sans text-xs font-medium text-charcoal-700 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary dark:text-charcoal-400"
                        >
                          Editar
                        </Link>
                        {row.status === "draft" ? (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="rounded-pill border border-red-200 bg-card px-3 py-1 font-sans text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:border-red-900/50"
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
