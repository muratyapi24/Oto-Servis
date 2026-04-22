import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { updateMaintenancePlanSchema } from "@/lib/validations/maintenance-plan";

async function getPlanOrFail(id: string, tenantId: string) {
  const plan = await prisma.maintenancePlan.findUnique({
    where: { id, tenantId },
    select: { id: true, vehicleId: true },
  });
  return plan;
}

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

    const validated = updateMaintenancePlanSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const plan = await getPlanOrFail(id, session.user.tenantId);
    if (!plan) {
      return NextResponse.json({ error: "Bakım planı bulunamadı." }, { status: 404 });
    }

    const updated = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        ...(validated.data.title !== undefined && { title: validated.data.title }),
        ...(validated.data.dueDate !== undefined && {
          dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
        }),
        ...(validated.data.dueMileage !== undefined && { dueMileage: validated.data.dueMileage }),
        ...(validated.data.isCompleted !== undefined && { isCompleted: validated.data.isCompleted }),
      },
    });

    const now = new Date();
    return NextResponse.json({
      plan: {
        ...updated,
        dueDate: updated.dueDate?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        isOverdue: !updated.isCompleted && updated.dueDate != null && updated.dueDate < now,
      },
    });
  } catch (err) {
    console.error("Maintenance plan PATCH hatası:", err);
    return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;

    const plan = await getPlanOrFail(id, session.user.tenantId);
    if (!plan) {
      return NextResponse.json({ error: "Bakım planı bulunamadı." }, { status: 404 });
    }

    await prisma.maintenancePlan.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Maintenance plan DELETE hatası:", err);
    return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  }
}
