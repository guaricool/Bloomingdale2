/**
 * `/miembros` — Read-only public directory.
 *
 * Visible to any signed-in user (member or admin). Groups members by
 * their family group; members without a group appear at the end under
 * "Sin grupo". Sorted by last name, first name within each group.
 *
 * Auth: any logged-in user (middleware protects the route); the page
 * itself doesn't care about role.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMembers } from "@/lib/members";
import { fullName, type MemberRow } from "@/lib/members";

export const dynamic = "force-dynamic";

interface GroupBucket {
  id: number | null;
  name: string;
  members: MemberRow[];
}

export default async function MembersDirectoryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fmiembros");
  }

  const { rows } = listMembers({ unpaged: true });
  const buckets: GroupBucket[] = [];
  const orphan: MemberRow[] = [];

  // Group by family group, preserving alphabetical sort within.
  for (const m of rows) {
    if (m.familyGroupId == null) {
      orphan.push(m);
    } else {
      const existing = buckets.find((b) => b.id === m.familyGroupId);
      if (existing) {
        existing.members.push(m);
      } else {
        buckets.push({
          id: m.familyGroupId,
          name: m.familyGroupName ?? "Sin nombre",
          members: [m],
        });
      }
    }
  }

  buckets.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  orphan.sort((a, b) => fullName(a).localeCompare(fullName(b), "es", { sensitivity: "base" }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Directorio</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Miembros de la rama</h1>
      <p className="mt-1 text-sm text-slate-600">
        Directorio de solo lectura. Total: <strong>{rows.length}</strong> miembro
        {rows.length === 1 ? "" : "s"}.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Aún no hay miembros registrados en el directorio.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {buckets.map((b) => (
            <section
              key={`grp-${b.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{b.name}</h2>
              <p className="text-xs text-slate-500">
                {b.members.length} miembro{b.members.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {b.members.map((m) => (
                  <li key={m.id} className="text-sm text-slate-700">
                    {fullName(m)}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {orphan.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Sin grupo</h2>
              <p className="text-xs text-slate-500">
                {orphan.length} miembro{orphan.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {orphan.map((m) => (
                  <li key={m.id} className="text-sm text-slate-700">
                    {fullName(m)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
