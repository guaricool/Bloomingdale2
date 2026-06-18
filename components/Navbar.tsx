"use client";

/**
 * SiteHeader — the main navigation bar.
 *
 * Replaces the old flat Navbar with a piece that actually has character:
 *   - Wordmark in Fraunces (the project's display serif)
 *   - Active state uses a sage underline (not a tinted pill)
 *   - Subtle "branch" tag under the wordmark
 *   - Sticky with a soft warm border on scroll
 *
 * No tracking pixels, no flashy logos — the page is the product.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import clsx from "clsx";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: "admin" | "member";
  };
}

const baseLinks = [
  { href: "/", label: "Inicio" },
  { href: "/domingo", label: "Programa" },
  { href: "/inicio", label: "Panel" },
  { href: "/miembros", label: "Miembros" },
  { href: "/agendas", label: "Agendas" },
  { href: "/eventos", label: "Eventos" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const adminLinks =
    user.role === "admin"
      ? [
          {
            href: "/admin/miembros",
            label: "Administrar",
            match: (p: string) => p.startsWith("/admin/") && p !== "/admin/qr" && p !== "/admin/anuncios",
          },
          {
            href: "/admin/anuncios",
            label: "Anuncios",
            match: (p: string) => p.startsWith("/admin/anuncios"),
          },
          {
            href: "/admin/qr",
            label: "Códigos QR",
          },
        ]
      : [];

  const links = [...baseLinks, ...adminLinks];

  function isActive(link: { href: string; match?: (p: string) => boolean }): boolean {
    if (link.match) return link.match(pathname);
    if (link.href === "/") return pathname === "/";
    return pathname === link.href || pathname.startsWith(link.href + "/");
  }

  const displayName = user.name ?? user.email?.split("@")[0] ?? "Miembro";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-background/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="group flex items-end gap-3 leading-none">
          {/* Pequeño sello decorativo — la inicial "B" en un círculo de color sage */}
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-celestial-600 font-display text-base font-semibold text-canvas-50 shadow-soft transition-transform group-hover:scale-105"
          >
            B
          </span>
          <span className="flex flex-col">
            <span className="font-display text-lg font-medium tracking-tight text-charcoal-900">
              Bloomingdale 2nd
            </span>
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-charcoal-500">
              Rama · La Iglesia de Jesucristo
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative rounded-md px-3 py-1.5 font-sans text-sm font-medium transition-colors",
                  active
                    ? "text-celestial-700"
                    : "text-charcoal-700 hover:text-charcoal-900",
                )}
              >
                {link.label}
                <span
                  aria-hidden
                  className={clsx(
                    "absolute inset-x-3 -bottom-0.5 h-[2px] origin-left rounded-full bg-celestial-600 transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="font-sans text-sm font-medium text-charcoal-900">
              {displayName}
            </div>
            <div className="font-sans text-[0.7rem] uppercase tracking-wider text-charcoal-500">
              {user.role === "admin" ? "Administrador" : "Miembro"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-pill border border-canvas-300 bg-white px-3.5 py-1.5 font-sans text-xs font-medium text-charcoal-700 transition-colors hover:border-celestial-400 hover:bg-celestial-50 hover:text-celestial-700"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Mobile nav — scroll horizontal con borde inferior sage */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-canvas-200/60 px-4 py-2 md:hidden"
        aria-label="Navegación móvil"
      >
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.href + link.label + "m"}
              href={link.href}
              className={clsx(
                "shrink-0 rounded-md px-3 py-1.5 font-sans text-sm font-medium",
                active
                  ? "bg-celestial-100 text-celestial-700"
                  : "text-charcoal-700 hover:bg-canvas-100",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
