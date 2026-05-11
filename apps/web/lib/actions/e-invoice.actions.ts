"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { generateUBLTRXml, getEInvoiceXmlKey } from "@/lib/e-invoice/ubl-tr-generator";
import {
  sendEInvoiceToGIB,
  queryEInvoiceStatusFromGIB,
  cancelEInvoiceAtGIB,
  checkEInvoiceEligibilityAtGIB,
} from "@/lib/e-invoice/integrator-client";
import { uploadFile } from "@/lib/storage";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 5.3 sendEInvoice — e-Fatura gönder
// ---------------------------------------------------------------------------

export async function sendEInvoice(
  invoiceId: string
): Promise<ActionResult<{ uuid: string; ettn: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (invoice.status === "DRAFT") {
      return { success: false, error: "Taslak fatura e-Fatura olarak gönderilemez." };
    }

    // Müşteri e-Fatura mükellefi mi kontrol et
    const customerTaxNumber = invoice.customer?.taxNumber ?? "";
    const eligibility = await checkEInvoiceEligibilityAtGIB(customerTaxNumber);

    if (!eligibility.isEligible) {
      return {
        success: false,
        error: "Müşteri e-Fatura mükellefi değil. e-Arşiv kullanın.",
      };
    }

    // UBL-TR XML üret
    const customerName = invoice.customer
      ? invoice.customer.companyName ||
        [invoice.customer.firstName, invoice.customer.lastName].filter(Boolean).join(" ") ||
        "Müşteri"
      : "Müşteri";

    const xmlContent = generateUBLTRXml({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? invoice.id,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        subTotal: Number(invoice.subTotal),
        taxAmount: Number(invoice.taxAmount),
        discountAmount: Number(invoice.discountAmount),
        totalAmount: Number(invoice.totalAmount),
      },
      supplier: {
        name: invoice.tenant.name,
        taxNumber: invoice.tenant.taxNumber ?? "",
        taxOffice: invoice.tenant.taxOffice,
        address: invoice.tenant.address,
        city: invoice.tenant.city,
        phone: invoice.tenant.phone,
        email: invoice.tenant.email,
      },
      customer: {
        name: customerName,
        taxNumber: invoice.customer?.taxNumber,
        address: invoice.customer?.address,
        city: invoice.customer?.city,
        phone: invoice.customer?.phone,
        email: invoice.customer?.email,
      },
      items: invoice.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discountRate: Number(item.discountRate),
        lineTotal: Number(item.lineTotal),
      })),
    });

    // XML'i S3'e kaydet (5.5)
    const xmlKey = getEInvoiceXmlKey(tenantId, invoice.invoiceNumber ?? invoice.id);
    await uploadFile(
      Buffer.from(xmlContent, "utf-8"),
      xmlKey,
      "application/xml; charset=utf-8"
    );

    // GİB'e gönder
    const result = await sendEInvoiceToGIB(xmlContent, invoice.invoiceNumber ?? invoice.id);

    if (!result.success) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          eInvoiceStatus: "REJECTED",
          eInvoiceErrorMessage: result.errorMessage,
          eInvoiceType: "E_INVOICE",
        },
      });

      // Tenant admin'e bildirim
      await notifyTenantAdmins(tenantId, "e-Fatura Gönderilemedi", result.errorMessage ?? "");

      return { success: false, error: result.errorMessage };
    }

    // Başarılı — Invoice güncelle
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        eInvoiceStatus: "SENT",
        eInvoiceUUID: result.uuid,
        eInvoiceETTN: result.ettn,
        eInvoiceXmlUrl: xmlKey,
        eInvoiceType: "E_INVOICE",
        eInvoiceSentAt: new Date(),
        eInvoiceErrorMessage: null,
      },
    });

    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true, data: { uuid: result.uuid!, ettn: result.ettn! } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("e-Fatura gönderme hatası:", error);
    return { success: false, error: "e-Fatura gönderilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 5.3 sendEArchiveInvoice — e-Arşiv faturası oluştur ve e-posta gönder
// ---------------------------------------------------------------------------

export async function sendEArchiveInvoice(
  invoiceId: string
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    const customerEmail = invoice.customer?.email;
    if (!customerEmail) {
      return { success: false, error: "Müşteri e-posta adresi bulunamadı." };
    }

    const customerName = invoice.customer
      ? invoice.customer.companyName ||
        [invoice.customer.firstName, invoice.customer.lastName].filter(Boolean).join(" ") ||
        "Müşteri"
      : "Müşteri";

    // XML üret ve S3'e kaydet
    const xmlContent = generateUBLTRXml({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? invoice.id,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        subTotal: Number(invoice.subTotal),
        taxAmount: Number(invoice.taxAmount),
        discountAmount: Number(invoice.discountAmount),
        totalAmount: Number(invoice.totalAmount),
      },
      supplier: {
        name: invoice.tenant.name,
        taxNumber: invoice.tenant.taxNumber ?? "",
        taxOffice: invoice.tenant.taxOffice,
        address: invoice.tenant.address,
        city: invoice.tenant.city,
        phone: invoice.tenant.phone,
        email: invoice.tenant.email,
      },
      customer: {
        name: customerName,
        taxNumber: invoice.customer?.taxNumber,
        address: invoice.customer?.address,
        city: invoice.customer?.city,
        phone: invoice.customer?.phone,
        email: invoice.customer?.email,
      },
      items: invoice.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discountRate: Number(item.discountRate),
        lineTotal: Number(item.lineTotal),
      })),
    });

    const xmlKey = getEInvoiceXmlKey(tenantId, invoice.invoiceNumber ?? invoice.id);
    await uploadFile(
      Buffer.from(xmlContent, "utf-8"),
      xmlKey,
      "application/xml; charset=utf-8"
    );

    // Resend ile e-posta gönder (5.6)
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@msotoservis.com",
      to: customerEmail,
      subject: `e-Arşiv Fatura: ${invoice.invoiceNumber} — ${invoice.tenant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>e-Arşiv Faturanız</h2>
          <p>Sayın ${customerName},</p>
          <p>${invoice.tenant.name} tarafından düzenlenen e-Arşiv faturanız ekte yer almaktadır.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Fatura No</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Toplam Tutar</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${Number(invoice.totalAmount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px;">Bu e-posta MS Oto Servis platformu tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      `,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.xml`,
          content: Buffer.from(xmlContent, "utf-8"),
        },
      ],
    });

    // Invoice güncelle
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        eInvoiceStatus: "SENT",
        eInvoiceXmlUrl: xmlKey,
        eInvoiceType: "E_ARCHIVE",
        eInvoiceSentAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("e-Arşiv gönderme hatası:", error);
    return { success: false, error: "e-Arşiv faturası gönderilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 5.3 checkEInvoiceEligibility — Müşteri e-Fatura mükellefiyeti sorgula
// ---------------------------------------------------------------------------

export async function checkEInvoiceEligibility(
  taxNumber: string
): Promise<ActionResult<{ isEligible: boolean }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const result = await checkEInvoiceEligibilityAtGIB(taxNumber);
    return { success: true, data: { isEligible: result.isEligible } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Mükellef sorgulanamadı." };
  }
}

// ---------------------------------------------------------------------------
// 5.3 cancelEInvoice — e-Fatura iptal
// ---------------------------------------------------------------------------

export async function cancelEInvoice(
  invoiceId: string
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice) {
      return { success: false, error: "Fatura bulunamadı." };
    }

    if (!invoice.eInvoiceUUID) {
      return { success: false, error: "Bu fatura için e-Fatura UUID bulunamadı." };
    }

    const result = await cancelEInvoiceAtGIB(invoice.eInvoiceUUID);

    if (!result.success) {
      return { success: false, error: result.errorMessage };
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { eInvoiceStatus: "CANCELLED" },
    });

    revalidatePath(`/dashboard/finances/invoices/${invoiceId}`);
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "e-Fatura iptal edilemedi." };
  }
}

// ---------------------------------------------------------------------------
// 5.3 queryEInvoiceStatus — e-Fatura durumu sorgula
// ---------------------------------------------------------------------------

export async function queryEInvoiceStatus(
  invoiceId: string
): Promise<ActionResult<{ status: string }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
    });

    if (!invoice || !invoice.eInvoiceUUID) {
      return { success: false, error: "e-Fatura UUID bulunamadı." };
    }

    const result = await queryEInvoiceStatusFromGIB(invoice.eInvoiceUUID);

    if (result.success && result.status) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { eInvoiceStatus: result.status },
      });
    }

    return { success: true, data: { status: result.status ?? "PENDING" } };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "e-Fatura durumu sorgulanamadı." };
  }
}

// ---------------------------------------------------------------------------
// Yardımcı: Tenant admin'e bildirim gönder
// ---------------------------------------------------------------------------

async function notifyTenantAdmins(
  tenantId: string,
  subject: string,
  message: string
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { tenantId, role: "TENANT_ADMIN", isActive: true },
      select: { id: true, email: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          tenantId,
          type: "IN_APP" as const,
          channel: "IN_APP",
          recipient: admin.email ?? admin.id,
          subject,
          body: message,
          status: "PENDING" as const,
        })),
      });
    }
  } catch {
    // Bildirim hatası kritik değil
  }
}
