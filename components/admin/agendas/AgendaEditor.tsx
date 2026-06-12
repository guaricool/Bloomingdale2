"use client";

/**
 * Agenda editor — admin drag-and-drop list of AgendaItems.
 *
 * The editor lives inside `/admin/agendas/[id]/editar` and is rendered by
 * the server component with the agenda's current items.
 *
 * Operations:
 *   - Add a new item (hymn / speaker / prayer / announcement) via the
 *     AddItemBar; a small typeahead is used for hymn and speaker refs.
 *   - Reorder via drag-and-drop on the row handle.
 *   - Delete an item with a confirm.
 *   - Edit an item's `note` in-place (used for announcements and prayers).
 *
 * All mutations go through the `/api/agendas/[id]/items/*` routes. After
 * each mutation we call `router.refresh()` so the server component
 * re-reads and re-passes the latest items.
 *
 * No external DnD lib — we use the HTML5 drag/drop API. Listens for
 * dragstart/dragover/drop and reorders a local copy of the items array,
 * then issues a single bulk reorder call on drop.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ITEM_TYPE_LABELS,
  type AgendaItemType,
  type AgendaItemWithJoins,
  type AgendaWithItems,
} from "@/lib/agenda/types";
import { HymnAutocomplete } from "./HymnAutocomplete";
import { SpeakerPicker, type MemberOption } from "./SpeakerPicker";

interface AgendaEditorProps {
  agenda: AgendaWithItems;
  /** Members used to seed the speaker picker typeahead (so the dev-server
   *  doesn't hammer the API on every keystroke even with no DB members). */
  memberSuggestions: MemberOption[];
  /** Lock the editor when the agenda isn't in 'draft' status. */
  readOnly: boolean;
}

interface DraftItem {
  id: number;
  type: AgendaItemType;
  refId: number | null;
  note: string | null;
  displayLabel: string;
}

function itemToDraft(item: AgendaItemWithJoins): DraftItem {
  let label = "—";
  if (item.type === "hymn" && item.hymn) {
    label = `${item.hymn.number} — ${item.hymn.titleEs}`;
  } else if ((item.type === "speaker" || item.type === "prayer") && item.member) {
    label = `${[item.member.firstName, item.member.middleName, item.member.lastName].filter(Boolean).join(" ")}`;
  } else if (item.type === "announcement" && item.event) {
    label = item.event.title;
  } else if (item.note) {
    label = item.note;
  }
  return {
    id: item.id,
    type: item.type,
    refId: item.refId,
    note: item.note,
    displayLabel: label,
  };
}

export function AgendaEditor({
  agenda,
  readOnly,
}: AgendaEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<DraftItem[]>(() =>
    agenda.items.map(itemToDraft),
  );
  const [error, setError] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<AgendaItemType | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  async function persistReorder(next: DraftItem[]) {
    setItems(next);
    setError(null);
    const res = await fetch(`/api/agendas/${agenda.id}/items/reordenar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: next.map((it, idx) => ({ id: it.id, order: idx })),
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo reordenar");
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function addItem(input: {
    type: AgendaItemType;
    refId: number | null;
    note: string | null;
    displayLabel: string;
  }) {
    setError(null);
    const res = await fetch(`/api/agendas/${agenda.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: input.type,
        refId: input.refId,
        note: input.note,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo agregar el item");
      return;
    }
    setAddingType(null);
    startTransition(() => router.refresh());
  }

  async function deleteItem(id: number) {
    if (!window.confirm("¿Eliminar este item de la agenda?")) return;
    setError(null);
    const res = await fetch(`/api/agendas/${agenda.id}/items/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo eliminar");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(() => router.refresh());
  }

  async function updateItemNote(id: number, note: string) {
    setError(null);
    const res = await fetch(`/api/agendas/${agenda.id}/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || null }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo guardar la nota");
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, note: note || null } : it)),
    );
  }

  // DnD handlers
  function onDragStart(id: number) {
    return (ev: React.DragEvent<HTMLLIElement>) => {
      setDraggingId(id);
      ev.dataTransfer.effectAllowed = "move";
      ev.dataTransfer.setData("text/plain", String(id));
    };
  }
  function onDragOver(ev: React.DragEvent<HTMLLIElement>) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }
  function onDrop(targetId: number) {
    return (ev: React.DragEvent<HTMLLIElement>) => {
      ev.preventDefault();
      const sourceId = Number(ev.dataTransfer.getData("text/plain"));
      setDraggingId(null);
      if (!sourceId || sourceId === targetId) return;
      const next = [...items];
      const fromIdx = next.findIndex((it) => it.id === sourceId);
      const toIdx = next.findIndex((it) => it.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      void persistReorder(next);
    };
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <ol className="space-y-2" aria-label="Items de la agenda">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Aún no hay items. Usa el formulario de abajo para empezar.
          </li>
        ) : (
          items.map((it, idx) => (
            <li
              key={it.id}
              draggable={!readOnly}
              onDragStart={onDragStart(it.id)}
              onDragOver={onDragOver}
              onDrop={onDrop(it.id)}
              className={`flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${
                draggingId === it.id ? "opacity-50" : ""
              }`}
            >
              <span
                className="mt-1 cursor-grab select-none text-slate-400"
                aria-hidden
                title="Arrastra para reordenar"
              >
                ⋮⋮
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {idx + 1}. {ITEM_TYPE_LABELS[it.type]}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-900">
                    {it.displayLabel}
                  </span>
                </div>
                {(it.type === "announcement" || it.type === "prayer") ? (
                  <textarea
                    defaultValue={it.note ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== (it.note ?? "")) {
                        void updateItemNote(it.id, v);
                      }
                    }}
                    disabled={readOnly}
                    rows={2}
                    placeholder={
                      it.type === "prayer"
                        ? "Tema de la oración (opcional)"
                        : "Detalle del anuncio (opcional)"
                    }
                    className="mt-2 block w-full rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void deleteItem(it.id)}
                disabled={readOnly}
                className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Eliminar
              </button>
            </li>
          ))
        )}
      </ol>

      {!readOnly ? (
        <AddItemBar
          agendaId={agenda.id}
          active={addingType}
          setActive={setAddingType}
          onSubmit={addItem}
        />
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Esta agenda no está en estado <strong>borrador</strong>. La edición está bloqueada.
        </p>
      )}
    </div>
  );
}

interface AddItemBarProps {
  agendaId: number;
  active: AgendaItemType | null;
  setActive: (t: AgendaItemType | null) => void;
  onSubmit: (input: {
    type: AgendaItemType;
    refId: number | null;
    note: string | null;
    displayLabel: string;
  }) => Promise<void>;
}

function AddItemBar({ active, setActive, onSubmit }: AddItemBarProps) {
  const [hymn, setHymn] = useState<{ number: number; titleEs: string } | null>(null);
  const [member, setMember] = useState<MemberOption | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const types: AgendaItemType[] = ["hymn", "speaker", "prayer", "announcement"];

  function reset() {
    setHymn(null);
    setMember(null);
    setNote("");
  }

  async function submit() {
    if (!active) return;
    let refId: number | null = null;
    let label = "";
    if (active === "hymn") {
      if (!hymn || hymn.number < 1) return;
      refId = hymn.number;
      label = `Himno ${hymn.number} — ${hymn.titleEs}`;
    } else if (active === "speaker" || active === "prayer") {
      if (!member || member.id < 1) return;
      refId = member.id;
      label = `${[member.firstName, member.middleName, member.lastName].filter(Boolean).join(" ")}`;
    } else if (active === "announcement") {
      refId = null;
      label = note || "Anuncio";
    }
    setSubmitting(true);
    try {
      await onSubmit({
        type: active,
        refId,
        note: active === "announcement" || active === "prayer" ? note || null : null,
        displayLabel: label,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Agregar
        </span>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setActive(active === t ? null : t);
              reset();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ${
              active === t
                ? "bg-blue-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {ITEM_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {active ? (
        <div className="mt-4 space-y-3">
          {active === "hymn" ? (
            <HymnAutocomplete
              value={hymn?.number ?? null}
              onSelect={(h) =>
                setHymn(h.number > 0 ? { number: h.number, titleEs: h.titleEs } : null)
              }
            />
          ) : null}
          {active === "speaker" || active === "prayer" ? (
            <SpeakerPicker
              value={member?.id ?? null}
              onSelect={(m) => setMember(m.id > 0 ? m : null)}
            />
          ) : null}
          {active === "announcement" || active === "prayer" ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                active === "prayer"
                  ? "Tema o detalle (opcional)"
                  : "Texto del anuncio"
              }
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setActive(null);
                reset();
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || (active === "hymn" && !hymn) || ((active === "speaker" || active === "prayer") && !member)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Agregando…" : "Agregar item"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
