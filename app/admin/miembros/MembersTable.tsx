"use client";

/**
 * Client-side table for the admin member list. Receives the initial
 * dataset from the server component and lets the admin:
 *   - search by name / membership number (debounced)
 *   - filter by family group
 *   - navigate pages
 *   - delete a member (with confirm)
 *
 * Uses Next router to keep the URL in sync (q, grupo, page) so
 * results are shareable / bookmarkable. Server actions are called
 * directly; we revalidate via the action, then router.refresh().
 */
import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { deleteMemberAction, listMembersAction } from "./actions";
import { fullName, type MemberRow } from "@/lib/member-types";

interface GroupOption {
  id: number;
  name: string;
  memberCount: number;
}

interface MembersTableProps {
  initialRows: MemberRow[];
  initialTotal: number;
  initialSearch: string;
  initialFamilyGroupId: number | null;
  pageSize: number;
  page: number;
  groups: GroupOption[];
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function MembersTable({
  initialRows,
  initialTotal,
  initialSearch,
  initialFamilyGroupId,
  pageSize,
  page: initialPage,
  groups,
}: MembersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [familyGroupId, setFamilyGroupId] = useState<number | null>(initialFamilyGroupId);
  const [rows, setRows] = useState<MemberRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const lastFiredRef = useRef({ search: initialSearch, familyGroupId: initialFamilyGroupId, page: initialPage });

  // Fire a server action whenever the debounced search / family filter changes.
  useEffect(() => {
    const next = {
      search: debouncedSearch,
      familyGroupId,
      page: 1, // reset page on filter change
    };
    if (
      next.search === lastFiredRef.current.search &&
      next.familyGroupId === lastFiredRef.current.familyGroupId &&
      next.page === lastFiredRef.current.page
    ) {
      return;
    }
    lastFiredRef.current = next;

    let cancelled = false;
    startTransition(async () => {
      const res = await listMembersAction({
        search: next.search || undefined,
        familyGroupId: next.familyGroupId,
        page: next.page,
        pageSize,
      });
      if (cancelled) return;
      if (res.ok) {
        setRows(res.rows ?? []);
        setTotal(res.total ?? 0);
        setPage(res.page ?? 1);
        // Sync the URL
        const sp = new URLSearchParams(searchParams.toString());
        if (next.search) sp.set("q", next.search);
        else sp.delete("q");
        if (next.familyGroupId != null) sp.set("grupo", String(next.familyGroupId));
        else sp.delete("grupo");
        sp.delete("page");
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    });
    return () => {
      cancelled = true;
    };
    // We intentionally don't depend on searchParams / router / pathname / startTransition
    // to avoid re-firing the effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, familyGroupId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  function goToPage(next: number) {
    const clamped = Math.max(1, Math.min(totalPages, next));
    setPage(clamped);
    const sp = new URLSearchParams(searchParams.toString());
    if (clamped === 1) sp.delete("page");
    else sp.set("page", String(clamped));
    const qs = sp.toString();
    startTransition(async () => {
      const res = await listMembersAction({
        search: debouncedSearch || undefined,
        familyGroupId,
        page: clamped,
        pageSize,
      });
      if (res.ok) {
        setRows(res.rows ?? []);
        setTotal(res.total ?? 0);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    });
  }

  async function onDelete(row: MemberRow) {
    const confirmed = window.confirm(
      `¿Eliminar a ${fullName(row)}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setDeletingId(row.id);
    setDeleteError(null);
    const res = await deleteMemberAction(row.id);
    setDeletingId(null);
    if (!res.ok) {
      setDeleteError(res.error ?? "No se pudo eliminar");
      return;
    }
    // Re-fetch the current page (or previous page if we just emptied it).
    const fallbackPage = rows.length === 1 && page > 1 ? page - 1 : page;
    const res2 = await listMembersAction({
      search: debouncedSearch || undefined,
      familyGroupId,
      page: fallbackPage,
      pageSize,
    });
    if (res2.ok) {
      setRows(res2.rows ?? []);
      setTotal(res2.total ?? 0);
      setPage(res2.page ?? 1);
      const sp = new URLSearchParams(searchParams.toString());
      if ((res2.page ?? 1) === 1) sp.delete("page");
      else sp.set("page", String(res2.page));
      router.replace(sp.toString() ? `${pathname}?${sp.toString()}` : pathname, { scroll: false });
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <label htmlFor="members-search" className="sr-only">
            Buscar miembros
          </label>
          <input
            id="members-search"
            type="search"
            inputMode="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido o número de miembro"
            className="block w-full rounded-card border border-cream-300 bg-white px-3.5 py-2.5 text-sm shadow-soft placeholder:text-ink-400 transition-colors focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="members-family" className="sr-only">
            Filtrar por grupo familiar
          </label>
          <select
            id="members-family"
            value={familyGroupId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setFamilyGroupId(v ? Number(v) : null);
            }}
            className="block w-full rounded-card border border-cream-300 bg-white px-3.5 py-2.5 text-sm shadow-soft transition-colors focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200"
          >
            <option value="">Todos los grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.memberCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      {deleteError ? (
        <div
          className="rounded-card border border-terracotta-100 bg-terracotta-50 px-3.5 py-2.5 font-sans text-sm text-terracotta-600"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}

      <div className="paper-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cream-200 text-sm">
            <thead className="bg-cream-100/60 text-left">
              <tr>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Nombre
                </th>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Número de miembro
                </th>
                <th scope="col" className="px-5 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Grupo familiar
                </th>
                <th scope="col" className="px-5 py-3 text-right font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center font-sans text-sm text-ink-500">
                    {search || familyGroupId
                      ? "Sin resultados para los filtros aplicados."
                      : "Aún no hay miembros. Crea el primero con «+ Nuevo miembro»."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-5 py-3 font-display text-base font-medium text-ink-900">
                      {fullName(r)}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-ink-500">
                      {r.membershipNumber ?? <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-ink-700">
                      {r.familyGroupName ?? <span className="italic text-ink-400">Sin grupo</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/miembros/${r.id}/editar`}
                          className="rounded-pill border border-cream-300 bg-white px-3 py-1 font-sans text-xs font-medium text-ink-700 transition-colors hover:border-sage-400 hover:bg-sage-50 hover:text-sage-700"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(r)}
                          disabled={deletingId === r.id}
                          className="rounded-pill border border-terracotta-100 bg-white px-3 py-1 font-sans text-xs font-medium text-terracotta-500 transition-colors hover:bg-terracotta-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="font-sans text-xs text-ink-500">
          Mostrando {rows.length === 0 ? 0 : (page - 1) * pageSize + 1}–
          {(page - 1) * pageSize + rows.length} de {total}.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-pill border border-cream-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-ink-700 transition-colors hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="font-sans text-xs text-ink-500">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-pill border border-cream-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-ink-700 transition-colors hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
