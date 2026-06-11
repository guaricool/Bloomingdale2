/**
 * Edge-safe NextAuth config. NO database access here — only the parts the
 * middleware and Edge runtime need (page redirects, basic session shape).
 *
 * The full config (with Credentials provider + DB access) lives in /auth.ts
 * and is used by server components and API routes. See Auth.js v5 docs:
 * https://authjs.dev/guides/edge-compatibility
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Auth.js v5 reads AUTH_SECRET automatically; NEXTAUTH_SECRET is a fallback for v4
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // Providers live in /auth.ts (Node runtime) — don't add any here.
  providers: [],
  callbacks: {
    // Edge-safe: only inspects the JWT (no DB)
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname === "/dashboard" ||
        nextUrl.pathname.startsWith("/dashboard/") ||
        nextUrl.pathname === "/miembros" ||
        nextUrl.pathname.startsWith("/miembros/") ||
        nextUrl.pathname === "/agendas" ||
        nextUrl.pathname.startsWith("/agendas/") ||
        nextUrl.pathname === "/eventos" ||
        nextUrl.pathname.startsWith("/eventos/") ||
        nextUrl.pathname === "/admin" ||
        nextUrl.pathname.startsWith("/admin/");
      if (isProtected) {
        return isLoggedIn;
      }
      return true;
    },
  },
};
