"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transitionAgendaAction } from "../../actions";

export function PublishForm({ id }: { id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await transitionAgendaAction(id, "published");
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo publicar");
      return;
    }
    startTransition(() => router.push(`/agendas/${id}`));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <a
          href={`/admin/agendas/${id}/editar`}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Publicando…" : "Sí, publicar"}
        </button>
      </div>
    </form>
  );
}
