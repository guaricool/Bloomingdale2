"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName]   = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [jurisdiction, setJurisdiction] = useState("rama");
  const [error, setError]           = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          middleName: middleName.trim() || null,
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          jurisdiction,
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo crear la cuenta.");
        return;
      }

      // Cuenta creada — intentar auto-login
      const signin = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (!signin?.error) {
        router.push("/");
        router.refresh();
        return;
      }

      // Auto-login falló — mostrar pantalla de éxito con link al login
      setRegistered(true);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        </div>
        <div>
          <p className="font-display text-xl font-medium text-slate-900">¡Cuenta creada!</p>
          <p className="mt-1 font-sans text-sm text-slate-500">
            Ya puedes iniciar sesión con tu correo y contraseña.
          </p>
        </div>
        <Button as="a" href="/login" variant="primary" size="lg" className="w-full">
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Nombres */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Primer nombre" htmlFor="firstName" required>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Primer nombre"
          />
        </Field>
        <Field label="Segundo nombre" htmlFor="middleName" hint="Opcional">
          <Input
            id="middleName"
            name="middleName"
            type="text"
            autoComplete="additional-name"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Segundo nombre"
          />
        </Field>
      </div>

      <Field label="Apellido" htmlFor="lastName" required>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Apellido"
        />
      </Field>

      <Field label="Correo electrónico" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hermano@ejemplo.com"
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Field label="Confirmar contraseña" htmlFor="confirm" required>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <Field label="Jurisdicción (Para Administradores)" htmlFor="jurisdiction" required>
        <select
          id="jurisdiction"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="block w-full rounded-md border-slate-300 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="rama">Rama</option>
          <option value="estaca">Estaca</option>
          <option value="barrio">Barrio</option>
        </select>
      </Field>

      {error ? (
        <div
          className="rounded-card border border-red-100 bg-red-50 px-3.5 py-2.5 font-sans text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-center font-sans text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
