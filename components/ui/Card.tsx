import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Subtle elevation variant — `lift` adds more shadow on hover. */
  interactive?: boolean;
  /** Optional ribbon at the top (e.g. status badge). */
  ribbon?: ReactNode;
}

export function Card({ children, className, interactive, ribbon, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "paper-card relative overflow-hidden",
        interactive &&
          "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift hover:border-primary/50 active:scale-[0.99]",
        className,
      )}
      {...rest}
    >
      {ribbon ? (
        <div className="absolute right-4 top-4 z-10">{ribbon}</div>
      ) : null}
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("border-b border-border/50 px-6 py-5", className)}>
      {eyebrow ? (
        <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </div>
      ) : null}
      <h3 className="mt-1 font-display text-xl font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-foreground/60">{description}</p>
      ) : null}
    </div>
  );
}
