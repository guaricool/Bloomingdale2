/**
 * Auth.js (NextAuth v5) — full config for server components, server actions
 * and API routes. Extends the Edge-safe authConfig in /auth.config.ts and
 * adds the Credentials provider (which needs Node-only `better-sqlite3`).
 *
 * Strategy:
 *   - Credentials provider against our SQLite User table
 *   - JWT sessions (no DB session adapter needed for v0.1)
 *   - Enrich the JWT/session with `role` and `memberId` for role-based UI
 *
 * Conventions:
 *   - The first user registered via /api/register becomes role=admin.
 *     Subsequent users default to role=member. Admin promotion happens in-app.
 *   - Passwords are hashed with bcryptjs (pure JS — portable on Windows).
 *   - AUTH_SECRET / NEXTAUTH_SECRET is required at runtime.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authConfig as baseConfig } from "@/auth.config";

// --- Type augmentations: stick to the v5-idiomatic string id for User.id,
//     but add `role` and `memberId` for our app. Our numeric DB id is encoded
//     as a string in the JWT (NextAuth convention) and decoded on demand.

declare module "@auth/core/types" {
  interface Session {
    user: {
      role: "admin" | "member";
      memberId: number | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "admin" | "member";
    memberId?: number | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "member";
    memberId?: number | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

interface UserRow {
  id: number;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
  memberId: number | null;
}

/**
 * Our augmented session user — adds role + memberId on top of NextAuth's defaults.
 * `id` stays a string per NextAuth v5 convention (we encode our DB int as string).
 */
export type AppSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: "admin" | "member";
  memberId: number | null;
};

/** Helper: parse the string id back to a number for DB lookups. */
export function appUserIdToNumber(user: AppSessionUser | null | undefined): number | null {
  if (!user?.id) return null;
  const n = Number(user.id);
  return Number.isFinite(n) ? n : null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...baseConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const db = getDb();
        const row = (await db
          .prepare(
            `SELECT u.id, u.email, u.passwordHash AS "passwordHash", u.role, u.memberId AS "memberId",
                    m.firstName AS "firstName", m.middleName AS "middleName", m.lastName AS "lastName"
             FROM "User" u
             LEFT JOIN "Member" m ON m.id = u.memberId
             WHERE u.email = ?`,
          )
          .get(email.toLowerCase())) as UserRow & {
            firstName?: string | null;
            middleName?: string | null;
            lastName?: string | null;
          } | undefined;

        if (!row) {
          await bcrypt.compare(
            password,
            "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali",
          );
          return null;
        }

        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        // Construir nombre completo desde el Member vinculado
        const nameParts = [row.firstName, row.middleName, row.lastName].filter(Boolean);
        const fullName = nameParts.length > 0 ? nameParts.join(" ") : null;

        return {
          id: String(row.id),
          email: row.email,
          name: fullName,
          role: row.role,
          memberId: row.memberId,
        };
      },
    }),
  ],
  callbacks: {
    ...baseConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: "admin" | "member"; memberId?: number | null };
        token.role = u.role ?? "member";
        token.memberId = u.memberId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // token.sub es el user.id que guardamos como String(row.id) en authorize()
        if (token.sub) session.user.id = token.sub;
        session.user.role = (token.role as "admin" | "member" | undefined) ?? "member";
        session.user.memberId = (token.memberId as number | null | undefined) ?? null;
      }
      return session;
    },
  },
});
