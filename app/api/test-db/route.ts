import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {};
  
  try {
    diagnostics.connection = "OK";
    
    // Probar SELECT 1
    const select1 = await prisma.$queryRawUnsafe("SELECT 1 as result");
    diagnostics.select1Result = select1;
    
    // Probar consulta de posts
    console.log("Probando consulta de posts...");
    try {
      const posts = await prisma.post.findMany({ take: 1 });
      diagnostics.postsQuerySimplified = { success: true, count: posts.length };
    } catch (err: any) {
      diagnostics.postsQuerySimplified = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    try {
      const postsQueryFull = await prisma.post.findMany({
        include: { author: true },
        take: 1
      });
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
      const events = await prisma.event.findMany({
        orderBy: { eventDate: 'asc' },
        take: 1
      });
      diagnostics.eventsQuery = { success: true, count: events.length };
    } catch (err: any) {
      diagnostics.eventsQuery = {
        success: false,
        error: { message: err.message, code: err.code }
      };
    }

    // Probar getAgendaByDate query
    console.log("Probando consulta de agendas...");
    try {
      const agenda = await prisma.agenda.findFirst({
        where: { date: "2026-06-14" }
      });
      diagnostics.agendaQuery = { success: true, exists: !!agenda };
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
