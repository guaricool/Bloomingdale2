"use client";

/**
 * Modal genérico — backdrop, focus trap básico, ESC para cerrar.
 * Usado para abrir la agenda completa del domingo desde el sidebar.
 */
import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  /** Optional footer (e.g. close button). */
  footer?: React.ReactNode;
  /** Max width class. Default: max-w-2xl. */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, eyebrow, children, footer, size = "lg" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    queueMicrotask(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`paper-card mx-4 w-full ${sizeClass[size]} my-8 max-h-[88vh] animate-reveal-up overflow-y-auto`}
      >
        {(title || eyebrow) ? (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/95 px-6 py-4 backdrop-blur">
            <div>
              {eyebrow ? (
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-600">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-slate-900">
                  {title}
                </h2>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full font-sans text-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
