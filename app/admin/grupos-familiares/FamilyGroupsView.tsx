"use client";

/**
 * Client view for the family groups admin page. Two main regions:
 *   1) A "create" form at the top.
 *   2) A list of existing groups with inline edit / delete actions.
 *
 * We keep it as a single component because the create form is small
 * and the edit is an inline expansion. All writes go through the
 * server actions in ./actions; on success we revalidate via
 * router.refresh() to reflect changes from sibling pages.
 */
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFamilyGroupAction,
  deleteFamilyGroupAction,
  updateFamilyGroupAction,
} from "./actions";
import { familyGroupCreateSchema } from "@/lib/validators/family-group";
import type { FamilyGroupRow } from "@/lib/family-groups";

interface MemberOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface FamilyGroupsViewProps {
  initialGroups: FamilyGroupRow[];
  allMembers: MemberOption[];
}

export function FamilyGroupsView({ initialGroups, allMembers }: FamilyGroupsViewProps) {
  const [groups, setGroups] = useState<FamilyGroupRow[]>(initialGroups);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const sortedMembers = useMemo(
    () =>
      [...allMembers].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "es"),
      ),
    [allMembers],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; headMemberId: number | null }>({
    resolver: zodResolver(familyGroupCreateSchema) as never,
    defaultValues: { name: "", headMemberId: null },
    mode: "onBlur",
  });

  async function onCreate(values: { name: string; headMemberId: number | null }) {
    setFormError(null);
    setFieldErrors({});
    const res = await createFamilyGroupAction({
      name: values.name,
      headMemberId: values.headMemberId ?? null,
    });
    if (!res.ok) {
      setFormError(res.error ?? "No se pudo crear el grupo");
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      return;
    }
    setGroups((prev) => [...prev, res.group!].sort(byName));
    reset({ name: "", headMemberId: null });
  }

  async function onUpdate(
    id: number,
    values: { name: string; headMemberId: number | null },
  ) {
    setBusy(true);
    setFormError(null);
    try {
      const res = await updateFamilyGroupAction({ id, ...values });
      if (!res.ok) {
        setFormError(res.error ?? "No se pudo actualizar el grupo");
        return;
      }
      setGroups((prev) => prev.map((g) => (g.id === id ? res.group! : g)).sort(byName));
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(g: FamilyGroupRow) {
    const confirmed = window.confirm(
      g.memberCount > 0
        ? `El grupo "${g.name}" aún tiene ${g.memberCount} miembro(s). No se puede eliminar.`
        : `¿Eliminar el grupo "${g.name}"?`,
    );
    if (!confirmed) return;
    if (g.memberCount > 0) return;
    setBusy(true);
    try {
      const res = await deleteFamilyGroupAction(g.id);
      if (!res.ok) {
        setFormError(res.error ?? "No se pudo eliminar");
        return;
      }
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Crear grupo</h2>
        <p className="mt-1 text-xs text-slate-500">
          El nombre debe ser descriptivo (ej. &quot;Familía Pérez&quot;).
        </p>
        <form
          onSubmit={handleSubmit(onCreate)}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label htmlFor="new-name" className="block text-sm font-medium text-slate-700">
              Nombre <span className="text-red-600">*</span>
            </label>
            <input
              id="new-name"
              type="text"
              required
              {...register("name")}
              aria-invalid={Boolean(errors.name?.message ?? fieldErrors.name)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.name?.message ?? fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.name?.message ?? fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="new-head" className="block text-sm font-medium text-slate-700">
              Jefe de familia
            </label>
            <select
              id="new-head"
              {...register("headMemberId", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">— Opcional —</option>
              {sortedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
        {formError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Grupos existentes</h2>
          <p className="mt-1 text-xs text-slate-500">
            {groups.length} grupo{groups.length === 1 ? "" : "s"} en total.
          </p>
        </div>
        {groups.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Aún no hay grupos. Crea el primero arriba.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {groups.map((g) =>
              editingId === g.id ? (
                <EditRow
                  key={g.id}
                  group={g}
                  members={sortedMembers}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSave={(values) => onUpdate(g.id, values)}
                />
              ) : (
                <li
                  key={g.id}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{g.name}</p>
                    <p className="text-xs text-slate-500">
                      {g.memberCount} miembro{g.memberCount === 1 ? "" : "s"}
                      {g.headMemberName ? ` · Jefe: ${g.headMemberName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(g.id);
                        setFormError(null);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(g)}
                      disabled={busy || g.memberCount > 0}
                      title={g.memberCount > 0 ? "Reasigna los miembros antes" : undefined}
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function byName(a: FamilyGroupRow, b: FamilyGroupRow): number {
  return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
}

interface EditRowProps {
  group: FamilyGroupRow;
  members: MemberOption[];
  busy: boolean;
  onCancel: () => void;
  onSave: (values: { name: string; headMemberId: number | null }) => void | Promise<void>;
}

function EditRow({ group, members, busy, onCancel, onSave }: EditRowProps) {
  const [name, setName] = useState(group.name);
  const [headMemberId, setHeadMemberId] = useState<number | null>(group.headMemberId);
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErr("El nombre es requerido");
      return;
    }
    onSave({ name: trimmed, headMemberId });
  }

  return (
    <li className="px-5 py-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px_auto]">
        <div>
          <label htmlFor={`name-${group.id}`} className="block text-xs font-medium text-slate-700">
            Nombre
          </label>
          <input
            id={`name-${group.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label htmlFor={`head-${group.id}`} className="block text-xs font-medium text-slate-700">
            Jefe de familia
          </label>
          <select
            id={`head-${group.id}`}
            value={headMemberId ?? ""}
            onChange={(e) => setHeadMemberId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">— Opcional —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
      {err ? <p className="mt-2 text-xs text-red-600" role="alert">{err}</p> : null}
    </li>
  );
}
