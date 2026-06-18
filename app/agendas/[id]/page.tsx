import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionForPage } from "@/lib/authz";
import { getAgendaById } from "@/lib/agenda/queries";
import { formatSpanishDate } from "@/lib/agenda/dates";
import { AgendaPublicView } from "./AgendaPublicView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function PublicAgendaView({ params }: PageProps) {
  await requireSessionForPage();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const agenda = await getAgendaById(id);
  if (!agenda) notFound();

  const formattedDate = formatSpanishDate(agenda.date);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center gap-2 font-sans text-sm text-slate-500">
        <Link href="/agendas" className="hover:text-slate-700">
          ← Agendas
        </Link>
      </div>

      <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900">
        {formattedDate}
      </h1>
      <p className="mt-1 font-sans text-sm text-slate-600">
        Estado:{" "}
        <span className="font-semibold uppercase tracking-wide">
          {agenda.status === "draft"
            ? "Borrador (no publicada aún)"
            : agenda.status === "published"
              ? "Publicada"
              : "Completada"}
        </span>
      </p>

      {agenda.status === "draft" ? (
        <div className="mt-6 rounded-card border border-amber-200 bg-amber-50 px-3 py-2 font-sans text-sm text-amber-800">
          Esta agenda aún está en borrador y no debería ser visible para
          miembros. Si la ves por error, avisa a un administrador.
        </div>
      ) : null}

      <AgendaPublicView agenda={agenda} formattedDate={formattedDate} />
    </div>
  );
}
