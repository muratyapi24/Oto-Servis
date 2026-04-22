"use server";

import { prisma } from "@repo/database";
import { auth } from "@/auth";

// KVKK Madde 11 — Veri sahibi hakkı talebi oluştur
export async function createDataSubjectRequest(
  requestType: "EXPORT" | "ERASURE" | "ACCESS" | "CORRECTION" | "OBJECTION"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Oturum bulunamadı." };
    }

    const customerId = session.user.id;

    // Müşterinin tenant bilgisini bul
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { tenantId: true },
    });

    if (!customer) {
      return { error: "Müşteri bulunamadı." };
    }

    // Aynı tipte bekleyen talep varsa tekrar oluşturma
    const existing = await prisma.dataSubjectRequest.findFirst({
      where: { customerId, requestType, status: "PENDING" },
    });
    if (existing) {
      return { error: "Bu talep türü zaten işlemde." };
    }

    await prisma.dataSubjectRequest.create({
      data: {
        tenantId: customer.tenantId,
        customerId,
        requestType,
        status: "PENDING",
      },
    });

    // Tenant admin'e bildirim gönder
    await prisma.notification.create({
      data: {
        tenantId: customer.tenantId,
        channel: "IN_APP",
        type: "IN_APP",
        recipient: "admin",
        subject: "KVKK Veri Sahibi Talebi",
        body: `Bir müşteri ${requestType === "ERASURE" ? "veri silme" : "veri dışa aktarma"} talebinde bulundu. Ayarlar > KVKK bölümünden yönetin.`,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Veri sahibi talebi hatası:", error);
    return { error: "Talep oluşturulurken bir hata oluştu." };
  }
}

export async function getCustomerOverview() {
  try {
    const session = await auth();

    // Check if user is CUSTOMER role
    if (!session?.user?.id || (session?.user as any)?.role !== "CUSTOMER") {
      return { error: "Yetkisiz erişim. Lütfen müşteri olarak giriş yapın." };
    }

    const customerId = session.user.id;
    const plate = (session.user as any).plate as string;

    // Fetch the specific vehicle the customer logged in with
    const vehicle = await prisma.vehicle.findFirst({
      where: { 
        customerId: customerId,
        plate: plate
      },
      include: {
        customer: true,
        serviceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5 // get latest 5 service orders
        }
      }
    });

    if (!vehicle) {
      return { error: "Kayıtlı araç bilgisi bulunamadı." };
    }

    // Get active service order if any
    const activeOrder = vehicle.serviceOrders.find(
      order => order.status !== "COMPLETED" && order.status !== "CANCELLED"
    );

    return {
      success: true,
      vehicle,
      customer: vehicle.customer,
      activeOrder,
      recentOrders: vehicle.serviceOrders
    };

  } catch (error) {
    console.error("Müşteri paneli veri çekme hatası:", error);
    return { error: "Veriler yüklenirken bir sorun oluştu." };
  }
}

/**
 * Tek bir servis emri detayını getirir (Stitch "Servis Detayı - Aktif" sayfası için)
 */
export async function getServisDetay(serviceOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı." };
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        vehicle: true,
        customer: true,
        assignedMechanic: true,
        items: {
          include: { part: true },
          orderBy: { createdAt: 'asc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        workLogs: {
          include: { mechanic: true },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    if (!order) {
      return { error: "Servis kaydı bulunamadı." };
    }

    return { success: true, order };
  } catch (error) {
    console.error("Servis detay hatası:", error);
    return { error: "Servis bilgileri yüklenirken hata oluştu." };
  }
}

/**
 * Müşterinin tüm araçlarındaki tamamlanmış/iptal edilmiş servis emirlerini getirir
 * (Stitch "Servis Geçmişi" sayfası için)
 */
export async function getServisGecmisi() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Oturum bulunamadı." };
    }

    // getMusteriPanelData benzeri: tenant'taki ilk müşteriyi bul
    const customer = await prisma.customer.findFirst({
      where: { tenantId: (session.user as any).tenantId || undefined },
      include: {
        vehicles: {
          include: {
            serviceOrders: {
              where: { status: { in: ["COMPLETED", "CANCELLED"] } },
              include: {
                assignedMechanic: true,
                items: true
              },
              orderBy: { createdAt: 'desc' },
              take: 20
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!customer) {
      return { error: "Müşteri profili bulunamadı." };
    }

    // Tüm araçlardan gelen geçmiş emirleri düzleştir
    const allOrders = customer.vehicles.flatMap(v =>
      v.serviceOrders.map(o => ({
        ...o,
        vehiclePlate: v.plate,
        vehicleBrand: v.brand,
        vehicleModel: v.model
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, customer, orders: allOrders };
  } catch (error) {
    console.error("Servis geçmişi hatası:", error);
    return { error: "Geçmiş bilgileri yüklenirken hata oluştu." };
  }
}

/**
 * Müşterinin araçlarına ait bakım planlarını getirir
 * (Müşteri portalı "Bakım Planlarım" sayfası için)
 */
export async function getMyMaintenancePlans() {
  try {
    const session = await auth();
    if (!session?.user) return { error: "Oturum bulunamadı." };

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) return { error: "Tenant bilgisi bulunamadı." };

    // Müşteriyi bul
    const customer = await prisma.customer.findFirst({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        vehicles: {
          where: { deletedAt: null },
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            mileage: true,
            maintenancePlans: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
      },
    });

    if (!customer) return { error: "Müşteri profili bulunamadı." };

    const now = new Date();

    const vehiclesWithPlans = customer.vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      mileage: v.mileage,
      plans: v.maintenancePlans.map((p) => ({
        id: p.id,
        title: p.title,
        dueDate: p.dueDate?.toISOString() ?? null,
        dueMileage: p.dueMileage,
        isCompleted: p.isCompleted,
        isOverdue: !p.isCompleted && p.dueDate != null && p.dueDate < now,
        isMileageDue: !p.isCompleted && p.dueMileage != null && v.mileage >= p.dueMileage,
      })),
    }));

    return { customer, vehiclesWithPlans };
  } catch (error) {
    console.error("Bakım planları hatası:", error);
    return { error: "Bakım planları yüklenirken hata oluştu." };
  }
}
