/**
 * Empty state — SVG icon + headline + helper text.
 *
 * Reusable across the app so the visual rhythm stays consistent. The
 * icon strokes are intentionally thin (1.5px) and tinted with the
 * brand's ink/sage palette, not pure gray — keeps the editorial feel.
 */
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden
          className={clsx(
            "mb-4 flex items-center justify-center rounded-full bg-sage-50 text-sage-600",
            size === "sm" ? "h-12 w-12" : "h-16 w-16",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3
        className={clsx(
          "font-display font-medium text-ink-900",
          size === "sm" ? "text-base" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={clsx(
            "mt-1.5 max-w-sm font-sans text-ink-500",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// --- Iconos SVG inline (sin librería externa, stroke 1.5, currentColor) ---

export function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconFeed({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 6h16M4 12h12M4 18h8" />
    </svg>
  );
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14.5 20c0-2 1.5-4 4-4s3 1.5 3 3" />
    </svg>
  );
}

export function IconEvents({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2l2.5 6 6.5.5-5 4.5 1.5 6.5L12 16l-5.5 3.5L8 13l-5-4.5 6.5-.5L12 2z" />
    </svg>
  );
}

export function IconHymn({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function IconSparkle({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </svg>
  );
}
