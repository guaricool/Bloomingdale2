import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Look up the member record (if linked) so we can show the friendly name.
  // Falls back to the email local-part if there's no member record.
  let displayName = session.user.email ?? "hermano/a";
  if (session.user.memberId) {
    const row = getDb()
      .prepare("SELECT firstName, lastName FROM Member WHERE id = ?")
      .get(session.user.memberId) as { firstName: string; lastName: string } | undefined;
    if (row) {
      displayName = `${row.firstName} ${row.lastName}`;
    }
  } else if (session.user.email) {
    displayName = session.user.email.split("@")[0] ?? displayName;
  }

  const role = session.user.role ?? "member";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">
        Hola <span className="text-brand-700">{displayName}</span>
      </h1>
      <p className="mt-2 text-slate-600">
        Bienvenido a Bloomingdale 2. {role === "admin" ? "Eres administrador de la rama." : "Eres miembro de la rama."}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Esta semana</h2>
          <p className="mt-2 text-slate-700">Aquí verás la agenda del domingo próximo cuando esté publicada.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Himnos</h2>
          <p className="mt-2 text-slate-700">Buscador por número (próximamente).</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Eventos</h2>
          <p className="mt-2 text-slate-700">Calendario de la rama (próximamente).</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Miembros</h2>
          <p className="mt-2 text-slate-700">Directorio de la rama (próximamente).</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p>
          Estás viendo el <strong>placeholder del dashboard</strong>. Los módulos de Miembros, Agendas, Eventos
          y Administración se llenan en las siguientes tareas del plan.
        </p>
      </div>
    </div>
  );
}
