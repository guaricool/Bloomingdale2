/**
 * `/agendas` — Public listing of upcoming + recent published agendas.
 */
import Link from "next/link";
import { requireSessionForPage } from "@/lib/authz";
import { listAgendas, getNextPublishedAgenda } from "@/lib/agenda/queries";
import { formatShortDate, formatSpanishDate, todayIso } from "@/lib/agenda/dates";
import { AgendaList } from "./AgendaList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PublicAgendasPage() {
  await requireSessionForPage();
  const today = todayIso();
  const next = getNextPublishedAgenda(today);
  const upcoming = listAgendas({ range: "upcoming", today });
  const recent = listAgendas({ range: "past", today, limit: 10 });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        eyebrow="Agendas"
        title={next ? formatSpanishDate(next.date) : "No hay agenda publicada"}
        description={
          next
            ? "La agenda está lista para este domingo."
            : "Pídele a un administrador que publique la agenda del próximo domingo."
        }
        actions={
          <Button as="a" href="/agendas/hoy" variant="primary" size="sm">
            Ir al domingo
          </Button>
        }
      />

      {next ? (
        <div className="mb-6">
          <Link
            href={`/agendas/${next.id}`}
            className="font-display text-base italic text-sage-700 underline decoration-sage-200 underline-offset-4 transition-colors hover:text-sage-800 hover:decoration-sage-400"
          >
            Ver la agenda de este domingo →
          </Link>
        </div>
      ) : null}

      <AgendaList
        upcoming={upcoming.filter((a) => a.id !== next?.id)}
        recent={recent}
      />

      <p className="mt-6 font-sans text-xs text-ink-400">
        Mostrando {upcoming.length} próxima(s) y {recent.length} pasada(s).
        Fechas: {formatShortDate(today)}.
      </p>
    </div>
  );
}
