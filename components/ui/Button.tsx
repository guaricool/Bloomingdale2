import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-sans font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_2px_12px_hsla(var(--primary),0.3)] hover:opacity-90 hover:shadow-[0_4px_16px_hsla(var(--primary),0.5)] focus-visible:ring-primary active:scale-[0.98]",
  secondary:
    "bg-card text-card-foreground border border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:ring-primary backdrop-blur-sm",
  ghost:
    "text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-primary",
  danger:
    "bg-terracotta-600 text-white shadow-soft hover:bg-terracotta-500 focus-visible:ring-terracotta-400 active:scale-[0.98]",
  subtle:
    "bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary",
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
