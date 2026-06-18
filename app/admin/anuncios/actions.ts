"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createAnnouncement(data: { title: string, body?: string, activeFrom: string, activeUntil?: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.announcement.create({
    data: {
      title: data.title,
      body: data.body || null,
      activeFrom: data.activeFrom,
      activeUntil: data.activeUntil || null,
      createdBy: Number(session.user.id),
    }
  });

  revalidatePath("/admin/anuncios");
  revalidatePath("/domingo");
}

export async function deleteAnnouncement(id: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") throw new Error("Unauthorized");

  await prisma.announcement.delete({ where: { id } });

  revalidatePath("/admin/anuncios");
  revalidatePath("/domingo");
}
