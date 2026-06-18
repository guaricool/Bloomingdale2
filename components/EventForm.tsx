"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, EVENT_TYPE_LABELS, type EventType } from "@/lib/events-types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface EventFormValues {
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD
  type: EventType;
}

interface EventFormProps {
  /** When provided, the form PUTs to /api/eventos/[id]. When null, it POSTs. */
  eventId?: number;
  initial?: Partial<EventFormValues>;
  /** Where to send the user after a successful save. Default: /admin/eventos. */
  redirectTo?: string;
}

const TYPE_LABELS = EVENT_TYPE_LABELS;

export function EventForm({ eventId, initial, redirectTo = "/admin/eventos" }: EventFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "actividad");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = typeof eventId === "number";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("El título debe tener al menos 2 caracteres.");
      return;
    }
    if (!eventDate) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    const payload: EventFormValues = {
      title: title.trim(),
      description: description.trim(),
      eventDate,
      type,
    };

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/eventos/${eventId}` : "/api/eventos";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar el evento.");
        return;
      }
      toast.success(isEdit ? "Evento actualizado" : "Evento creado");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="La Noche Internacional"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Descripción <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles, hora, lugar, qué llevar..."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-slate-700">
            Fecha del evento
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            YYYY-MM-DD. El evento se anunciará en los domingos previos.
          </p>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            Tipo de evento
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-card border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(redirectTo)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
