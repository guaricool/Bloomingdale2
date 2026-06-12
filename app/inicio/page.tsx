import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getNextPublishedAgenda } from "@/lib/agenda/queries";
import {
  formatSpanishDate,
  isSunday,
  nextSunday,
  todayIso,
} from "@/lib/agenda/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  let displayName = session.user.name ?? session.user.email ?? "hermano/a";
  if (!session.user.name && session.user.memberId) {
    const row = (await getDb()
      .prepare(`SELECT firstName AS "firstName", middleName AS "middleName", lastName AS "lastName" FROM "Member" WHERE id = ?`)
      .get(session.user.memberId)) as { firstName: string; middleName: string | null; lastName: string } | undefined;
    if (row) {
      displayName = [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
    }
  }

  // Saludo según la hora del día (UTC, no importa mucho para v0.1)
  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const role = session.user.role ?? "member";
  const isAdmin = role === "admin";

  // Quick stats for the dashboard tiles
  const today = todayIso();
  const target = isSunday(today) ? today : nextSunday(today);
  const nextAgenda = await getNextPublishedAgenda(today);

  const memberCount = (
    (await getDb().prepare(`SELECT COUNT(*) AS n FROM "Member"`).get()) as { n: number }
  ).n;
  const eventCount = (
    (await getDb()
      .prepare(`SELECT COUNT(*) AS n FROM "Event" WHERE eventDate >= ?`)
      .get(today)) as { n: number }
  ).n;

  // "Spiritual note" for the day — a small rotating line of scripture-like reflection.
  // Not real scripture — these are short quotes the user can rotate later.
  const notes = [
    "«Alma, ¿cuánto tiempo le ruego a mi Padre?» — Jacob 7:7",
    "«Haced las cosas con orden» — Mosiah 4:15",
    "«Regocijaos en la esperanza» — Romanos 12:12",
  ];
  const todayNote = notes[new Date().getUTCDate() % notes.length];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="reveal space-y-3">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blue-600">
          {greeting}
        </p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl">
          {displayName}
        </h1>
        <p className="max-w-2xl font-display text-base italic text-slate-500">
          {todayNote}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Próximo domingo */}
        <Card interactive>
          <CardBody>
            <div className="flex items-start justify-between">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Este domingo
              </p>
              <Badge tone={nextAgenda ? "sage" : "ink"}>
                {nextAgenda ? "Publicada" : "Pendiente"}
              </Badge>
            </div>
            <p className="mt-3 font-display text-2xl font-medium text-slate-900">
              {formatSpanishDate(target)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {nextAgenda
                ? "La agenda ya está disponible para todos los miembros."
                : "La agenda se publicará desde el panel de administración."}
            </p>
            <div className="mt-5">
              {nextAgenda ? (
                <Button as="a" href={`/agendas/${nextAgenda.id}`} variant="primary" size="sm">
                  Ver agenda
                </Button>
              ) : isAdmin ? (
                <Button as="a" href="/admin/agendas" variant="secondary" size="sm">
                  Crear desde administración
                </Button>
              ) : (
                <Button as="a" href="/agendas" variant="ghost" size="sm">
                  Ver historial
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Miembros */}
        <Card interactive>
          <CardBody>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Comunidad
            </p>
            <p className="mt-3 font-display text-5xl font-medium text-slate-900">
              {memberCount}
            </p>
            <p className="text-sm text-slate-500">miembros en la rama</p>
            <div className="mt-5 flex gap-2">
              <Button as="a" href="/miembros" variant="secondary" size="sm">
                Ver directorio
              </Button>
              {isAdmin ? (
                <Button as="a" href="/admin/miembros" variant="ghost" size="sm">
                  Administrar
                </Button>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {/* Eventos */}
        <Card interactive>
          <CardBody>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Próximos eventos
            </p>
            <p className="mt-3 font-display text-5xl font-medium text-slate-900">
              {eventCount}
            </p>
            <p className="text-sm text-slate-500">eventos en el calendario</p>
            <div className="mt-5">
              <Button as="a" href="/eventos" variant="secondary" size="sm">
                Ver calendario
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sección admin — visible solo para admins */}
      {isAdmin ? (
        <section className="mt-12">
          <div className="divider-leaf mb-6 text-sm">
            <span>Panel de administración</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card interactive>
              <CardBody>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Miembros
                </p>
                <p className="mt-2 font-display text-lg text-slate-900">Directorio y grupos</p>
                <p className="mt-1 text-sm text-slate-500">
                  Crea, edita y asigna miembros a grupos familiares.
                </p>
                <div className="mt-4">
                  <Button as="a" href="/admin/miembros" variant="primary" size="sm">
                    Gestionar
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card interactive>
              <CardBody>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Agendas
                </p>
                <p className="mt-2 font-display text-lg text-slate-900">Dominicales</p>
                <p className="mt-1 text-sm text-slate-500">
                  Crea borradores, agrega himnos y orden público.
                </p>
                <div className="mt-4">
                  <Button as="a" href="/admin/agendas" variant="primary" size="sm">
                    Abrir agendas
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card interactive>
              <CardBody>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Eventos
                </p>
                <p className="mt-2 font-display text-lg text-slate-900">Calendario</p>
                <p className="mt-1 text-sm text-slate-500">
                  Crea eventos y controla los anuncios automáticos.
                </p>
                <div className="mt-4">
                  <Button as="a" href="/admin/eventos" variant="primary" size="sm">
                    Gestionar eventos
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
