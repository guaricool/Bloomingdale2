/**
 * POST /api/miembros/rapido
 *
 * Quickly create a Member from the agenda editor's "Agregar a Hermano X"
 * flow. Returns the freshly-created Member.
 *
 * This is a thin wrapper around `createMember` to keep the editor snappy:
 * the admin types a name, we create the record, and we auto-fill the
 * speaker slot with the new id.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/agenda/auth-helpers";
import { createMemberSchema } from "@/lib/agenda/validations";
import { createMember } from "@/lib/agenda/members";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  try {
    const member = await createMember({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      membershipNumber: parsed.data.membershipNumber ?? null,
      familyGroupId: parsed.data.familyGroupId ?? null,
    });
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear el miembro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
