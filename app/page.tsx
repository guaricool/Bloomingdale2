import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Root route: send the user to the right place based on session state.
 *   - Authenticated → /dashboard
 *   - Otherwise    → /login
 */
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
