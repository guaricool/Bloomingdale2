/**
 * Spinner — indicador de carga circular.
 *
 * Usa los colores de marca (sage) y respeta prefers-reduced-motion vía
 * la regla global en globals.css. El tamaño hereda del contexto o se
 * controla con la prop `size`.
 *
 * Uso típico: dentro de un botón mientras una server action está pendiente,
 * o como placeholder mientras carga contenido.
 */
import { clsx } from "clsx";

type SpinnerSize = "sm" | "md" | "lg";

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
};

interface SpinnerProps {
  size?: SpinnerSize;
  /** Color del anillo. Default hereda currentColor para usarse dentro de botones. */
  className?: string;
  /** Texto para lectores de pantalla. */
  label?: string;
}

export function Spinner({ size = "md", className, label = "Cargando" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={clsx(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeMap[size],
        className,
      )}
    >
      <span className="sr-only">{label}…</span>
    </span>
  );
}
