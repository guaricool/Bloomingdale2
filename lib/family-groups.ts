/**
 * Data access layer for the FamilyGroup module.
 *
 * Pure DB functions. Authorization and validation happen in the
 * server action / API route that calls these helpers.
 */
import { getDb } from "@/lib/db";

export interface FamilyGroupRow {
  id: number;
  name: string;
  headMemberId: number | null;
  headMemberName: string | null;
  memberCount: number;
  createdAt: string;
}

interface RawFamilyGroupRow {
  id: number;
  name: string;
  headMemberId: number | null;
  headMemberName: string | null;
  memberCount: number;
  createdAt: string;
}

const SELECT_JOIN = `
  SELECT
    fg.id              AS id,
    fg.name            AS name,
    fg.headMemberId    AS headMemberId,
    h.firstName || ' ' || h.lastName AS headMemberName,
    (SELECT COUNT(*) FROM Member m WHERE m.familyGroupId = fg.id) AS memberCount,
    fg.createdAt       AS createdAt
  FROM FamilyGroup fg
  LEFT JOIN Member h ON h.id = fg.headMemberId
`;

export function getFamilyGroupById(id: number): FamilyGroupRow | null {
  const row = getDb()
    .prepare(`${SELECT_JOIN} WHERE fg.id = ?`)
    .get(id) as RawFamilyGroupRow | undefined;
  return row ?? null;
}

export function listFamilyGroups(): FamilyGroupRow[] {
  return getDb()
    .prepare(`${SELECT_JOIN} ORDER BY fg.name COLLATE NOCASE ASC`)
    .all() as RawFamilyGroupRow[];
}

export interface CreateFamilyGroupInput {
  name: string;
  headMemberId: number | null;
}

export function createFamilyGroup(input: CreateFamilyGroupInput): FamilyGroupRow {
  const db = getDb();
  const result = db
    .prepare(`INSERT INTO FamilyGroup (name, headMemberId) VALUES (?, ?)`)
    .run(input.name.trim(), input.headMemberId);
  const id = Number(result.lastInsertRowid);
  const row = getFamilyGroupById(id);
  if (!row) throw new Error("No se pudo crear el grupo familiar");
  return row;
}

export interface UpdateFamilyGroupInput {
  id: number;
  name: string;
  headMemberId: number | null;
}

export function updateFamilyGroup(input: UpdateFamilyGroupInput): FamilyGroupRow {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE FamilyGroup
       SET name = ?, headMemberId = ?
       WHERE id = ?`,
    )
    .run(input.name.trim(), input.headMemberId, input.id);
  if (result.changes === 0) {
    throw new Error("Grupo familiar no encontrado");
  }
  const row = getFamilyGroupById(input.id);
  if (!row) throw new Error("Grupo familiar no encontrado");
  return row;
}

/**
 * Delete a family group. Fails (returns false) when the group still has
 * members, since ON DELETE SET NULL on Member.familyGroupId would silently
 * unlink them; we prefer to be explicit and ask the admin to reassign first.
 */
export function deleteFamilyGroup(id: number): { ok: boolean; reason?: string } {
  const db = getDb();
  const group = getFamilyGroupById(id);
  if (!group) return { ok: false, reason: "Grupo familiar no encontrado" };
  if (group.memberCount > 0) {
    return {
      ok: false,
      reason: `El grupo tiene ${group.memberCount} miembro(s) asignado(s). Reasígnalos antes de eliminarlo.`,
    };
  }
  const result = db.prepare("DELETE FROM FamilyGroup WHERE id = ?").run(id);
  return { ok: result.changes > 0 };
}
