import { prisma } from "@/lib/db";
import { format, isAfter, parseISO, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Suspense } from "react";
import { getActiveAnnouncementsAndEvents } from "@/lib/announcements";
import { auth } from "@/auth";
import { RadioPlayerCard } from "@/components/RadioPlayerCard";

export const dynamic = "force-dynamic";

async function getNextSundayAgenda() {
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");

  const agenda = await prisma.agenda.findFirst({
    where: {
      date: { gte: todayStr },
      status: "published",
    },
    orderBy: { date: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  return agenda;
}

export default async function DomingoPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const [agenda, announcementsData] = await Promise.all([
    getNextSundayAgenda(),
    getActiveAnnouncementsAndEvents()
  ]);

  const formattedDate = agenda 
    ? format(parseISO(agenda.date), "EEEE, d 'de' MMMM", { locale: es })
    : "Próximo Domingo";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <Badge tone="sage" className="mb-4">Boletín Dominical</Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl capitalize">
          {formattedDate}
        </h1>
        <p className="mt-2 text-foreground/60">Rama Bloomingdale 2nd</p>
      </div>

      <div className="mb-8">
        <RadioPlayerCard />
      </div>

      {!agenda ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="font-display text-xl text-foreground mb-2">No hay un programa publicado</h3>
            <p className="text-foreground/60">La presidencia aún no ha publicado el programa para el próximo domingo.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Anuncios Globales */}
          {(!announcementsData.announcements.length && !announcementsData.events.length) ? null : (
            <Card>
              <CardHeader title="Anuncios y Eventos" eyebrow="Avisos Importantes" />
              <CardBody>
                <div className="space-y-6">
                  {announcementsData.announcements.map((ann: any) => (
                    <div key={`ann-${ann.id}`} className="border-l-2 border-celestial-500 pl-4 py-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-celestial-600 mb-1 block">
                        Anuncio
                      </span>
                      <p className="text-foreground text-lg font-medium">{ann.title}</p>
                      {ann.body && <p className="text-foreground/80 mt-1">{ann.body}</p>}
                    </div>
                  ))}
                  {announcementsData.events.map((ev: any) => (
                    <div key={`ev-${ev.id}`} className="border-l-2 border-blue-400 pl-4 py-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1 block">
                        Próximo Evento {ev.isRecurring ? '(Recurrente)' : ''}
                      </span>
                      <p className="text-foreground text-lg font-medium">{ev.title}</p>
                      <p className="text-foreground/80 mt-1">
                        {ev.isRecurring ? ev.recurrenceRule : format(parseISO(ev.eventDate), "EEEE, d 'de' MMMM", { locale: es })}
                      </p>
                      {ev.description && <p className="text-foreground/70 mt-1 text-sm">{ev.description}</p>}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Reunión Sacramental" eyebrow="1ra Hora" />
            <CardBody>
              <div className="space-y-6">
                {agenda.items.map((item: any) => {
                  if ((item.type === "business_rama" || item.type === "business_estaca")) {
                    if (!isAdmin) return null; // Nunca mostrar Asuntos a no-administradores
                    if (!item.note) return null; // No mostrar ni a administradores si está vacío
                  }

                  return (
                  <div key={item.id} className="border-l-2 border-primary/20 pl-4 py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">
                      {item.type === "hymn_opening" && "Himno Inicial"}
                      {item.type === "prayer_opening" && "Primera Oración"}
                      {item.type === "business_rama" && "Asuntos de Rama"}
                      {item.type === "business_estaca" && "Asuntos de Estaca"}
                      {item.type === "sacrament_hymn" && "Himno Sacramental"}
                      {item.type === "sacrament" && "Santa Cena"}
                      {item.type === "speaker" && "Discursante"}
                      {item.type === "hymn_closing" && "Himno Final"}
                      {item.type === "prayer_closing" && "Última Oración"}
                      {item.type === "announcement" && "Anuncio"}
                      {item.type === "other" && "Otro"}
                    </span>
                    <p className="text-foreground text-lg">
                      {item.note || "Sin detalle"}
                    </p>
                  </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card interactive>
            <CardHeader title="Clases Dominicales" eyebrow="2da Hora" />
            <CardBody>
               <p className="text-foreground/80 mb-4">
                 <em>El horario de clases de la segunda hora será anunciado próximamente en esta sección.</em>
               </p>
               <Link href="https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-individuals-and-families-book-of-mormon-2024?lang=spa" target="_blank" className="text-primary hover:underline text-sm font-medium">
                 Ver manual de Ven, Sígueme
               </Link>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
