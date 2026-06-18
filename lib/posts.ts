/**
 * Posts / news feed data access.
 */
import { prisma } from "@/lib/db";
import type { PostRow } from "@/lib/post-types";
export type { PostRow } from "@/lib/post-types";

function toPost(r: any): PostRow {
  const mFirstName = r.author?.member?.firstName;
  const mLastName = r.author?.member?.lastName;
  const memberName = (mFirstName && mLastName) ? `${mFirstName} ${mLastName}` : null;

  return {
    id: r.id,
    authorId: r.authorId,
    authorName: memberName || r.author?.email || "Anónimo",
    authorEmail: r.author?.email || "",
    authorRole: (r.author?.role || "member") as "admin" | "member",
    title: r.title,
    body: r.body,
    pinned: r.pinned === 1,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
  };
}

export async function listPosts(limit = 50): Promise<PostRow[]> {
  const rows = await prisma.post.findMany({
    include: {
      author: {
        include: {
          member: true
        }
      }
    },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ],
    take: Math.max(1, Math.min(200, limit))
  });
  return rows.map(toPost);
}

export async function getPostById(id: number): Promise<PostRow | null> {
  const row = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        include: { member: true }
      }
    }
  });
  return row ? toPost(row) : null;
}

export async function createPost(input: {
  authorId: number;
  title?: string | null;
  body: string;
  pinned?: boolean;
}): Promise<PostRow> {
  const row = await prisma.post.create({
    data: {
      authorId: input.authorId,
      title: input.title?.trim() || null,
      body: input.body.trim(),
      pinned: input.pinned ? 1 : 0,
    },
    include: {
      author: {
        include: { member: true }
      }
    }
  });
  return toPost(row);
}

export async function deletePost(id: number): Promise<boolean> {
  try {
    await prisma.post.delete({ where: { id } });
    return true;
  } catch (e) {
    return false;
  }
}

export async function togglePostPinned(id: number): Promise<boolean> {
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) return false;
  const next = current.pinned === 1 ? 0 : 1;
  await prisma.post.update({
    where: { id },
    data: { pinned: next }
  });
  return true;
}
