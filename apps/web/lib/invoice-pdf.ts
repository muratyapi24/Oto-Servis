/**
 * Fatura PDF üretimi için yardımcı fonksiyonlar.
 * Sunucu tarafında HTML şablonu oluşturur; S3'e yüklenir.
 * @react-pdf/renderer yerine HTML-to-S3 yaklaşımı kullanılır.
 */

import { formatTurkishCurrency, formatTurkishDate } from "./invoice-utils";

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

export interface InvoicePdfData {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    status: string;
    subTotal: number | string;
    taxAmount: number | string;
    discountAmount: number | string;
    totalAmount: number | string;
    notes?: string | null;
    pdfUrl?: string | null;
  };
  tenant: {
    name: string;
    taxNumber?: string | null;
    taxOffice?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    taxNumber?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  items: Array<{
    name: string;
    type: string;
    quantity: number | string;
    unitPrice: number | string;
    taxRate: number | string;
    discountRate: number | string;
    lineTotal: number | string;
  }>;
}

// ---------------------------------------------------------------------------
// Yardımcı fonksiyonlar
// ---------------------------------------------------------------------------

function toNum(val: number | string): number {
  return typeof val === "string" ? parseFloat(val) || 0 : val;
}

function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function itemTypeLabel(type: string): string {
  switch (type) {
    case "LABOR":
      return "İşçilik";
    case "PART":
      return "Yedek Parça";
    case "SERVICE":
    default:
      return "Hizmet";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SENT":
      return "Gönderildi";
    case "PAID":
      return "Ödendi";
    case "CANCELLED":
      return "İptal";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Ana fonksiyon: HTML şablonu oluştur
// ---------------------------------------------------------------------------

/**
 * Fatura verilerinden tam HTML belgesi üretir.
 * Bu HTML S3'e yüklenir ve PDF görüntüleyici olarak kullanılır.
 */
export function generateInvoiceHtml(data: InvoicePdfData): string {
  const { invoice, tenant, customer, items } = data;

  const issueDate = toDate(invoice.issueDate);
  const dueDate = toDate(invoice.dueDate);

  const subTotal = toNum(invoice.subTotal);
  const taxAmount = toNum(invoice.taxAmount);
  const discountAmount = toNum(invoice.discountAmount);
  const totalAmount = toNum(invoice.totalAmount);

  // Müşteri adı
  const customerName = customer
    ? customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      "—"
    : "—";

  // Kalem satırları
  const itemRows = items
    .map((item, idx) => {
      const qty = toNum(item.quantity);
      const unitPrice = toNum(item.unitPrice);
      const taxRate = toNum(item.taxRate);
      const discountRate = toNum(item.discountRate);
      const lineTotal = toNum(item.lineTotal);

      return `
      <tr class="${idx % 2 === 0 ? "row-even" : "row-odd"}">
        <td>${escapeHtml(item.name)}</td>
        <td class="center">${escapeHtml(itemTypeLabel(item.type))}</td>
        <td class="right">${qty.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="right">${formatTurkishCurrency(unitPrice)}</td>
        <td class="right">${discountRate > 0 ? `%${discountRate.toLocaleString("tr-TR")}` : "—"}</td>
        <td class="right">%${taxRate.toLocaleString("tr-TR")}</td>
        <td class="right bold">${formatTurkishCurrency(lineTotal)}</td>
      </tr>`;
    })
    .join("\n");

  // Logo satırı
  const logoHtml = tenant.logoUrl
    ? `<img src="${escapeHtml(tenant.logoUrl)}" alt="Firma Logosu" class="logo" />`
    : `<div class="logo-placeholder">${escapeHtml(tenant.name.charAt(0).toUpperCase())}</div>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fatura ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: #3b82f6;
      color: #fff;
      font-size: 36px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .tenant-info { flex: 1; margin-left: 20px; }
    .tenant-name { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .tenant-detail { color: #64748b; font-size: 12px; line-height: 1.6; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
    .invoice-number { font-size: 14px; color: #64748b; margin-top: 4px; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 6px;
      background: #dbeafe;
      color: #1d4ed8;
    }
    .status-PAID { background: #dcfce7; color: #166534; }
    .status-CANCELLED { background: #fee2e2; color: #991b1b; }
    .status-DRAFT { background: #f1f5f9; color: #475569; }
    /* Bilgi kutuları */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .info-box-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .info-label { color: #64748b; font-size: 12px; }
    .info-value { font-weight: 600; font-size: 12px; color: #1e293b; }
    /* Tablo */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table thead tr {
      background: #1e293b;
      color: #fff;
    }
    .items-table thead th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .items-table thead th.right { text-align: right; }
    .items-table thead th.center { text-align: center; }
    .items-table tbody td {
      padding: 9px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .items-table tbody td.right { text-align: right; }
    .items-table tbody td.center { text-align: center; }
    .items-table tbody td.bold { font-weight: 600; }
    .row-even { background: #fff; }
    .row-odd { background: #f8fafc; }
    /* Toplamlar */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals-box {
      width: 320px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 9px 16px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total {
      background: #1e293b;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
    }
    .totals-row.discount { color: #dc2626; }
    /* Notlar */
    .notes-section {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .notes-title { font-size: 11px; font-weight: 700; color: #92400e; margin-bottom: 6px; text-transform: uppercase; }
    .notes-text { font-size: 12px; color: #78350f; line-height: 1.6; }
    /* Footer */
    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body { padding: 16px; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div style="display:flex;align-items:center;">
      ${logoHtml}
      <div class="tenant-info">
        <div class="tenant-name">${escapeHtml(tenant.name)}</div>
        <div class="tenant-detail">
          ${tenant.taxNumber ? `VKN: ${escapeHtml(tenant.taxNumber)}${tenant.taxOffice ? ` / ${escapeHtml(tenant.taxOffice)}` : ""}<br/>` : ""}
          ${tenant.address ? `${escapeHtml(tenant.address)}<br/>` : ""}
          ${tenant.phone ? `Tel: ${escapeHtml(tenant.phone)}<br/>` : ""}
          ${tenant.email ? `E-posta: ${escapeHtml(tenant.email)}` : ""}
        </div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">FATURA</div>
      <div class="invoice-number"># ${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="status-badge status-${escapeHtml(invoice.status)}">${escapeHtml(statusLabel(invoice.status))}</div>
    </div>
  </div>

  <!-- BİLGİ KUTULARI -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Müşteri Bilgileri</div>
      <div class="info-row">
        <span class="info-label">Ad / Unvan</span>
        <span class="info-value">${escapeHtml(customerName)}</span>
      </div>
      ${customer?.taxNumber ? `<div class="info-row"><span class="info-label">VKN / TCKN</span><span class="info-value">${escapeHtml(customer.taxNumber)}</span></div>` : ""}
      ${customer?.address ? `<div class="info-row"><span class="info-label">Adres</span><span class="info-value" style="max-width:180px;text-align:right;">${escapeHtml(customer.address)}</span></div>` : ""}
      ${customer?.phone ? `<div class="info-row"><span class="info-label">Telefon</span><span class="info-value">${escapeHtml(customer.phone)}</span></div>` : ""}
      ${customer?.email ? `<div class="info-row"><span class="info-label">E-posta</span><span class="info-value">${escapeHtml(customer.email)}</span></div>` : ""}
    </div>
    <div class="info-box">
      <div class="info-box-title">Fatura Bilgileri</div>
      <div class="info-row">
        <span class="info-label">Fatura No</span>
        <span class="info-value">${escapeHtml(invoice.invoiceNumber)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Düzenleme Tarihi</span>
        <span class="info-value">${issueDate ? formatTurkishDate(issueDate) : "—"}</span>
      </div>
      ${dueDate ? `<div class="info-row"><span class="info-label">Vade Tarihi</span><span class="info-value">${formatTurkishDate(dueDate)}</span></div>` : ""}
      <div class="info-row">
        <span class="info-label">Durum</span>
        <span class="info-value">${escapeHtml(statusLabel(invoice.status))}</span>
      </div>
    </div>
  </div>

  <!-- KALEM TABLOSU -->
  <table class="items-table">
    <thead>
      <tr>
        <th>Açıklama</th>
        <th class="center">Tür</th>
        <th class="right">Miktar</th>
        <th class="right">Birim Fiyat</th>
        <th class="right">İndirim</th>
        <th class="right">KDV</th>
        <th class="right">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px;">Kalem bulunamadı</td></tr>`}
    </tbody>
  </table>

  <!-- TOPLAMLAR -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row">
        <span>Ara Toplam</span>
        <span>${formatTurkishCurrency(subTotal)}</span>
      </div>
      ${discountAmount > 0 ? `<div class="totals-row discount"><span>İndirim</span><span>-${formatTurkishCurrency(discountAmount)}</span></div>` : ""}
      <div class="totals-row">
        <span>KDV</span>
        <span>${formatTurkishCurrency(taxAmount)}</span>
      </div>
      <div class="totals-row total">
        <span>GENEL TOPLAM</span>
        <span>${formatTurkishCurrency(totalAmount)}</span>
      </div>
    </div>
  </div>

  ${
    invoice.notes
      ? `<div class="notes-section">
    <div class="notes-title">Notlar</div>
    <div class="notes-text">${escapeHtml(invoice.notes)}</div>
  </div>`
      : ""
  }

  <!-- FOOTER -->
  <div class="footer">
    Bu belge ${escapeHtml(tenant.name)} tarafından MS Oto Servis platformu aracılığıyla oluşturulmuştur.
    ${issueDate ? `Düzenleme tarihi: ${formatTurkishDate(issueDate)}` : ""}
  </div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// S3 anahtar üretici
// ---------------------------------------------------------------------------

/**
 * Fatura PDF'i için S3 depolama anahtarı üretir.
 *
 * Format: invoices/{tenantId}/{invoiceNumber}.pdf
 * Örnek:  invoices/tenant-abc/2025-0001.pdf
 */
export function getInvoicePdfKey(tenantId: string, invoiceNumber: string): string {
  // Dosya adında güvenli olmayan karakterleri temizle
  const safeNumber = invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, "_");
  return `invoices/${tenantId}/${safeNumber}.pdf`;
}
