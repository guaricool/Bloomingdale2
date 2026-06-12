"use client";

/**
 * Typeahead picker for Members, used as the speaker/prayer ref in the
 * agenda editor. Wraps the agenda-module's own searchMembers helper via
 * a tiny `/api/miembros/rapido` route (we keep the speakers decoupled
 * from the broader members module so the agenda editor can ship first).
 */
import { useEffect, useRef, useState } from "react";

export interface MemberOption {
  id: number;
  firstName: string;
  lastName: string;
  membershipNumber: string | null;
  familyGroupName?: string | null;
}

interface SpeakerPickerProps {
  value: number | null;
  onSelect: (member: MemberOption) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function SpeakerPicker({
  value,
  onSelect,
  placeholder = "Buscar por nombre…",
  disabled,
  id,
}: SpeakerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!containerRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Resolve the label for an existing value if we don't have one yet.
  useEffect(() => {
    if (value == null || selectedLabel != null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/miembros/rapido?id=${value}`);
        if (!res.ok) return;
        const data = (await res.json()) as { member: MemberOption | null };
        if (!cancelled && data.member) {
          setSelectedLabel(`${data.member.firstName} ${data.member.lastName}`);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, selectedLabel]);

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
          `/api/miembros/rapido?q=${encodeURIComponent(trimmed)}&limit=8`,
        );
        if (!res.ok) {
          setResults([]);
        } else {
          const data = (await res.json()) as { results: MemberOption[] };
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
        setSelectedLabel(`${target.firstName} ${target.lastName}`);
      }
    } else if (ev.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

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
            {selectedLabel ?? `#${value}`}
            <button
              type="button"
              onClick={() => {
                onSelect({ id: 0, firstName: "", lastName: "", membershipNumber: null });
                setSelectedLabel(null);
              }}
              disabled={disabled}
              className="ml-1 text-slate-500 hover:text-slate-700 disabled:opacity-50"
              aria-label="Quitar miembro"
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
            results.map((m, idx) => (
              <li
                key={m.id}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(m);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                  setSelectedLabel(`${m.firstName} ${m.lastName}`);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === activeIdx ? "bg-blue-50 text-blue-900" : "text-slate-700"
                }`}
              >
                <span className="font-medium">
                  {m.firstName} {m.lastName}
                </span>
                {m.familyGroupName ? (
                  <span className="ml-2 text-xs text-slate-500">
                    {m.familyGroupName}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
