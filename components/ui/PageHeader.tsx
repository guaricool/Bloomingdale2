import { clsx } from "clsx";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={clsx("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-celestial-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-charcoal-900 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-charcoal-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
