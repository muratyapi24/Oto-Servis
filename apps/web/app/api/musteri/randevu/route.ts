import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@repo/database";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  const [vehicles, appointments] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId, tenantId, deletedAt: null },
      select: { id: true, plate: true, brand: true, model: true, year: true, mileage: true, nextMaintenanceMileage: true, color: true },
    }),
    prisma.appointment.findMany({
      where: { customerId, tenantId, deletedAt: null },
      orderBy: [{ appointmentDate: "asc" }, { appointmentTime: "asc" }],
      select: { id: true, appointmentDate: true, appointmentTime: true, type: true, status: true },
      take: 10,
    }),
  ]);

  return NextResponse.json({ vehicles, appointments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  const body = await req.json();
  const { vehicleId, date, time, serviceType, notes, estimatedCostMin, estimatedCostMax } = body;

  if (!vehicleId || !date || !time || !serviceType) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
  }

  // Araç bu müşteriye ait mi kontrol et
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customerId, tenantId },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      customerId,
      vehicleId,
      appointmentDate: new Date(date),
      appointmentTime: time,
      type: serviceType,
      notes: notes || null,
      estimatedCostMin: estimatedCostMin ? parseFloat(estimatedCostMin) : null,
      estimatedCostMax: estimatedCostMax ? parseFloat(estimatedCostMax) : null,
      status: "PENDING",
    },
  });

  // Müşteriye randevu onay bildirimi gönder
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { phone: true, email: true, firstName: true, lastName: true, companyName: true, type: true },
    });
    if (customer) {
      const { getAppointmentConfirmTemplate } = await import("@/lib/notifications/templates");
      const { sendSms } = await import("@/lib/notifications/sms");
      const customerName = customer.type === "CORPORATE"
        ? customer.companyName ?? "Müşteri"
        : `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
      const tmpl = getAppointmentConfirmTemplate({ customerName, date, time });
      if (customer.phone) {
        await sendSms({ to: customer.phone, body: tmpl.sms, tenantId, customerId });
      }
    }
  } catch (notifErr) {
    console.error("Randevu bildirimi gönderilemedi:", notifErr);
  }

  return NextResponse.json({ success: "Randevu talebi oluşturuldu", appointmentId: appointment.id });
}
