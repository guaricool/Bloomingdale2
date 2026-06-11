import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-sans font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-sage-600 text-cream-50 shadow-soft hover:bg-sage-700 hover:shadow-lift focus-visible:ring-sage-400 active:scale-[0.98]",
  secondary:
    "bg-cream-50 text-ink-900 border border-cream-300 hover:border-sage-400 hover:bg-sage-50 hover:text-sage-700 focus-visible:ring-sage-400",
  ghost:
    "text-ink-700 hover:bg-cream-100 hover:text-ink-900 focus-visible:ring-sage-400",
  danger:
    "bg-terracotta-600 text-cream-50 shadow-soft hover:bg-terracotta-500 focus-visible:ring-terracotta-400 active:scale-[0.98]",
  subtle:
    "bg-sage-50 text-sage-700 hover:bg-sage-100 focus-visible:ring-sage-400",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
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
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
