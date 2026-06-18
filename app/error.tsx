"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí se podría enviar el error a Sentry u otro servicio
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold text-charcoal-900">
          Algo salió mal
        </h2>
        <p className="max-w-md text-charcoal-500">
          Ocurrió un error inesperado al intentar cargar esta página.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="primary">
          Intentar de nuevo
        </Button>
        <Button as="a" href="/" variant="secondary">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
