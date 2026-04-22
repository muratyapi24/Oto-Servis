/**
 * Paraşüt Veri Eşleştirici
 * Invoice → Paraşüt fatura, InvoiceItem → Paraşüt satır, Customer → Paraşüt müşteri
 */

import type { ParasutInvoiceInput, ParasutInvoiceLine } from "./client";

// ---------------------------------------------------------------------------
// 6.2 InvoiceItem → Paraşüt satır
// ---------------------------------------------------------------------------

export function mapInvoiceItemsToParasutLines(
  items: Array<{
    name: string;
    quantity: number | string;
    unitPrice: number | string;
    taxRate: number | string;
    discountRate?: number | string;
  }>
): ParasutInvoiceLine[] {
  if (items.length === 0) {
    // Kalem yoksa genel hizmet kalemi oluştur
    return [
      {
        name: "Genel Hizmet",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ];
  }

  return items.map((item) => ({
    name: item.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    vatRate: Number(item.taxRate),
  }));
}

// ---------------------------------------------------------------------------
// 6.2 Invoice → Paraşüt fatura input
// ---------------------------------------------------------------------------

export function mapInvoiceToParasutInput(
  invoice: {
    invoiceNumber: string | null;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    notes?: string | null;
    currency?: string;
  },
  contactId: string,
  items: Array<{
    name: string;
    quantity: number | string;
    unitPrice: number | string;
    taxRate: number | string;
    discountRate?: number | string;
  }>
): ParasutInvoiceInput {
  const issueDate = toDateString(invoice.issueDate);
  const dueDate = invoice.dueDate ? toDateString(invoice.dueDate) : issueDate;

  return {
    invoiceNumber: invoice.invoiceNumber ?? `INV-${Date.now()}`,
    issueDate,
    dueDate,
    contactId,
    lines: mapInvoiceItemsToParasutLines(items),
    currency: invoice.currency ?? "TRL",
    description: invoice.notes ?? invoice.invoiceNumber ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// 6.2 Customer → Paraşüt müşteri input
// ---------------------------------------------------------------------------

export function mapCustomerToParasutContact(customer: {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  taxNumber?: string | null;
  email?: string | null;
  phone?: string | null;
}): {
  name: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
} {
  const name =
    customer.companyName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Müşteri";

  return {
    name,
    taxNumber: customer.taxNumber ?? undefined,
    email: customer.email ?? undefined,
    phone: customer.phone ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Yardımcı: Tarih → YYYY-MM-DD string
// ---------------------------------------------------------------------------

function toDateString(val: Date | string): string {
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}
