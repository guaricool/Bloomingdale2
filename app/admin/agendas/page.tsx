/**
 * `/admin/agendas` — Agenda list page.
 *
 * Filterable list (próximas, pasadas, por status) with a "New agenda" CTA.
 * Server component: queries `listAgendas()` directly and renders the
 * client-side <AgendasTable> for interactive filtering.
 */
import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { listAgendas } from "@/lib/agenda/queries";
import { todayIso } from "@/lib/agenda/dates";
import { AgendasTable, type AgendaStatusFilter } from "./AgendasTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    range?: string;
    status?: string;
  };
}

function parseRange(raw: string | undefined): "upcoming" | "past" | "all" {
  if (raw === "upcoming" || raw === "past" || raw === "all") return raw;
  return "upcoming";
}

function parseStatus(raw: string | undefined): AgendaStatusFilter {
  if (raw === "draft" || raw === "published" || raw === "completed") return raw;
  return "all";
}

export default async function AdminAgendasPage({ searchParams }: PageProps) {
  await requireAdminForPage();
  const range = parseRange(searchParams.range);
  const status = parseStatus(searchParams.status);
  const agendas = listAgendas({ range, today: todayIso() });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Agendas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona las agendas dominicales de la rama.
          </p>
        </div>
        <div>
          <Link
            href="/admin/agendas/nueva"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            + Nueva agenda
          </Link>
        </div>
      </div>
      <AgendasTable
        initialRows={agendas}
        initialRange={range}
        initialStatus={status}
      />
    </div>
  );
}
