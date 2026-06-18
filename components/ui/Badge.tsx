import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "sage" | "amber" | "rose" | "ink" | "gold";

const tones: Record<Tone, string> = {
  sage: "bg-primary/15 text-primary border-primary/20",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  rose: "bg-terracotta-500/15 text-terracotta-600 dark:text-terracotta-400 border-terracotta-500/20",
  ink: "bg-foreground/5 text-foreground/80 border-foreground/10",
  gold: "bg-gold-500/15 text-gold-600 dark:text-gold-400 border-gold-500/30",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "sage", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 font-sans text-[0.7rem] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
