/**
 * GET /api/export/accounting
 * Fatura verilerini muhasebe yazılımları için dışa aktarır.
 *
 * Query params:
 *   format  = "logo-xml" | "netsis-xml" | "excel" | "csv"  (default: logo-xml)
 *   type    = "SALES" | "PURCHASE" | "ALL"                 (default: ALL)
 *   start   = YYYY-MM-DD
 *   end     = YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvoicesForExport, type InvoiceExportRow } from "@/lib/actions/accounting.actions";

// ─── Logo / Netsis XML ───────────────────────────────────────────────────────

function toLogoXml(rows: InvoiceExportRow[]): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmt = (n: number) => n.toFixed(2);

  const lines = rows.map((inv) => {
    const itemsXml = inv.items.map((item) => `
      <FATURASATIRI>
        <ACIKLAMA>${esc(item.name)}</ACIKLAMA>
        <MIKTAR>${fmt(item.quantity)}</MIKTAR>
        <BIRIMFIYAT>${fmt(item.unitPrice)}</BIRIMFIYAT>
        <KDVORANI>${fmt(item.taxRate)}</KDVORANI>
        <ISKONTOORANI>${fmt(item.discountRate)}</ISKONTOORANI>
        <TUTARNET>${fmt(item.lineTotal)}</TUTARNET>
      </FATURASATIRI>`).join("");

    return `
  <FATURA>
    <FATNO>${esc(inv.invoiceNumber)}</FATNO>
    <FATTAR>${inv.invoiceDate}</FATTAR>
    <VADETAR>${inv.dueDate ?? inv.invoiceDate}</VADETAR>
    <FATTUR>${inv.type === "SALES" ? "Satış" : "Alış"}</FATTUR>
    <CARIKOD>${esc(inv.counterpartyTaxNumber || inv.counterpartyName)}</CARIKOD>
    <CARIADI>${esc(inv.counterpartyName)}</CARIADI>
    <VERGIAIRES>${esc(inv.counterpartyTaxOffice)}</VERGIAIRES>
    <VERGINO>${esc(inv.counterpartyTaxNumber)}</VERGINO>
    <ADRES>${esc(inv.counterpartyAddress)}</ADRES>
    <ARABATOPLAM>${fmt(inv.subTotal)}</ARABATOPLAM>
    <ISKONTO>${fmt(inv.discountAmount)}</ISKONTO>
    <KDVTUTARI>${fmt(inv.taxAmount)}</KDVTUTARI>
    <GENELTOPLAM>${fmt(inv.totalAmount)}</GENELTOPLAM>
    <DOVIZ>${inv.currency}</DOVIZ>
    <SATIRLAR>${itemsXml}
    </SATIRLAR>
  </FATURA>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<LOGOFATURALAR>
  <FIRMA>
    <AD>${esc(rows[0]?.tenantName ?? "")}</AD>
    <VERGINO>${esc(rows[0]?.tenantTaxNumber ?? "")}</VERGINO>
    <VERGIAIRES>${esc(rows[0]?.tenantTaxOffice ?? "")}</VERGIAIRES>
  </FIRMA>
${lines.join("")}
</LOGOFATURALAR>`;
}

// ─── CSV (universal) ─────────────────────────────────────────────────────────

function toCsv(rows: InvoiceExportRow[]): string {
  const headers = ["Fatura No", "Tarih", "Vade", "Tür", "Cari Ad", "Vergi No", "Ara Toplam", "İskonto", "KDV", "Genel Toplam", "Durum"];
  const body = rows.map((r) => [
    r.invoiceNumber,
    r.invoiceDate,
    r.dueDate ?? "",
    r.type === "SALES" ? "Satış" : "Alış",
    r.counterpartyName,
    r.counterpartyTaxNumber,
    r.subTotal.toFixed(2),
    r.discountAmount.toFixed(2),
    r.taxAmount.toFixed(2),
    r.totalAmount.toFixed(2),
    r.status,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return `﻿${headers.join(",")}\n${body}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "logo-xml") as string;
  const type = (searchParams.get("type") ?? "ALL") as "SALES" | "PURCHASE" | "ALL";
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;

  const result = await getInvoicesForExport({ startDate: start, endDate: end, type });
  if (result.error || !result.invoices) {
    return NextResponse.json({ error: result.error ?? "Export hatası." }, { status: 500 });
  }

  const { invoices } = result;

  if (invoices.length === 0) {
    return NextResponse.json({ error: "Belirtilen kriterlere göre fatura bulunamadı." }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    return new NextResponse(toCsv(invoices), {
      headers: {
        "Content-Type": "text/csv; charset=UTF-8",
        "Content-Disposition": `attachment; filename="faturalar-${today}.csv"`,
      },
    });
  }

  // logo-xml veya netsis-xml — aynı format, farklı dosya adı
  const xml = toLogoXml(invoices);
  const filename = format === "netsis-xml" ? `netsis-faturalar-${today}.xml` : `logo-faturalar-${today}.xml`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
