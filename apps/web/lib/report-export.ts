import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Report Export Utility
 * Client-Side PDF ve Excel oluşturma / indirme fonksiyonları
 */

export interface ExportColumn {
  header: string;
  dataKey: string;
}

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
}

/**
 * Verilen tablo verisini PDF olarak indirir
 */
export async function exportToPdf(options: ExportOptions) {
  const { title, filename, columns, data } = options;

  // jsPDF örneği oluştur
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Türkçe karakter desteği için font ayarları genel olarak jsPDF'te sorun yaratabilir,
  // ancak temel ASCII ve temel Türkçe karakterler genelde font embed ile tam çözülür.
  // Varsayılan helvetica kullanarak basit rapor oluşturacağız.

  doc.setFontSize(16);
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, 22);

  const head = [columns.map((c) => c.header)];
  const body = data.map((item) =>
    columns.map((c) => {
      const val = item[c.dataKey];
      return val !== null && val !== undefined ? String(val) : "";
    })
  );

  // jspdf-autotable eklentisi jsPDF instance'ına .autoTable metodunu ekler
  // TypeScript hata vermemesi için any cast kullanıyoruz:
  const docAny = doc as any;
  
  docAny.autoTable({
    startY: 28,
    head: head,
    body: body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Verilen tablo verisini Excel (XLSX) olarak indirir
 */
export async function exportToExcel(options: ExportOptions) {
  const { filename, columns, data } = options;

  // Veriyi Excel objesi formatına dönüştür (sütun başlıklarına göre map'le)
  const formattedData = data.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      row[col.header] = item[col.dataKey];
    });
    return row;
  });

  // Workbook oluştur
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

  // Dosyayı İndir
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
