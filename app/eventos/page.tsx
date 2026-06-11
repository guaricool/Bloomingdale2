/**
 * Vista pública: calendario de eventos próximos para miembros.
 */
import { redirect } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { listEvents, type EventRow } from "@/lib/events";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/events-types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<EventType, "sage" | "amber" | "gold" | "ink" | "rose"> = {
  actividad: "sage",
  evento_especial: "amber",
  servicio: "gold",
  reunion: "ink",
  otro: "ink",
};

function formatDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "EEEE d 'de' MMMM, yyyy", { locale: es });
}

export default async function EventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/eventos");

  const eventos = listEvents({
    filters: { range: "upcoming" },
    ascending: true,
  });

  const isAdmin = session.user.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        eyebrow="Calendario"
        title="Eventos próximos"
        description="Las actividades y eventos de la Rama Bloomingdale 2nd."
        actions={
          isAdmin ? (
            <Button as="a" href="/admin/eventos" variant="secondary" size="sm">
              Administrar
            </Button>
          ) : undefined
        }
      />

      {eventos.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center font-sans text-sm text-ink-500">
              No hay eventos próximos programados. Vuelve a revisar más adelante.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {eventos.map((ev: EventRow) => (
            <Card key={ev.id} interactive>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-medium leading-snug text-ink-900">
                    {ev.title}
                  </h2>
                  <Badge tone={TYPE_TONE[ev.type]}>{EVENT_TYPE_LABELS[ev.type]}</Badge>
                </div>
                <p className="mt-1 font-sans text-sm text-ink-500">
                  {formatDate(ev.eventDate)}
                </p>
                {ev.description ? (
                  <p className="mt-3 whitespace-pre-line font-sans text-sm text-ink-700">
                    {ev.description}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
