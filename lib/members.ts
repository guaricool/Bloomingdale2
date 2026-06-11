/**
 * Data access layer for the Member module.
 *
 * Pure functions over `better-sqlite3` (no auth checks, no HTTP). All
 * authorization and validation happens in the server action / API route
 * that calls these helpers.
 *
 * Conventions:
 *  - `membershipNumber` is treated as PII; we never log or echo it back
 *    unless the caller already had it in hand.
 *  - All read functions return a stable shape (id, firstName, lastName,
 *    fullName, membershipNumber, familyGroupId, familyGroupName?).
 *  - Write functions return the freshly inserted/updated row so the caller
 *    can redirect / revalidate without a second SELECT.
 */
import { getDb } from "@/lib/db";
import { fullName, type MemberRow } from "@/lib/member-types";
export { fullName, type MemberRow } from "@/lib/member-types";

interface RawMemberRow {
  id: number;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
  familyGroupName: string | null;
  createdAt: string;
  updatedAt: string;
}

const SELECT_JOIN = `
  SELECT
    m.id              AS id,
    m.firstName       AS firstName,
    m.lastName        AS lastName,
    m.membershipNumber AS membershipNumber,
    m.familyGroupId   AS familyGroupId,
    fg.name           AS familyGroupName,
    m.createdAt       AS createdAt,
    m.updatedAt       AS updatedAt
  FROM Member m
  LEFT JOIN FamilyGroup fg ON fg.id = m.familyGroupId
`;

export function getMemberById(id: number): MemberRow | null {
  const row = getDb()
    .prepare(`${SELECT_JOIN} WHERE m.id = ?`)
    .get(id) as RawMemberRow | undefined;
  return row ?? null;
}

export interface ListMembersOptions {
  search?: string | null;
  familyGroupId?: number | null;
  limit?: number;
  offset?: number;
  /** When true, do not apply limit/offset (used for "all" reads). */
  unpaged?: boolean;
}

export interface ListMembersResult {
  rows: MemberRow[];
  total: number;
}

export function listMembers(opts: ListMembersOptions = {}): ListMembersResult {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (opts.search && opts.search.trim().length > 0) {
    const term = `%${opts.search.trim().toLowerCase()}%`;
    where.push(
      "(LOWER(m.firstName) LIKE ? OR LOWER(m.lastName) LIKE ? OR m.membershipNumber LIKE ?)",
    );
    params.push(term, term, opts.search.trim());
  }
  if (typeof opts.familyGroupId === "number" && Number.isFinite(opts.familyGroupId)) {
    where.push("m.familyGroupId = ?");
    params.push(opts.familyGroupId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = db
    .prepare(`SELECT COUNT(*) AS c FROM Member m ${whereSql}`)
    .get(...params) as { c: number };

  const limit = opts.unpaged ? -1 : Math.max(1, Math.min(100, opts.limit ?? 20));
  const offset = opts.unpaged ? 0 : Math.max(0, opts.offset ?? 0);

  const rowsRaw = limit === -1
    ? (db
        .prepare(`${SELECT_JOIN} ${whereSql} ORDER BY m.lastName COLLATE NOCASE ASC, m.firstName COLLATE NOCASE ASC`)
        .all(...params) as RawMemberRow[])
    : (db
        .prepare(
          `${SELECT_JOIN} ${whereSql} ORDER BY m.lastName COLLATE NOCASE ASC, m.firstName COLLATE NOCASE ASC LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset) as RawMemberRow[]);

  return { rows: rowsRaw, total: totalRow.c };
}

export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
}

export function createMember(input: CreateMemberInput): MemberRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO Member (firstName, lastName, membershipNumber, familyGroupId)
       VALUES (?, ?, ?, ?)`,
    )
    .run(
      input.firstName.trim(),
      input.lastName.trim(),
      input.membershipNumber,
      input.familyGroupId,
    );
  const id = Number(result.lastInsertRowid);
  const row = getMemberById(id);
  if (!row) throw new Error("No se pudo crear el miembro");
  return row;
}

export interface UpdateMemberInput {
  id: number;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  familyGroupId: number | null;
}

export function updateMember(input: UpdateMemberInput): MemberRow {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE Member
       SET firstName = ?,
           lastName = ?,
           membershipNumber = ?,
           familyGroupId = ?,
           updatedAt = datetime('now')
       WHERE id = ?`,
    )
    .run(
      input.firstName.trim(),
      input.lastName.trim(),
      input.membershipNumber,
      input.familyGroupId,
      input.id,
    );
  if (result.changes === 0) {
    throw new Error("Miembro no encontrado");
  }
  const row = getMemberById(input.id);
  if (!row) throw new Error("Miembro no encontrado");
  return row;
}

export function deleteMember(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM Member WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface MemberSearchHit {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  membershipNumber: string | null;
}

/**
 * Lightweight autocomplete search. Returns at most `limit` matches
 * (default 10) ordered by last name, first name. Matches by first
 * name, last name (prefix-friendly), or membership number.
 */
export function searchMembers(query: string, limit = 10): MemberSearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const term = `%${trimmed.toLowerCase()}%`;
  const exact = trimmed.toLowerCase();
  const rows = getDb()
    .prepare(
      `SELECT id, firstName, lastName, membershipNumber
       FROM Member
       WHERE LOWER(firstName) LIKE ?
          OR LOWER(lastName)  LIKE ?
          OR membershipNumber LIKE ?
       ORDER BY
         CASE WHEN LOWER(firstName) = ? OR LOWER(lastName) = ? THEN 0 ELSE 1 END,
         lastName COLLATE NOCASE ASC,
         firstName COLLATE NOCASE ASC
       LIMIT ?`,
    )
    .all(term, term, term, exact, exact, limit) as {
    id: number;
    firstName: string;
    lastName: string;
    membershipNumber: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: fullName(r),
    membershipNumber: r.membershipNumber,
  }));
}

/**
 * Find a member by exact (case-insensitive) full name match. Used by
 * the rapid-create endpoint to avoid duplicates when the agenda form
 * has just typed "Juan Pérez" and an existing Juan Pérez is already
 * on file. Returns null when ambiguous (more than one match).
 */
export function findMemberByFullName(
  firstName: string,
  lastName: string,
): MemberRow | null {
  const db = getDb();
  const rows = db
    .prepare(
      `${SELECT_JOIN}
       WHERE LOWER(m.firstName) = ? AND LOWER(m.lastName) = ?
       ORDER BY m.id ASC
       LIMIT 2`,
    )
    .all(firstName.trim().toLowerCase(), lastName.trim().toLowerCase()) as RawMemberRow[];
  if (rows.length !== 1) return null;
  return rows[0] ?? null;
}
