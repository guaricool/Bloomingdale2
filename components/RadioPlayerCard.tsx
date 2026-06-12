"use client";

/**
 * RadioPlayerCard — reproductor de audio en vivo para SUD Radio Online.
 *
 * Reproductor minimalista con play/pause. El stream URL viene de la
 * variable de entorno NEXT_PUBLIC_RADIO_STREAM_URL para que sea fácil
 * actualizar cuando cambie el túnel (trycloudflare.com es temporal).
 *
 * Ubicación: sidebar derecho de la landing (/).
 */
import { useEffect, useRef, useState } from "react";

const STREAM_URL =
  process.env.NEXT_PUBLIC_RADIO_STREAM_URL ??
  "https://charles-determination-piece-mistress.trycloudflare.com/stream";

type PlayerState = "idle" | "loading" | "playing" | "error";

export function RadioPlayerCard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>("idle");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";

    audio.addEventListener("waiting", () => setState("loading"));
    audio.addEventListener("playing", () => setState("playing"));
    audio.addEventListener("pause", () => setState("idle"));
    audio.addEventListener("error", () => setState("error"));
    audio.addEventListener("stalled", () => setState("loading"));

    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (state === "playing" || state === "loading") {
      audio.pause();
      audio.src = "";
      setState("idle");
      return;
    }

    // Forzar recarga del stream en cada play (streams en vivo no hacen cache)
    setState("loading");
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => setState("error"));
  }

  const isActive = state === "playing" || state === "loading";

  return (
    <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-soft">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-800 px-5 py-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-400/20 blur-2xl"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-200">
              Radio en vivo
            </p>
            <p className="mt-0.5 font-display text-base font-medium leading-snug text-white">
              SUD Radio Online
            </p>
            <p className="font-sans text-[0.65rem] text-blue-200/80">
              Unidos por Jesucristo
            </p>
          </div>
          {/* Indicador EN VIVO */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-wider transition-colors ${
              state === "playing"
                ? "bg-sky-400/20 text-sky-200"
                : "bg-white/10 text-white/50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                state === "playing"
                  ? "animate-pulse bg-sky-300"
                  : "bg-white/30"
              }`}
              aria-hidden
            />
            En vivo
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={toggle}
          disabled={state === "error"}
          aria-label={isActive ? "Pausar radio" : "Reproducir radio"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 active:scale-95 ${
            isActive
              ? "bg-blue-600 text-white shadow-soft hover:bg-blue-700"
              : state === "error"
              ? "bg-red-50 text-red-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {state === "loading" ? (
            /* Spinner */
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : state === "playing" ? (
            /* Pause icon */
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg
              className="h-5 w-5 translate-x-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4l15 8-15 8V4z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          {state === "error" ? (
            <p className="font-sans text-xs text-red-500">
              No se pudo conectar al stream.
            </p>
          ) : state === "loading" ? (
            <p className="font-sans text-xs text-slate-500">Conectando…</p>
          ) : state === "playing" ? (
            <>
              <p className="truncate font-sans text-sm font-medium text-slate-900">
                Transmisión en vivo
              </p>
              <p className="font-sans text-xs text-slate-500">
                sudradioonline.com
              </p>
            </>
          ) : (
            <>
              <p className="truncate font-sans text-sm font-medium text-slate-700">
                Presiona para escuchar
              </p>
              <p className="font-sans text-xs text-slate-400">
                sudradioonline.com
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5">
        <a
          href="https://sudradioonline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between font-sans text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          <span>Abrir sitio completo</span>
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
