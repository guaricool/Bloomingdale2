import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-sans font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50 active:transition-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-slate-50 shadow-soft hover:bg-blue-700 hover:shadow-lift hover:-translate-y-0.5 focus-visible:ring-blue-400 active:translate-y-0 active:scale-[0.97] active:shadow-soft",
  secondary:
    "bg-slate-50 text-slate-900 border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-0.5 focus-visible:ring-blue-400 active:translate-y-0 active:scale-[0.97]",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-blue-400 active:scale-[0.97]",
  danger:
    "bg-red-600 text-slate-50 shadow-soft hover:bg-red-500 hover:shadow-lift hover:-translate-y-0.5 focus-visible:ring-red-400 active:translate-y-0 active:scale-[0.97] active:shadow-soft",
  subtle:
    "bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-400 active:scale-[0.97]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const spinnerSize: Record<Size, "sm" | "md"> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Cuando true, muestra un spinner y deshabilita el botón. */
  loading?: boolean;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string };

export function Button(props: ButtonProps | LinkButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    loading = false,
    ...rest
  } = props as BaseProps & Record<string, unknown>;
  const cls = clsx(base, variants[variant], sizes[size], className);

  if ("as" in props && props.as === "a") {
    const anchorRest = rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={cls} {...anchorRest}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={cls}
      {...buttonRest}
      disabled={loading || buttonRest.disabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <Spinner size={spinnerSize[size]} className="text-current" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
