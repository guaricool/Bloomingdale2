import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Navbar } from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Bloomingdale 2 — Plataforma comunitaria",
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
      <body className="min-h-full antialiased">
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
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
              <div className="mx-auto max-w-6xl px-4">
                Bloomingdale 2 &middot; Plataforma comunitaria &middot; Rama local
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
