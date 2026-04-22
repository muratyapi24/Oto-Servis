/**
 * Fatura hesaplama ve formatlama yardımcı fonksiyonları.
 * Tüm fonksiyonlar saf (pure) — yan etki yok, DB çağrısı yok.
 */

// ---------------------------------------------------------------------------
// Kalem Toplam Hesaplama
// ---------------------------------------------------------------------------

/**
 * Tek bir fatura kalemi için toplam tutarı hesaplar.
 *
 * Formül: lineTotal = (quantity * unitPrice * (1 - discountRate/100)) * (1 + taxRate/100)
 *
 * @param quantity     - Miktar (> 0)
 * @param unitPrice    - KDV hariç birim fiyat (>= 0)
 * @param discountRate - İndirim oranı yüzde olarak (0-100)
 * @param taxRate      - KDV oranı yüzde olarak (0-100)
 * @returns Hesaplanan satır toplamı (KDV dahil, indirim sonrası)
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountRate: number,
  taxRate: number
): number {
  const discountedPrice = unitPrice * (1 - discountRate / 100);
  const lineSubTotal = quantity * discountedPrice;
  const lineTotal = lineSubTotal * (1 + taxRate / 100);
  return lineTotal;
}

// ---------------------------------------------------------------------------
// Fatura Toplamları
// ---------------------------------------------------------------------------

export interface InvoiceTotals {
  /** KDV hariç, indirim sonrası ara toplam */
  subTotal: number;
  /** Toplam KDV tutarı */
  taxAmount: number;
  /** Toplam indirim tutarı */
  discountAmount: number;
  /** Genel toplam: subTotal + taxAmount */
  totalAmount: number;
}

export interface InvoiceItemInput {
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}

/**
 * Kalem listesinden fatura toplamlarını hesaplar.
 *
 * - subTotal: her kalem için (quantity * unitPrice * (1 - discountRate/100)) toplamı
 * - taxAmount: her kalem için (lineTotal - satır subTotal) toplamı
 * - discountAmount: her kalem için (quantity * unitPrice * discountRate/100) toplamı
 * - totalAmount: subTotal + taxAmount
 *
 * @param items - Fatura kalemleri listesi
 * @returns Hesaplanan fatura toplamları
 */
export function calculateInvoiceTotals(items: InvoiceItemInput[]): InvoiceTotals {
  let subTotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  for (const item of items) {
    const grossLineSubTotal = item.quantity * item.unitPrice;
    const lineDiscount = grossLineSubTotal * (item.discountRate / 100);
    const lineSubTotal = grossLineSubTotal - lineDiscount;
    const lineTax = lineSubTotal * (item.taxRate / 100);

    subTotal += lineSubTotal;
    taxAmount += lineTax;
    discountAmount += lineDiscount;
  }

  const totalAmount = subTotal + taxAmount;

  return {
    subTotal,
    taxAmount,
    discountAmount,
    totalAmount,
  };
}

// ---------------------------------------------------------------------------
// Fatura Numarası Üretimi
// ---------------------------------------------------------------------------

/**
 * Kalıcı fatura numarası üretir.
 *
 * Format: {YIL}-{SIRA:04d}
 * Örnek: 2025-0001
 *
 * @param year - Takvim yılı (örn. 2025)
 * @param seq  - Sıra numarası (1'den başlar)
 * @returns Formatlanmış fatura numarası
 */
export function generateInvoiceNumber(year: number, seq: number): string {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

/**
 * DRAFT faturalar için geçici numara üretir.
 *
 * Format: TASLAK-{timestamp}
 * Örnek: TASLAK-1735689600000
 *
 * @returns Geçici taslak fatura numarası
 */
export function generateDraftInvoiceNumber(): string {
  return `TASLAK-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Tarih ve Para Birimi Formatlama
// ---------------------------------------------------------------------------

/**
 * Tarihi Türkçe formatında döndürür.
 *
 * Format: DD.MM.YYYY
 * Örnek: 15.01.2025
 *
 * @param date - Formatlanacak tarih
 * @returns DD.MM.YYYY formatında tarih string'i
 */
export function formatTurkishDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Para tutarını Türkçe para birimi formatında döndürür.
 *
 * Format: ₺#.###,##
 * Örnek: ₺1.234,56
 *
 * @param amount - Formatlanacak tutar
 * @returns Türkçe para birimi formatında string
 */
export function formatTurkishCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
