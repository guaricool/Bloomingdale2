/**
 * `/admin/miembros` — Member directory admin page.
 *
 * Lists members with a free-text search, family-group filter, and
 * pagination. Each row has Edit and Delete actions. New-member button
 * is at the top right. Authz: admin only (redirects non-admins).
 *
 * Server component: reads the query string, calls listMembers()
 * directly, and renders the client-side <MembersTable> with the
 * initial dataset so the admin can also interact with it from the
 * client (search debounce, delete confirm).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminForPage } from "@/lib/authz";
import { listMembers } from "@/lib/members";
import { listFamilyGroups } from "@/lib/family-groups";
import { MembersTable } from "./MembersTable";

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

  const { rows, total } = listMembers({
    search,
    familyGroupId,
    limit: pageSize,
    offset,
  });
  const groups = listFamilyGroups();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Miembros</h1>
          <p className="mt-1 text-sm text-slate-600">
            Directorio de la rama. Total: <strong>{total}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/grupos-familiares"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Grupos familiares
          </Link>
          <Link
            href="/admin/miembros/nuevo"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            + Nuevo miembro
          </Link>
        </div>
      </div>

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
