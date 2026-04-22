/**
 * UBL-TR 2.1 XML Üreticisi
 * GİB (Gelir İdaresi Başkanlığı) uyumlu e-Fatura XML belgesi üretir.
 * Standart: UBL-TR 2.1 (Universal Business Language - Türkiye)
 */

import { formatTurkishDate } from "@/lib/invoice-utils";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface UBLInvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    notes?: string | null;
    subTotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  supplier: {
    name: string;
    taxNumber: string;
    taxOffice?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string;
    phone?: string | null;
    email?: string | null;
  };
  customer: {
    name: string;
    taxNumber?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string;
    phone?: string | null;
    email?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate: number;
    lineTotal: number;
  }>;
  invoiceType?: "SATIS" | "IADE"; // Varsayılan: SATIS
}

// ---------------------------------------------------------------------------
// Yardımcı fonksiyonlar
// ---------------------------------------------------------------------------

function toDate(val: Date | string | null | undefined): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDecimal(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// 5.1 UBL-TR 2.1 XML üretici
// ---------------------------------------------------------------------------

/**
 * Fatura verilerinden UBL-TR 2.1 uyumlu XML belgesi üretir.
 *
 * @param data - Fatura verileri
 * @returns UBL-TR 2.1 XML string
 */
export function generateUBLTRXml(data: UBLInvoiceData): string {
  const { invoice, supplier, customer, items } = data;
  const invoiceType = data.invoiceType ?? "SATIS";

  const issueDate = toDate(invoice.issueDate);
  const issueDateStr = formatTurkishDate(issueDate);
  const issueTimeStr = issueDate.toTimeString().slice(0, 8);

  // UUID formatında benzersiz ID
  const uuid = `${invoice.id.replace(/-/g, "").slice(0, 8)}-${Date.now()}`;

  // Kalem satırları
  const invoiceLines = items
    .map((item, index) => {
      const lineExtensionAmount = item.quantity * item.unitPrice * (1 - item.discountRate / 100);
      const taxAmount = lineExtensionAmount * (item.taxRate / 100);

      return `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${formatDecimal(item.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="TRY">${formatDecimal(lineExtensionAmount)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${formatDecimal(taxAmount)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="TRY">${formatDecimal(lineExtensionAmount)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="TRY">${formatDecimal(taxAmount)}</cbc:TaxAmount>
          <cbc:Percent>${formatDecimal(item.taxRate)}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(item.name)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="TRY">${formatDecimal(item.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${issueDateStr.split(".").reverse().join("-")}</cbc:IssueDate>
  <cbc:IssueTime>${issueTimeStr}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>

  ${invoice.notes ? `<cbc:Note>${escapeXml(invoice.notes)}</cbc:Note>` : ""}

  <!-- Satıcı Bilgileri -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${escapeXml(supplier.taxNumber)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(supplier.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(supplier.address ?? "")}</cbc:StreetName>
        <cbc:CityName>${escapeXml(supplier.city ?? "")}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${escapeXml(supplier.country ?? "Türkiye")}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${escapeXml(supplier.taxOffice ?? "")}</cbc:RegistrationName>
        <cac:TaxScheme>
          <cbc:Name>VKN</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        ${supplier.phone ? `<cbc:Telephone>${escapeXml(supplier.phone)}</cbc:Telephone>` : ""}
        ${supplier.email ? `<cbc:ElectronicMail>${escapeXml(supplier.email)}</cbc:ElectronicMail>` : ""}
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Alıcı Bilgileri -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${customer.taxNumber ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${escapeXml(customer.taxNumber)}</cbc:ID>
      </cac:PartyIdentification>` : ""}
      <cac:PartyName>
        <cbc:Name>${escapeXml(customer.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(customer.address ?? "")}</cbc:StreetName>
        <cbc:CityName>${escapeXml(customer.city ?? "")}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${escapeXml(customer.country ?? "Türkiye")}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        ${customer.phone ? `<cbc:Telephone>${escapeXml(customer.phone)}</cbc:Telephone>` : ""}
        ${customer.email ? `<cbc:ElectronicMail>${escapeXml(customer.email)}</cbc:ElectronicMail>` : ""}
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Vergi Toplamı -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${formatDecimal(invoice.taxAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${formatDecimal(invoice.subTotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${formatDecimal(invoice.taxAmount)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Yasal Parasal Toplam -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${formatDecimal(invoice.subTotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${formatDecimal(invoice.subTotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${formatDecimal(invoice.totalAmount)}</cbc:TaxInclusiveAmount>
    ${invoice.discountAmount > 0 ? `<cbc:AllowanceTotalAmount currencyID="TRY">${formatDecimal(invoice.discountAmount)}</cbc:AllowanceTotalAmount>` : ""}
    <cbc:PayableAmount currencyID="TRY">${formatDecimal(invoice.totalAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Fatura Kalemleri -->
  ${invoiceLines}

</Invoice>`;
}

/**
 * e-Fatura XML için S3 depolama anahtarı üretir.
 * Format: e-invoices/{tenantId}/{invoiceNumber}.xml
 */
export function getEInvoiceXmlKey(tenantId: string, invoiceNumber: string): string {
  const safeNumber = invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, "_");
  return `e-invoices/${tenantId}/${safeNumber}.xml`;
}
