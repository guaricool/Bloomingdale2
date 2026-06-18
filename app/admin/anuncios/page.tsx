import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnnouncementManager } from "@/components/AnnouncementManager";

export const dynamic = "force-dynamic";

export default async function AdminAnunciosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        eyebrow="Administración"
        title="Anuncios de la Rama"
        description="Agrega anuncios que se mostrarán automáticamente en la página del domingo y el boletín QR."
      />
      <AnnouncementManager initialAnnouncements={announcements} />
    </div>
  );
}
