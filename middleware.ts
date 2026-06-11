/**
 * NextAuth v5 middleware. Uses the Edge-safe /auth.config.ts (no DB imports)
 * so the middleware bundle stays Edge-compatible. The protected-prefix list
 * is duplicated here for clarity; the canonical `authorized` callback lives
 * in /auth.config.ts.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/miembros",
  "/agendas",
  "/eventos",
  "/admin",
];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return;
  if (req.auth) return;

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
  return Response.redirect(url);
});

export const config = {
  // Match everything except Next internals, API auth (so login POSTs through), and static
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
