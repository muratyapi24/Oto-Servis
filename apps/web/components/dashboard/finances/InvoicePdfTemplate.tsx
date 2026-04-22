"use client";

import React from "react";
import dayjs from "dayjs";
import { Receipt } from "lucide-react";

export default function InvoicePdfTemplate({ invoice }: { invoice: any }) {
  if (!invoice) return null;

  const getCustomerName = () => {
    if (invoice.type === "PURCHASE" && invoice.supplier) return invoice.supplier.name;
    if (invoice.customer) {
      return invoice.customer.type === "CORPORATE" 
             ? invoice.customer.companyName 
             : `${invoice.customer.firstName ?? ""} ${invoice.customer.lastName ?? ""}`.trim();
    }
    return "Müşteri Bilgisi Yok";
  };

  return (
    <div 
      id={`invoice-pdf-${invoice.id}`} 
      style={{
        width: "794px", // A4 Width in pixels (96 DPI)
        minHeight: "1123px", // A4 Height in pixels
        padding: "40px",
        backgroundColor: "white",
        color: "black",
        fontFamily: "sans-serif",
        position: "absolute",
        left: "-9999px", // Hide it off-screen
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #f3f4f6", paddingBottom: "20px", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>FATURA</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            Fatura No: {invoice.invoiceNumber ?? `#${invoice.id.slice(0,8)}`}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>MS Oto Servis A.Ş.</h2>
          <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "4px", lineHeight: "1.5" }}>
            Örnek Sanayi Sitesi, 1. Blok No: 12<br/>
            Kadıköy, İstanbul<br/>
            Vergi No: 1234567890 | Vergi Dairesi: Kadıköy
          </p>
        </div>
      </div>

      {/* Bill To & Details */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px" }}>Sayın</h3>
          <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>{getCustomerName()}</p>
          {invoice.customer && (
             <p style={{ fontSize: "14px", color: "#4b5563", marginTop: "4px" }}>
               {invoice.customer.phone && <span>Tel: {invoice.customer.phone}<br/></span>}
               {invoice.customer.taxNumber && <span>Vergi No: {invoice.customer.taxNumber}</span>}
             </p>
          )}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}>
            <strong>Tarih:</strong> {dayjs(invoice.issueDate).format("DD/MM/YYYY")}
          </p>
          {invoice.dueDate && (
             <p style={{ fontSize: "14px", margin: "0 0 4px 0" }}>
               <strong>Vade Tarihi:</strong> {dayjs(invoice.dueDate).format("DD/MM/YYYY")}
             </p>
          )}
          <p style={{ fontSize: "14px", margin: "0" }}>
            <strong>Durum:</strong> {invoice.status === "PAID" ? "Ödendi" : invoice.status === "DRAFT" ? "Taslak" : "Beklemede"}
          </p>
        </div>
      </div>

      {/* Lines Table */}
      <div style={{ marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", color: "#374151" }}>Açıklama</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#374151" }}>Miktar</th>
              <th style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#374151" }}>Tutar (₺)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "16px 12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>Servis ve Parça Hizmet Bedeli</td>
              <td style={{ padding: "16px 12px", borderBottom: "1px solid #f3f4f6", textAlign: "right", fontSize: "14px" }}>1</td>
              <td style={{ padding: "16px 12px", borderBottom: "1px solid #f3f4f6", textAlign: "right", fontSize: "14px" }}>
                 {invoice.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
        <div style={{ width: "250px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#4b5563" }}>
            <span>Ara Toplam:</span>
            <span>₺{invoice.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
          </div>
          {invoice.discountAmount > 0 && (
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#ef4444" }}>
               <span>İndirim:</span>
               <span>-₺{invoice.discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
             </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#4b5563" }}>
            <span>KDV:</span>
            <span>₺{invoice.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid #e5e7eb", fontSize: "18px", fontWeight: "bold" }}>
            <span>Genel Toplam:</span>
            <span>₺{invoice.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: "40px", borderTop: "1px solid #e5e7eb", fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
        <p style={{ margin: 0 }}>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
        <p style={{ margin: "4px 0 0 0" }}>Bu belge e-arşiv faturası bilgi kopyasıdır.</p>
      </div>
    </div>
  );
}
