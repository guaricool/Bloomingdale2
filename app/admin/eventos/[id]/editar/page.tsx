/**
 * Admin: formulario para editar un evento existente.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEventById } from "@/lib/events";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

function parseId(idStr: string): number | null {
  const n = Number(idStr);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export default async function EditarEventoPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/eventos/${params.id}/editar`);
  if (session.user.role !== "admin") redirect("/");

  const id = parseId(params.id);
  if (id === null) notFound();
  const evento = await getEventById(id);
  if (!evento) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar evento</h1>
        <p className="mt-1 text-sm text-slate-600">
          Modifica los datos del evento. Los cambios se reflejan
          inmediatamente en los anuncios de los domingos.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <EventForm
          eventId={id}
          initial={{
            title: evento.title,
            description: evento.description ?? "",
            eventDate: evento.eventDate,
            type: evento.type,
          }}
        />
      </div>
    </div>
  );
}
