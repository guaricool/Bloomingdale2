import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "sage" | "amber" | "rose" | "ink" | "gold";

const tones: Record<Tone, string> = {
  sage: "bg-sage-50 text-sage-700 border-sage-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  rose: "bg-terracotta-50 text-terracotta-600 border-terracotta-100",
  ink: "bg-ink-900/5 text-ink-700 border-ink-900/10",
  gold: "bg-gold-400/15 text-gold-500 border-gold-400/30",
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
