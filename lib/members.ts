/**
 * Data access layer for the Member module using Prisma.
 *
 * Pure functions over `prisma` (no auth checks, no HTTP). All
 * authorization and validation happens in the server action / API route
 * that calls these helpers.
 */
import { prisma } from "@/lib/db";
import { fullName, type MemberRow } from "@/lib/member-types";
export { fullName, type MemberRow } from "@/lib/member-types";

function mapRow(m: any): MemberRow {
  return {
    id: m.id,
    firstName: m.firstName,
    middleName: m.middleName ?? null,
    lastName: m.lastName,
    membershipNumber: m.membershipNumber,
    familyGroupId: m.familyGroupId,
    familyGroupName: m.familyGroup?.name ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export async function getMemberById(id: number): Promise<MemberRow | null> {
  const row = await prisma.member.findUnique({
    where: { id },
    include: { familyGroup: true },
  });
  return row ? mapRow(row) : null;
}

export interface ListMembersOptions {
  search?: string | null;
  familyGroupId?: number | null;
  limit?: number;
  offset?: number;
  unpaged?: boolean;
}

export interface ListMembersResult {
  rows: MemberRow[];
  total: number;
}

export async function listMembers(
  opts: ListMembersOptions = {},
): Promise<ListMembersResult> {
  const where: any = {};

  if (opts.search && opts.search.trim().length > 0) {
    const term = opts.search.trim();
    where.OR = [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { membershipNumber: { contains: term } },
    ];
  }
  
  if (typeof opts.familyGroupId === "number" && Number.isFinite(opts.familyGroupId)) {
    where.familyGroupId = opts.familyGroupId;
  }

  const limit = opts.unpaged ? undefined : Math.max(1, Math.min(100, opts.limit ?? 20));
  const offset = opts.unpaged ? undefined : Math.max(0, opts.offset ?? 0);

  const [total, rowsRaw] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      include: { familyGroup: true },
    }),
  ]);

  return { rows: rowsRaw.map(mapRow), total };
}

export interface CreateMemberInput {
  firstName: string;
  middleName: string | null;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
}

export async function createMember(input: CreateMemberInput): Promise<MemberRow> {
  const row = await prisma.member.create({
    data: {
      firstName: input.firstName.trim(),
      middleName: input.middleName ? input.middleName.trim() : null,
      lastName: input.lastName.trim(),
      membershipNumber: input.membershipNumber,
      familyGroupId: input.familyGroupId,
    },
    include: { familyGroup: true },
  });
  return mapRow(row);
}

export interface UpdateMemberInput {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
}

export async function updateMember(input: UpdateMemberInput): Promise<MemberRow> {
  try {
    const row = await prisma.member.update({
      where: { id: input.id },
      data: {
        firstName: input.firstName.trim(),
        middleName: input.middleName ? input.middleName.trim() : null,
        lastName: input.lastName.trim(),
        membershipNumber: input.membershipNumber,
        familyGroupId: input.familyGroupId,
      },
      include: { familyGroup: true },
    });
    return mapRow(row);
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error("Miembro no encontrado");
    }
    throw error;
  }
}

export async function deleteMember(id: number): Promise<boolean> {
  try {
    await prisma.member.delete({
      where: { id },
    });
    return true;
  } catch (error: any) {
    if (error.code === 'P2025') return false;
    throw error;
  }
}

export interface MemberSearchHit {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  membershipNumber: string | null;
}

export async function searchMembers(
  query: string,
  limit = 10,
): Promise<MemberSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  // Prisma doesn't support complex "ORDER BY CASE" natively in a single query 
  // without raw SQL, but we can just use raw SQL for this specific autocomplete query
  // to maintain the exact same ordering logic, or just return them and sort in memory 
  // since limit is small.
  const term = `%${trimmed.toLowerCase()}%`;
  const exact = trimmed.toLowerCase();
  
  const rows: any[] = await prisma.$queryRawUnsafe(`
    SELECT id, "firstName", "middleName", "lastName", "membershipNumber"
    FROM "Member"
    WHERE LOWER(firstName) LIKE $1
       OR LOWER(lastName)  LIKE $2
       OR membershipNumber LIKE $3
    ORDER BY
      CASE WHEN LOWER(firstName) = $4 OR LOWER(lastName) = $5 THEN 0 ELSE 1 END,
      LOWER(lastName) ASC,
      LOWER(firstName) ASC
    LIMIT $6
  `, term, term, term, exact, exact, limit);

  return rows.map((r: any) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: fullName(r as any), // fullName just uses firstName/lastName
    membershipNumber: r.membershipNumber,
  }));
}

export async function findMemberByFullName(
  firstName: string,
  lastName: string,
): Promise<MemberRow | null> {
  const rows = await prisma.member.findMany({
    where: {
      firstName: { equals: firstName.trim(), mode: "insensitive" },
      lastName: { equals: lastName.trim(), mode: "insensitive" },
    },
    orderBy: { id: "asc" },
    take: 2,
    include: { familyGroup: true },
  });
  
  if (rows.length !== 1) return null;
  return mapRow(rows[0]);
}
