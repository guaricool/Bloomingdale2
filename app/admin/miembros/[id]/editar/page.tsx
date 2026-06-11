/**
 * `/admin/miembros/[id]/editar` — Edit an existing member.
 *
 * Server component: looks up the member by id (404 if missing) and
 * renders the client form prefilled with the row data. Family group
 * list is fetched fresh so the dropdown always matches the latest
 * set of groups.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { getMemberById } from "@/lib/members";
import { listFamilyGroups } from "@/lib/family-groups";
import { MemberForm } from "../../MemberForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function EditMemberPage({ params }: PageProps) {
  await requireAdminForPage();
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const member = await getMemberById(id);
  if (!member) notFound();
  const groups = (await listFamilyGroups()).map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/miembros" className="hover:text-slate-700">
          ← Miembros
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Editar miembro</h1>
      <p className="mt-1 text-sm text-slate-600">
        Modifica los datos del miembro. Los cambios se guardan al pulsar
        &quot;Guardar cambios&quot;.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <MemberForm
          mode="edit"
          groups={groups}
          initial={{
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            membershipNumber: member.membershipNumber ?? "",
            familyGroupId: member.familyGroupId,
          }}
        />
      </div>
    </div>
  );
}
