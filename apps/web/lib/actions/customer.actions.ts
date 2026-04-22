"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import { CreateCustomerInput, createCustomerSchema, UpdateCustomerInput, updateCustomerSchema } from "@/lib/validations/customers";
import { getCached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/cache";
import { checkLimit } from "@/lib/subscription-guard";

/**
 * Creates a new customer for the current tenant.
 */
export async function createCustomer(data: CreateCustomerInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { error: "Yetkisiz erişim. Sadece yetkili personeller işlem yapabilir." };
    }

    // Subscription Guard — Müşteri limit kontrolü
    const limitCheck = await checkLimit(session.user.tenantId, "maxCustomers");
    if (!limitCheck.allowed) {
      return { error: limitCheck.message || "Müşteri limitinize ulaştınız. Paketinizi yükseltin." };
    }

    const validatedData = createCustomerSchema.parse(data);

    // Telefon no benzersizliği kontrolü (Aynı tenant içinde aynı telefon olmamalı)
    const existingPhone = await prisma.customer.findFirst({
      where: {
        tenantId: session.user.tenantId,
        phone: validatedData.phone,
      },
    });

    if (existingPhone) {
      return { error: "Bu telefon numarasına ait bir müşteri kaydı zaten var." };
    }

    const newCustomer = await prisma.customer.create({
      data: {
        tenantId: session.user.tenantId,
        type: validatedData.type,
        firstName: validatedData.type === 'INDIVIDUAL' ? validatedData.firstName : null,
        lastName: validatedData.type === 'INDIVIDUAL' ? validatedData.lastName : null,
        companyName: validatedData.type === 'CORPORATE' ? validatedData.companyName : null,
        contactPerson: validatedData.type === 'CORPORATE' ? validatedData.contactPerson : null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        secondaryPhone: validatedData.secondaryPhone || null,
        taxOffice: validatedData.taxOffice || null,
        taxNumber: validatedData.taxNumber || null,
        city: validatedData.city || null,
        district: validatedData.district || null,
        address: validatedData.address || null,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath("/dashboard/customers");
    await invalidateCache(CacheKeys.customerList(session.user.tenantId));
    return { success: "Müşteri başarıyla oluşturuldu.", customerId: newCustomer.id };
  } catch (error: any) {
    console.error("Müşteri oluşturulurken hata:", error);
    if (error.name === "ZodError") {
      return { error: "Lütfen bilgileri geçerli formatta doldurun." };
    }
    return { error: "Müşteri oluşturulurken bir hata oluştu." };
  }
}

/**
 * Retrieves all customers for the current tenant.
 */
export async function getCustomers() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      throw new Error("Yetkisiz erişim");
    }

    const tenantId = session.user.tenantId;
    const cacheKey = CacheKeys.customerList(tenantId);

    return getCached(cacheKey, CacheTTL.customerList, async () => {
      const customers = await prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { vehicles: true } },
          vehicles: {
            where: { deletedAt: null },
            select: { id: true, plate: true, brand: true, model: true },
          },
        },
      });

      return {
        customers: customers.map(c => ({
          ...c,
          balance: c.balance ? Number(c.balance.toString()) : 0,
        })),
      };
    });
  } catch (error: any) {
    console.error("Müşteriler getirilirken hata:", error);
    return { error: "Müşteriler yüklenemedi." };
  }
}

export async function updateCustomer(data: UpdateCustomerInput) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    const validated = updateCustomerSchema.parse(data);

    const existingPhone = await prisma.customer.findFirst({
      where: { tenantId: session.user.tenantId, phone: validated.phone, id: { not: validated.id } }
    });
    if (existingPhone) return { error: "Bu telefon numarası başka bir müşteriye ait." };

    await prisma.customer.update({
      where: { id: validated.id, tenantId: session.user.tenantId },
      data: {
        type: validated.type,
        firstName: validated.type === 'INDIVIDUAL' ? validated.firstName : null,
        lastName: validated.type === 'INDIVIDUAL' ? validated.lastName : null,
        companyName: validated.type === 'CORPORATE' ? validated.companyName : null,
        contactPerson: validated.type === 'CORPORATE' ? validated.contactPerson : null,
        email: validated.email || null,
        phone: validated.phone,
        secondaryPhone: validated.secondaryPhone || null,
        taxOffice: validated.taxOffice || null,
        taxNumber: validated.taxNumber || null,
        city: validated.city || null,
        district: validated.district || null,
        address: validated.address || null,
        notes: validated.notes || null,
      }
    });

    revalidatePath("/dashboard/customers");
    await invalidateCache(CacheKeys.customerList(session.user.tenantId));
    return { success: "Müşteri başarıyla güncellendi." };
  } catch (error) {
    console.error(error);
    return { error: "Güncelleme sırasında bir hata oluştu." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { error: "Yetkisiz erişim" };

    await prisma.customer.update({
      where: { id, tenantId: session.user.tenantId },
      data: { deletedAt: new Date() }
    });

    revalidatePath("/dashboard/customers");
    await invalidateCache(CacheKeys.customerList(session.user.tenantId));
    return { success: "Müşteri sistemden (Soft-Delete) başarıyla kaldırıldı." };
  } catch (err) {
    console.error(err);
    return { error: "Müşteri silinirken bir engel ile karşılaşıldı." };
  }
}

/**
 * Retrieves a single customer by ID with related vehicles, service orders, payments and invoice count.
 */
export async function getCustomerById(id: string): Promise<{
  customer: {
    id: string;
    type: "INDIVIDUAL" | "CORPORATE";
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string;
    secondaryPhone: string | null;
    taxOffice: string | null;
    taxNumber: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    notes: string | null;
    balance: number;
    isBlacklisted: boolean;
    vehicles: {
      id: string;
      plate: string;
      brand: string;
      model: string;
      year: number | null;
    }[];
    serviceOrders: {
      id: string;
      orderNumber: number;
      status: string;
      receptionDate: Date;
      totalAmount: number;
      vehicle: { plate: string; brand: string; model: string };
    }[];
    payments: {
      id: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
      notes: string | null;
    }[];
    _count: { invoices: number };
  } | null;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { customer: null, error: "Yetkisiz erişim" };
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
      include: {
        vehicles: {
          where: { deletedAt: null },
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            year: true,
          },
        },
        serviceOrders: {
          orderBy: { receptionDate: "desc" },
          include: {
            vehicle: {
              select: { plate: true, brand: true, model: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
            notes: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!customer) {
      return { customer: null };
    }

    // Serialize Decimal fields
    const serialized = {
      ...customer,
      balance: customer.balance ? Number(customer.balance.toString()) : 0,
      serviceOrders: customer.serviceOrders.map((order) => ({
        ...order,
        totalAmount: order.totalAmount ? Number(order.totalAmount.toString()) : 0,
      })),
      payments: customer.payments.map((payment) => ({
        ...payment,
        amount: payment.amount ? Number(payment.amount.toString()) : 0,
      })),
    };

    return { customer: serialized };
  } catch (error) {
    console.error("Müşteri detayı getirilirken hata:", error);
    return { customer: null, error: "Müşteri detayı yüklenemedi." };
  }
}
