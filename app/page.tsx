/**
 * `/` — Landing / public dashboard.
 *
 * Visible to anyone (signed in or not). Layout:
 *   - Sticky left sidebar (260px) with the Sunday agenda card and the
 *     interactive month calendar.
 *   - Center: hero greeting + post form (signed in) + feed of latest posts.
 *   - Right column (signed in): quick links + stats.
 *
 * The page deliberately avoids forcing a login — visitors see the
 * feed and the agenda. The login button is prominent in the header
 * and in the hero CTA when no session exists.
 */
import Link from "next/link";
import { auth, type AppSessionUser } from "@/auth";
import { listEvents } from "@/lib/events";
import { listPosts } from "@/lib/posts";
import {
  getAgendaByDate,
  getAgendaById,
  getNextPublishedAgenda,
} from "@/lib/agenda/queries";
import {
  formatSpanishDate,
  isSunday,
  nextSunday,
  todayIso,
} from "@/lib/agenda/dates";
import { appUserIdToNumber } from "@/auth";
import { MonthCalendar, type CalendarEvent } from "@/components/Calendar";
import { SundayAgendaCard } from "@/components/SundayAgendaCard";
import { PostCard } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, IconFeed, IconSparkle } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const today = todayIso();
  const target = isSunday(today) ? today : nextSunday(today);

  // Sunday agenda: prefer the date-anchored agenda; fall back to next published.
  const byDate = await getAgendaByDate(target);
  let sundayAgenda = byDate;
  if (!sundayAgenda) {
    const next = await getNextPublishedAgenda(today);
    sundayAgenda = next ? await getAgendaById(next.id) : null;
  }

  // Calendar: load a window of events — 60 days back, 90 days forward — to
  // cover the visible month and a little extra. Cheap on SQLite.
  const eventsRaw = await listEvents({
    filters: { range: "all" },
    ascending: true,
  });
  // Filter to a reasonable window to keep the client bundle small
  const minIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 31);
    return d.toISOString().slice(0, 10);
  })();
  const maxIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  })();
  const calendarEvents: CalendarEvent[] = eventsRaw
    .filter((e) => e.eventDate >= minIso && e.eventDate <= maxIso)
    .map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description ?? null,
      eventDate: e.eventDate,
      type: e.type,
    }));

  // Posts
  const posts = await listPosts(20);

  // Current user for the post form
  const currentUserId = appUserIdToNumber(session?.user as AppSessionUser | undefined) ?? null;
  const currentUserRole = session?.user?.role;
  const currentUserName = session?.user?.name ?? session?.user?.email ?? "Tú";

  // Total counts for the right sidebar
  const { prisma } = await import("@/lib/db");
  const memberCount = await prisma.member.count();
  const upcomingEventCount = await prisma.event.count({
    where: { eventDate: { gte: today } }
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="reveal relative overflow-hidden rounded-card border border-cream-200 bg-sunrise px-6 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sage-200/40 blur-3xl animate-subtle-float"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl animate-subtle-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sage-700">
              {session?.user ? "Bienvenido de vuelta" : "Bienvenido"}
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">
              {session?.user ? currentUserName : "Rama Bloomingdale 2nd"}
            </h1>
            <p className="mt-3 max-w-xl font-display text-lg italic text-ink-500">
              {session?.user
                ? "Aquí está la vida de la rama: las agendas, los eventos, y las noticias que queremos compartir."
                : "Aquí encontrarás las agendas dominicales, el calendario de eventos, y las noticias de la presidencia."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {session?.user ? (
                <>
                  <Button as="a" href="/inicio" variant="primary">
                    Ir a mi panel
                  </Button>
                  <Button as="a" href="/agendas/hoy" variant="secondary">
                    Ver agenda de hoy
                  </Button>
                </>
              ) : (
                <>
                  <Button as="a" href="/login" variant="primary">
                    Iniciar sesión
                  </Button>
                  <Button as="a" href="/register" variant="secondary">
                    Crear cuenta
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="paper-card bg-cream-50/95 p-5">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                Cita del día
              </p>
              <p className="mt-2 font-display text-lg italic text-ink-700">
                «Hagamos todo lo que el Señor nos ha mandado».
              </p>
              <p className="mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-ink-400">
                — 1 Nefi 3:7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GRID PRINCIPAL */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Sidebar izquierdo */}
        <aside className="space-y-4">
          <SundayAgendaCard
            date={target}
            formattedDate={formatSpanishDate(target)}
            agenda={sundayAgenda}
            publicHref={sundayAgenda ? `/agendas/${sundayAgenda.id}` : "/agendas/hoy"}
          />
          <MonthCalendar events={calendarEvents} />
        </aside>

        {/* Centro: feed */}
        <main className="space-y-6">
          {session?.user ? (
            <PostForm
              isAdmin={currentUserRole === "admin"}
              authorName={currentUserName}
            />
          ) : (
            <Card>
              <EmptyState
                icon={<IconSparkle />}
                title="Únete a la conversación"
                description="La lectura es libre; para publicar y comentar necesitas una cuenta."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button as="a" href="/login" variant="primary" size="sm">
                      Iniciar sesión
                    </Button>
                    <Button as="a" href="/register" variant="secondary" size="sm">
                      Crear cuenta
                    </Button>
                  </div>
                }
              />
            </Card>
          )}

          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-medium text-ink-900">
              Novedades
            </h2>
            <p className="font-sans text-xs text-ink-500">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
          </div>

          {posts.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconFeed />}
                title="Aún no hay publicaciones"
                description="La presidencia y los miembros pueden compartir noticias, anuncios o pensamientos aquí."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={
                    currentUserId != null
                      ? { id: currentUserId, role: (currentUserRole ?? "member") as "admin" | "member" }
                      : null
                  }
                />
              ))}
            </div>
          )}
        </main>

        {/* Sidebar derecho */}
        <aside className="space-y-4 xl:block">
          <Card>
            <CardBody>
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                La rama
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="font-display text-3xl font-medium text-ink-900">
                    {memberCount}
                  </p>
                  <p className="font-sans text-xs text-ink-500">miembros</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-medium text-ink-900">
                    {upcomingEventCount}
                  </p>
                  <p className="font-sans text-xs text-ink-500">eventos próximos</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button as="a" href="/miembros" variant="secondary" size="sm">
                  Ver directorio
                </Button>
                <Button as="a" href="/eventos" variant="ghost" size="sm">
                  Ver eventos
                </Button>
              </div>
            </CardBody>
          </Card>

          {session?.user ? (
            <Card>
              <CardBody>
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                  Tu espacio
                </p>
                <ul className="mt-3 space-y-2 font-sans text-sm">
                  <li>
                    <Link
                      href="/inicio"
                      className="text-ink-700 underline decoration-cream-300 underline-offset-4 transition-colors hover:text-sage-700 hover:decoration-sage-400"
                    >
                      Mi panel
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/agendas"
                      className="text-ink-700 underline decoration-cream-300 underline-offset-4 transition-colors hover:text-sage-700 hover:decoration-sage-400"
                    >
                      Historial de agendas
                    </Link>
                  </li>
                  {currentUserRole === "admin" ? (
                    <li>
                      <Link
                        href="/admin/agendas"
                        className="text-ink-700 underline decoration-cream-300 underline-offset-4 transition-colors hover:text-sage-700 hover:decoration-sage-400"
                      >
                        Panel de administración
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage-600">
                Himno destacado
              </p>
              <p className="mt-3 font-display text-lg italic text-ink-700">
                «Jehová, mi Pastor es» — me guía con cariño.
              </p>
              <p className="mt-1 font-sans text-[0.7rem] uppercase tracking-wider text-ink-400">
                Himno 99 · «The Lord Is My Shepherd»
              </p>
              <div className="mt-4">
                <Button as="a" href="/agendas/hoy" variant="ghost" size="sm">
                  Ver himnos de hoy →
                </Button>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
