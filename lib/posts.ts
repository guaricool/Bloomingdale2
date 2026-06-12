/**
 * Posts / news feed data access.
 *
 * Used by the public landing page (`/`) and the member dashboard. Posts
 * can be created by any signed-in user; admins (presidency / bishopric)
 * can additionally pin a post to the top of the feed.
 *
 * Async: all functions return Promises. The DB layer can be SQLite (sync
 * semantics wrapped in a resolved Promise) or Postgres (native async). The
 * call sites `await` everything uniformly.
 */
import { getDb } from "@/lib/db";
import type { PostRow } from "@/lib/post-types";
export type { PostRow } from "@/lib/post-types";

interface RawPostRow {
  id: number;
  authorId: number;
  title: string | null;
  body: string;
  pinned: number;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
  authorRole: "admin" | "member" | null;
}

function toPost(r: RawPostRow): PostRow {
  return {
    id: r.id,
    authorId: r.authorId,
    authorName: r.authorName ?? "Anónimo",
    authorEmail: r.authorEmail ?? "",
    authorRole: (r.authorRole ?? "member") as "admin" | "member",
    title: r.title,
    body: r.body,
    pinned: r.pinned === 1,
    createdAt: r.createdAt,
  };
}

const SELECT_JOIN = `
  SELECT
    p.id          AS id,
    p.authorId    AS "authorId",
    p.title       AS title,
    p.body        AS body,
    p.pinned      AS pinned,
    p.createdAt   AS "createdAt",
    COALESCE(m.firstName || ' ' || m.lastName, u.email) AS "authorName",
    u.email       AS "authorEmail",
    u.role        AS "authorRole"
  FROM "Post" p
  JOIN "User" u ON u.id = p.authorId
  LEFT JOIN "Member" m ON m.id = u.memberId
`;

/** Public read: latest 50 posts, pinned first. */
export async function listPosts(limit = 50): Promise<PostRow[]> {
  const db = getDb();
  const rows = (await db
    .prepare(
      `${SELECT_JOIN}
       ORDER BY p.pinned DESC, p.createdAt DESC
       LIMIT ?`,
    )
    .all(Math.max(1, Math.min(200, limit)))) as RawPostRow[];
  return rows.map(toPost);
}

export async function getPostById(id: number): Promise<PostRow | null> {
  const db = getDb();
  const row = (await db
    .prepare(`${SELECT_JOIN} WHERE p.id = ?`)
    .get(id)) as RawPostRow | undefined;
  return row ? toPost(row) : null;
}

export async function createPost(input: {
  authorId: number;
  title?: string | null;
  body: string;
  pinned?: boolean;
}): Promise<PostRow> {
  const db = getDb();
  const rows = await db
    .prepare(
      `INSERT INTO "Post" (authorId, title, body, pinned) VALUES (?, ?, ?, ?) RETURNING id`,
    )
    .all(
      input.authorId,
      input.title?.trim() || null,
      input.body.trim(),
      input.pinned ? 1 : 0,
    );
  const id = (rows[0] as { id: number }).id;
  const created = await getPostById(id);
  if (!created) throw new Error("Failed to load newly-created Post");
  return created;
}

export async function deletePost(id: number): Promise<boolean> {
  const db = getDb();
  // Confirm the row exists first so the return value is accurate.
  const existing = await getPostById(id);
  if (!existing) return false;
  const result = await db.prepare(`DELETE FROM "Post" WHERE id = ?`).run(id);
  return result.changes > 0;
}

export async function togglePostPinned(id: number): Promise<boolean> {
  const db = getDb();
  const current = (await db
    .prepare(`SELECT pinned FROM "Post" WHERE id = ?`)
    .get(id)) as { pinned: number } | undefined;
  if (!current) return false;
  const next = current.pinned === 1 ? 0 : 1;
  await db.prepare(`UPDATE "Post" SET pinned = ? WHERE id = ?`).run(next, id);
  return true;
}
