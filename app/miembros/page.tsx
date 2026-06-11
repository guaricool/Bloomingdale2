/**
 * `/miembros` — Read-only public directory.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMembers } from "@/lib/members";
import { fullName, type MemberRow } from "@/lib/member-types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        eyebrow="Comunidad"
        title="Miembros de la rama"
        description={`Directorio de solo lectura. Total: ${rows.length} miembro${rows.length === 1 ? "" : "s"}.`}
      />

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center font-sans text-sm text-ink-500">
              Aún no hay miembros registrados en el directorio.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {buckets.map((b) => (
            <Card key={`grp-${b.id}`}>
              <CardBody>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-medium text-ink-900">
                    {b.name}
                  </h2>
                  <Badge tone="sage">
                    {b.members.length} miembro{b.members.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {b.members.map((m) => (
                    <li
                      key={m.id}
                      className="font-sans text-sm text-ink-700"
                    >
                      {fullName(m)}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}

          {orphan.length > 0 ? (
            <Card>
              <CardBody>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-medium text-ink-900">
                    Sin grupo
                  </h2>
                  <Badge tone="ink">
                    {orphan.length} miembro{orphan.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {orphan.map((m) => (
                    <li key={m.id} className="font-sans text-sm text-ink-700">
                      {fullName(m)}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
