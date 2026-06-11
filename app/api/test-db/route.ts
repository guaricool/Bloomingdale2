import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {};
  
  try {
    const db = getDb();
    diagnostics.connection = "OK";
    
    // Probar SELECT 1
    const select1 = await db.prepare("SELECT 1 as result").get();
    diagnostics.select1Result = select1;
    
    // Probar SELECT_JOIN de posts
    console.log("Probando consulta de posts...");
    try {
      const postsQuery = await db.prepare(`
        SELECT
          p.id          AS id,
          p.authorId    AS authorId,
          p.title       AS title,
          p.body        AS body,
          p.pinned      AS pinned,
          p.createdAt   AS createdAt,
          u.email       AS authorEmail,
          u.role        AS authorRole
        FROM "Post" p
        JOIN "User" u ON u.id = p.authorId
        LIMIT 1
      `).all();
      diagnostics.postsQuerySimplified = { success: true, count: postsQuery.length };
    } catch (err: any) {
      diagnostics.postsQuerySimplified = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    try {
      const postsQueryFull = await db.prepare(`
        SELECT
          p.id          AS id,
          p.authorId    AS authorId,
          p.title       AS title,
          p.body        AS body,
          p.pinned      AS pinned,
          p.createdAt   AS createdAt,
          u.name        AS authorName,
          u.email       AS authorEmail,
          u.role        AS authorRole
        FROM "Post" p
        JOIN "User" u ON u.id = p.authorId
        LIMIT 1
      `).all();
      diagnostics.postsQueryFull = { success: true, count: postsQueryFull.length };
    } catch (err: any) {
      diagnostics.postsQueryFull = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    // Probar listEvents query
    console.log("Probando consulta de eventos...");
    try {
      const eventsQuery = await db.prepare(`
        SELECT id, title, description, eventDate, type, createdBy, createdAt
        FROM "Event"
        ORDER BY eventDate ASC
        LIMIT 1
      `).all();
      diagnostics.eventsQuery = { success: true, count: eventsQuery.length };
    } catch (err: any) {
      diagnostics.eventsQuery = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    // Probar getAgendaByDate query
    console.log("Probando consulta de agendas...");
    try {
      const agendaQuery = await db.prepare(`
        SELECT id, date, status, createdBy, createdAt, updatedAt
        FROM "Agenda"
        WHERE date = ?
      `).get("2026-06-14");
      diagnostics.agendaQuery = { success: true, exists: !!agendaQuery };
    } catch (err: any) {
      diagnostics.agendaQuery = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    diagnostics.success = true;
  } catch (err: any) {
    diagnostics.success = false;
    diagnostics.error = {
      message: err.message,
      stack: err.stack,
      code: err.code
    };
  }

  return NextResponse.json(diagnostics);
}
