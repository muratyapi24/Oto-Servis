/**
 * POST /api/webhooks/paytr
 * PayTR ödeme bildirimleri webhook handler'ı.
 * MD5 hash doğrulaması yapılır.
 * PayTR gereksinimi: "OK" string döndür.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { verifyPayTRWebhookHash } from "@/lib/payment-providers/paytr";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  let formData: URLSearchParams | null = null;

  try {
    const body = await request.text();
    formData = new URLSearchParams(body);

    const merchantOid = formData.get("merchant_oid") ?? "";
    const status = formData.get("status") ?? "";
    const totalAmount = formData.get("total_amount") ?? "";
    const hash = formData.get("hash") ?? "";

    const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";

    // Hash doğrulama
    if (
      merchantKey &&
      merchantSalt &&
      !verifyPayTRWebhookHash(merchantOid, status, totalAmount, merchantKey, merchantSalt, hash)
    ) {
      Sentry.captureMessage("PayTR webhook hash doğrulama başarısız", {
        level: "warning",
        extra: { merchantOid },
      });
      return new NextResponse("INVALID_HASH", { status: 200 });
    }

    if (status === "success" && merchantOid) {
      // Faturayı bul
      const invoice = await prisma.invoice.findFirst({
        where: { id: merchantOid, deletedAt: null },
      });

      if (invoice) {
        const paidAmount = parseFloat(totalAmount) / 100; // kuruş → TL

        await prisma.$transaction(async (tx) => {
          // Payment kaydı oluştur
          await tx.payment.create({
            data: {
              tenantId: invoice.tenantId,
              invoiceId: invoice.id,
              customerId: invoice.customerId ?? null,
              amount: paidAmount,
              paymentMethod: "PAYTR",
              paymentType: "INCOMING",
              notes: `PayTR ödeme — Sipariş: ${merchantOid}`,
            },
          });

          // Invoice.paidAmount güncelle
          const newPaidAmount = Number(invoice.paidAmount) + paidAmount;
          const totalInvoiceAmount = Number(invoice.totalAmount);
          const newStatus =
            newPaidAmount >= totalInvoiceAmount ? "PAID" : invoice.status;

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });

          // AuditLog
          await tx.auditLog.create({
            data: {
              level: "INFO",
              module: "PAYMENT-WEBHOOK",
              message: `PayTR ödeme alındı: ${paidAmount} TL — Fatura: ${invoice.invoiceNumber}`,
              tenantId: invoice.tenantId,
            },
          });
        });

        // Inngest event tetikle
        await inngest.send({
          name: "payment/created",
          data: {
            invoiceId: invoice.id,
            tenantId: invoice.tenantId,
            provider: "PAYTR",
            amount: paidAmount,
          },
        });
      }
    } else if (status === "failed" && merchantOid) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: merchantOid, deletedAt: null },
      });

      if (invoice) {
        await prisma.paymentAttempt.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            provider: "PAYTR",
            amount: parseFloat(totalAmount) / 100,
            errorCode: formData.get("failed_reason_code") ?? null,
            errorMessage: formData.get("failed_reason_msg") ?? null,
          },
        });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { module: "paytr-webhook" },
    });
  }

  // PayTR "OK" bekler
  return new NextResponse("OK", { status: 200 });
}
