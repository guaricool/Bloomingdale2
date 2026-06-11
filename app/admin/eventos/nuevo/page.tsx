/**
 * Admin: formulario para crear un evento nuevo.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function NuevoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/eventos/nuevo");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Nuevo evento</h1>
        <p className="mt-1 text-sm text-slate-600">
          Crea un evento para la rama. Se anunciará automáticamente en los
          domingos previos a la fecha indicada.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <EventForm />
      </div>
    </div>
  );
}
