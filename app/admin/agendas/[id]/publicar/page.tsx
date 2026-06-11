/**
 * `/admin/agendas/[id]/publicar` — Confirm transition draft → published.
 *
 * Server component: confirms admin, shows the agenda summary, and
 * embeds the client form that submits the `transitionAgendaAction`.
 * Cancelling returns to the edit page without changes.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminForPage } from "@/lib/authz";
import { getAgendaById } from "@/lib/agenda/queries";
import { formatSpanishDate } from "@/lib/agenda/dates";
import { PublishForm } from "./PublishForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function PublishAgendaPage({ params }: PageProps) {
  await requireAdminForPage();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const agenda = await getAgendaById(id);
  if (!agenda) notFound();

  const canPublish = agenda.status === "draft";
  const itemCount = agenda.items.length;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href={`/admin/agendas/${id}/editar`} className="hover:text-slate-700">
          ← Editar
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Publicar agenda</h1>
      <p className="mt-1 text-sm text-slate-600">
        Vas a publicar la agenda del{" "}
        <strong>{formatSpanishDate(agenda.date)}</strong> (
        {itemCount} {itemCount === 1 ? "item" : "items"}).
        Una vez publicada, ya no podrás editarla — solo marcar como completada.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {canPublish ? (
          <PublishForm id={agenda.id} />
        ) : (
          <p className="text-sm text-slate-600">
            Esta agenda no está en estado <strong>borrador</strong> (estado
            actual: <code>{agenda.status}</code>). Vuelve a la página de
            edición para revisar.
          </p>
        )}
      </div>
    </div>
  );
}
