/**
 * `/admin/miembros` — Directorio de miembros.
 */
import Link from "next/link";
import { requireAdminForPage } from "@/lib/authz";
import { listMembers } from "@/lib/members";
import { listFamilyGroups } from "@/lib/family-groups";
import { MembersTable } from "./MembersTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    q?: string;
    grupo?: string;
    page?: string;
  };
}

export default async function AdminMembersPage({ searchParams }: PageProps) {
  await requireAdminForPage();

  const search = (searchParams.q ?? "").trim() || null;
  const familyGroupIdRaw = searchParams.grupo;
  const familyGroupId = familyGroupIdRaw && /^\d+$/.test(familyGroupIdRaw)
    ? Number(familyGroupIdRaw)
    : null;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const { rows, total } = await listMembers({
    search,
    familyGroupId,
    limit: pageSize,
    offset,
  });
  const groups = await listFamilyGroups();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        eyebrow="Administración"
        title="Miembros"
        description={`Directorio de la rama. Total: ${total}. Busca por nombre o filtra por grupo familiar.`}
        actions={
          <>
            <Button as="a" href="/admin/grupos-familiares" variant="secondary" size="sm">
              Grupos familiares
            </Button>
            <Button as="a" href="/admin/miembros/nuevo" variant="primary" size="sm">
              + Nuevo miembro
            </Button>
          </>
        }
      />

      <MembersTable
        initialRows={rows}
        initialTotal={total}
        initialSearch={search ?? ""}
        initialFamilyGroupId={familyGroupId}
        pageSize={pageSize}
        page={page}
        groups={groups.map((g) => ({ id: g.id, name: g.name, memberCount: g.memberCount }))}
      />
    </div>
  );
}
