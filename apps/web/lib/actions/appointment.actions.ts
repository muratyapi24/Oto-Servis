"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { guardTenant } from "@/lib/guards";
import { 
  CreateAppointmentInput, 
  createAppointmentSchema,
  UpdateAppointmentStatusInput,
  updateAppointmentStatusSchema
} from "@/lib/validations/appointments";

export async function createAppointment(data: CreateAppointmentInput) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const val = createAppointmentSchema.parse(data);

    // Müşterinin veya arabanın kontrolüne gerek yok şimdilik
    // Çünkü ID bazlı. Araç yoksa bile kaydedebilmeli

    const apt = await prisma.appointment.create({
      data: {
        tenantId: tenantId,
        customerId: val.customerId,
        vehicleId: val.vehicleId || null,
        appointmentDate: val.appointmentDate,
        appointmentTime: val.appointmentTime,
        type: val.type || "Bilinmiyor",
        notes: val.notes || null,
        status: "CONFIRMED" // Default olara onaylı yapabiliriz veya pending kalabilir. Onaylı yapalım.
      }
    });

    revalidatePath("/dashboard/appointments");
    return { success: "Randevu başarıyla eklendi" };
  } catch (error) {
    console.error("Randevu oluşturma hatası:", error);
    return { error: "Randevu eklenemedi." };
  }
}

export async function getAppointments() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const apts = await prisma.appointment.findMany({
      where: { tenantId: tenantId, deletedAt: null },
      include: {
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true, phone: true } },
        vehicle: { select: { plate: true, brand: true, model: true } }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    const customers = await prisma.customer.findMany({
      where: { tenantId: tenantId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, companyName: true, type: true },
      orderBy: { createdAt: 'desc' }
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId: tenantId, deletedAt: null },
      select: { id: true, customerId: true, plate: true, brand: true, model: true }
    });

    // Format for client
    const mappedApts = apts.map(a => ({
      ...a,
      estimatedCostMin: a.estimatedCostMin ? Number(a.estimatedCostMin) : null,
      estimatedCostMax: a.estimatedCostMax ? Number(a.estimatedCostMax) : null,
      customerName: a.customer.type === "CORPORATE" ? a.customer.companyName : `${a.customer.firstName} ${a.customer.lastName}`,
      customerPhone: a.customer.phone,
      vehicleTitle: a.vehicle ? `${a.vehicle.plate} (${a.vehicle.brand} ${a.vehicle.model})` : "Araç Belirtilmedi (Sonra Belli Olacak)"
    }));

    const mappedCustomers = customers.map(c => ({
      id: c.id,
      name: c.type === "CORPORATE" ? c.companyName || "" : `${c.firstName} ${c.lastName}`
    }));

    return { appointments: mappedApts, customers: mappedCustomers, vehicles };
  } catch (error) {
    console.error("Randevular yüklenemedi", error);
    return { error: "Randevu listesi yüklenemedi" };
  }
}

export async function updateAppointmentStatus(data: UpdateAppointmentStatusInput) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {
    
    const val = updateAppointmentStatusSchema.parse(data);

    // Eğer statü COMPLETED (Servise Al) ise, bir İş Emri oluşturmamız lazım
    if (val.status === "COMPLETED") {
      const apt = await prisma.appointment.findUnique({
        where: { id: val.id, tenantId: tenantId }
      });

      if (!apt) return { error: "Randevu bulunamadı" };
      if (!apt.vehicleId) return { error: "Bu randevuya henüz bir araç atanmamış. Lütfen önce araç seçin." };

      // İş Emri Oluştur
      await prisma.serviceOrder.create({
        data: {
          tenantId: tenantId,
          customerId: apt.customerId,
          vehicleId: apt.vehicleId,
          status: "PENDING",
          complaintDescription: `[Randevudan Geldi] - ${apt.type || "Genel"}: ${apt.notes || "Not yok"}`,
          receptionDate: new Date(),
        }
      });
    }

    await prisma.appointment.update({
      where: { id: val.id, tenantId: tenantId },
      data: { status: val.status }
    });

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/services");
    if (val.status === "COMPLETED") {
      revalidatePath("/m/musteri/panel", "page");
      revalidatePath("/m/musteri/takip", "page");
    }
    return { success: val.status === "COMPLETED" ? "Randevu başarıyla Servis İş Emrine dönüştürüldü" : "Statü güncellendi" };
  } catch (error) {
    console.error("Hata:", error);
    return { error: "İşlem başarısız oldu." };
  }
}

export async function updateAppointment(data: any) { // Type explicitly to avoid import issues in this chunk
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const apt = await prisma.appointment.update({
      where: { id: data.id, tenantId: tenantId },
      data: {
        customerId: data.customerId,
        vehicleId: data.vehicleId || null,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        type: data.type,
        notes: data.notes
      }
    });

    revalidatePath("/dashboard/appointments");
    return { success: "Randevu başarıyla güncellendi" };
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    return { error: "Randevu güncellenemedi" };
  }
}

export async function dragAndDropAppointment(id: string, newDate: Date, newTime: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    // Randevunun varlığını ve kullanıcıya ait olduğunu doğrula (update içinde where ile de yapılıyor ama bulamazsa throw atar)
    await prisma.appointment.update({
      where: { id, tenantId: tenantId },
      data: {
        appointmentDate: newDate,
        appointmentTime: newTime
      }
    });

    revalidatePath("/dashboard/appointments");
    return { success: "Randevu başarıyla yeni tarihine taşındı" };
  } catch (error) {
    console.error("Sürükle bırak hatası:", error);
    return { error: "Randevu taşınırken bir hata oluştu" };
  }
}

export async function getAppointmentById(id: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const appointment = await prisma.appointment.findUnique({
      where: { id, tenantId: tenantId },
      include: {
        customer: {
          select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true },
        },
        vehicle: {
          select: { id: true, plate: true, brand: true, model: true },
        },
      },
    });

    if (!appointment || appointment.deletedAt) {
      return { appointment: null };
    }

    return { appointment };
  } catch (error) {
    console.error("getAppointmentById hatası:", error);
    return { appointment: null, error: "Randevu bilgileri alınamadı." };
  }
}

/** Randevu İstatistikleri **/
export async function getAppointmentStats() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [todayCount, pendingCount, confirmedCount, weeklyCount, noShowCount] = await Promise.all([
      prisma.appointment.count({
        where: { tenantId, deletedAt: null, appointmentDate: { gte: today, lt: tomorrow } }
      }),
      prisma.appointment.count({
        where: { tenantId, deletedAt: null, status: "PENDING" }
      }),
      prisma.appointment.count({
        where: { tenantId, deletedAt: null, status: "CONFIRMED" }
      }),
      prisma.appointment.count({
        where: { tenantId, deletedAt: null, appointmentDate: { gte: today, lt: weekEnd } }
      }),
      prisma.appointment.count({
        where: { tenantId, deletedAt: null, status: "NO_SHOW" }
      })
    ]);

    return {
      stats: { todayCount, pendingCount, confirmedCount, weeklyCount, noShowCount }
    };
  } catch (error) {
    console.error("Randevu istatistikleri alınamadı:", error);
    return { error: "İstatistikler yüklenemedi" };
  }
}

/** SMS ile Randevu Hatırlatması Gönder **/
export async function sendAppointmentReminder(appointmentId: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    const apt = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId, deletedAt: null },
      include: {
        customer: { select: { phone: true, firstName: true, lastName: true, companyName: true, type: true } },
        vehicle: { select: { plate: true, brand: true, model: true } }
      }
    });

    if (!apt) return { error: "Randevu bulunamadı" };
    if (!apt.customer?.phone) return { error: "Müşterinin telefon numarası kayıtlı değil" };

    const customerName = apt.customer.type === "CORPORATE"
      ? apt.customer.companyName
      : `${apt.customer.firstName} ${apt.customer.lastName}`;

    const vehicleInfo = apt.vehicle
      ? `${apt.vehicle.plate} (${apt.vehicle.brand} ${apt.vehicle.model})`
      : "";

    const dateStr = new Date(apt.appointmentDate).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric"
    });

    const message = `Sayın ${customerName}, ${dateStr} tarihinde saat ${apt.appointmentTime}'de ${apt.type || "servis"} randevunuz bulunmaktadır.${vehicleInfo ? ` Araç: ${vehicleInfo}.` : ""} İyi günler dileriz. - Oto Servis`;

    // SMS gönder (multi-provider sms.ts kullanılıyor)
    const { sendSms } = await import("@/lib/notifications/sms");
    const result = await sendSms({
      to: apt.customer.phone,
      body: message,
      tenantId,
      customerId: apt.customerId
    });

    if (result.success) {
      return { success: `${customerName} müşterisine hatırlatma SMS'i gönderildi.` };
    } else {
      return { error: result.error || "SMS gönderilemedi" };
    }
  } catch (error) {
    console.error("Hatırlatma SMS hatası:", error);
    return { error: "SMS gönderilemedi: " + (error instanceof Error ? error.message : String(error)) };
  }
}

/** Randevuyu Sil (Soft Delete) **/
export async function deleteAppointment(id: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  try {

    await prisma.appointment.update({
      where: { id, tenantId: tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/appointments");
    return { success: "Randevu silindi." };
  } catch (error) {
    console.error("Randevu silinemedi:", error);
    return { error: "Randevu silinemedi." };
  }
}
