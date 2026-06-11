"use server";

/**
 * Server actions for the Member admin module.
 *
 * Used by the /admin/miembros pages. All actions verify role==='admin'
 * (via requireAdmin) and revalidate the relevant path tags so the
 * list / detail views reflect the change.
 *
 * Return shape:
 *   { ok: true,  member: MemberRow }     on success
 *   { ok: false, error: string }         on validation / business failure
 *
 * We never throw for user-fixable problems; the client should render
 * the error inline next to the field/form.
 */
import { revalidatePath } from "next/cache";
import { requireAdmin, AuthzError } from "@/lib/authz";
import {
  createMember,
  deleteMember,
  getMemberById,
  listMembers,
  updateMember,
  type MemberRow,
} from "@/lib/members";
import {
  memberCreateSchema,
  memberUpdateSchema,
} from "@/lib/validators/member";

export interface MemberActionResult {
  ok: boolean;
  error?: string;
  member?: MemberRow;
  fieldErrors?: Record<string, string>;
}

function flattenZod(err: import("zod").ZodError): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { message: err.issues[0]?.message ?? "Datos inválidos", fieldErrors };
}

function authzFailure(err: unknown): MemberActionResult | null {
  if (err instanceof AuthzError) {
    return { ok: false, error: err.message };
  }
  return null;
}

export async function createMemberAction(
  raw: unknown,
): Promise<MemberActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  const parsed = memberCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const { message, fieldErrors } = flattenZod(parsed.error);
    return { ok: false, error: message, fieldErrors };
  }

  try {
    const member = await createMember({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      membershipNumber: parsed.data.membershipNumber ?? null,
      familyGroupId: parsed.data.familyGroupId ?? null,
    });
    revalidatePath("/admin/miembros");
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/miembros");
    return { ok: true, member };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al crear el miembro",
    };
  }
}

export async function updateMemberAction(
  raw: unknown,
): Promise<MemberActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  const parsed = memberUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const { message, fieldErrors } = flattenZod(parsed.error);
    return { ok: false, error: message, fieldErrors };
  }

  const existing = await getMemberById(parsed.data.id);
  if (!existing) return { ok: false, error: "Miembro no encontrado" };

  try {
    const member = await updateMember({
      id: parsed.data.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      membershipNumber: parsed.data.membershipNumber ?? null,
      familyGroupId: parsed.data.familyGroupId ?? null,
    });
    revalidatePath("/admin/miembros");
    revalidatePath(`/admin/miembros/${member.id}/editar`);
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/miembros");
    return { ok: true, member };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al actualizar el miembro",
    };
  }
}

export async function deleteMemberAction(
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "Identificador inválido" };
  }

  try {
    const ok = await deleteMember(id);
    if (!ok) return { ok: false, error: "Miembro no encontrado" };
    revalidatePath("/admin/miembros");
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/miembros");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al eliminar el miembro",
    };
  }
}

/**
 * Server action for the admin list page. Accepts a search string,
 * familyGroupId filter, page and pageSize, and returns a paginated
 * snapshot of the directory. Runs as a server action (not an API route)
 * so the page can `await` it directly with no extra round-trip.
 */
export async function listMembersAction(input: {
  search?: string;
  familyGroupId?: number | null;
  page?: number;
  pageSize?: number;
}): Promise<{
  ok: boolean;
  error?: string;
  rows?: MemberRow[];
  total?: number;
  page?: number;
  pageSize?: number;
}> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  const pageSize = Math.max(1, Math.min(100, input.pageSize ?? 20));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const result = await listMembers({
    search: input.search ?? null,
    familyGroupId: input.familyGroupId ?? null,
    limit: pageSize,
    offset,
  });

  return {
    ok: true,
    rows: result.rows,
    total: result.total,
    page,
    pageSize,
  };
}
