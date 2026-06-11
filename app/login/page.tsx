import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión — Bloomingdale 2",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accede a la plataforma comunitaria de la Rama Bloomingdale 2
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Aún no tienes cuenta?{" "}
        <a href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Regístrate
        </a>
      </p>
    </div>
  );
}
