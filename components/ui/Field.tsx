import { clsx } from "clsx";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block font-sans text-sm font-medium text-slate-700"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="font-sans text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="font-sans text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "block w-full rounded-card border border-slate-300 bg-white px-3.5 py-2.5 font-sans text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(inputBase, "min-h-[88px]", className)} {...rest} />;
}

export function Select({
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(inputBase, "pr-9", className)} {...rest} />;
}
