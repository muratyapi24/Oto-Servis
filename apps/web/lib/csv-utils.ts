/**
 * Basit CSV oluşturma ve indirme yardımcıları.
 * papaparse yerine kullanılır — dış bağımlılık gerektirmez.
 */

type CsvRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Nesne dizisini CSV string'e dönüştürür.
 * Başlık satırı otomatik olarak ilk nesnenin key'lerinden oluşturulur.
 */
export function objectsToCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]!);
  const escape = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    // Virgül, çift tırnak veya satır sonu içeriyorsa tırnak içine al
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * CSV string'i dosya olarak indirir.
 * BOM karakteri eklenerek Excel'de Türkçe karakter desteği sağlanır.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Nesne dizisini CSV olarak indirir (kısayol).
 */
export function exportToCsv(rows: CsvRow[], filename: string): void {
  const csv = objectsToCsv(rows);
  downloadCsv(csv, filename);
}
