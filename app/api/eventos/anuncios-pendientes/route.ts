/**
 * Pending announcements endpoint.
 *
 *   GET /api/eventos/anuncios-pendientes?fecha=YYYY-MM-DD[&horizonteDias=N]
 *
 *   Given a target Sunday `fecha`, returns every Event that:
 *     1. happens strictly AFTER `fecha`, AND
 *     2. happens within `horizonteDias` of `fecha` (default 60, max 365, min 1).
 *
 *   This is the read-side contract consumed by the `agendas-module`: when
 *   the admin opens the agenda editor for Sunday X, the agendas module
 *   calls this endpoint to pre-populate the Anuncios section.
 *
 *   Response: { fecha: string, horizonteDias: number, anuncios: PendingAnnouncement[] }
 *     - anuncios: ordered ascending by eventDate (earliest deadline first).
 *     -204 is not used; 200 with empty array is the canonical "no announcements" shape.
 *
 *   Auth: any authenticated user (read access; the agendas module calls it
 *   on behalf of the admin, but a member's dashboard could call it too).
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api-guard";
import {
  DEFAULT_HORIZON_DAYS,
  getPendingAnnouncementsForSunday,
  validateSundayParam,
} from "@/lib/events-pending";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const fechaRaw = req.nextUrl.searchParams.get("fecha");
  const parsed = validateSundayParam(fechaRaw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const horizonteRaw = req.nextUrl.searchParams.get("horizonteDias");
  let horizonte = DEFAULT_HORIZON_DAYS;
  if (horizonteRaw) {
    const n = Number(horizonteRaw);
    if (!Number.isFinite(n) || n < 1) {
      return NextResponse.json(
        { error: "'horizonteDias' debe ser un entero >= 1" },
        { status: 400 },
      );
    }
    horizonte = Math.floor(n);
  }

  const anuncios = await getPendingAnnouncementsForSunday(parsed.value, horizonte);
  return NextResponse.json({
    fecha: parsed.value,
    horizonteDias: horizonte,
    anuncios,
  });
}
