"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import * as Sentry from "@sentry/nextjs";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validations/payment";
import { inngest } from "@/lib/inngest/client";
import { createIyzicoPaymentForm } from "@/lib/payment-providers/iyzico";
import { createPayTRToken } from "@/lib/payment-providers/paytr";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface PaymentFilters {
  invoiceId?: string;
  customerId?: string;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// 4.5 initOnlinePayment — Online ödeme başlat
// ---------------------------------------------------------------------------

export async function initOnlinePayment(
  invoiceId: string
): Promise<ActionResult<{ checkoutToken: string; provider: string; checkoutFormContent?: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (invoice.status === "PAID") {
      return { success: false, error: "Bu fatura zaten ödenmiş." };
    }

    // Idempotency: Aynı fatura için aktif ödeme var mı?
    const activeAttempt = await prisma.paymentAttempt.findFirst({
      where: {
        invoiceId,
        tenantId,
        attemptedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Son 10 dakika
        },
      },
    });

    if (activeAttempt) {
      return {
        success: false,
        error: "Bu fatura için zaten bir ödeme işlemi devam ediyor. Lütfen bekleyin.",
      };
    }

    // Tenant'ın aktif ödeme sağlayıcısını belirle
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true },
    });

    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const provider = (settings.paymentProvider as string) ?? "IYZICO";

    const totalAmount = Number(invoice.totalAmount);
    const customerName = invoice.customer
      ? invoice.customer.companyName ||
        [invoice.customer.firstName, invoice.customer.lastName].filter(Boolean).join(" ") ||
        "Müşteri"
      : "Müşteri";

    const callbackUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/webhooks/iyzico`;

    if (provider === "IYZICO") {
      const result = await createIyzicoPaymentForm({
        price: totalAmount.toFixed(2),
        paidPrice: totalAmount.toFixed(2),
        currency: "TRY",
        basketId: invoiceId,
        callbackUrl,
        buyer: {
          id: invoice.customerId ?? "guest",
          name: customerName.split(" ")[0] ?? "Müşteri",
          surname: customerName.split(" ").slice(1).join(" ") || "—",
          email: invoice.customer?.email ?? "musteri@example.com",
          identityNumber: invoice.customer?.taxNumber ?? "11111111111",
          registrationAddress: invoice.customer?.address ?? "Türkiye",
          city: invoice.customer?.city ?? "İstanbul",
          country: "Turkey",
          ip: "127.0.0.1",
        },
        billingAddress: {
          contactName: customerName,
          city: invoice.customer?.city ?? "İstanbul",
          country: "Turkey",
          address: invoice.customer?.address ?? "Türkiye",
        },
        basketItems: invoice.items.map((item) => ({
          id: item.id,
          name: item.name,
          category1: item.type,
          itemType: "VIRTUAL" as const,
          price: Number(item.lineTotal).toFixed(2),
        })),
      });

      if (result.status === "success" && result.token) {
        return {
          success: true,
          data: {
            checkoutToken: result.token,
            provider: "IYZICO",
            checkoutFormContent: result.checkoutFormContent,
          },
        };
      }

      return { success: false, error: result.errorMessage ?? "iyzico ödeme formu oluşturulamadı." };
    }

    if (provider === "PAYTR") {
      const result = await createPayTRToken({
        email: invoice.customer?.email ?? "musteri@example.com",
        paymentAmount: Math.round(totalAmount * 100), // kuruş
        currency: "TL",
        testMode: process.env.NODE_ENV === "production" ? "0" : "1",
        noInstallment: "0",
        maxInstallment: "0",
        userName: customerName,
        userAddress: invoice.customer?.address ?? "Türkiye",
        userPhone: invoice.customer?.phone ?? "05000000000",
        merchantOid: invoiceId,
        userBasket: JSON.stringify(
          invoice.items.map((item) => [item.name, Number(item.lineTotal).toFixed(2), 1])
        ),
        userIp: "127.0.0.1",
        okUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard/finance/invoices/${invoiceId}?payment=success`,
        failUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard/finance/invoices/${invoiceId}?payment=failed`,
        lang: "tr",
        timeoutLimit: "30",
      });

      return {
        success: true,
        data: {
          checkoutToken: result.token,
          provider: "PAYTR",
        },
      };
    }

    return { success: false, error: "Aktif ödeme sağlayıcısı bulunamadı." };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Online ödeme başlatma hatası:", error);
    return { success: false, error: "Online ödeme başlatılamadı." };
  }
}

// ---------------------------------------------------------------------------
// 4.6 createPayment — Manuel ödeme kaydı
// ---------------------------------------------------------------------------

export async function createPayment(
  data: CreatePaymentInput
): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const validatedData = createPaymentSchema.parse(data);

    // Fatura varsa kontrol et
    let invoice = null;
    if (validatedData.invoiceId) {
      invoice = await prisma.invoice.findFirst({
        where: { id: validatedData.invoiceId, tenantId, deletedAt: null },
      });

      if (!invoice) {
        return { success: false, error: "Fatura bulunamadı." };
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Payment oluştur
      const newPayment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: validatedData.invoiceId ?? null,
          customerId: validatedData.customerId ?? null,
          supplierId: validatedData.supplierId ?? null,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
          paymentType: validatedData.paymentType,
          paymentDate: validatedData.paymentDate,
          notes: validatedData.notes ?? null,
        },
      });

      // Çek/senet ise CheckPayment kaydı oluştur
      if (
        (validatedData.paymentMethod === "CHECK" ||
          validatedData.paymentMethod === "PROMISSORY_NOTE") &&
        validatedData.checkDetails
      ) {
        await tx.checkPayment.create({
          data: {
            tenantId,
            paymentId: newPayment.id,
            checkNumber: validatedData.checkDetails.checkNumber,
            bankName: validatedData.checkDetails.bankName,
            dueDate: validatedData.checkDetails.dueDate,
            drawerName: validatedData.checkDetails.drawerName,
            status: "PENDING",
          },
        });
      }

      // Müşteri veya tedarikçi bakiyesini güncelle
      if (validatedData.customerId) {
        // INCOMING = müşteri ödedi → bakiye azalır (borç kapandı)
        // OUTGOING = müşteriye iade → bakiye artar
        const balanceOp = validatedData.paymentType === "INCOMING"
          ? { decrement: validatedData.amount }
          : { increment: validatedData.amount };
        await tx.customer.update({
          where: { id: validatedData.customerId },
          data: { balance: balanceOp }
        });
      }

      if (validatedData.supplierId) {
        // OUTGOING = tedarikçiye ödedik → borç azalır
        // INCOMING = tedarikçiden iade aldık → borç artar (nadir)
        const balanceOp = validatedData.paymentType === "OUTGOING"
          ? { decrement: validatedData.amount }
          : { increment: validatedData.amount };
        await tx.supplier.update({
          where: { id: validatedData.supplierId },
          data: { balance: balanceOp }
        });
      }

      // Fatura varsa paidAmount güncelle
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + validatedData.amount;
        const totalAmount = Number(invoice.totalAmount);
        const newStatus = newPaidAmount >= totalAmount ? "PAID" : invoice.status;

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          level: "INFO",
          module: "PAYMENT",
          message: `Ödeme kaydedildi: ${validatedData.amount} TL — Yöntem: ${validatedData.paymentMethod}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });

      return newPayment;
    });

    // Inngest event tetikle
    await inngest.send({
      name: "payment/created",
      data: {
        paymentId: payment.id,
        tenantId,
        invoiceId: validatedData.invoiceId ?? null,
        amount: validatedData.amount,
      },
    });

    revalidatePath("/dashboard/finance/payments");
    if (validatedData.invoiceId) {
      revalidatePath(`/dashboard/finance/invoices/${validatedData.invoiceId}`);
    }

    return { success: true, data: { paymentId: payment.id } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Ödeme kaydetme hatası:", error);
    return { success: false, error: "Ödeme kaydedilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 4.7 updateCheckPaymentStatus — Çek/senet durumu güncelle
// ---------------------------------------------------------------------------

export async function updateCheckPaymentStatus(
  paymentId: string,
  status: "COLLECTED" | "BOUNCED"
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;

    const checkPayment = await prisma.checkPayment.findFirst({
      where: { paymentId, tenantId },
      include: {
        payment: {
          include: { invoice: true, customer: true },
        },
      },
    });

    if (!checkPayment) {
      return { success: false, error: "Çek/senet kaydı bulunamadı." };
    }

    if (checkPayment.status !== "PENDING") {
      return {
        success: false,
        error: `Bu çek/senet zaten ${checkPayment.status} durumunda.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = { status };

      if (status === "COLLECTED") {
        updateData.collectedAt = new Date();
      } else if (status === "BOUNCED") {
        updateData.bouncedAt = new Date();

        // BOUNCED: Müşteri bakiyesini geri yükle (ödeme tutarı kadar)
        if (checkPayment.payment.customerId) {
          await tx.customer.update({
            where: { id: checkPayment.payment.customerId },
            data: {
              balance: {
                decrement: Number(checkPayment.payment.amount),
              },
            },
          });
        }

        // Fatura paidAmount'ı geri al
        if (checkPayment.payment.invoiceId && checkPayment.payment.invoice) {
          const newPaidAmount = Math.max(
            0,
            Number(checkPayment.payment.invoice.paidAmount) -
              Number(checkPayment.payment.amount)
          );

          await tx.invoice.update({
            where: { id: checkPayment.payment.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              status: "SENT", // PAID'den geri al
            },
          });
        }
      }

      await tx.checkPayment.update({
        where: { id: checkPayment.id },
        data: updateData,
      });

      // Tenant admin'e bildirim
      const admins = await tx.user.findMany({
        where: { tenantId, role: "TENANT_ADMIN", isActive: true },
        select: { id: true, email: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            tenantId,
            type: "IN_APP" as const,
            channel: "IN_APP",
            recipient: admin.email ?? admin.id,
            subject:
              status === "BOUNCED"
                ? "Karşılıksız Çek/Senet"
                : "Çek/Senet Tahsil Edildi",
            body:
              status === "BOUNCED"
                ? `${checkPayment.checkNumber} numaralı çek/senet karşılıksız çıktı.`
                : `${checkPayment.checkNumber} numaralı çek/senet tahsil edildi.`,
            status: "PENDING" as const,
            metadata: {
              paymentId,
              checkNumber: checkPayment.checkNumber,
              status,
            },
          })),
        });
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          level: status === "BOUNCED" ? "WARN" : "INFO",
          module: "CHECK-PAYMENT",
          message: `Çek/senet durumu güncellendi: ${checkPayment.checkNumber} → ${status}`,
          tenantId,
          userId: session.user.id ?? null,
        },
      });
    });

    revalidatePath("/dashboard/finance/payments/checks");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Çek/senet durum güncelleme hatası:", error);
    return { success: false, error: "Çek/senet durumu güncellenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 4.8 getPayments — Filtreli ödeme listesi
// ---------------------------------------------------------------------------

export async function getPayments(
  filters?: PaymentFilters
): Promise<ActionResult<{ payments: unknown[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { tenantId };

    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;

    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = filters.dateFrom;
      if (filters.dateTo) dateFilter.lte = filters.dateTo;
      where.paymentDate = dateFilter;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, companyName: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, totalAmount: true },
          },
          checkPayment: true,
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      success: true,
      data: {
        payments: JSON.parse(JSON.stringify(payments)),
        total,
      },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Ödeme listesi hatası:", error);
    return { success: false, error: "Ödemeler listelenemedi." };
  }
}

// ---------------------------------------------------------------------------
// 4.8 getUpcomingCheckPayments — Vadesi yaklaşan çek/senetler
// ---------------------------------------------------------------------------

export async function getUpcomingCheckPayments(
  daysAhead = 7
): Promise<ActionResult<{ payments: unknown[] }>> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: "Yetkisiz erişim." };
    }

    const tenantId = session.user.tenantId;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const checkPayments = await prisma.checkPayment.findMany({
      where: {
        tenantId,
        status: "PENDING",
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        payment: {
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, companyName: true, phone: true },
            },
            invoice: {
              select: { id: true, invoiceNumber: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return {
      success: true,
      data: { payments: JSON.parse(JSON.stringify(checkPayments)) },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Vadesi yaklaşan çek/senet hatası:", error);
    return { success: false, error: "Vadesi yaklaşan çek/senetler alınamadı." };
  }
}
