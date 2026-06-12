"use client";

/**
 * Sistema de notificaciones toast.
 *
 * Reemplaza los window.alert() del proyecto. Un toast aparece en la
 * esquina inferior, se desvanece solo a los 4s (o al hacer click en X).
 *
 * Uso:
 *   1. Envolver la app (o un subárbol) con <ToastProvider>
 *   2. En cualquier componente cliente: const toast = useToast();
 *      toast.success("Guardado"); toast.error("Algo falló");
 *
 * Tonos: success (sage), error (terracotta), info (ink).
 * Respeta prefers-reduced-motion vía las animaciones de Tailwind config.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { wrap: string; icon: ReactNode }> = {
  success: {
    wrap: "border-blue-200 bg-blue-50 text-blue-800",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="9" className="fill-blue-600/15" />
        <path
          d="M6 10.5l2.5 2.5L14 7.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    wrap: "border-red-100 bg-red-50 text-red-600",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="9" className="fill-red-500/15" />
        <path
          d="M7 7l6 6M13 7l-6 6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  info: {
    wrap: "border-slate-300 bg-slate-50 text-slate-700",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="9" className="fill-slate-900/10" />
        <path
          d="M10 9v4.5M10 6.5h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-6 sm:items-end sm:pr-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  // Pequeño delay de salida para la animación de fade-out.
  useEffect(() => {
    const t = window.setTimeout(() => setLeaving(false), 0);
    return () => window.clearTimeout(t);
  }, []);

  const styles = TONE_STYLES[item.tone];

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border px-4 py-3 shadow-lift backdrop-blur-sm transition-all duration-300",
        styles.wrap,
        leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100 animate-reveal-up",
      )}
    >
      {styles.icon}
      <p className="flex-1 font-sans text-sm font-medium leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          window.setTimeout(onDismiss, 200);
        }}
        className="shrink-0 rounded-full p-0.5 text-current/60 transition-colors hover:text-current"
        aria-label="Cerrar notificación"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M5 5l10 10M15 5L5 15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
