import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { listAgendas } from "@/lib/agenda/queries";
import { todayIso } from "@/lib/agenda/dates";
import { AgendasTable, type AgendaStatusFilter } from "./AgendasTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

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
  const agendas = await listAgendas({ range, today: todayIso() });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        eyebrow="Administración"
        title="Agendas dominicales"
        description="Crea, edita y publica las agendas que se mostrarán a la rama cada domingo."
        actions={
          <Button as="a" href="/admin/agendas/nueva" variant="primary">
            + Nueva agenda
          </Button>
        }
      />

      <AgendasTable
        initialRows={agendas}
        initialRange={range}
        initialStatus={status}
      />
    </div>
  );
}
