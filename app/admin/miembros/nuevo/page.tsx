/**
 * `/admin/miembros/nuevo` — Create a new member.
 *
 * Server component: verifies admin role, fetches the family group
 * options, and renders the client form. On submit, the client form
 * calls `createMemberAction` and either redirects to the edit page
 * of the new member or stays on the form with a success message.
 */
import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { listFamilyGroups } from "@/lib/family-groups";
import { MemberForm } from "../MemberForm";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  await requireAdminForPage();
  const groups = (await listFamilyGroups()).map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/miembros" className="hover:text-slate-700">
          ← Miembros
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Nuevo miembro</h1>
      <p className="mt-1 text-sm text-slate-600">
        Registra a un hermano o hermana de la rama. Los campos con{" "}
        <span className="text-red-600">*</span> son obligatorios.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <MemberForm
          mode="create"
          groups={groups}
        />
      </div>
    </div>
  );
}
