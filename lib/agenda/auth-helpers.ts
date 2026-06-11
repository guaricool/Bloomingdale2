/**
 * Auth helpers for API routes.
 *
 * Re-export the shared `requireUser` / `requireAdmin` from `lib/api-guard.ts`
 * (owned by the foundation) but shaped as `{ok, user}` so we can read the
 * full session (role, memberId, etc.) without a second `auth()` call.
 */
import { NextResponse } from "next/server";
import { auth, type AppSessionUser } from "@/auth";

export type AuthOutcome =
  | { ok: true; user: AppSessionUser }
  | { ok: false; response: NextResponse };

/** Any authenticated user. */
export async function requireSession(): Promise<AuthOutcome> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  return { ok: true, user: session.user as AppSessionUser };
}

/** Admin role required. */
export async function requireAdmin(): Promise<AuthOutcome> {
  const outcome = await requireSession();
  if (!outcome.ok) return outcome;
  if (outcome.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Se requiere rol de administrador" },
        { status: 403 },
      ),
    };
  }
  return outcome;
}
