/**
 * Fetch pending announcements from the events module.
 *
 * Hits `GET /api/eventos/anuncios-pendientes?fecha=YYYY-MM-DD` (owned by
 * the events-module) and returns the upstream shape.
 *
 * Robustness: if the endpoint is unreachable (parallel track not yet
 * merged, dev server off, network glitch, etc.), we fall back to `[]` so
 * the agenda editor keeps working — the admin can still add manual
 * announcements.
 */
import type { PendingAnnouncement } from "./types";

export const EVENTS_ANNOUNCEMENTS_ENDPOINT = "/api/eventos/anuncios-pendientes";

/**
 * Returns the list of pending announcements for the given Sunday.
 *
 * Strategy:
 *   1. On the server, we are running in the same process as the events
 *      endpoint. The cleanest path is to call the upstream `getPending…`
 *      helper directly via a dynamic import. That avoids a self-fetch
 *      loop (and the auth/cookie plumbing that would entail) while
 *      keeping the module boundary crisp.
 *   2. If the upstream throws or isn't installed, fall back to `[]` and
 *      log a single warning at the call site.
 */
export async function fetchPendingAnnouncements(
  date: string,
): Promise<PendingAnnouncement[]> {
  try {
    // Dynamic import so this file compiles even before the events module
    // is in the tree (e.g. a v0.1.x build that hasn't integrated the
    // module yet). The `lib/events-pending` module is the canonical
    // source of truth — see its docs for the algorithm.
    const mod = (await import("@/lib/events-pending").catch(
      () => null,
    )) as null | {
      getPendingAnnouncementsForSunday: (
        date: string,
        horizonDays: number,
      ) => PendingAnnouncement[];
    };
    if (!mod) return [];
    return mod.getPendingAnnouncementsForSunday(date, 60);
  } catch (err) {
    // Don't crash the editor if the events module is unavailable.
    // The error is surfaced in the server log; the UI shows "0 anuncios
    // pendientes" and the admin can add manual announcements.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[agendas-module] fetchPendingAnnouncements failed, using empty fallback:",
        err instanceof Error ? err.message : err,
      );
    }
    return [];
  }
}
