/**
 * Members lookup helpers used by the agenda editor's speaker picker.
 *
 * We don't depend on the members-module (parallel track) yet — define the
 * queries locally and re-use them so the editor works standalone. The
 * members-module will eventually own these and we can swap the
 * implementation transparently.
 *
 * Async: all functions return Promises. The DB layer can be SQLite (sync
 * semantics wrapped in a resolved Promise) or Postgres (native async). The
 * call sites `await` everything uniformly.
 */
import { getDb } from "@/lib/db";
import type { MemberRow } from "./types";

interface RawMember {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
  createdAt: string;
  updatedAt: string;
}

function toMember(r: RawMember): MemberRow {
  return {
    id: r.id,
    firstName: r.firstName,
    middleName: r.middleName ?? null,
    lastName: r.lastName,
    membershipNumber: r.membershipNumber,
    familyGroupId: r.familyGroupId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function searchMembers(q: string, limit = 10): Promise<MemberRow[]> {
  const db = getDb();
  const trimmed = q.trim();
  if (!trimmed) return [];
  // Search by firstName, lastName, or `firstName + ' ' + lastName` (LIKE)
  const like = `%${trimmed.toLowerCase()}%`;
  const rows = (await db
    .prepare(
      `SELECT id,
              firstName AS "firstName",
              middleName AS "middleName",
              lastName AS "lastName",
              membershipNumber AS "membershipNumber",
              familyGroupId AS "familyGroupId",
              createdAt AS "createdAt",
              updatedAt AS "updatedAt"
       FROM "Member"
       WHERE LOWER(firstName) LIKE ? OR LOWER(lastName) LIKE ?
         OR LOWER(firstName || ' ' || lastName) LIKE ?
       ORDER BY
         CASE WHEN LOWER(firstName) = ? THEN 0
              WHEN LOWER(lastName)  = ? THEN 1
              ELSE 2 END,
         firstName ASC,
         lastName ASC
       LIMIT ?`,
    )
    .all(
      like,
      like,
      like,
      trimmed.toLowerCase(),
      trimmed.toLowerCase(),
      Math.max(1, Math.min(50, limit)),
    )) as RawMember[];
  return rows.map(toMember);
}

export async function getMemberById(id: number): Promise<MemberRow | null> {
  const db = getDb();
  const row = (await db
    .prepare(
      `SELECT id,
              firstName AS "firstName",
              middleName AS "middleName",
              lastName AS "lastName",
              membershipNumber AS "membershipNumber",
              familyGroupId AS "familyGroupId",
              createdAt AS "createdAt",
              updatedAt AS "updatedAt"
       FROM "Member" WHERE id = ?`,
    )
    .get(id)) as RawMember | undefined;
  return row ? toMember(row) : null;
}

export async function createMember(input: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  membershipNumber?: string | null;
  familyGroupId?: number | null;
}): Promise<MemberRow> {
  const db = getDb();
  const rows = await db
    .prepare(
      `INSERT INTO "Member" (firstName, middleName, lastName, membershipNumber, familyGroupId)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .all(
      input.firstName,
      input.middleName ?? null,
      input.lastName,
      input.membershipNumber ?? null,
      input.familyGroupId ?? null,
    );
  const id = (rows[0] as { id: number }).id;
  const created = await getMemberById(id);
  if (!created) throw new Error("No se pudo crear el miembro");
  return created;
}
