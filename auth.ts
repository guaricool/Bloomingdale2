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
      calling?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "admin" | "member";
    memberId?: number | null;
    calling?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "member";
    memberId?: number | null;
    calling?: string | null;
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

        const { prisma } = await import("@/lib/db");
        const row = await prisma.user.findFirst({
          where: {
            email: {
              equals: email.toLowerCase(),
              mode: 'insensitive'
            }
          },
          include: {
            member: {
              include: { callings: true }
            }
          }
        });

        if (!row) {
          // Constant-time-ish: still run bcrypt to avoid trivial timing oracle.
          await bcrypt.compare(
            password,
            "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali",
          );
          return null;
        }

        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        // NextAuth's User.id is typed as string; we encode our int as string here
        // and let appUserIdToNumber() decode it on the consuming side.
        let name = null;
        let calling = null;
        if (row.member) {
          name = [row.member.firstName, row.member.lastName].filter(Boolean).join(" ");
          if (row.member.callings && row.member.callings.length > 0) {
            calling = row.member.callings[0].title;
          }
        }

        return {
          id: String(row.id),
          email: row.email,
          name: name,
          calling: calling,
          role: row.role as "admin" | "member",
          memberId: row.memberId,
        };
      },
    }),
  ],
  callbacks: {
    ...baseConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: "admin" | "member"; memberId?: number | null; calling?: string | null; name?: string | null };
        token.role = u.role ?? "member";
        token.memberId = u.memberId ?? null;
        token.calling = u.calling ?? null;
        if (u.name) token.name = u.name;
      }

      if (!token.name && token.email) {
        const { prisma } = await import("@/lib/db");
        const row = await prisma.user.findFirst({
          where: { email: { equals: token.email, mode: 'insensitive' } },
          include: { member: { include: { callings: true } } }
        });
        if (row && row.member) {
          token.name = [row.member.firstName, row.member.lastName].filter(Boolean).join(" ");
          if (row.member.callings && row.member.callings.length > 0) {
            token.calling = row.member.callings[0].title;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = (token.role as "admin" | "member" | undefined) ?? "member";
        session.user.memberId = (token.memberId as number | null | undefined) ?? null;
        session.user.calling = (token.calling as string | null | undefined) ?? null;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
