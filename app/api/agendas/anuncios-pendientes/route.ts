/**
 * GET /api/agendas/anuncios-pendientes?fecha=YYYY-MM-DD
 *
 * PROXY to the events module's `/api/eventos/anuncios-pendientes?fecha=...`
 * endpoint. Until that endpoint exists, this returns `{results: []}` with a
 * 200 and a warning header.
 *
 * The inter-module contract is described in the agendas-module task brief:
 * the events module owns event CRUD and computes which events should be
 * announced on a given Sunday (announcements auto-generate per spec F4).
 *
 * TODO(agendas-module): drop the fallback once events module is integrated.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/agenda/auth-helpers";
import { fetchPendingAnnouncements } from "@/lib/agenda/announcements";
import { isSunday } from "@/lib/agenda/dates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const date = url.searchParams.get("fecha");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Se requiere ?fecha=YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (!isSunday(date)) {
    return NextResponse.json(
      { error: "La fecha debe ser un domingo" },
      { status: 400 },
    );
  }

  const results = await fetchPendingAnnouncements(date);
  return NextResponse.json(
    { results },
    {
      headers: {
        "X-Announcements-Source":
          results.length === 0
            ? "fallback-empty"
            : "events-module",
        // Visible in dev tools so the integrator knows the upstream is missing.
        "X-Announcements-Todo":
          "events-module endpoint not yet integrated; using empty fallback",
      },
    },
  );
}
