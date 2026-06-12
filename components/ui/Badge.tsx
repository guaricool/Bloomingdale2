import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "sage" | "amber" | "rose" | "ink" | "gold";

const tones: Record<Tone, string> = {
  sage: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  rose: "bg-red-50 text-red-600 border-red-100",
  ink: "bg-slate-900/5 text-slate-700 border-slate-900/10",
  gold: "bg-sky-400/15 text-sky-500 border-sky-400/30",
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
