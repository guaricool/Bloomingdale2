/**
 * Admin: lista de eventos con filtros (próximos / pasados / todos / por tipo).
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listEvents, EVENT_TYPES, type EventType } from "@/lib/events";
import { EventList } from "@/components/EventList";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { range?: string; type?: string };
}

function parseRange(raw: string | undefined): "upcoming" | "past" | "all" {
  if (raw === "upcoming" || raw === "past" || raw === "all") return raw;
  return "upcoming";
}

function parseType(raw: string | undefined): EventType | undefined {
  if (raw && (EVENT_TYPES as readonly string[]).includes(raw)) {
    return raw as EventType;
  }
  return undefined;
}

export default async function AdminEventosPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/eventos");
  if (session.user.role !== "admin") redirect("/");

  const range = parseRange(searchParams.range);
  const type = parseType(searchParams.type);

  const eventos = await listEvents({
    filters: { range, type },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        eyebrow="Administración"
        title="Eventos"
        description="Gestiona los eventos y actividades de la rama. Los eventos futuros aparecen automáticamente como anuncio en los domingos previos."
      />
      <EventList initialEvents={eventos} initialFilter={range} />
    </div>
  );
}
