"use client";

/**
 * New-agenda form (Sunday picker).
 *
 * Validates that the picked date is a Sunday client-side (the server
 * validates again in the action). On submit, calls `createAgendaAction`
 * and navigates to the new agenda's edit page.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isSunday, nextSunday, todayIso } from "@/lib/agenda/dates";
import { createAgendaAction } from "../actions";

export function NewAgendaForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => nextSunday(todayIso()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    if (!isSunday(date)) {
      setError("La fecha debe ser un domingo");
      return;
    }
    setSubmitting(true);
    const res = await createAgendaAction({ date });
    setSubmitting(false);
    if (!res.ok || !res.agenda) {
      setError(res.error ?? "No se pudo crear la agenda");
      return;
    }
    const id = (res.agenda as { id: number }).id;
    startTransition(() => {
      router.push(`/admin/agendas/${id}/editar`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700">
          Fecha (domingo)
        </label>
        <input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Sugerencia: {nextSunday(todayIso())} (próximo domingo).
        </p>
      </div>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <a
          href="/admin/agendas"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creando…" : "Crear borrador"}
        </button>
      </div>
    </form>
  );
}
