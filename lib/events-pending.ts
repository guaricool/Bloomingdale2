/**
 * Events module — pending announcements for a given Sunday.
 *
 * Endpoint: `GET /api/eventos/anuncios-pendientes?fecha=YYYY-MM-DD`
 *
 * Definition (documented):
 *   Given a target Sunday `fecha`, return every Event that:
 *     1. has not happened by `fecha` (strictly: `eventDate > fecha`), AND
 *     2. is reasonably soon (horizon: 60 days by default — overridable via
 *        the `horizonteDias` query param, clamped to [1, 365]).
 *
 * Why "strictly after": per spec F4 "el evento aparece como anuncio en cada
 * agenda de esos domingos" — i.e. only Sundays BEFORE the event. An event
 * ON that Sunday doesn't need to be "announced", it just happens.
 *
 * Why 60 days: in the spec example (evento 2026-07-17 desde 2026-06-10)
 * the announcement window is 5 Sundays ≈ 35 days. 60 days gives ~8-9
 * Sundays of lookahead, which is a comfortable ramp-up window for a
 * small-branch announcement cadence. Override via ?horizonteDias=…
 * if a particular event needs a longer or shorter window.
 *
 * Caller: the agendas module calls this when the admin opens the agenda
 * editor for Sunday X, to pre-populate the Anuncios section.
 */
import { listEvents, todayIsoDate, parseEventDate, toIsoDate, addDaysIso } from "@/lib/events";

export const DEFAULT_HORIZON_DAYS = 60;
export const MIN_HORIZON_DAYS = 1;
export const MAX_HORIZON_DAYS = 365;

export interface PendingAnnouncement {
  id: number;
  title: string;
  description: string | null;
  eventDate: string; // YYYY-MM-DD
  type: string;
}

export function getPendingAnnouncementsForSunday(
  sundayIso: string,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
): PendingAnnouncement[] {
  // Defensive: clamp the horizon. Bad input never crashes the endpoint.
  const clampedHorizon = Math.min(
    MAX_HORIZON_DAYS,
    Math.max(MIN_HORIZON_DAYS, Math.floor(horizonDays) || DEFAULT_HORIZON_DAYS),
  );

  // The eventDate must be strictly after the queried Sunday. We also
  // require it to be after today (events that already happened in the past
  // are filtered by definition; an event in the past can never be a
  // pending announcement for a future Sunday either, but we keep the
  // range [sunday+1day, sunday+horizon] for clarity and to match the
  // spec language).
  const lowerBound = addDaysIso(sundayIso, 1);
  const upperBound = addDaysIso(sundayIso, clampedHorizon);

  // Also enforce: not in the past relative to today. (If the admin is
  // asking about a Sunday in the past, the response should naturally be
  // empty — events before "today" are no longer "pending".)
  const today = todayIsoDate();
  const effectiveLower = lowerBound < today ? today : lowerBound;
  if (effectiveLower > upperBound) {
    return [];
  }

  const events = listEvents({
    filters: {
      from: effectiveLower,
      to: upperBound,
    },
    // Earliest first — closest deadlines at the top, so the admin sees
    // "this Sunday" before "two months from now".
    ascending: true,
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
    type: e.type,
  }));
}

/**
 * Validation helper for the API route. Returns the normalized Sunday as
 * a YYYY-MM-DD string, or an error message.
 */
export function validateSundayParam(
  raw: string | null | undefined,
): { ok: true; value: string } | { ok: false; error: string } {
  if (!raw) return { ok: false, error: "Falta el parámetro 'fecha' (YYYY-MM-DD)" };
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
    return { ok: false, error: "El parámetro 'fecha' debe tener formato YYYY-MM-DD" };
  }
  let d: Date;
  try {
    d = parseEventDate(raw);
  } catch {
    return { ok: false, error: "Fecha inválida" };
  }
  // We don't *reject* non-Sundays — the spec doesn't require it and being
  // permissive is friendlier. But we still return the normalized form.
  return { ok: true, value: toIsoDate(d) };
}
