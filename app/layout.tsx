import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Navbar } from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: {
    template: "%s · Bloomingdale 2",
    default: "Bloomingdale 2 — Plataforma comunitaria",
  },
  description:
    "Plataforma comunitaria para la Rama Bloomingdale 2 de La Iglesia de Jesucristo de los Santos de los Últimos Días",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es-MX">
      <body className="min-h-full font-sans antialiased">
        <SessionProvider session={session}>
          <div className="flex min-h-screen flex-col">
            {session?.user ? (
              <Navbar
                user={{
                  name: session.user.name ?? null,
                  email: session.user.email ?? null,
                  role: session.user.role,
                }}
              />
            ) : null}
            <main className="flex-1">{children}</main>
            <footer className="mt-16 border-t border-cream-200 bg-cream-50/60">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
                <p className="font-sans text-xs text-ink-500">
                  Bloomingdale 2 · Plataforma comunitaria · Rama local
                </p>
                <p className="font-display text-xs italic text-ink-400">
                  «Sed uno; y si no sois uno, no sois míos». — Mosiah 18:21
                </p>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
