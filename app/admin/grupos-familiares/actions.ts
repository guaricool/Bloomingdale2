"use server";

/**
 * Server actions for the FamilyGroup admin module.
 * Used by /admin/grupos-familiares. Authz: role==='admin' enforced.
 */
import { revalidatePath } from "next/cache";
import { requireAdmin, AuthzError } from "@/lib/authz";
import {
  createFamilyGroup,
  deleteFamilyGroup,
  getFamilyGroupById,
  listFamilyGroups,
  updateFamilyGroup,
  type FamilyGroupRow,
} from "@/lib/family-groups";
import {
  familyGroupCreateSchema,
  familyGroupUpdateSchema,
} from "@/lib/validators/family-group";

export interface FamilyGroupActionResult {
  ok: boolean;
  error?: string;
  group?: FamilyGroupRow;
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

function authzFailure(err: unknown): FamilyGroupActionResult | null {
  if (err instanceof AuthzError) {
    return { ok: false, error: err.message };
  }
  return null;
}

export async function listFamilyGroupsAction(): Promise<{
  ok: boolean;
  error?: string;
  groups?: FamilyGroupRow[];
}> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }
  try {
    return { ok: true, groups: listFamilyGroups() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al listar los grupos",
    };
  }
}

export async function createFamilyGroupAction(
  raw: unknown,
): Promise<FamilyGroupActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  const parsed = familyGroupCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const { message, fieldErrors } = flattenZod(parsed.error);
    return { ok: false, error: message, fieldErrors };
  }
  try {
    const group = createFamilyGroup({
      name: parsed.data.name,
      headMemberId: parsed.data.headMemberId ?? null,
    });
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/admin/miembros");
    revalidatePath("/miembros");
    return { ok: true, group };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al crear el grupo",
    };
  }
}

export async function updateFamilyGroupAction(
  raw: unknown,
): Promise<FamilyGroupActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    const r = authzFailure(err);
    if (r) return r;
    throw err;
  }

  const parsed = familyGroupUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const { message, fieldErrors } = flattenZod(parsed.error);
    return { ok: false, error: message, fieldErrors };
  }
  if (!getFamilyGroupById(parsed.data.id)) {
    return { ok: false, error: "Grupo familiar no encontrado" };
  }
  try {
    const group = updateFamilyGroup({
      id: parsed.data.id,
      name: parsed.data.name,
      headMemberId: parsed.data.headMemberId ?? null,
    });
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/admin/miembros");
    revalidatePath("/miembros");
    return { ok: true, group };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al actualizar el grupo",
    };
  }
}

export async function deleteFamilyGroupAction(
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
    const res = deleteFamilyGroup(id);
    if (!res.ok) return { ok: false, error: res.reason ?? "No se pudo eliminar" };
    revalidatePath("/admin/grupos-familiares");
    revalidatePath("/admin/miembros");
    revalidatePath("/miembros");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al eliminar el grupo",
    };
  }
}
