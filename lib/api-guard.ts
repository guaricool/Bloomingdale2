/**
 * API guard helpers — used by route handlers to enforce auth/admin.
 *
 * Kept in /lib (not /app/api) so it's clearly utility code, not a route.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse };

/** Require any authenticated user. Returns the userId (number) on success. */
export async function requireUser(): Promise<GuardResult<number>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sesión inválida" }, { status: 401 }),
    };
  }
  return { ok: true, value: userId };
}

/** Require `role === 'admin'`. */
export async function requireAdmin(): Promise<GuardResult<number>> {
  const guard = await requireUser();
  if (!guard.ok) return guard;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Se requiere rol de administrador" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, value: guard.value };
}
