/**
 * `/admin/agendas/[id]/editar` — Edit a draft agenda.
 *
 * Server component: verifies admin, loads the agenda with all items + joins,
 * and renders the client editor. The editor handles add/reorder/delete and
 * is read-only when the agenda is not in 'draft' status.
 *
 * Top bar exposes Publish / Complete transitions once the agenda is in
 * the right state (these link to dedicated transition pages so the user
 * sees a confirmation step).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminForPage } from "@/lib/authz";
import { getAgendaById } from "@/lib/agenda/queries";
import { getDb } from "@/lib/db";
import { formatSpanishDate } from "@/lib/agenda/dates";
import { AgendaEditor } from "@/components/admin/agendas/AgendaEditor";
import type { MemberOption } from "@/components/admin/agendas/SpeakerPicker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function EditAgendaPage({ params }: PageProps) {
  await requireAdminForPage();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const agenda = getAgendaById(id);
  if (!agenda) notFound();

  // Pre-load a small roster of members so the speaker picker has suggestions
  // even before the user types. Cheap on small branches.
  const db = getDb();
  const memberSuggestions = db
    .prepare(
      `SELECT m.id, m.firstName, m.lastName, m.membershipNumber,
              g.name AS familyGroupName
       FROM Member m
       LEFT JOIN FamilyGroup g ON m.familyGroupId = g.id
       ORDER BY m.firstName ASC, m.lastName ASC
       LIMIT 50`,
    )
    .all() as MemberOption[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/agendas" className="hover:text-slate-700">
          ← Agendas
        </Link>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {formatSpanishDate(agenda.date)}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Estado:{" "}
            <span className="font-medium uppercase tracking-wide">
              {agenda.status === "draft"
                ? "Borrador"
                : agenda.status === "published"
                  ? "Publicada"
                  : "Completada"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {agenda.status === "draft" ? (
            <Link
              href={`/admin/agendas/${agenda.id}/publicar`}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Publicar
            </Link>
          ) : null}
          {agenda.status === "published" ? (
            <Link
              href={`/admin/agendas/${agenda.id}/completar`}
              className="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Marcar completada
            </Link>
          ) : null}
          <Link
            href={`/agendas/${agenda.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Vista pública
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <AgendaEditor
          agenda={agenda}
          memberSuggestions={memberSuggestions}
          readOnly={agenda.status !== "draft"}
        />
      </div>
    </div>
  );
}
