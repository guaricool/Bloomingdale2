/**
 * `/admin/agendas/nueva` — Pick a Sunday, create a draft agenda.
 *
 * Server component: verifies admin role, then renders the NewAgendaForm
 * client component. The form submits to `createAgendaAction`, which
 * creates the draft and revalidates the list. On success we redirect
 * to the new agenda's edit page.
 */
import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { NewAgendaForm } from "./NewAgendaForm";

export const dynamic = "force-dynamic";

export default async function NewAgendaPage() {
  await requireAdminForPage();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/agendas" className="hover:text-slate-700">
          ← Agendas
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Nueva agenda</h1>
      <p className="mt-1 text-sm text-slate-600">
        Elige el domingo. Se creará una agenda en estado{" "}
        <strong>borrador</strong> que podrás editar antes de publicarla.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <NewAgendaForm />
      </div>
    </div>
  );
}
