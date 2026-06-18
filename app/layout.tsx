import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: {
    template: "%s · Bloomingdale 2nd",
    default: "Bloomingdale 2nd — Plataforma comunitaria",
  },
  description:
    "Plataforma comunitaria para la Rama Bloomingdale 2nd de La Iglesia de Jesucristo de los Santos de los Últimos Días",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es-MX">
      <body className="paper-grain min-h-full font-sans antialiased bg-transparent">
        {/* Fondo Global con animación suave y overlay para asegurar la legibilidad */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background">
          <div className="temple-bg absolute inset-0 opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95 dark:from-background/98 dark:via-background/90 dark:to-background/98 backdrop-blur-[2px]" />
        </div>
        <SessionProvider session={session}>
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              {session?.user ? (
                <Navbar
                  user={{
                    name: session.user.name ?? null,
                    email: session.user.email ?? null,
                    role: session.user.role,
                  }}
                />
              ) : (
                <PublicHeader />
              )}
              <main className="flex-1">{children}</main>
              <footer className="mt-16 border-t border-border bg-card/40 backdrop-blur-md">
                <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-8 sm:flex-row">
                  <p className="font-sans text-xs text-charcoal-500">
                    Bloomingdale 2nd · Plataforma comunitaria · Rama local
                  </p>
                  <p className="font-display text-xs italic text-charcoal-400">
                    «Sed uno; y si no sois uno, no sois míos». — Mosiah 18:21
                  </p>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="group flex items-end gap-3 leading-none">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-display text-base font-semibold text-slate-50 shadow-soft transition-transform group-hover:scale-105"
          >
            B
          </span>
          <span className="flex flex-col">
            <span className="font-display text-lg font-medium tracking-tight text-slate-900">
              Bloomingdale 2nd
            </span>
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
              Rama · La Iglesia de Jesucristo
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button as="a" href="/domingo" variant="ghost" size="sm">
            Boletín Dominical
          </Button>
          <Button as="a" href="/login" variant="primary" size="sm">
            Iniciar sesión
          </Button>
          <Button as="a" href="/register" variant="secondary" size="sm">
            Crear cuenta
          </Button>
        </div>
      </div>
    </header>
  );
}
