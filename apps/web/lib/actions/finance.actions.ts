"use server";

import { guardTenant } from "@/lib/guards";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import { recordPaymentSchema, RecordPaymentInput, createInvoiceSchema, CreateInvoiceInput } from "@/lib/validations/finance";
import dayjs from "dayjs";
import { createParasutInvoice, createParasutPayment, upsertParasutContact } from "@/lib/parasut";

/** Finans Dashboard - Ana İstatistikleri ve Fişleri Döndürür **/
export async function getFinanceDashboard() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // 1. Ödenmemiş Faturaları Çek (Gereken Listelemeler İçin)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ["SENT", "DRAFT"] },
        type: "SALES",
        deletedAt: null
      },
      include: {
        customer: { select: { id: true, type: true, firstName: true, lastName: true, companyName: true } }
      },
      orderBy: { dueDate: "asc" }
    });

    const serializedInvoices = unpaidInvoices.map(inv => ({
      ...inv,
      subTotal: Number(inv.subTotal),
      taxAmount: Number(inv.taxAmount),
      discountAmount: Number(inv.discountAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      customerName: inv.customer?.type === "CORPORATE" ? inv.customer?.companyName : `${inv.customer?.firstName} ${inv.customer?.lastName}`
    }));

    // 2. Günlük Nakit Akışı (Sadece INCOMING/Tahsilatlar)
    const today = dayjs().startOf('day').toDate();
    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    
    const todayPayments = await prisma.payment.aggregate({
      where: { tenantId, paymentType: "INCOMING", paymentDate: { gte: today } },
      _sum: { amount: true }
    });
    
    const yesterdayPayments = await prisma.payment.aggregate({
      where: { tenantId, paymentType: "INCOMING", paymentDate: { gte: yesterday, lt: today } },
      _sum: { amount: true }
    });

    const dailyCashIn = Number(todayPayments._sum.amount || 0);
    const yesterdayCashIn = Number(yesterdayPayments._sum.amount || 0);
    
    let dailyTrend = 0;
    if (yesterdayCashIn > 0) {
      dailyTrend = ((dailyCashIn - yesterdayCashIn) / yesterdayCashIn) * 100;
    }

    // 3. Genel Kasa (Total Inflow - Total Outflow)
    const allIn = await prisma.payment.aggregate({
      where: { tenantId, paymentType: "INCOMING" },
      _sum: { amount: true }
    });
    const allOut = await prisma.payment.aggregate({
      where: { tenantId, paymentType: "OUTGOING" },
      _sum: { amount: true }
    });

    const totalInflow = Number(allIn._sum.amount || 0);
    const totalOutflow = Number(allOut._sum.amount || 0);
    const netCash = totalInflow - totalOutflow;

    // 4. Tahsilat Yaşlandırması (Receivables Aging)
    const now = new Date();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const sixtyDaysAgo = dayjs().subtract(60, 'day').toDate();

    let aging_0_30 = 0, aging_31_60 = 0, aging_60_plus = 0;

    serializedInvoices.forEach(inv => {
      const remaining = inv.totalAmount - inv.paidAmount;
      if (remaining <= 0) return;
      
      const issueDate = new Date(inv.issueDate);
      if (issueDate >= thirtyDaysAgo) {
        aging_0_30 += remaining;
      } else if (issueDate < thirtyDaysAgo && issueDate >= sixtyDaysAgo) {
        aging_31_60 += remaining;
      } else {
        aging_60_plus += remaining;
      }
    });

    // 5. Yakında Ödenecek Giderler (Gelecek demo için simülatif faturalar veya Purchases)
    // Şimdilik Sales harici faturalar Purchases olarak ele alınabilir.
    const upcomingExpensesRows = await prisma.invoice.findMany({
      where: { tenantId, type: "PURCHASE", status: { in: ["SENT", "DRAFT"] } },
      orderBy: { dueDate: "asc" },
      take: 5
    });
    const upcomingExpenses = upcomingExpensesRows.map(expense => ({
       id: expense.id,
       title: expense.invoiceNumber || expense.notes || "Gider Faturası (Tedarikçi)",
       amount: Number(expense.totalAmount),
       paidAmount: Number(expense.paidAmount || 0),
       dueDate: expense.dueDate,
       supplierId: expense.supplierId
    }));

    return {
      unpaidInvoices: serializedInvoices,
      cashMetrics: {
        dailyCashIn,
        dailyTrend: Math.round(dailyTrend),
        netCash,
        totalInflow,
        totalOutflow,
      },
      receivables: {
        aging_0_30,
        aging_31_60,
        aging_60_plus
      },
      upcomingExpenses
    };

  } catch (err) {
    Sentry.captureException(err);
    console.error("Finance Dashboard Error:", err);
    return { error: "Finans verileri alınırken bir hata oluştu." };
  }
}

/** Yeni Fatura/Borçlandırma Kaydı **/
export async function createInvoice(data: CreateInvoiceInput) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const val = createInvoiceSchema.parse(data);

    // Kaba Taslak Fatura (Item vb detay girmeden doğrudan bakiye borçlandırma)
    const newInvoice = await prisma.$transaction(async (tx) => {
       const { getNextInvoiceNumber } = await import('@/lib/sequence-utils');
       const invoiceNumber = await getNextInvoiceNumber(tenantId, tx);

       const inv = await tx.invoice.create({
         data: {
           tenantId,
           customerId: val.customerId,
           invoiceNumber,
           type: val.type as any,
           status: val.status as any,
           issueDate: new Date(val.issueDate),
           dueDate: val.dueDate ? new Date(val.dueDate) : undefined,
           subTotal: val.subTotal,
           taxAmount: val.taxAmount,
           discountAmount: val.discountAmount,
           totalAmount: val.totalAmount,
           notes: val.notes
         }
       });

       // Müşteri kartındaki bakiyeyi güncelle (Sales ise cari artar = Borç, Purchase ise cari azalır)
       if (val.status !== "DRAFT" && val.status !== "CANCELLED") {
          const balanceOp = val.type === "SALES" ? { increment: val.totalAmount } : { decrement: val.totalAmount };
          await tx.customer.update({
            where: { id: val.customerId },
            data: { balance: balanceOp }
          });
       }

       return inv;
    });

    revalidatePath("/dashboard/finances");
    return { success: "Fatura başarıyla oluşturuldu.", invoiceId: newInvoice.id };
  } catch (err) {
    Sentry.captureException(err);
    console.error("Create Invoice Error:", err);
    return { error: "Fatura oluşturulamadı." };
  }
}

/** Tahsilat/Kasa Hareketi (Ödeme Girişi - Çıkışı) **/
export async function recordPayment(data: RecordPaymentInput) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const val = recordPaymentSchema.parse(data);

    await prisma.$transaction(async (tx) => {
      // 1. Ödeme tablosuna işle
      await tx.payment.create({
        data: {
          tenantId,
          customerId: val.customerId ?? null,
          supplierId: val.supplierId ?? null,
          invoiceId: val.invoiceId ?? null,
          amount: val.amount,
          paymentMethod: val.paymentMethod as any,
          paymentType: val.paymentType as any,
          paymentDate: new Date(val.paymentDate),
          notes: val.notes ?? null
        }
      });

      // 2. Müşteri bakiyesini güncelle
      if (val.customerId) {
        // INCOMING = müşteri ödedi → borç azalır; OUTGOING = müşteriye iade → borç artar
        const balanceOp = val.paymentType === "INCOMING"
          ? { decrement: val.amount }
          : { increment: val.amount };
        await tx.customer.update({
          where: { id: val.customerId },
          data: { balance: balanceOp }
        });
      }

      // 3. Tedarikçi bakiyesini güncelle
      if (val.supplierId) {
        // OUTGOING = tedarikçiye ödedik → borç azalır; INCOMING = tedarikçiden iade → borç artar
        const balanceOp = val.paymentType === "OUTGOING"
          ? { decrement: val.amount }
          : { increment: val.amount };
        await tx.supplier.update({
          where: { id: val.supplierId },
          data: { balance: balanceOp }
        });
      }

      // 4. Fatura ödeniyorsa fatura bakiyesini güncelle
      if (val.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: val.invoiceId } });
        if (inv) {
          const newPaidAmount = Number(inv.paidAmount) + val.amount;
          const status = newPaidAmount >= Number(inv.totalAmount) ? "PAID" : inv.status;
          await tx.invoice.update({
            where: { id: val.invoiceId },
            data: { paidAmount: newPaidAmount, status }
          });
        }
      }
    });

    revalidatePath("/dashboard/finances");
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/suppliers");
    return { success: "Ödeme / Tahsilat başarıyla kaydedildi." };
  } catch(err: any){
    Sentry.captureException(err);
    console.error("Record Payment Error:", err);
    return { error: "Ödeme işlemi kaydedilirken hata oluştu." };
  }
}

export async function getInvoiceById(id: string): Promise<{ invoice?: any; error?: string }> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true, email: true },
        },
        supplier: {
          select: { id: true, name: true, phone: true, email: true },
        },
        serviceOrder: {
          select: { id: true, orderNumber: true },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        stockMovements: true,
      },
    });

    if (!invoice) {
      return { error: "Fatura bulunamadı" };
    }

    const serialized = {
      ...invoice,
      subTotal: Number(invoice.subTotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      stockMovements: invoice.stockMovements.map((sm) => ({
        ...sm,
        quantity: Number(sm.quantity),
      })),
    };

    return { invoice: serialized };
  } catch (error) {
    Sentry.captureException(error);
    console.error("getInvoiceById hatası:", error);
    return { error: "Fatura bilgileri alınamadı." };
  }
}

/** Faturaya ödeme ekle **/
export async function addPaymentToInvoice(data: {
  invoiceId: string;
  amount: number;
  paymentMethod: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER";
  paymentDate: string;
  notes?: string;
}): Promise<{ success?: string; error?: string }> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) return { error: "Fatura bulunamadı" };

    const currentPaid = Number(invoice.paidAmount);
    const total = Number(invoice.totalAmount);

    if (currentPaid + data.amount > total) {
      return { error: "Ödeme tutarı kalan bakiyeyi aşamaz" };
    }

    const newPaidAmount = currentPaid + data.amount;
    const newStatus = newPaidAmount >= total ? "PAID" : invoice.status;

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          tenantId,
          invoiceId: data.invoiceId,
          customerId: invoice.customerId ?? undefined,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentType: "INCOMING",
          paymentDate: new Date(data.paymentDate),
          notes: data.notes,
        },
      });

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus as any,
        },
      });

      // Müşteri bakiyesini güncelle (tahsilat → borç azalır)
      if (invoice.customerId) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { balance: { decrement: data.amount } }
        });
      }
    });

    revalidatePath("/dashboard/finances");
    return { success: "Ödeme kaydedildi" };
  } catch (err) {
    Sentry.captureException(err);
    console.error("addPaymentToInvoice hatası:", err);
    return { error: "Ödeme kaydedilemedi." };
  }
}

/** Faturayı Güncelle **/
export async function updateInvoice(id: string, data: Partial<CreateInvoiceInput>) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;
    
    await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id, tenantId, deletedAt: null }
      });
      if (!existing) throw new Error("Fatura bulunamadı");

      // Bakiye kontrolü (Eski durum DRAFT/CANCELLED, yeni durum aktifse bakiyeyi artır; tam tersiyse azalt)
      if (data.status && data.status !== existing.status) {
        const wasInactive = existing.status === "DRAFT" || existing.status === "CANCELLED";
        const isNowActive = data.status !== "DRAFT" && data.status !== "CANCELLED";

        if (wasInactive && isNowActive) {
          // Fatura aktifleşti -> Bakiyeye ekle (Satış ise müşteri borcu artar, Alış ise tedarikçi borcumuz azalır)
          if (existing.customerId && existing.type === "SALES") {
             await tx.customer.update({ where: { id: existing.customerId }, data: { balance: { increment: existing.totalAmount } } });
          } else if (existing.supplierId && existing.type === "PURCHASE") {
             await tx.supplier.update({ where: { id: existing.supplierId }, data: { balance: { decrement: existing.totalAmount } } });
          }
        } else if (!wasInactive && !isNowActive) {
          // Fatura pasife düştü -> Bakiyeden düş
          if (existing.customerId && existing.type === "SALES") {
             await tx.customer.update({ where: { id: existing.customerId }, data: { balance: { decrement: existing.totalAmount } } });
          } else if (existing.supplierId && existing.type === "PURCHASE") {
             await tx.supplier.update({ where: { id: existing.supplierId }, data: { balance: { increment: existing.totalAmount } } });
          }
        }
      }

      await tx.invoice.update({
        where: { id },
        data: {
          issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: data.status as any,
          notes: data.notes
        }
      });
    });

    revalidatePath("/dashboard/finances");
    return { success: "Fatura güncellendi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Fatura güncellenemedi." };
  }
}

/** Faturayı İptal Et (ve bakiyeleri geri al) **/
export async function cancelInvoice(id: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findFirst({ where: { id, tenantId: tenantId, deletedAt: null } });
      if (!inv) throw new Error("Fatura bulunamadı.");
      if (inv.status === "CANCELLED") throw new Error("Zaten iptal edilmiş.");

      // 1. Bakiye işlemleri — fatura DRAFT değilse geriye dönük işlenebilir.
      if (inv.status !== "DRAFT") {
        if (inv.customerId && inv.type === "SALES") {
          await tx.customer.update({
            where: { id: inv.customerId },
            data: { balance: { decrement: inv.totalAmount } }
          });
        } else if (inv.supplierId && inv.type === "PURCHASE") {
          await tx.supplier.update({
            where: { id: inv.supplierId },
            data: { balance: { decrement: inv.totalAmount } }
          });
        }
      }

      // 2. Stok hareketlerini geri al (PURCHASE fatura iptali → stok düşür)
      const stockMovements = await tx.stockMovement.findMany({
        where: { invoiceId: inv.id }
      });
      for (const mv of stockMovements) {
        const qty = Number(mv.quantity);
        if (mv.type === "IN") {
          // Giriş hareketi → stoğu geri düşür
          await tx.part.update({
            where: { id: mv.partId },
            data: { currentStock: { decrement: qty } }
          });
          // Ters hareket kaydı oluştur
          await tx.stockMovement.create({
            data: {
              tenantId,
              partId: mv.partId,
              quantity: qty,
              type: "OUT",
              reason: `İptal — ${inv.invoiceNumber}`,
              invoiceId: inv.id,
            }
          });
        } else if (mv.type === "OUT") {
          // Çıkış hareketi → stoğu geri artır
          await tx.part.update({
            where: { id: mv.partId },
            data: { currentStock: { increment: qty } }
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              partId: mv.partId,
              quantity: qty,
              type: "IN",
              reason: `İptal — ${inv.invoiceNumber}`,
              invoiceId: inv.id,
            }
          });
        }
      }

      // 3. Ödeme iadelerini işle — yapılmış ödemelerin bakiye etkisini geri al
      const payments = await tx.payment.findMany({ where: { invoiceId: inv.id } });
      for (const p of payments) {
        const amount = Number(p.amount);
        if (p.customerId) {
          // Müşteriden tahsil edilmişti → bakiyeyi geri artır
          if (p.paymentType === "INCOMING") {
            await tx.customer.update({
              where: { id: p.customerId },
              data: { balance: { increment: amount } }
            });
          } else {
            await tx.customer.update({
              where: { id: p.customerId },
              data: { balance: { decrement: amount } }
            });
          }
        }
        if (p.supplierId) {
          // Tedarikçiye ödenmişti → bakiyeyi geri artır (borcumuz geri gelir)
          if (p.paymentType === "OUTGOING") {
            await tx.supplier.update({
              where: { id: p.supplierId },
              data: { balance: { increment: amount } }
            });
          } else {
            await tx.supplier.update({
              where: { id: p.supplierId },
              data: { balance: { decrement: amount } }
            });
          }
        }
      }

      await tx.invoice.update({
        where: { id },
        data: { status: "CANCELLED", paidAmount: 0 }
      });
    });

    revalidatePath("/dashboard/finances");
    return { success: "Fatura iptal edildi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Fatura iptal edilemedi." };
  }
}

/** İş Emrinden Fatura Oluştur **/
export async function generateInvoiceFromServiceOrder(serviceOrderId: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const so = await prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, tenantId, deletedAt: null },
      include: { customer: true }
    });

    if (!so) return { error: "İş emri bulunamadı." };

    const existing = await prisma.invoice.findFirst({ where: { serviceOrderId, deletedAt: null } });
    if (existing) return { error: "Bu iş emrine ait fatura zaten var.", invoiceId: existing.id };

    const inv = await prisma.$transaction(async (tx) => {
      const { getNextInvoiceNumber } = await import('@/lib/sequence-utils');
      const invoiceNumber = await getNextInvoiceNumber(tenantId, tx);

      const newInv = await tx.invoice.create({
        data: {
          tenantId,
          customerId: so.customerId,
          serviceOrderId: so.id,
          invoiceNumber,
          type: "SALES",
          status: "DRAFT",
          issueDate: new Date(),
          subTotal: so.subTotal,
          discountAmount: so.discountAmount,
          taxAmount: so.taxAmount,
          totalAmount: so.totalAmount,
        }
      });
      return newInv;
    });

    revalidatePath("/dashboard/finances");
    return { success: "Fatura taslağı oluşturuldu.", invoiceId: inv.id };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Fatura oluşturulamadı." };
  }
}

/** Paraşüt'e Fatura Senkronizasyonu **/
export async function syncInvoiceToParasut(invoiceId: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const integration = await prisma.accountingIntegration.findUnique({
      where: { tenantId }
    });
    if (!integration || !integration.isActive) return { error: "Muhasebe entegrasyonu aktif değil." };

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: { customer: true, serviceOrder: { include: { items: true } } }
    });

    if (!invoice || invoice.type !== "SALES") return { error: "Senkronizasyona uygun satış faturası bulunamadı." };
    
    let contactName = "Bilinmiyor";
    if (invoice.customer) {
        contactName = invoice.customer.type === "CORPORATE" && invoice.customer.companyName
          ? invoice.customer.companyName
          : `${invoice.customer.firstName ?? ""} ${invoice.customer.lastName ?? ""}`.trim();
    }
    
    const parasutCreds = {
      clientId: integration.clientId,
      clientSecret: integration.clientSecret,
      username: integration.username,
      password: integration.password,
      companyId: integration.companyId
    };

    const parasutContactId = await upsertParasutContact(
      parasutCreds,
      {
        name: contactName,
        taxNumber: invoice.customer?.taxNumber || undefined,
        email: invoice.customer?.email || undefined,
        phone: invoice.customer?.phone || undefined,
      }
    );

    // Items map
    let lines = [];
    if (invoice.serviceOrder && invoice.serviceOrder.items.length > 0) {
       lines = invoice.serviceOrder.items.map(i => ({
         name: i.name,
         quantity: Number(i.quantity),
         unitPrice: Number(i.unitPrice),
         vatRate: Number(i.taxRate)
       }));
    } else {
       lines = [
         { name: "Genel Hizmet Bedeli", quantity: 1, unitPrice: Number(invoice.subTotal), vatRate: 20 }
       ];
    }

    const { id: externalId } = await createParasutInvoice(parasutCreds, {
      invoiceNumber: invoice.invoiceNumber ?? `FAT-SYNC-${Date.now()}`,
      issueDate: invoice.issueDate.toISOString().split('T')[0]!,
      customerName: contactName,
      lines: lines
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { externalId }
    });

    return { success: "Fatura Paraşüt'e senkronize edildi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Paraşüt senkronizasyonu başarısız: " + (error instanceof Error ? error.message : String(error)) };
  }
}

/** Aylık Gelir Gider Raporu **/
export async function getMonthlyFinanceReport() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // Son 6 ayın trendi (basitleştirilmiş)
    const sixMonthsAgo = dayjs().subtract(6, 'month').startOf('month').toDate();

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        issueDate: { gte: sixMonthsAgo }
      },
      select: { type: true, totalAmount: true, issueDate: true }
    });

    // Gruplama logic'i
    const report: Record<string, { income: number; expense: number }> = {};
    for (let i = 0; i < 6; i++) {
        const d = dayjs().subtract(i, 'month').format('MMM YYYY');
        report[d] = { income: 0, expense: 0 };
    }

    invoices.forEach(inv => {
      const monthStr = dayjs(inv.issueDate).format('MMM YYYY');
      if (report[monthStr]) {
        if (inv.type === "SALES") report[monthStr].income += Number(inv.totalAmount);
        else if (inv.type === "PURCHASE") report[monthStr].expense += Number(inv.totalAmount);
      }
    });

    const data = Object.entries(report).map(([month, vals]) => ({
      month,
      income: vals.income,
      expense: vals.expense,
      profit: vals.income - vals.expense
    })).reverse();

    return { data };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Aylık rapor alınamadı." };
  }
}
