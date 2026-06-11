import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta — Bloomingdale 2",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">
          El primer usuario registrado será el administrador de la rama.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
