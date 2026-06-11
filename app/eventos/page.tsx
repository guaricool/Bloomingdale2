/**
 * Vista pública: calendario de eventos próximos para miembros.
 *
 * Esta página es la contraparte de solo-lectura de `/admin/eventos`. Los
 * miembros (cualquier usuario logueado) ven aquí los eventos próximos
 * ordenados por fecha. La usan el navbar y el dashboard del miembro.
 */
import { redirect } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";
import { listEvents, type EventType } from "@/lib/events";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<EventType, string> = {
  actividad: "Actividad",
  evento_especial: "Evento especial",
  servicio: "Servicio",
  reunion: "Reunión",
  otro: "Otro",
};

const TYPE_BADGE: Record<EventType, string> = {
  actividad: "bg-emerald-100 text-emerald-800",
  evento_especial: "bg-amber-100 text-amber-800",
  servicio: "bg-sky-100 text-sky-800",
  reunion: "bg-violet-100 text-violet-800",
  otro: "bg-slate-100 text-slate-700",
};

function formatDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return format(d, "EEEE d 'de' MMMM, yyyy", { locale: es });
}

export default async function EventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/eventos");

  // Public view: only upcoming events, ordered ascending.
  const eventos = listEvents({
    filters: { range: "upcoming" },
    ascending: true,
  });

  const isAdmin = session.user.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eventos próximos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Calendario de actividades y eventos de la Rama Bloomingdale 2.
          </p>
        </div>
        {isAdmin ? (
          <a
            href="/admin/eventos"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Administrar eventos
          </a>
        ) : null}
      </div>

      {eventos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            No hay eventos próximos programados. Vuelve a revisar más adelante.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {eventos.map((ev) => (
            <li
              key={ev.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{ev.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[ev.type]}`}>
                  {TYPE_LABELS[ev.type]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{formatDate(ev.eventDate)}</p>
              {ev.description ? (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{ev.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
