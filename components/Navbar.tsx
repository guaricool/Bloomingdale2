"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: "admin" | "member";
  };
}

const baseLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/miembros", label: "Miembros" },
  { href: "/agendas", label: "Agendas" },
  { href: "/eventos", label: "Eventos" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  // The admin-only link goes to the members admin page (the first thing
  // admins usually need). For consistency with the spec ("Admin → Miembros"),
  // we also mark the path so the link stays "active" on any /admin/* page.
  const adminLinks =
    user.role === "admin"
      ? [
          {
            href: "/admin/miembros",
            label: "Admin · Miembros",
            match: (p: string) => p === "/admin/miembros" || p.startsWith("/admin/miembros/"),
          },
          {
            href: "/admin/grupos-familiares",
            label: "Admin · Grupos",
            match: (p: string) => p === "/admin/grupos-familiares" || p.startsWith("/admin/grupos-familiares/"),
          },
        ]
      : [];

  const links = [...baseLinks, ...adminLinks];

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-full bg-brand-500" aria-hidden />
            <span className="text-lg font-semibold text-slate-900">Bloomingdale 2</span>
          </Link>
          <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Navegación principal">
            {links.map((link) => {
              const isActive = "match" in link && typeof link.match === "function"
                ? link.match(pathname)
                : pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-slate-900">{user.name ?? user.email}</div>
            <div className="text-xs text-slate-500">
              {user.role === "admin" ? "Administrador" : "Miembro"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-4 py-2 md:hidden" aria-label="Navegación móvil">
        {links.map((link) => {
          const isActive = "match" in link && typeof link.match === "function"
            ? link.match(pathname)
            : pathname === link.href;
          return (
            <Link
              key={link.href + link.label + "m"}
              href={link.href}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
