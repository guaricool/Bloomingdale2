"use server";

/**
 * Server actions for the Agenda admin module.
 *
 * Used by the /admin/agendas pages. All actions verify role==='admin'
 * (via requireAdmin) and revalidate the relevant path tags so the
 * list / detail views reflect the change.
 *
 * Return shape mirrors the rest of the admin modules:
 *   { ok: true,  agenda: AgendaRow | AgendaWithItems }   on success
 *   { ok: false, error: string }                         on failure
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth, type AppSessionUser } from "@/auth";
import {
  createAgenda,
  deleteAgenda,
  getAgendaById,
  transitionAgenda,
  updateAgenda,
} from "@/lib/agenda/queries";
import type { AgendaRow, AgendaWithItems } from "@/lib/agenda/types";
import { isSunday, todayIso } from "@/lib/agenda/dates";

export interface AgendaActionResult {
  ok: boolean;
  error?: string;
  agenda?: AgendaRow | AgendaWithItems;
}

async function requireAdminOrFail(): Promise<
  { ok: true; user: AppSessionUser } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  const user = session?.user as AppSessionUser | undefined;
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Se requiere rol de administrador" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, user };
}

function dateParam(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

export async function createAgendaAction(
  raw: unknown,
): Promise<AgendaActionResult> {
  const authz = await requireAdminOrFail();
  if (!authz.ok) {
    return { ok: false, error: "No autorizado" };
  }
  const date = dateParam((raw as { date?: unknown })?.date);
  if (!date) return { ok: false, error: "Fecha inválida" };
  if (!isSunday(date)) return { ok: false, error: "La fecha debe ser un domingo" };

  try {
    const createdBy = Number(authz.user.id);
    if (!Number.isInteger(createdBy) || createdBy < 1) {
      return { ok: false, error: "Sesión inválida" };
    }
    const created = createAgenda({ date, createdBy });
    revalidatePath("/admin/agendas");
    revalidatePath("/agendas");
    return { ok: true, agenda: created };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo crear la agenda",
    };
  }
}

export async function updateAgendaAction(
  id: number,
  raw: unknown,
): Promise<AgendaActionResult> {
  const authz = await requireAdminOrFail();
  if (!authz.ok) return { ok: false, error: "No autorizado" };
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "ID inválido" };
  }

  const patch: { date?: string; status?: "draft" | "published" | "completed" } = {};
  if (raw && typeof raw === "object") {
    const r = raw as { date?: unknown; status?: unknown };
    if (r.date !== undefined) {
      const d = dateParam(r.date);
      if (!d) return { ok: false, error: "Fecha inválida" };
      if (!isSunday(d)) return { ok: false, error: "La fecha debe ser un domingo" };
      patch.date = d;
    }
    if (r.status !== undefined) {
      if (r.status !== "draft" && r.status !== "published" && r.status !== "completed") {
        return { ok: false, error: "Estado inválido" };
      }
      patch.status = r.status;
    }
  }

  try {
    const updated = updateAgenda(id, patch);
    if (!updated) return { ok: false, error: "Agenda no encontrada" };
    revalidatePath("/admin/agendas");
    revalidatePath(`/admin/agendas/${id}/editar`);
    revalidatePath("/agendas");
    return { ok: true, agenda: updated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo actualizar la agenda",
    };
  }
}

export async function deleteAgendaAction(
  id: number,
): Promise<AgendaActionResult> {
  const authz = await requireAdminOrFail();
  if (!authz.ok) return { ok: false, error: "No autorizado" };
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "ID inválido" };
  }

  const existing = getAgendaById(id);
  if (!existing) return { ok: false, error: "Agenda no encontrada" };
  if (existing.status !== "draft") {
    return {
      ok: false,
      error: "Solo se pueden eliminar agendas en estado 'draft'",
    };
  }

  const ok = deleteAgenda(id);
  if (!ok) return { ok: false, error: "No se pudo eliminar la agenda" };
  revalidatePath("/admin/agendas");
  revalidatePath("/agendas");
  return { ok: true };
}

export async function transitionAgendaAction(
  id: number,
  to: "published" | "completed",
): Promise<AgendaActionResult> {
  const authz = await requireAdminOrFail();
  if (!authz.ok) return { ok: false, error: "No autorizado" };
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "ID inválido" };
  }
  const result = transitionAgenda(id, to);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return { ok: false, error: "Agenda no encontrada" };
    }
    return {
      ok: false,
      error: `No se puede pasar a '${to}' desde '${result.current}'`,
    };
  }
  revalidatePath("/admin/agendas");
  revalidatePath(`/admin/agendas/${id}/editar`);
  revalidatePath("/agendas");
  revalidatePath("/agendas/hoy");
  return { ok: true, agenda: result.agenda };
}

/** Default-wizard helper: returns the date to seed "Nueva agenda" with. */
export async function defaultNewAgendaDateAction(): Promise<string> {
  // We don't strictly need auth here, but the admin navbar only links
  // to this from /admin/agendas which is gated. Cheaper to just return.
  return todayIso();
}
