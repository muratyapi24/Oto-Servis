/**
 * POST /api/webhooks/iyzico
 * iyzico ödeme bildirimleri webhook handler'ı.
 * HMAC-SHA256 imza doğrulaması yapılır.
 * Her zaman 200 döndürür (webhook retry döngüsünü önlemek için).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import {
  verifyIyzicoWebhookSignature,
  parseIyzicoWebhookPayload,
} from "@/lib/payment-providers/iyzico";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  let body = "";

  try {
    body = await request.text();
    const signature = request.headers.get("x-iyz-signature") ?? "";
    const secretKey = process.env.IYZICO_SECRET_KEY ?? "";

    // İmza doğrulama (geliştirme ortamında atla)
    if (secretKey && !verifyIyzicoWebhookSignature(body, signature, secretKey)) {
      Sentry.captureMessage("iyzico webhook imza doğrulama başarısız", {
        level: "warning",
        extra: { signature: signature.slice(0, 20) },
      });
      // Yine de 200 döndür — iyzico retry yapar
      return NextResponse.json({ received: true, verified: false }, { status: 200 });
    }

    const payload = parseIyzicoWebhookPayload(body);

    if (payload.status === "SUCCESS" && payload.basketId && payload.paymentId) {
      // Faturayı bul
      const invoice = await prisma.invoice.findFirst({
        where: { id: payload.basketId, deletedAt: null },
      });

      if (invoice) {
        const paidAmount = parseFloat(payload.paidPrice) || 0;

        await prisma.$transaction(async (tx) => {
          // Payment kaydı oluştur
          const payment = await tx.payment.create({
            data: {
              tenantId: invoice.tenantId,
              invoiceId: invoice.id,
              customerId: invoice.customerId ?? null,
              amount: paidAmount,
              paymentMethod: "IYZICO",
              paymentType: "INCOMING",
              providerPaymentId: payload.paymentId,
              notes: `iyzico ödeme ID: ${payload.paymentId}`,
            },
          });

          // Invoice.paidAmount güncelle
          const newPaidAmount = Number(invoice.paidAmount) + paidAmount;
          const totalAmount = Number(invoice.totalAmount);
          const newStatus =
            newPaidAmount >= totalAmount ? "PAID" : invoice.status;

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
              message: `iyzico ödeme alındı: ${paidAmount} TL — Fatura: ${invoice.invoiceNumber}`,
              tenantId: invoice.tenantId,
            },
          });

          return payment;
        });

        // Inngest event tetikle
        await inngest.send({
          name: "payment/created",
          data: {
            invoiceId: invoice.id,
            tenantId: invoice.tenantId,
            provider: "IYZICO",
            amount: paidAmount,
          },
        });
      }
    } else if (payload.status === "FAILURE" && payload.basketId) {
      // Başarısız ödeme girişimini kaydet
      const invoice = await prisma.invoice.findFirst({
        where: { id: payload.basketId, deletedAt: null },
      });

      if (invoice) {
        await prisma.paymentAttempt.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            provider: "IYZICO",
            amount: parseFloat(payload.paidPrice) || 0,
            errorCode: payload.errorCode ?? null,
            errorMessage: payload.errorMessage ?? null,
            rawResponse: payload as any,
          },
        });
      }
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { module: "iyzico-webhook" },
      extra: { body: body.slice(0, 500) },
    });
  }

  // Her zaman 200 döndür
  return NextResponse.json({ received: true }, { status: 200 });
}
