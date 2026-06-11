"use client";

/**
 * Form para crear un post. Solo se muestra si hay sesión.
 * Miembros: post normal. Admins: pueden fijarlo al frente del feed.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/app/actions/posts";
import { Button } from "@/components/ui/Button";
import { Field, Textarea, Input } from "@/components/ui/Field";

interface PostFormProps {
  isAdmin: boolean;
  authorName: string;
}

export function PostForm({ isAdmin, authorName }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (body.trim().length === 0) {
      setError("Escribe algo antes de publicar.");
      return;
    }
    setSubmitting(true);
    const res = await createPostAction({
      title: title.trim() || null,
      body: body.trim(),
      pinned,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo publicar");
      return;
    }
    setTitle("");
    setBody("");
    setPinned(false);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="paper-card p-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-700 font-display text-sm font-medium text-cream-50"
          aria-hidden
        >
          {authorName
            .split(/\s+/)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase() ?? "")
            .join("")}
        </div>
        <p className="font-sans text-sm text-ink-700">
          Publicando como <strong className="text-ink-900">{authorName}</strong>
          {isAdmin ? (
            <span className="ml-2 rounded-pill border border-sage-200 bg-sage-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-sage-700">
              Presidencia
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <Field
          label="Título (opcional)"
          htmlFor="post-title"
          hint="Si lo dejas vacío, el post aparece solo con el cuerpo."
        >
          <Input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Anuncio, testimonio, invitación…"
            maxLength={160}
          />
        </Field>
        <Field label="Contenido" htmlFor="post-body" required>
          <Textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Comparte una noticia, un pensamiento o un anuncio con la rama…"
            maxLength={5000}
          />
        </Field>

        {isAdmin ? (
          <label className="flex items-center gap-2 font-sans text-sm text-ink-700">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-cream-300 text-sage-600 focus:ring-sage-400"
            />
            <span>Fijar este post al inicio del feed</span>
          </label>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-card border border-terracotta-100 bg-terracotta-50 px-3 py-2 font-sans text-xs text-terracotta-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "Publicando…" : "Publicar"}
        </Button>
      </div>
    </form>
  );
}
