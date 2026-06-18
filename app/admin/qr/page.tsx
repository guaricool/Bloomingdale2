"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QrCodesPage() {
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  if (!baseUrl) {
    return null; // Evitar hidratación mismatch
  }

  const urlHome = `${baseUrl}/`;
  const urlAgenda = `${baseUrl}/domingo`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10 text-center">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-celestial-600">
          Compartir
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-charcoal-900">
          Códigos QR
        </h1>
        <p className="mt-3 font-sans text-sm text-charcoal-500">
          Descarga o muestra estos códigos QR para que los miembros puedan acceder rápidamente.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* QR Principal */}
        <div className="paper-card flex flex-col items-center p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-medium text-charcoal-900">
            Plataforma Completa
          </h2>
          <p className="mb-6 font-sans text-sm text-charcoal-500">
            Abre la página principal de la rama con todos los recursos y anuncios.
          </p>
          <div className="rounded-2xl border-4 border-celestial-100 bg-white p-4 shadow-sm">
            <QRCodeSVG value={urlHome} size={220} level="M" includeMargin={false} />
          </div>
          <div className="mt-6 w-full rounded-md bg-canvas-50 px-3 py-2 font-mono text-xs text-charcoal-600 break-all border border-canvas-200">
            {urlHome}
          </div>
        </div>

        {/* QR Agenda Hoy */}
        <div className="paper-card flex flex-col items-center p-8 text-center">
          <h2 className="mb-2 font-display text-2xl font-medium text-charcoal-900">
            Boletín Dominical
          </h2>
          <p className="mb-6 font-sans text-sm text-charcoal-500">
            Abre directamente la agenda del domingo actual (sin distracciones).
          </p>
          <div className="rounded-2xl border-4 border-celestial-100 bg-white p-4 shadow-sm">
            <QRCodeSVG value={urlAgenda} size={220} level="M" includeMargin={false} />
          </div>
          <div className="mt-6 w-full rounded-md bg-canvas-50 px-3 py-2 font-mono text-xs text-charcoal-600 break-all border border-canvas-200">
            {urlAgenda}
          </div>
        </div>
      </div>
    </div>
  );
}
