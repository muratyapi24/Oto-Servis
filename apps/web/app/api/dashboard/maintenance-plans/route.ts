import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import { createMaintenancePlanSchema } from "@/lib/validations/maintenance-plan";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId zorunludur." }, { status: 400 });
    }

    // Aracın bu tenant'a ait olduğunu doğrula
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
    }

    const plans = await prisma.maintenancePlan.findMany({
      where: { vehicleId, tenantId: session.user.tenantId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const serialized = plans.map((p) => ({
      id: p.id,
      vehicleId: p.vehicleId,
      title: p.title,
      dueDate: p.dueDate?.toISOString() ?? null,
      dueMileage: p.dueMileage,
      isCompleted: p.isCompleted,
      isOverdue: !p.isCompleted && p.dueDate != null && p.dueDate < now,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ plans: serialized });
  } catch (err) {
    console.error("Maintenance plans GET hatası:", err);
    return NextResponse.json({ error: "Bakım planları yüklenemedi." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();
    const validated = createMaintenancePlanSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error?.errors?.[0]?.message || "Ge�ersiz veri" },
        { status: 400 }
      );
    }

    // Aracın bu tenant'a ait olduğunu doğrula
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validated.data.vehicleId, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
    }

    const plan = await prisma.maintenancePlan.create({
      data: {
        tenantId: session.user.tenantId,
        vehicleId: validated.data.vehicleId,
        title: validated.data.title,
        dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
        dueMileage: validated.data.dueMileage ?? null,
      },
    });

    return NextResponse.json(
      {
        plan: {
          ...plan,
          dueDate: plan.dueDate?.toISOString() ?? null,
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
          isOverdue: false,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Maintenance plans POST hatası:", err);
    return NextResponse.json({ error: "Bakım planı oluşturulamadı." }, { status: 500 });
  }
}
