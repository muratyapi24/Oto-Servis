/**
 * Inngest Job: Paraşüt Senkronizasyonu
 * invoice/status-changed, payment/created, invoice/cancelled event'lerini dinler.
 * Exponential backoff ile 3 retry.
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import {
  getParasutToken,
  findOrCreateParasutContact,
  createParasutInvoice,
  updateParasutInvoice,
  cancelParasutInvoice,
  createParasutPayment,
} from "@/lib/parasut/client";
import {
  mapInvoiceToParasutInput,
  mapCustomerToParasutContact,
} from "@/lib/parasut/mapper";
import * as Sentry from "@sentry/nextjs";

export const parasutSyncFunction = inngest.createFunction(
  {
    id: "parasut-sync",
    name: "Paraşüt Senkronizasyonu",
    retries: 3,
    triggers: [
      { event: "invoice/status-changed" },
      { event: "payment/created" },
      { event: "invoice/cancelled" },
    ],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { tenantId, invoiceId, paymentId } = event.data as {
      tenantId: string;
      invoiceId?: string;
      paymentId?: string;
      status?: string;
    };

    // AccountingIntegration aktif mi kontrol et
    const integration = await step.run("check-integration", async () => {
      return prisma.accountingIntegration.findFirst({
        where: { tenantId, isActive: true, provider: "PARASUT" },
      });
    });

    if (!integration) {
      return { skipped: true, reason: "Paraşüt entegrasyonu aktif değil" };
    }

    const creds = {
      clientId: integration.clientId,
      clientSecret: integration.clientSecret,
      username: integration.username,
      password: integration.password,
      companyId: integration.companyId,
    };

    // Fatura senkronizasyonu
    if (invoiceId && event.name !== "invoice/cancelled") {
      const invoice = await step.run("fetch-invoice", async () => {
        return prisma.invoice.findFirst({
          where: { id: invoiceId, tenantId },
          include: {
            items: { orderBy: { sortOrder: "asc" } },
            customer: true,
          },
        });
      });

      if (!invoice || invoice.status === "DRAFT") {
        return { skipped: true, reason: "Fatura DRAFT veya bulunamadı" };
      }

      let operation = "CREATE_INVOICE";
      let success = false;
      let errorMessage: string | undefined;

      try {
        // Müşteri bul veya oluştur (6.6 deduplication)
        const contactInput = invoice.customer
          ? mapCustomerToParasutContact(invoice.customer)
          : { name: "Müşteri" };

        const contactId = await step.run("upsert-contact", async () => {
          return findOrCreateParasutContact(creds, contactInput);
        });

        const invoiceInput = mapInvoiceToParasutInput(
          {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            notes: invoice.notes,
          },
          contactId,
          invoice.items.map((item: any) => ({
            name: item.name,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            discountRate: Number(item.discountRate),
          }))
        );

        if (invoice.externalId) {
          // Güncelle
          operation = "UPDATE_INVOICE";
          await step.run("update-invoice", async () => {
            return updateParasutInvoice(creds, invoice.externalId!, invoiceInput);
          });
        } else {
          // Oluştur
          const result = await step.run("create-invoice", async () => {
            return createParasutInvoice(creds, invoiceInput);
          });

          // externalId kaydet
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { externalId: result.id },
          });
        }

        success = true;
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
        Sentry.captureException(err, {
          tags: { module: "parasut-sync" },
          extra: { invoiceId, tenantId, operation },
        });
        throw err; // Inngest retry için
      } finally {
        // 6.4 ParasutSyncLog kaydı
        await prisma.parasutSyncLog.create({
          data: {
            tenantId,
            invoiceId,
            operation,
            status: success ? "SUCCESS" : "FAILED",
            errorMessage: errorMessage ?? null,
          },
        });
      }
    }

    // Fatura iptal senkronizasyonu
    if (invoiceId && event.name === "invoice/cancelled") {
      const invoice = await step.run("fetch-invoice-for-cancel", async () => {
        return prisma.invoice.findFirst({
          where: { id: invoiceId, tenantId },
        });
      });

      if (!invoice?.externalId) {
        return { skipped: true, reason: "Fatura Paraşüt'te kayıtlı değil" };
      }

      let success = false;
      let errorMessage: string | undefined;

      try {
        await step.run("cancel-invoice", async () => {
          return cancelParasutInvoice(creds, invoice.externalId!);
        });
        success = true;
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
        Sentry.captureException(err, {
          tags: { module: "parasut-sync-cancel" },
          extra: { invoiceId, tenantId },
        });
        throw err;
      } finally {
        await prisma.parasutSyncLog.create({
          data: {
            tenantId,
            invoiceId,
            operation: "CANCEL_INVOICE",
            status: success ? "SUCCESS" : "FAILED",
            errorMessage: errorMessage ?? null,
          },
        });
      }
    }

    // Ödeme senkronizasyonu
    if (paymentId && event.name === "payment/created") {
      const payment = await step.run("fetch-payment", async () => {
        return prisma.payment.findFirst({
          where: { id: paymentId, tenantId },
          include: { invoice: true },
        });
      });

      if (!payment?.invoice?.externalId) {
        return { skipped: true, reason: "Ödeme faturası Paraşüt'te kayıtlı değil" };
      }

      let success = false;
      let errorMessage: string | undefined;

      try {
        await step.run("create-payment", async () => {
          return createParasutPayment(creds, {
            invoiceId: payment.invoice!.externalId!,
            amount: Number(payment.amount),
            date: payment.paymentDate.toISOString().slice(0, 10),
            description: payment.notes ?? "MS Oto Servis Tahsilatı",
          });
        });
        success = true;
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
        Sentry.captureException(err, {
          tags: { module: "parasut-sync-payment" },
          extra: { paymentId, tenantId },
        });
        throw err;
      } finally {
        await prisma.parasutSyncLog.create({
          data: {
            tenantId,
            paymentId,
            invoiceId: payment.invoiceId ?? null,
            operation: "CREATE_PAYMENT",
            status: success ? "SUCCESS" : "FAILED",
            errorMessage: errorMessage ?? null,
          },
        });
      }
    }

    return { success: true };
  }
);
