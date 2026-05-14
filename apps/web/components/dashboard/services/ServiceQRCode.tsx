"use client";

/**
 * ServiceQRCode — İş emri QR takip kodu bileşeni
 *
 * Müşteriye verilecek QR kodu oluşturur.
 * Müşteri okutunca /servis-takip/[id] sayfasına gider (oturum gerekmez).
 */

import { useEffect, useRef, useState } from "react";

interface ServiceQRCodeProps {
  serviceOrderId: string;
  orderNumber: number;
  plate: string;
}

export function ServiceQRCode({ serviceOrderId, orderNumber, plate }: ServiceQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/servis-takip/${serviceOrderId}`
    : `/servis-takip/${serviceOrderId}`;

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, trackingUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#1e293b", light: "#ffffff" },
        });
        if (!cancelled) setLoaded(true);
      } catch {
        // qrcode library failed silently
      }
    }

    generateQR();
    return () => { cancelled = true; };
  }, [trackingUrl]);

  function handleCopy() {
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow || !canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL("image/png");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>İş Emri #${orderNumber} — QR Takip</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            img { width: 200px; height: 200px; }
            p { margin: 8px 0; font-size: 13px; color: #374151; }
            .plate { font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #1e40af; }
            .order { font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <p class="plate">${plate}</p>
          <p class="order">İş Emri #${orderNumber}</p>
          <img src="${dataUrl}" alt="QR Kod" />
          <p style="font-size:11px;color:#9ca3af;">Bu kodu okutarak aracınızın servis durumunu takip edin</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-slate-200 rounded-2xl">
      <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Müşteri Servis Takip QR</p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`rounded-lg transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
          width={200}
          height={200}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-gray-700 rounded-lg w-[200px] h-[200px]">
            <span className="text-slate-400 dark:text-slate-500 text-sm">Yükleniyor...</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[200px]">
        Müşteri bu kodu okutarak aracını takip eder — uygulama gerekmez
      </p>

      <div className="flex gap-2 w-full">
        <button
          onClick={handleCopy}
          className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-gray-800/50 transition-colors font-medium"
        >
          {copied ? "✓ Kopyalandı" : "🔗 Link Kopyala"}
        </button>
        <button
          onClick={handlePrint}
          disabled={!loaded}
          className="flex-1 text-xs py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          🖨️ Yazdır
        </button>
      </div>
    </div>
  );
}
