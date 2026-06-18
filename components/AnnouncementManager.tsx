"use client";

import { useState } from "react";
import { createAnnouncement, deleteAnnouncement } from "@/app/admin/anuncios/actions";

export function AnnouncementManager({ initialAnnouncements }: { initialAnnouncements: any[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeUntil, setActiveUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAnnouncement({ title, body, activeFrom, activeUntil });
      setTitle("");
      setBody("");
      // No limpiamos activeFrom y activeUntil para facilitar múltiples entradas para las mismas fechas
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Crear Anuncio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Detalle (Opcional)</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full rounded-md border p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Activo desde</label>
              <input required type="date" value={activeFrom} onChange={e => setActiveFrom(e.target.value)} className="w-full rounded-md border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Activo hasta (Opcional)</label>
              <input type="date" value={activeUntil} onChange={e => setActiveUntil(e.target.value)} className="w-full rounded-md border p-2" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-sage-600 px-4 py-2 text-white disabled:opacity-50">
            Guardar Anuncio
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Anuncios Actuales</h2>
        {initialAnnouncements.length === 0 ? (
          <p className="text-ink-500 text-sm">No hay anuncios configurados.</p>
        ) : null}
        {initialAnnouncements.map((ann, idx) => (
          <div key={ann.id} className="rounded-xl border bg-card p-4 flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">
                <span className="text-sage-600 mr-2">{idx + 1}.</span>
                {ann.title}
              </h3>
              <p className="text-sm text-ink-600">{ann.body}</p>
              <p className="text-xs text-ink-500 mt-2">
                Visible: {ann.activeFrom} {ann.activeUntil ? `al ${ann.activeUntil}` : '(sin límite)'}
              </p>
            </div>
            <button onClick={() => deleteAnnouncement(ann.id)} className="text-red-600 text-sm hover:underline">
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
