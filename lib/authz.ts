/**
 * Auth helpers shared by server actions, API routes, and pages.
 *
 * Wraps NextAuth's `auth()` to provide a single `requireAdmin()` check
 * that throws when the caller is not an admin, and a softer `isAdmin()`
 * that returns a boolean. Pages use `requireAdminForPage()` which
 * redirects to /dashboard on failure (no leaked 403 page).
 */
import { redirect } from "next/navigation";
import { auth, type AppSessionUser } from "@/auth";

export type { AppSessionUser };

/** Return the current session user, or null if not signed in. */
export async function currentUser(): Promise<AppSessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as AppSessionUser;
}

/** Return true if the caller is an admin. */
export async function isAdmin(): Promise<boolean> {
  const u = await currentUser();
  return u?.role === "admin";
}

/**
 * Require admin role for a server action or API route. Throws an
 * Error with a `status` field so callers can map it to a 403 response.
 */
export class AuthzError extends Error {
  status: number;
  constructor(message = "No autorizado", status = 403) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

export async function requireAdmin(): Promise<AppSessionUser> {
  const u = await currentUser();
  if (!u) throw new AuthzError("No has iniciado sesión", 401);
  if (u.role !== "admin") throw new AuthzError("Se requiere rol de administrador", 403);
  return u;
}

/**
 * Page-level admin guard. Redirects to /login if not signed in, or to
 * /dashboard with a friendly message if signed in but not admin. We
 * don't expose the 403 directly in pages to keep the UX simple — the
 * user already knows their role from the navbar badge.
 */
export async function requireAdminForPage(): Promise<AppSessionUser> {
  const u = await currentUser();
  if (!u) redirect("/login?callbackUrl=%2Fadmin%2Fmiembros");
  if (u.role !== "admin") redirect("/dashboard?forbidden=admin");
  return u;
}

/**
 * Page-level "must be signed in" guard. Redirects to /login if the
 * visitor is anonymous. Used by member-facing pages (agenda view,
 * member dashboard, etc.) where any authenticated user can read.
 */
export async function requireSessionForPage(): Promise<AppSessionUser> {
  const u = await currentUser();
  if (!u) redirect("/login?callbackUrl=%2Fagendas");
  return u;
}
