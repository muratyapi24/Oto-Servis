"use client";

import { useEffect, useState } from "react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getServiceStatusLabel,
  type SupportedLocale,
} from "@/lib/i18n-utils";

/**
 * Locale-aware format hook'u
 * Dashboard bileşenlerinde kullanım:
 *
 * const { currency, date, statusLabel } = useLocale();
 * currency(1500)        → "₺1.500,00" (tr) veya "$1,500.00" (en)
 * date(new Date())      → "04.04.2026" (tr) veya "04/04/2026" (en)
 * statusLabel("COMPLETED") → "Tamamlandı" (tr) veya "Completed" (en)
 */
export function useLocale() {
  const [locale, setLocale] = useState<SupportedLocale>("tr");

  useEffect(() => {
    const match = document.cookie.match(/locale=([^;]+)/);
    const detected = match?.[1];
    if (detected === "en" || detected === "tr") {
      setLocale(detected);
    }
  }, []);

  return {
    locale,
    currency: (amount: number) => formatCurrency(amount, locale),
    date: (d: Date | string) => formatDate(d, locale),
    dateTime: (d: Date | string) => formatDateTime(d, locale),
    number: (n: number) => formatNumber(n, locale),
    statusLabel: (status: string) => getServiceStatusLabel(status, locale),
  };
}
