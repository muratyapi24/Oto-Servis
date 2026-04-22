import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { z } from "zod";

const talepSchema = z.object({
  partId: z.string().uuid("Geçerli bir parça seçin"),
  locationId: z.string().uuid("Geçerli bir depo seçin"),
  quantity: z.number().int().positive("Miktar pozitif olmalıdır"),
  serviceOrderId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = talepSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    const { partId, quantity } = validated.data;
    const tenantId = session.user.tenantId;

    // Parçanın bu tenant'a ait olduğunu ve stok durumunu kontrol et
    const part = await prisma.part.findUnique({
      where: { id: partId, tenantId, deletedAt: null },
      select: { id: true, name: true, currentStock: true, unit: true },
    });

    if (!part) {
      return NextResponse.json({ error: "Parça bulunamadı." }, { status: 404 });
    }

    if (part.currentStock < quantity) {
      return NextResponse.json(
        {
          error: `Yetersiz stok. Mevcut: ${part.currentStock} ${part.unit}, İstenen: ${quantity}`,
          insufficientStock: true,
          currentStock: part.currentStock,
        },
        { status: 422 }
      );
    }

    // Stok hareketi oluştur (OUT)
    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          tenantId,
          partId,
          quantity,
          type: "OUT",
          reason: validated.data.notes
            ? `Parça talebi: ${validated.data.notes}`
            : "Mobil parça talebi",
          serviceOrderId: validated.data.serviceOrderId ?? null,
        },
      }),
      prisma.part.update({
        where: { id: partId },
        data: { currentStock: { decrement: quantity } },
      }),
    ]);

    return NextResponse.json(
      { success: true, message: "Parça talebi oluşturuldu." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Parça talep hatası:", err);
    return NextResponse.json({ error: "Parça talebi oluşturulamadı." }, { status: 500 });
  }
}
