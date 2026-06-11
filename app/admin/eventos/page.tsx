/**
 * Admin: lista de eventos con filtros (próximos / pasados / todos / por tipo).
 *
 * Authz: admin only. Si no, redirect a /dashboard.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listEvents, EVENT_TYPES, type EventType } from "@/lib/events";
import { EventList } from "@/components/EventList";

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
  if (session.user.role !== "admin") redirect("/dashboard");

  const range = parseRange(searchParams.range);
  const type = parseType(searchParams.type);

  const eventos = listEvents({
    filters: {
      range,
      type,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestiona los eventos y actividades de la rama. Los eventos futuros
          aparecen automáticamente como anuncio en los domingos previos.
        </p>
      </div>
      <EventList initialEvents={eventos} initialFilter={range} />
    </div>
  );
}
