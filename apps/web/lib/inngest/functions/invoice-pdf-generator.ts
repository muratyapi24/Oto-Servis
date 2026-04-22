/**
 * Inngest arka plan işi: Fatura PDF Üreticisi
 *
 * Tetikleyici: invoice/status-changed event'i
 * Koşul: Fatura SENT veya PAID durumuna geçtiğinde
 * İşlem: HTML şablonu oluştur → S3'e yükle → Invoice.pdfUrl güncelle
 */

import { inngest } from "../client";
import { prisma } from "@repo/database";
import { generateInvoiceHtml, getInvoicePdfKey } from "@/lib/invoice-pdf";
import { uploadFile } from "@/lib/storage";
import * as Sentry from "@sentry/nextjs";

export const invoicePdfGeneratorFunction = inngest.createFunction(
  {
    id: "invoice-pdf-generator",
    name: "Fatura PDF Üretici",
    retries: 2,
    triggers: [{ event: "invoice/status-changed" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { invoiceId, tenantId, status } = event.data as {
      invoiceId: string;
      tenantId: string;
      status: string;
      generatePdf?: boolean;
    };

    // Sadece SENT veya PAID durumunda PDF üret
    if (status !== "SENT" && status !== "PAID") {
      return {
        skipped: true,
        reason: "PDF yalnızca SENT veya PAID durumunda üretilir",
      };
    }

    // Invoice + InvoiceItem + Tenant + Customer verilerini çek
    const invoice = await step.run("fetch-invoice", async () => {
      return prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          customer: true,
          tenant: true,
        },
      });
    }) as Awaited<ReturnType<typeof prisma.invoice.findFirst<{
      include: { items: true; customer: true; tenant: true };
    }>>>;

    if (!invoice) {
      return { skipped: true, reason: "Fatura bulunamadı" };
    }

    // PDF zaten varsa atla
    if (invoice.pdfUrl) {
      return { skipped: true, reason: "PDF zaten mevcut", pdfKey: invoice.pdfUrl };
    }

    // HTML oluştur ve S3'e yükle
    const pdfKey = await step.run("generate-and-upload-pdf", async () => {
      try {
        const htmlContent = generateInvoiceHtml({
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber ?? "TASLAK",
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            subTotal: Number(invoice.subTotal),
            taxAmount: Number(invoice.taxAmount),
            discountAmount: Number(invoice.discountAmount),
            totalAmount: Number(invoice.totalAmount),
            notes: invoice.notes,
          },
          tenant: {
            name: invoice.tenant.name,
            taxNumber: invoice.tenant.taxNumber,
            taxOffice: invoice.tenant.taxOffice,
            address: invoice.tenant.address,
            phone: invoice.tenant.phone,
            email: invoice.tenant.email,
            logoUrl: invoice.tenant.logoUrl,
          },
          customer: invoice.customer
            ? {
                firstName: invoice.customer.firstName,
                lastName: invoice.customer.lastName,
                companyName: invoice.customer.companyName,
                taxNumber: invoice.customer.taxNumber,
                address: invoice.customer.address,
                phone: invoice.customer.phone,
                email: invoice.customer.email,
              }
            : null,
          items: invoice.items.map((item) => ({
            name: item.name,
            type: item.type,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            discountRate: Number(item.discountRate),
            lineTotal: Number(item.lineTotal),
          })),
        });

        const key = getInvoicePdfKey(tenantId, invoice.invoiceNumber ?? invoice.id);

        // HTML içeriğini S3'e yükle (text/html olarak sakla)
        await uploadFile(
          Buffer.from(htmlContent, "utf-8"),
          key,
          "text/html; charset=utf-8"
        );

        return key;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { module: "invoice-pdf-generator" },
          extra: { invoiceId, tenantId },
        });
        throw err;
      }
    });

    // Invoice.pdfUrl güncelle
    await step.run("update-invoice-pdf-url", async () => {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl: pdfKey },
      });
    });

    return { success: true, pdfKey };
  }
);
