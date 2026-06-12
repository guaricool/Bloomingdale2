"use client";

/**
 * Shared member form (create + edit). Built with react-hook-form +
 * @hookform/resolvers/zod. The same zod schema used by the server
 * actions is reused here so error messages stay consistent in
 * Spanish.
 *
 * Focus management: the first invalid field is auto-focused on submit.
 * All inputs are labeled (explicit htmlFor), and the membership-number
 * field has an `inputMode="numeric"` hint for mobile keyboards.
 */
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  memberCreateSchema,
  memberUpdateSchema,
  type MemberCreateInput,
  type MemberUpdateInput,
} from "@/lib/validators/member";
import { createMemberAction, updateMemberAction } from "./actions";

interface GroupOption {
  id: number;
  name: string;
}

interface MemberFormProps {
  mode: "create" | "edit";
  groups: GroupOption[];
  initial?: {
    id: number;
    firstName: string;
    lastName: string;
    membershipNumber: string;
    familyGroupId: number | null;
  };
}

type FormValues = {
  firstName: string;
  lastName: string;
  membershipNumber: string;
  familyGroupId: number | null;
};

export function MemberForm({ mode, groups, initial }: MemberFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  const defaultValues: FormValues = {
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    membershipNumber: initial?.membershipNumber ?? "",
    familyGroupId: initial?.familyGroupId ?? null,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<FormValues>({
    resolver: zodResolver(
      // We use the create schema for both modes because both have the
      // same field set; the update schema only adds `id`. We pass id
      // through on submit.
      memberCreateSchema.transform(() => undefined) as never,
    ) as never,
    defaultValues,
    mode: "onBlur",
  });

  // Use the proper zod schema directly to validate the values on submit.
  // react-hook-form's resolver doesn't easily support two schemas for
  // the same form, so we keep its role light (basic required checks)
  // and do the strict validation server-side; the server returns
  // field-level errors which we then paint.
  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      firstName: values.firstName,
      lastName: values.lastName,
      membershipNumber: values.membershipNumber,
      familyGroupId: values.familyGroupId,
    };
    if (mode === "edit" && initial) {
      payload.id = initial.id;
    }

    const schema = mode === "edit" ? memberUpdateSchema : memberCreateSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "_form";
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      // Focus the first invalid field
      const order = ["firstName", "lastName", "membershipNumber", "familyGroupId"];
      const first = order.find((k) => errs[k]);
      if (first) setFocus(first as keyof FormValues);
      return;
    }

    const res = mode === "edit"
      ? await updateMemberAction(parsed.data)
      : await createMemberAction(parsed.data);

    if (!res.ok) {
      setSubmitError(res.error ?? "No se pudo guardar");
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
        const order = ["firstName", "lastName", "membershipNumber", "familyGroupId"];
        const first = order.find((k) => res.fieldErrors?.[k]);
        if (first) setFocus(first as keyof FormValues);
      }
      return;
    }

    if (mode === "create" && res.member) {
      router.push(`/admin/miembros/${res.member.id}/editar?created=1`);
      router.refresh();
    } else {
      router.refresh();
    }
  });

  // Focus the first field on mount (a11y)
  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  function err(name: string): string | undefined {
    return errors[name as keyof FormValues]?.message ?? fieldErrors[name];
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
            Nombre <span className="text-red-600">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            required
            {...register("firstName")}
            ref={(el) => {
              register("firstName").ref(el);
              firstNameRef.current = el;
            }}
            aria-invalid={Boolean(err("firstName"))}
            aria-describedby={err("firstName") ? "firstName-err" : undefined}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid=true]:border-red-400"
          />
          {err("firstName") ? (
            <p id="firstName-err" className="mt-1 text-xs text-red-600">
              {err("firstName")}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
            Apellido <span className="text-red-600">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            required
            {...register("lastName")}
            aria-invalid={Boolean(err("lastName"))}
            aria-describedby={err("lastName") ? "lastName-err" : undefined}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid=true]:border-red-400"
          />
          {err("lastName") ? (
            <p id="lastName-err" className="mt-1 text-xs text-red-600">
              {err("lastName")}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="membershipNumber" className="block text-sm font-medium text-slate-700">
          Número de miembro
        </label>
        <input
          id="membershipNumber"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          {...register("membershipNumber")}
          aria-invalid={Boolean(err("membershipNumber"))}
          aria-describedby={err("membershipNumber") ? "membershipNumber-err" : "membershipNumber-help"}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid=true]:border-red-400"
          placeholder="Solo dígitos, opcional"
        />
        {err("membershipNumber") ? (
          <p id="membershipNumber-err" className="mt-1 text-xs text-red-600">
            {err("membershipNumber")}
          </p>
        ) : (
          <p id="membershipNumber-help" className="mt-1 text-xs text-slate-500">
            Opcional. Solo dígitos. Se maneja como dato personal.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="familyGroupId" className="block text-sm font-medium text-slate-700">
          Grupo familiar
        </label>
        <select
          id="familyGroupId"
          {...register("familyGroupId", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Sin grupo —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {err("familyGroupId") ? (
          <p className="mt-1 text-xs text-red-600">{err("familyGroupId")}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Crea o edita los grupos en la página de{" "}
            <a className="text-blue-700 underline" href="/admin/grupos-familiares">
              grupos familiares
            </a>
            .
          </p>
        )}
      </div>

      {submitError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <a
          href="/admin/miembros"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Guardando..."
            : mode === "create"
              ? "Crear miembro"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
