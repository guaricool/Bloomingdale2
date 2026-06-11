"use server";

/**
 * Server actions for the Posts feed.
 *
 * Public read: the landing page (`/`) lists the latest posts without
 * requiring a session. Write (create / delete / pin) requires a session.
 * Only admins can pin.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, appUserIdToNumber, type AppSessionUser } from "@/auth";
import { createPost, deletePost, listPosts, togglePostPinned } from "@/lib/posts";

const createPostSchema = z.object({
  title: z.string().max(160).optional().nullable(),
  body: z.string().min(1, "El contenido no puede estar vacío").max(5000),
  pinned: z.boolean().optional().default(false),
});

export interface PostActionResult {
  ok: boolean;
  error?: string;
}

export async function createPostAction(
  raw: unknown,
): Promise<PostActionResult> {
  const session = await auth();
  const user = session?.user as AppSessionUser | undefined;
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const authorId = appUserIdToNumber(user);
  if (authorId == null) return { ok: false, error: "Sesión inválida" };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // Only admins can pin; force pinned=false otherwise.
  const pinned = user.role === "admin" && parsed.data.pinned === true;

  try {
    createPost({
      authorId,
      title: parsed.data.title ?? null,
      body: parsed.data.body,
      pinned,
    });
    revalidatePath("/");
    revalidatePath("/"); revalidatePath("/inicio");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo crear el post",
    };
  }
}

export async function deletePostAction(
  id: number,
): Promise<PostActionResult> {
  const session = await auth();
  const user = session?.user;
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const ok = deletePost(id);
  if (!ok) return { ok: false, error: "Post no encontrado" };

  revalidatePath("/");
  revalidatePath("/"); revalidatePath("/inicio");
  return { ok: true };
}

export async function togglePostPinnedAction(
  id: number,
): Promise<PostActionResult> {
  const session = await auth();
  const user = session?.user;
  if (!user) return { ok: false, error: "No has iniciado sesión" };
  if (user.role !== "admin") {
    return { ok: false, error: "Solo la presidencia puede fijar posts" };
  }

  const ok = togglePostPinned(id);
  if (!ok) return { ok: false, error: "Post no encontrado" };

  revalidatePath("/");
  revalidatePath("/"); revalidatePath("/inicio");
  return { ok: true };
}

/** Used by the landing page to pull the latest feed. */
export async function listPostsAction(
  limit?: number,
): Promise<{ ok: boolean; posts?: Awaited<ReturnType<typeof listPosts>>; error?: string }> {
  try {
    return { ok: true, posts: listPosts(limit ?? 50) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}
