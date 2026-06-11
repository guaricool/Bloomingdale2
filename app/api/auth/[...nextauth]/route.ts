/**
 * NextAuth v5 catch-all route. Re-exports the GET/POST handlers from `auth.ts`.
 * The actual config lives in /auth.ts at the repo root.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
