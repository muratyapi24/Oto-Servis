/**
 * i18n Yardımcı Fonksiyonlar
 * next-intl ile entegrasyon için kullanım örnekleri ve format yardımcıları
 */

export const SUPPORTED_LOCALES = ["tr", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Para birimi formatla
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale = "tr"
): string {
  const currency = locale === "tr" ? "TRY" : "USD";
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Tarih formatla
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale = "tr",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return new Intl.DateTimeFormat(
    locale === "tr" ? "tr-TR" : "en-US",
    options ?? defaultOptions
  ).format(d);
}

/**
 * Tarih + saat formatla
 */
export function formatDateTime(
  date: Date | string,
  locale: SupportedLocale = "tr"
): string {
  return formatDate(date, locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sayı formatla (binlik ayraç)
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale = "tr"
): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US").format(value);
}

/**
 * Servis durumunu locale'e göre çevir
 */
export const SERVICE_STATUS_LABELS: Record<string, Record<SupportedLocale, string>> = {
  PENDING: { tr: "Bekliyor", en: "Pending" },
  IN_PROGRESS: { tr: "Devam Ediyor", en: "In Progress" },
  WAITING_APPROVAL: { tr: "Onay Bekliyor", en: "Awaiting Approval" },
  COMPLETED: { tr: "Tamamlandı", en: "Completed" },
  CANCELLED: { tr: "İptal Edildi", en: "Cancelled" },
};

export function getServiceStatusLabel(
  status: string,
  locale: SupportedLocale = "tr"
): string {
  return SERVICE_STATUS_LABELS[status]?.[locale] ?? status;
}
