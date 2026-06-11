"use client";

/**
 * Feed item — un post del feed. Card con autor, fecha, contenido,
 * y acciones (eliminar si soy el autor o admin, fijar si soy admin).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { deletePostAction, togglePostPinnedAction } from "@/app/actions/posts";
import type { PostRow } from "@/lib/post-types";

interface PostCardProps {
  post: PostRow;
  /** Current session — used to decide which actions to show. */
  currentUser?: {
    id: number;
    role: "admin" | "member";
  } | null;
}

function timeAgo(iso: string): string {
  const then = new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z")).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `hace ${w} sem`;
  const date = new Date(then);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canDelete = currentUser && (currentUser.id === post.authorId || currentUser.role === "admin");
  const canPin = currentUser?.role === "admin";

  async function onDelete() {
    if (!window.confirm("¿Eliminar este post?")) return;
    setError(null);
    const res = await deletePostAction(post.id);
    if (!res.ok) {
      setError(res.error ?? "No se pudo eliminar");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function onTogglePin() {
    setError(null);
    const res = await togglePostPinnedAction(post.id);
    if (!res.ok) {
      setError(res.error ?? "No se pudo fijar");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <article
      className={clsx(
        "paper-card relative overflow-hidden p-6 transition-all",
        post.pinned && "ring-1 ring-sage-300",
      )}
    >
      {post.pinned ? (
        <div className="absolute right-0 top-0 rounded-bl-card bg-sage-600 px-3 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cream-50">
          Fijado
        </div>
      ) : null}

      <header className="flex items-start gap-3">
        <div
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-medium shadow-soft",
            post.authorRole === "admin"
              ? "bg-sage-700 text-cream-50"
              : "bg-cream-200 text-ink-700",
          )}
          aria-hidden
        >
          {initials(post.authorName || "?")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-sans text-sm">
            <span className="font-semibold text-ink-900">{post.authorName}</span>
            {post.authorRole === "admin" ? (
              <span className="rounded-pill border border-sage-200 bg-sage-50 px-1.5 py-0.5 font-sans text-[0.6rem] font-semibold uppercase tracking-wider text-sage-700">
                Presidencia
              </span>
            ) : null}
            <span className="text-ink-400">·</span>
            <time className="text-xs text-ink-500" dateTime={post.createdAt}>
              {timeAgo(post.createdAt)}
            </time>
          </p>
          {post.title ? (
            <h2 className="mt-1.5 font-display text-xl font-medium tracking-tight text-ink-900">
              {post.title}
            </h2>
          ) : null}
        </div>
      </header>

      <div className="mt-4 whitespace-pre-line font-display text-base leading-relaxed text-ink-700">
        {post.body}
      </div>

      {error ? (
        <p className="mt-3 rounded-card border border-terracotta-100 bg-terracotta-50 px-3 py-2 font-sans text-xs text-terracotta-600" role="alert">
          {error}
        </p>
      ) : null}

      {(canDelete || canPin) ? (
        <footer className="mt-4 flex items-center gap-2 border-t border-cream-200 pt-3">
          {canPin ? (
            <button
              type="button"
              onClick={onTogglePin}
              disabled={pending}
              className="rounded-pill border border-cream-300 bg-white px-3 py-1 font-sans text-xs font-medium text-ink-700 transition-colors hover:border-sage-400 hover:bg-sage-50 hover:text-sage-700 disabled:opacity-50"
            >
              {post.pinned ? "Quitar fijado" : "Fijar"}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-pill border border-terracotta-100 bg-white px-3 py-1 font-sans text-xs font-medium text-terracotta-500 transition-colors hover:bg-terracotta-50 disabled:opacity-50"
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </button>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
