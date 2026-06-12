/**
 * Data access layer for the FamilyGroup module.
 *
 * Pure DB functions. Authorization and validation happen in the
 * server action / API route that calls these helpers.
 *
 * Async: all functions return Promises. The DB layer can be SQLite (sync
 * semantics wrapped in a resolved Promise) or Postgres (native async). The
 * call sites `await` everything uniformly.
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
    fg.headMemberId    AS "headMemberId",
    h.firstName || ' ' || h.lastName AS "headMemberName",
    (SELECT COUNT(*) FROM "Member" m WHERE m.familyGroupId = fg.id) AS "memberCount",
    fg.createdAt       AS "createdAt"
  FROM "FamilyGroup" fg
  LEFT JOIN "Member" h ON h.id = fg.headMemberId
`;

export async function getFamilyGroupById(id: number): Promise<FamilyGroupRow | null> {
  const row = (await getDb()
    .prepare(`${SELECT_JOIN} WHERE fg.id = ?`)
    .get(id)) as RawFamilyGroupRow | undefined;
  return row ?? null;
}

export async function listFamilyGroups(): Promise<FamilyGroupRow[]> {
  return (await getDb()
    .prepare(`${SELECT_JOIN} ORDER BY LOWER(fg.name) ASC`)
    .all()) as RawFamilyGroupRow[];
}

export interface CreateFamilyGroupInput {
  name: string;
  headMemberId: number | null;
}

export async function createFamilyGroup(
  input: CreateFamilyGroupInput,
): Promise<FamilyGroupRow> {
  const db = getDb();
  const rows = await db
    .prepare(`INSERT INTO "FamilyGroup" (name, headMemberId) VALUES (?, ?) RETURNING id`)
    .all(input.name.trim(), input.headMemberId);
  const id = (rows[0] as { id: number }).id;
  const row = await getFamilyGroupById(id);
  if (!row) throw new Error("No se pudo crear el grupo familiar");
  return row;
}

export interface UpdateFamilyGroupInput {
  id: number;
  name: string;
  headMemberId: number | null;
}

export async function updateFamilyGroup(
  input: UpdateFamilyGroupInput,
): Promise<FamilyGroupRow> {
  const db = getDb();
  const result = await db
    .prepare(
      `UPDATE "FamilyGroup"
       SET name = ?, headMemberId = ?
       WHERE id = ?`,
    )
    .run(input.name.trim(), input.headMemberId, input.id);
  if (result.changes === 0) {
    // Postgres path: 0 changes can mean a no-op update or a missing row.
    const existing = await getFamilyGroupById(input.id);
    if (!existing) throw new Error("Grupo familiar no encontrado");
    return existing;
  }
  const row = await getFamilyGroupById(input.id);
  if (!row) throw new Error("Grupo familiar no encontrado");
  return row;
}

/**
 * Delete a family group. Fails (returns false) when the group still has
 * members, since ON DELETE SET NULL on Member.familyGroupId would silently
 * unlink them; we prefer to be explicit and ask the admin to reassign first.
 */
export async function deleteFamilyGroup(
  id: number,
): Promise<{ ok: boolean; reason?: string }> {
  const group = await getFamilyGroupById(id);
  if (!group) return { ok: false, reason: "Grupo familiar no encontrado" };
  if (group.memberCount > 0) {
    return {
      ok: false,
      reason: `El grupo tiene ${group.memberCount} miembro(s) asignado(s). Reasígnalos antes de eliminarlo.`,
    };
  }
  const result = await getDb().prepare(`DELETE FROM "FamilyGroup" WHERE id = ?`).run(id);
  if (result.changes === 0) {
    // Postgres: 0 changes with a confirmed existing row is unusual; report
    // as a soft failure so the caller can re-check.
    return { ok: false, reason: "No se pudo eliminar el grupo" };
  }
  return { ok: true };
}
