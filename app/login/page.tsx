import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a la plataforma comunitaria de la Rama Bloomingdale 2nd.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-[calc(100vh-0px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Lado izquierdo — invitación visual con identidad de la rama */}
      <aside className="relative hidden overflow-hidden bg-blue-700 text-slate-50 lg:block">
        {/* Decoración: un sello circular grande que se difumina */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-blue-600/60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-400/15 blur-3xl"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 font-display text-lg font-semibold text-blue-700"
              >
                B
              </span>
              <span className="font-display text-xl font-medium tracking-tight">
                Bloomingdale 2nd
              </span>
            </div>
            <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-blue-200">
              Rama · La Iglesia de Jesucristo
            </p>
          </div>

          <div className="reveal max-w-md">
            <div className="divider-leaf mb-6 text-blue-200/70">
              <span className="font-display italic text-blue-100">«Hagamos todo</span>
            </div>
            <p className="font-display text-2xl italic leading-snug text-blue-100">
              «Hagamos todo lo que el Señor nos ha mandado».
            </p>
            <p className="mt-2 font-sans text-xs uppercase tracking-wider text-blue-200/70">
              — 1 Nefi 3:7
            </p>
            <div className="divider-leaf mt-6 text-blue-200/70">
              <span className="font-display italic text-blue-100">lo que Él nos ha mandado».</span>
            </div>
          </div>

          <div className="space-y-1 text-sm text-blue-100/80">
            <p className="font-display text-base text-slate-50">
              Bienvenido a casa.
            </p>
            <p>
              Aquí encontrarás las agendas dominicales, los himnos, los miembros
              de la rama y mucho más.
            </p>
          </div>
        </div>
      </aside>

      {/* Lado derecho — el formulario */}
      <section className="flex items-center justify-center bg-slate-50 px-6 py-12 sm:px-10">
        <div className="reveal w-full max-w-md">
          <header className="mb-8">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blue-600">
              Acceso
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-slate-900">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Accede con tu correo registrado en la rama.
            </p>
          </header>

          <div className="paper-card p-7">
            <LoginForm />
          </div>

          <p className="mt-6 text-center font-sans text-sm text-slate-500">
            ¿Aún no tienes cuenta?{" "}
            <a
              href="/register"
              className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-400"
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
