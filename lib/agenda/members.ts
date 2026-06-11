/**
 * Members lookup helpers used by the agenda editor's speaker picker.
 *
 * We don't depend on the members-module (parallel track) yet — define the
 * queries locally and re-use them so the editor works standalone. The
 * members-module will eventually own these and we can swap the
 * implementation transparently.
 */
import { getDb } from "@/lib/db";
import type { MemberRow } from "./types";

interface RawMember {
  id: number;
  firstName: string;
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
    lastName: r.lastName,
    membershipNumber: r.membershipNumber,
    familyGroupId: r.familyGroupId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function searchMembers(q: string, limit = 10): MemberRow[] {
  const db = getDb();
  const trimmed = q.trim();
  if (!trimmed) return [];
  // Search by firstName, lastName, or `firstName + ' ' + lastName` (LIKE)
  const like = `%${trimmed.toLowerCase()}%`;
  const rows = db
    .prepare(
      `SELECT * FROM Member
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
    .all(like, like, like, trimmed.toLowerCase(), trimmed.toLowerCase(), Math.max(1, Math.min(50, limit))) as RawMember[];
  return rows.map(toMember);
}

export function getMemberById(id: number): MemberRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM Member WHERE id = ?").get(id) as
    | RawMember
    | undefined;
  return row ? toMember(row) : null;
}

export function createMember(input: {
  firstName: string;
  lastName: string;
  membershipNumber?: string | null;
  familyGroupId?: number | null;
}): MemberRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO Member (firstName, lastName, membershipNumber, familyGroupId)
       VALUES (?, ?, ?, ?)`,
    )
    .run(
      input.firstName,
      input.lastName,
      input.membershipNumber ?? null,
      input.familyGroupId ?? null,
    );
  const id = Number(result.lastInsertRowid);
  const created = getMemberById(id);
  if (!created) {
    throw new Error("Failed to load newly-created Member");
  }
  return created;
}
