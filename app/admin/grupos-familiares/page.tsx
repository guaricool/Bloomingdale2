/**
 * `/admin/grupos-familiares` — Manage family groups.
 *
 * Server component: lists the groups (with their head and member count)
 * and renders the client form / table. The client side handles the
 * create + edit + delete flows via server actions.
 */
import { requireAdminForPage } from "@/lib/authz";
import { listFamilyGroups } from "@/lib/family-groups";
import { listMembers } from "@/lib/members";
import { FamilyGroupsView } from "./FamilyGroupsView";

export const dynamic = "force-dynamic";

export default async function FamilyGroupsPage() {
  await requireAdminForPage();
  const groups = await listFamilyGroups();
  // For the "head of household" picker on the create/edit forms.
  const members = (await listMembers({ unpaged: true })).rows.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        Administración
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Grupos familiares</h1>
      <p className="mt-1 text-sm text-slate-600">
        Crea y edita los grupos familiares. Un grupo debe estar vacío para
        poder eliminarlo (primero reasigna a sus miembros desde la
        sección &quot;Miembros&quot;).
      </p>

      <div className="mt-6">
        <FamilyGroupsView
          initialGroups={groups}
          allMembers={members}
        />
      </div>
    </div>
  );
}
