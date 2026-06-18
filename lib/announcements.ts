import { prisma } from "@/lib/db";
import { todayIso, parseDate, formatDate } from "@/lib/agenda/dates";

export async function getActiveAnnouncementsAndEvents() {
  const todayStr = todayIso();
  const d = parseDate(todayStr);
  let in45DaysStr = todayStr;
  if (d) {
    d.setUTCDate(d.getUTCDate() + 45);
    in45DaysStr = formatDate(d);
  }

  // 1. Fetch Manual Announcements
  const announcements = await prisma.announcement.findMany({
    where: {
      activeFrom: { lte: todayStr },
      OR: [
        { activeUntil: null },
        { activeUntil: { gte: todayStr } }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  // 2. Fetch Events (recurring, or finite upcoming within 45 days)
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { isRecurring: true },
        {
          isRecurring: false,
          eventDate: { gte: todayStr, lte: in45DaysStr }
        }
      ]
    },
    orderBy: { eventDate: "asc" }
  });

  return { announcements, events };
}
