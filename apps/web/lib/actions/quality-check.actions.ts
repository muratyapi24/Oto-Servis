"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { z } from "zod";

const qualityCheckSchema = z.object({
  qualityCheckNotes: z.string().min(1, "Kalite notu zorunludur"),
});

export async function updateQualityCheck(
  serviceOrderId: string,
  data: { qualityCheckNotes: string }
): Promise<{ success?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim." };

    const validated = qualityCheckSchema.safeParse(data);
    if (!validated.success) {
      return { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" };
    }

    // Servis emrinin bu tenant'a ait olduğunu doğrula
    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId, tenantId: session.user.tenantId },
      select: { id: true, status: true },
    });

    if (!order) return { error: "Servis emri bulunamadı." };

    await prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        qualityCheckNotes: validated.data.qualityCheckNotes,
        qualityCheckedAt: new Date(),
        qualityCheckedBy: session.user.name ?? session.user.email ?? "Bilinmiyor",
      },
    });

    revalidatePath(`/dashboard/services/${serviceOrderId}`);
    return { success: "Kalite kontrol notu kaydedildi." };
  } catch (err) {
    console.error("Kalite kontrol güncelleme hatası:", err);
    return { error: "Kalite notu kaydedilirken bir hata oluştu." };
  }
}
