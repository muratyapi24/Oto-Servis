"use server";

import { guardTenant } from "@/lib/guards";

import { prisma } from "@repo/database";
import { auth } from "@/auth";

export async function getMusteriPanelData() {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "Oturum bulunamadı. Lütfen giriş yapın.", customer: null, vehicles: [] };
  }

  const isCustomer = (session.user as any).role === "CUSTOMER" || (session as any).role === "CUSTOMER";
  const customerOrUserId = session.user.id; // Usually customer id if logged in as customer

  // Gerçekte oturum açan müşterinin id'sine göre bulalım.
  // Test ortamı için (eğer role customer değilse) en güncel müşteriyi getiriyoruz.
  const customer = await prisma.customer.findFirst({
    where: { 
      tenantId: session.user.tenantId || undefined,
      ...(isCustomer && customerOrUserId ? { id: customerOrUserId } : {})
    },
    include: {
      vehicles: {
        include: {
          serviceOrders: {
            where: { status: { not: "COMPLETED" } },
            include: {
              assignedMechanic: true
            },
            // approvalToken alanını da dahil et
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!customer) {
    return { error: "Müşteri profili bulunamadı.", customer: null, vehicles: [] };
  }

  // Yaklaşan Bakımlar ve hatırlatmalar
  const reminders = customer.vehicles.flatMap(v => {
    const list = [];
    if (v.nextMaintenanceMileage && v.mileage > v.nextMaintenanceMileage - 1000) {
      list.push({
        id: `rm-mil-${v.id}`,
        title: "Yaklaşan Bakım",
        desc: `${v.nextMaintenanceMileage - v.mileage} km kaldı`,
        type: "WARNING",
        icon: "oil_barrel"
      });
    }
    if (v.nextMaintenanceDate && new Date(v.nextMaintenanceDate).getTime() < new Date().getTime() + 15 * 24 * 60 * 60 * 1000) {
      list.push({
        id: `rm-date-${v.id}`,
        title: "Periyodik Bakım",
        desc: "15 günden az süre kaldı",
        type: "INFO",
        icon: "calendar_month"
      });
    }
    return list;
  });

  return { error: null, customer, vehicles: customer.vehicles, reminders };
}

export async function getFirmaPanelData() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId, session } = g;


  // Günlük Hasılat & İşlemler
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyInvoices = await prisma.invoice.aggregate({
    where: { 
      tenantId, 
      issueDate: { gte: today },
      status: { not: "CANCELLED" },
      type: "SALES"
    },
    _sum: { totalAmount: true }
  });

  const activeServicesCount = await prisma.serviceOrder.count({
    where: { tenantId, status: "IN_PROGRESS" }
  });

  const pendingCollection = await prisma.invoice.aggregate({
    where: {
      tenantId,
      status: "SENT"
    },
    _sum: { totalAmount: true, paidAmount: true }
  });

  const collectionTotal = (Number(pendingCollection._sum.totalAmount || 0) - Number(pendingCollection._sum.paidAmount || 0));

  // Acil / Eskalasyonlar
  const escalations = await prisma.serviceOrder.findMany({
    where: { tenantId, isUrgent: true, status: { not: "COMPLETED" } },
    include: { vehicle: true },
    take: 5
  });

  // Servis Alanı Canlı Takip (Bay Map)
  const activeBays = await prisma.serviceOrder.findMany({
    where: { tenantId, status: { not: "COMPLETED" }, serviceBay: { not: null } },
    include: { assignedMechanic: true, vehicle: true },
    orderBy: { updatedAt: 'desc' }
  });

  // Stok uyarıları
  const criticalParts = await prisma.part.findMany({
    where: { tenantId, currentStock: { lte: prisma.part.fields.minStockLevel } },
    take: 5
  });

  const approvalQueue = await prisma.serviceOrder.findMany({
    where: { tenantId, status: "WAITING_APPROVAL" },
    include: { vehicle: true },
    orderBy: { updatedAt: 'desc' }
  });

  const completedToday = await prisma.serviceOrder.count({
    where: { 
      tenantId, 
      status: "COMPLETED", 
      updatedAt: { gte: today } 
    }
  });

  // Calculate last 7 days revenue natively or grouped
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  const recentInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      issueDate: { gte: sevenDaysAgo },
      status: { not: "CANCELLED" },
      type: "SALES"
    },
    select: { issueDate: true, totalAmount: true }
  });

  // Group by day index (0-disabled, basic approach)
  let weeklyTrend = [0, 0, 0, 0, 0, 0, 0];
  let daysLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]; // generic
  
  recentInvoices.forEach(inv => {
     const dayDiff = Math.floor((today.getTime() - inv.issueDate.getTime()) / (1000 * 3600 * 24));
     if (dayDiff >= 0 && dayDiff <= 6) {
        weeklyTrend[6 - dayDiff] = (weeklyTrend[6 - dayDiff] ?? 0) + Number(inv.totalAmount || 0);
     }
  });

  const criticalAlertCount =
    escalations.length + approvalQueue.length + criticalParts.length;

  return {
    error: null,
    overview: {
      dailyRevenue: dailyInvoices._sum.totalAmount || 0,
      activeServicesCount,
      collectionTotal,
      escalations,
      activeBays,
      criticalParts,
      approvalQueue,
      completedToday,
      weeklyTrend,
      criticalAlertCount,
      userName: session.user.name || "Kullanıcı"
    }
  };
}

export async function getFirmaKuyrukData() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;
  

  const orders = await prisma.serviceOrder.findMany({
    where: { 
      tenantId, 
      status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL", "COMPLETED"] } 
    },
    include: {
      vehicle: true,
      assignedMechanic: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Status mapping via API allows frontend to remain dumb
  const inProgress = orders.filter(o => o.status === "IN_PROGRESS");
  const pending = orders.filter(o => o.status === "PENDING" || o.status === "WAITING_APPROVAL"); // Basic grouping, actual might differ 

  return { error: null, inProgress, pending, orders };
}

export async function getFirmaPersonelData() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const mechanics = await prisma.mechanic.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { firstName: "asc" },
  });

  // Her usta için aktif iş emri sayısı
  const mechanicIds = mechanics.map((m) => m.id);
  const activeOrderCounts = await prisma.serviceOrder.groupBy({
    by: ["assignedMechanicId"],
    where: {
      tenantId,
      assignedMechanicId: { in: mechanicIds },
      status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
    },
    _count: { id: true },
  });

  const countMap = new Map(
    activeOrderCounts.map((r) => [r.assignedMechanicId, r._count.id])
  );

  const personelList = mechanics.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone,
    email: m.email,
    specialties: m.specialties,
    experienceYears: m.experienceYears,
    hourlyRate: m.hourlyRate ? Number(m.hourlyRate) : null,
    isActive: m.isActive,
    activeOrderCount: countMap.get(m.id) ?? 0,
  }));

  const totalActive = personelList.filter((p) => p.isActive).length;
  const totalOpenOrders = personelList.reduce((s, p) => s + p.activeOrderCount, 0);
  const avgLoad = totalActive > 0 ? Math.round((totalOpenOrders / totalActive) * 100) / 100 : 0;

  return {
    error: null,
    personel: personelList,
    summary: { totalActive, totalOpenOrders, avgLoad },
  };
}

export async function getFirmaFinansData() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const monthlyInvoices = await prisma.invoice.aggregate({
    where: { 
      tenantId, 
      issueDate: { gte: firstDayOfMonth },
      status: { not: "CANCELLED" },
      type: "SALES"
    },
    _sum: { totalAmount: true }
  });

  const pendingInvoices = await prisma.invoice.findMany({
    where: { tenantId, status: "SENT", type: "SALES" },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
    take: 10
  });

  const recentPayments = await prisma.payment.findMany({
    where: { tenantId, paymentType: "INCOMING" },
    include: { customer: true },
    orderBy: { paymentDate: "desc" },
    take: 5
  });

  return {
    error: null,
    data: {
      monthlyRevenue: Number(monthlyInvoices._sum.totalAmount || 0),
      pendingInvoices: pendingInvoices.map((i: any) => ({ ...i, totalAmount: Number(i.totalAmount), paidAmount: Number(i.paidAmount) })),
      recentPayments: recentPayments.map((p: any) => ({ ...p, amount: Number(p.amount) }))
    }
  };
}

export async function getFirmaStokData() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const criticalParts = await prisma.part.findMany({
    where: { tenantId, currentStock: { lte: prisma.part.fields.minStockLevel } },
    include: { category: true },
    orderBy: { currentStock: "asc" },
    take: 15
  });

  const recentMovements = await prisma.stockMovement.findMany({
    where: { tenantId },
    include: { part: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return {
    error: null,
    data: {
      criticalParts: criticalParts.map((p: any) => ({...p, purchasePrice: Number(p.purchasePrice), sellingPrice: Number(p.sellingPrice)})),
      recentMovements: recentMovements.map((m: any) => ({...m, quantity: Number(m.quantity)}))
    }
  }
}

export async function getFirmaServisDetay(orderId: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, tenantId, deletedAt: null },
    include: {
      vehicle: true,
      customer: true,
      assignedMechanic: true,
      items: {
        include: { part: true, mechanic: true },
      },
      inspectionForms: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return { error: "Servis emri bulunamadı", status: 404, order: null };
  }

  const serialized = {
    ...order,
    estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
    subTotal: Number(order.subTotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      discount: Number(item.discount),
      subTotal: Number(item.subTotal),
      taxAmount: Number(item.taxAmount),
      totalPrice: Number(item.totalPrice),
    })),
  };

  return { error: null, order: serialized };
}

export async function kapatFirmaServis(
  orderId: string,
  body: { qualityCheckNotes?: string }
) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId, session } = g;

  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, tenantId, deletedAt: null },
    include: { customer: true, vehicle: true },
  });

  if (!order) {
    return { error: "Servis emri bulunamadı", status: 404, order: null };
  }

  const updated = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      actualDeliveryDate: new Date(),
      qualityCheckNotes: body.qualityCheckNotes ?? null,
      qualityCheckedAt: new Date(),
      qualityCheckedBy: session.user.name ?? session.user.email ?? "Usta",
    },
  });

  // Push notification to customer (best-effort)
  try {
    const customerPhone = order.customer?.phone;
    if (customerPhone) {
      await prisma.notification.create({
        data: {
          tenantId,
          customerId: order.customerId,
          type: "IN_APP",
          channel: "push",
          recipient: customerPhone,
          subject: "Aracınız Hazır",
          body: `Servis işleminiz tamamlandı. Aracınızı teslim alabilirsiniz.`,
          status: "PENDING",
        },
      });
    }
  } catch (_) {
    // non-blocking
  }

  return {
    error: null,
    order: {
      ...updated,
      subTotal: Number(updated.subTotal),
      discountAmount: Number(updated.discountAmount),
      taxAmount: Number(updated.taxAmount),
      totalAmount: Number(updated.totalAmount),
    },
  };
}

export async function getFirmaOnayListesi() {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const orders = await prisma.serviceOrder.findMany({
    where: { tenantId, status: "WAITING_APPROVAL", deletedAt: null },
    include: {
      vehicle: true,
      customer: true,
      assignedMechanic: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    error: null,
    orders: orders.map((o) => ({
      ...o,
      estimatedCost: o.estimatedCost ? Number(o.estimatedCost) : null,
      subTotal: Number(o.subTotal),
      discountAmount: Number(o.discountAmount),
      taxAmount: Number(o.taxAmount),
      totalAmount: Number(o.totalAmount),
    })),
  };
}

export async function firmaOnayIslem(
  orderId: string,
  body: { action: "approve" | "reject"; reason?: string }
) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: orderId,
      tenantId,
      status: "WAITING_APPROVAL",
      deletedAt: null,
    },
    include: { customer: true },
  });

  if (!order) {
    return {
      error: "Onay bekleyen servis emri bulunamadı",
      status: 404,
      order: null,
    };
  }

  const newStatus = body.action === "approve" ? "IN_PROGRESS" : "CANCELLED";

  const updated = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      ...(body.action === "reject" && body.reason
        ? { internalNotes: body.reason }
        : {}),
    },
  });

  // Notify customer (best-effort)
  try {
    const phone = order.customer?.phone;
    if (phone) {
      await prisma.notification.create({
        data: {
          tenantId,
          customerId: order.customerId,
          type: "IN_APP",
          channel: "push",
          recipient: phone,
          subject:
            body.action === "approve"
              ? "Teklifiniz Onaylandı"
              : "Teklifiniz Reddedildi",
          body:
            body.action === "approve"
              ? "Servis teklifiniz onaylandı. Çalışmalar başlıyor."
              : `Servis teklifiniz reddedildi.${body.reason ? " Sebep: " + body.reason : ""}`,
          status: "PENDING",
        },
      });
    }
  } catch (_) {
    // non-blocking
  }

  return {
    error: null,
    order: {
      ...updated,
      subTotal: Number(updated.subTotal),
      discountAmount: Number(updated.discountAmount),
      taxAmount: Number(updated.taxAmount),
      totalAmount: Number(updated.totalAmount),
    },
  };
}

export async function getFirmaPersonelDetay(mechanicId: string) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const mechanic = await prisma.mechanic.findFirst({
    where: { id: mechanicId, tenantId, deletedAt: null },
  });

  if (!mechanic) {
    return { error: "Personel bulunamadı", status: 404, mechanic: null, performance: null };
  }

  // Performance metrics
  const [completedCount, activeOrders, workLogs] = await Promise.all([
    prisma.serviceOrder.count({
      where: { tenantId, assignedMechanicId: mechanicId, status: "COMPLETED" },
    }),
    prisma.serviceOrder.findMany({
      where: {
        tenantId,
        assignedMechanicId: mechanicId,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
      },
      include: { vehicle: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.workLog.findMany({
      where: { tenantId, mechanicId, durationMinutes: { not: null } },
      select: { durationMinutes: true },
      take: 50,
    }),
  ]);

  const avgDurationMinutes =
    workLogs.length > 0
      ? Math.round(
          workLogs.reduce((sum, w) => sum + (w.durationMinutes ?? 0), 0) /
            workLogs.length
        )
      : 0;

  return {
    error: null,
    mechanic: {
      ...mechanic,
      hourlyRate: mechanic.hourlyRate ? Number(mechanic.hourlyRate) : null,
    },
    performance: {
      completedCount,
      activeOrderCount: activeOrders.length,
      avgDurationMinutes,
      activeOrders: activeOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
      })),
    },
  };
}

export async function getFirmaStokHareketler({
  page = 1,
  limit = 20,
  partId,
}: {
  page?: number;
  limit?: number;
  partId?: string;
}) {
  const g = await guardTenant();
  if ("error" in g) return g as never;
  const { tenantId } = g;

  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(partId ? { partId } : {}),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { part: { select: { id: true, name: true, partNumber: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    error: null,
    movements: movements.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMusteriServisDetay(orderId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Yetkisiz erişim", status: 401, order: null };
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: orderId,
      customerId,
      ...(tenantId ? { tenantId } : {}),
      deletedAt: null,
    },
    include: {
      vehicle: true,
      assignedMechanic: true,
      items: {
        include: { part: true },
      },
      documents: true,
      serviceRating: true,
    },
  });

  if (!order) {
    return { error: "Servis emri bulunamadı", status: 404, order: null };
  }

  return {
    error: null,
    order: {
      ...order,
      estimatedCost: order.estimatedCost ? Number(order.estimatedCost) : null,
      subTotal: Number(order.subTotal),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        subTotal: Number(item.subTotal),
        taxAmount: Number(item.taxAmount),
        totalPrice: Number(item.totalPrice),
      })),
    },
  };
}

export async function createMusteriServisRating(
  orderId: string,
  body: { rating: number; comment?: string }
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Yetkisiz erişim", status: 401, rating: null };
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  // Validate order belongs to customer and is completed
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: orderId,
      customerId,
      status: "COMPLETED",
      ...(tenantId ? { tenantId } : {}),
    },
  });

  if (!order) {
    return { error: "Tamamlanmış servis emri bulunamadı", status: 404, rating: null };
  }

  // Validate rating value
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return { error: "Puan 1-5 arasında olmalıdır", status: 400, rating: null };
  }

  // Upsert rating (one per service order)
  const rating = await prisma.serviceRating.upsert({
    where: { serviceOrderId: orderId },
    create: {
      tenantId: order.tenantId,
      serviceOrderId: orderId,
      customerId,
      rating: body.rating,
      comment: body.comment ?? null,
    },
    update: {
      rating: body.rating,
      comment: body.comment ?? null,
    },
  });

  return { error: null, rating };
}

export async function createMusteriArac(body: {
  plate: string;
  brand: string;
  model: string;
  year?: number;
  imageUrl?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Yetkisiz erişim", status: 401, vehicle: null };
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  if (!body.plate || !body.brand || !body.model) {
    return { error: "Plaka, marka ve model zorunludur", status: 400, vehicle: null };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...(tenantId ? { tenantId } : {}) },
  });

  if (!customer) {
    return { error: "Müşteri bulunamadı", status: 404, vehicle: null };
  }

  const existing = await prisma.vehicle.findFirst({
    where: { plate: body.plate.toUpperCase(), tenantId: customer.tenantId },
  });

  if (existing) {
    return { error: "Bu plaka zaten kayıtlı", status: 409, vehicle: null };
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId: customer.tenantId,
      customerId: customer.id,
      plate: body.plate.toUpperCase(),
      brand: body.brand,
      model: body.model,
      year: body.year ?? null,
      imageUrl: body.imageUrl ?? null,
    },
  });

  return { error: null, vehicle };
}

const TIER_THRESHOLDS = {
  STANDARD: 0,
  BRONZE: 500,
  SILVER: 2000,
  GOLD: 5000,
  PLATINUM: 10000,
} as const;

type TierKey = keyof typeof TIER_THRESHOLDS;

function getTierProgress(points: number, currentTier: string) {
  const tiers = Object.entries(TIER_THRESHOLDS) as [TierKey, number][];
  const currentIndex = tiers.findIndex(([t]) => t === currentTier);
  const nextTier = tiers[currentIndex + 1];

  if (!nextTier) {
    return { currentTier, nextTier: "MAX", currentPoints: points, requiredPoints: 0, progressPercent: 100 };
  }

  const currentMin = TIER_THRESHOLDS[currentTier as TierKey] ?? 0;
  const nextMin = nextTier[1];
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor(((points - currentMin) / (nextMin - currentMin)) * 100))
  );

  return {
    currentTier,
    nextTier: nextTier[0],
    currentPoints: points,
    requiredPoints: nextMin,
    progressPercent,
  };
}

export async function getMusteriProfil() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Yetkisiz erişim", status: 401, customer: null };
  }

  const customerId = session.user.id;
  const tenantId = (session.user as any).tenantId;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...(tenantId ? { tenantId } : {}) },
    include: {
      vehicles: {
        where: { deletedAt: null },
        select: { id: true, plate: true, brand: true, model: true, year: true, imageUrl: true },
      },
      loyaltyTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, type: true, points: true, description: true, createdAt: true },
      },
    },
  });

  if (!customer) {
    return { error: "Müşteri bulunamadı", status: 404, customer: null };
  }

  const tierProgress = getTierProgress(customer.rewardPoints, customer.membershipTier);

  return {
    error: null,
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      rewardPoints: customer.rewardPoints,
      membershipTier: customer.membershipTier,
      balance: Number(customer.balance),
    },
    tierProgress,
    vehicles: customer.vehicles,
    recentTransactions: customer.loyaltyTransactions,
  };
}
