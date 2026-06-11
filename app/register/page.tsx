import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Únete a la plataforma comunitaria de la Rama Bloomingdale 2nd.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
      {/* Lado izquierdo — el formulario, en este caso */}
      <section className="order-2 flex items-center justify-center bg-cream-50 px-6 py-12 sm:px-10 lg:order-1">
        <div className="reveal w-full max-w-md">
          <header className="mb-8">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sage-600">
              Bienvenida
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-900">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              El primer usuario registrado será el administrador de la rama.
            </p>
          </header>

          <div className="paper-card p-7">
            <RegisterForm />
          </div>

          <p className="mt-6 text-center font-sans text-sm text-ink-500">
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="font-medium text-sage-700 underline decoration-sage-200 underline-offset-4 transition-colors hover:text-sage-800 hover:decoration-sage-400"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </section>

      {/* Lado derecho — branding + cita */}
      <aside className="relative order-1 hidden overflow-hidden bg-sage-700 text-cream-50 lg:order-2 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-sage-600/60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-gold-400/15 blur-3xl"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-50 font-display text-lg font-semibold text-sage-700"
              >
                B
              </span>
              <span className="font-display text-xl font-medium tracking-tight">
                Bloomingdale 2nd
              </span>
            </div>
            <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-sage-200">
              Rama · La Iglesia de Jesucristo
            </p>
          </div>

          <div className="reveal max-w-md">
            <p className="font-display text-2xl italic text-sage-100">
              «Así alumbre vuestra luz delante de los hombres».
            </p>
            <p className="mt-2 font-sans text-xs uppercase tracking-wider text-sage-200/70">
              — Mateo 5:16
            </p>
          </div>

          <p className="font-display text-base text-cream-50/90">
            Bienvenido a la familia.
          </p>
        </div>
      </aside>
    </div>
  );
}
