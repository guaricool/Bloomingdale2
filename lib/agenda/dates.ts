/**
 * Date utilities for the agendas module.
 *
 * All "agenda dates" are stored as `YYYY-MM-DD` strings in the DB
 * (timezone-naive). Sundays are the canonical meeting day (spec F2).
 *
 * We deliberately do not use date-fns-tz here — the v0.1 spec is single-rama,
 * single-timezone, and the secretary enters "the next Sunday" in their local
 * wall clock. The DB column enforces the Sunday rule at insert time.
 */

/** True if the given `YYYY-MM-DD` string is a Sunday. */
export function isSunday(dateStr: string): boolean {
  const d = parseDate(dateStr);
  if (!d) return false;
  return d.getUTCDay() === 0;
}

/** Parse `YYYY-MM-DD` to a Date at UTC midnight. Returns null on bad input. */
export function parseDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date as `YYYY-MM-DD` (UTC). */
export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date in `YYYY-MM-DD` (UTC). */
export function todayIso(): string {
  return formatDate(new Date());
}

/**
 * The "next Sunday" relative to `from` (UTC date string).
 *
 * Rules:
 *   - If `from` is a Sunday → returns `from` (the same Sunday).
 *   - Otherwise returns the first strictly-future Sunday.
 *
 * Used by `/agendas/hoy` to default-wizard the date picker.
 */
export function nextSunday(from: string): string {
  const d = parseDate(from);
  if (!d) return from;
  const dow = d.getUTCDay();
  const daysAhead = dow === 0 ? 0 : 7 - dow;
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + daysAhead);
  return formatDate(out);
}

/**
 * The previous Sunday relative to `from` (UTC date string).
 *
 * Rules:
 *   - If `from` is a Sunday → returns `from` (the same Sunday).
 *   - Otherwise returns the most recent past Sunday.
 */
export function previousSunday(from: string): string {
  const d = parseDate(from);
  if (!d) return from;
  const dow = d.getUTCDay();
  const daysBack = dow === 0 ? 0 : dow;
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() - daysBack);
  return formatDate(out);
}

/** Human label, e.g. "Domingo 14 de junio de 2026". */
export function formatSpanishDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()] ?? "";
  const year = d.getUTCFullYear();
  return `Domingo ${day} de ${month} de ${year}`;
}

/** Short label, e.g. "14 jun 2026". */
export function formatShortDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()] ?? "";
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
