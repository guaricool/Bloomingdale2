/**
 * Health check endpoint. Used by smoke tests and uptime monitors.
 * Returns {ok: true} with a 200 status.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true });
}
