"use client";

/**
 * Typeahead autocomplete for the Hymn table.
 *
 * Debounced (200ms) query against `/api/himnos/buscar`. Keyboard-navigable
 * dropdown (↑/↓/Enter/Esc). Selecting a hymn fires `onSelect` with the
 * chosen number. Empty state is explicit (not just "no results") so the
 * admin knows the search ran.
 */
import { useEffect, useRef, useState } from "react";

export interface HymnOption {
  number: number;
  titleEs: string;
  titleEn: string | null;
}

interface HymnAutocompleteProps {
  /** Currently selected hymn number (for controlled rendering). */
  value: number | null;
  onSelect: (hymn: HymnOption) => void;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Disable the input (e.g. locked agenda). */
  disabled?: boolean;
  /** Input id (for label association). */
  id?: string;
}

export function HymnAutocomplete({
  value,
  onSelect,
  placeholder = "Buscar por número o título…",
  disabled,
  id,
}: HymnAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HymnOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!containerRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/himnos/buscar?q=${encodeURIComponent(trimmed)}&limit=8`,
        );
        if (!res.ok) {
          setResults([]);
        } else {
          const data = (await res.json()) as { results: HymnOption[] };
          setResults(data.results ?? []);
          setOpen(true);
          setActiveIdx(-1);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (ev.key === "ArrowDown" && results.length > 0) {
        setOpen(true);
        setActiveIdx(0);
        ev.preventDefault();
      }
      return;
    }
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      const target = results[activeIdx >= 0 ? activeIdx : 0];
      if (target) {
        onSelect(target);
        setQuery("");
        setResults([]);
        setOpen(false);
      }
    } else if (ev.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  const selectedDisplay =
    value != null ? `Himno ${value}` : "— elegir himno —";

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {value != null ? (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
            aria-live="polite"
          >
            {selectedDisplay}
            <button
              type="button"
              onClick={() => onSelect({ number: 0, titleEs: "", titleEn: null })}
              disabled={disabled}
              className="ml-1 text-slate-500 hover:text-slate-700 disabled:opacity-50"
              aria-label="Quitar himno"
            >
              ×
            </button>
          </span>
        ) : null}
      </div>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              {query.trim() ? "Sin coincidencias." : "Escribe para buscar."}
            </li>
          ) : (
            results.map((h, idx) => (
              <li
                key={h.number}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  // mousedown so the input doesn't lose focus before onSelect fires
                  e.preventDefault();
                  onSelect(h);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === activeIdx ? "bg-blue-50 text-blue-900" : "text-slate-700"
                }`}
              >
                <span className="font-mono font-semibold">{h.number}</span>{" "}
                <span>{h.titleEs}</span>
                {h.titleEn ? (
                  <span className="ml-1 text-xs text-slate-500">/ {h.titleEn}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
