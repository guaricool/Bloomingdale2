/**
 * `/admin/agendas/[id]/completar` — Confirm transition published → completed.
 *
 * On completion, the future discourse-tracking task (plan v0.1 task #5)
 * will hook in here to write one `DiscourseLog` row per `speaker` item.
 * For v0.1 the page just flips the status and routes back to the public view.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminForPage } from "@/lib/authz";
import { getAgendaById } from "@/lib/agenda/queries";
import { formatSpanishDate } from "@/lib/agenda/dates";
import { CompleteForm } from "./CompleteForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function CompleteAgendaPage({ params }: PageProps) {
  await requireAdminForPage();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const agenda = getAgendaById(id);
  if (!agenda) notFound();

  const canComplete = agenda.status === "published";

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href={`/admin/agendas/${id}/editar`} className="hover:text-slate-700">
          ← Editar
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Marcar como completada</h1>
      <p className="mt-1 text-sm text-slate-600">
        Confirma que la reunión del{" "}
        <strong>{formatSpanishDate(agenda.date)}</strong> se llevó a cabo.
        Una vez completada, la agenda queda como registro histórico.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {canComplete ? (
          <CompleteForm id={agenda.id} />
        ) : (
          <p className="text-sm text-slate-600">
            Esta agenda no está publicada (estado actual:{" "}
            <code>{agenda.status}</code>). Solo se pueden completar agendas
            publicadas.
          </p>
        )}
      </div>
    </div>
  );
}
