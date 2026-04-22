import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;
  const body = await req.json();
  const { quantity, type, reason } = body;

  if (!quantity || !type) {
    return NextResponse.json(
      { error: "Miktar ve hareket tipi zorunludur" },
      { status: 400 }
    );
  }

  const part = await prisma.part.findFirst({
    where: { id: id, tenantId },
  });
  if (!part) {
    return NextResponse.json({ error: "Parça bulunamadı" }, { status: 404 });
  }

  // Create movement
  const movement = await prisma.stockMovement.create({
    data: {
      tenantId,
      partId: id,
      quantity,
      type,
      reason: reason ?? null,
    },
  });

  // Update part stock
  const delta =
    type === "IN"
      ? Number(quantity)
      : type === "OUT"
        ? -Number(quantity)
        : 0;
  await prisma.part.update({
    where: { id: id },
    data: { currentStock: { increment: delta } },
  });

  return NextResponse.json({
    success: true,
    movement: { ...movement, quantity: Number(movement.quantity) },
  });
}
