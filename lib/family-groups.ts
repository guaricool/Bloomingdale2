/**
 * Data access layer for the FamilyGroup module using Prisma.
 *
 * Pure DB functions. Authorization and validation happen in the
 * server action / API route that calls these helpers.
 */
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/member-types";

export interface FamilyGroupRow {
  id: number;
  name: string;
  headMemberId: number | null;
  headMemberName: string | null;
  memberCount: number;
  createdAt: string;
}

function mapRow(fg: any): FamilyGroupRow {
  return {
    id: fg.id,
    name: fg.name,
    headMemberId: fg.headMemberId,
    headMemberName: fg.headMember ? fullName(fg.headMember) : null,
    memberCount: fg._count?.members ?? 0,
    createdAt: fg.createdAt.toISOString(),
  };
}

export async function getFamilyGroupById(id: number): Promise<FamilyGroupRow | null> {
  const row = await prisma.familyGroup.findUnique({
    where: { id },
    include: {
      headMember: true,
      _count: { select: { members: true } },
    },
  });
  return row ? mapRow(row) : null;
}

export async function listFamilyGroups(): Promise<FamilyGroupRow[]> {
  const rowsRaw = await prisma.familyGroup.findMany({
    orderBy: { name: 'asc' },
    include: {
      headMember: true,
      _count: { select: { members: true } },
    },
  });
  return rowsRaw.map(mapRow);
}

export interface CreateFamilyGroupInput {
  name: string;
  headMemberId: number | null;
}

export async function createFamilyGroup(
  input: CreateFamilyGroupInput,
): Promise<FamilyGroupRow> {
  const row = await prisma.familyGroup.create({
    data: {
      name: input.name.trim(),
      headMemberId: input.headMemberId,
    },
    include: {
      headMember: true,
      _count: { select: { members: true } },
    },
  });
  return mapRow(row);
}

export interface UpdateFamilyGroupInput {
  id: number;
  name: string;
  headMemberId: number | null;
}

export async function updateFamilyGroup(
  input: UpdateFamilyGroupInput,
): Promise<FamilyGroupRow> {
  try {
    const row = await prisma.familyGroup.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        headMemberId: input.headMemberId,
      },
      include: {
        headMember: true,
        _count: { select: { members: true } },
      },
    });
    return mapRow(row);
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error("Grupo familiar no encontrado");
    }
    throw error;
  }
}

/**
 * Delete a family group. Fails (returns false) when the group still has
 * members, since ON DELETE SET NULL on Member.familyGroupId would silently
 * unlink them; we prefer to be explicit and ask the admin to reassign first.
 */
export async function deleteFamilyGroup(
  id: number,
): Promise<{ ok: boolean; reason?: string }> {
  const group = await prisma.familyGroup.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!group) return { ok: false, reason: "Grupo familiar no encontrado" };
  
  if (group._count.members > 0) {
    return {
      ok: false,
      reason: `El grupo tiene ${group._count.members} miembro(s) asignado(s). Reasígnalos antes de eliminarlo.`,
    };
  }
  
  try {
    await prisma.familyGroup.delete({
      where: { id },
    });
    return { ok: true };
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { ok: false, reason: "No se pudo eliminar el grupo" };
    }
    throw error;
  }
}
