/**
 * Client-safe post types. Same split pattern as events-types / member-types
 * — the full `lib/posts.ts` imports `getDb` and is server-only.
 */
export interface PostRow {
  id: number;
  authorId: number;
  authorName: string;
  authorEmail: string;
  authorRole: "admin" | "member";
  title: string | null;
  body: string;
  pinned: boolean;
  createdAt: string;
}
