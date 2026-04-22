import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { shiftUpdateSchema } from "@/lib/validations/mechanics";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const validated = shiftUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    // Tenant izolasyonu
    const mechanic = await prisma.mechanic.findUnique({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!mechanic) {
      return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
    }

    const updated = await prisma.mechanic.update({
      where: { id },
      data: {
        ...(validated.data.shiftStart !== undefined && { shiftStart: validated.data.shiftStart }),
        ...(validated.data.shiftEnd !== undefined && { shiftEnd: validated.data.shiftEnd }),
        ...(validated.data.workDays !== undefined && { workDays: validated.data.workDays }),
        ...(validated.data.dailyTarget !== undefined && { dailyTarget: validated.data.dailyTarget }),
        ...(validated.data.avatarUrl !== undefined && { avatarUrl: validated.data.avatarUrl }),
      },
      select: {
        id: true,
        shiftStart: true,
        shiftEnd: true,
        workDays: true,
        dailyTarget: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ success: true, mechanic: updated });
  } catch (err) {
    console.error("Usta vardiya güncelleme hatası:", err);
    return NextResponse.json({ error: "Güncelleme sırasında bir hata oluştu." }, { status: 500 });
  }
}
