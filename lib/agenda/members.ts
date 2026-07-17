/**
 * Members lookup helpers used by the agenda editor's speaker picker.
 */
import { prisma } from "@/lib/db";
import type { MemberRow } from "./types";

function toMember(r: any): MemberRow {
  return {
    id: r.id,
    firstName: r.firstName,
    middleName: r.middleName ?? null,
    lastName: r.lastName,
    membershipNumber: r.membershipNumber,
    familyGroupId: r.familyGroupId,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : r.updatedAt.toISOString(),
    lastDiscourseDate: r.lastDiscourseDate ?? null,
  };
}

export async function searchMembers(q: string, limit = 10): Promise<MemberRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  
  const like = `%${trimmed.toLowerCase()}%`;
  const exact = trimmed.toLowerCase();
  
  const sql = `
    SELECT m.id,
           m."firstName" AS "firstName",
           m."middleName" AS "middleName",
           m."lastName" AS "lastName",
           m."membershipNumber" AS "membershipNumber",
           m."familyGroupId" AS "familyGroupId",
           m."createdAt" AS "createdAt",
           m."updatedAt" AS "updatedAt",
           MAX(d."discourseDate") as "lastDiscourseDate"
    FROM "Member" m
    LEFT JOIN "DiscourseLog" d ON d."memberId" = m.id
    WHERE LOWER(m."firstName") LIKE $1 OR LOWER(m."lastName") LIKE $2
       OR LOWER(m."firstName" || ' ' || m."lastName") LIKE $3
    GROUP BY m.id, m."firstName", m."middleName", m."lastName", m."membershipNumber", m."familyGroupId", m."createdAt", m."updatedAt"
    ORDER BY
      CASE WHEN LOWER(m."firstName") = $4 THEN 0
           WHEN LOWER(m."lastName")  = $5 THEN 1
           ELSE 2 END,
      m."firstName" ASC,
      m."lastName" ASC
    LIMIT $6
  `;
  
  const rowsRaw: any[] = await prisma.$queryRawUnsafe(sql, like, like, like, exact, exact, limit);
  return rowsRaw.map(toMember);
}

export async function getMemberById(id: number): Promise<MemberRow | null> {
  const row = await prisma.member.findUnique({
    where: { id },
    include: {
      discourseLogs: {
        orderBy: { discourseDate: 'desc' },
        take: 1
      }
    }
  });
  if (!row) return null;
  return toMember({
    ...row,
    lastDiscourseDate: row.discourseLogs.length > 0 ? row.discourseLogs[0].discourseDate : null
  });
}

export async function createMember(input: {
  firstName: string;
  lastName: string;
  membershipNumber?: string | null;
  familyGroupId?: number | null;
}): Promise<MemberRow> {
  const row = await prisma.member.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      membershipNumber: input.membershipNumber ?? null,
      familyGroupId: input.familyGroupId ?? null,
    }
  });
  return toMember(row);
}
