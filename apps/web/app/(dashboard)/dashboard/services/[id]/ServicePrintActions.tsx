"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { 
  Printer, 
  ChevronDown, 
  FileText, 
  Receipt, 
  Tag, 
  Loader2,
  FileDown
} from "lucide-react";
import type { Tenant } from "@repo/database";

const PrintLayoutsHost = dynamic(() => import("./PrintLayoutsHost"), {
  ssr: false,
  loading: () => null,
});

interface ServicePrintActionsProps {
  order: any;
  tenant: Tenant;
}

async function waitForPrintElement(elementId: string) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const element = document.getElementById(elementId);
    if (element) return element;

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return null;
}

export function ServicePrintActions({ order, tenant }: ServicePrintActionsProps) {
  const [printing, setPrinting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [renderPrintLayouts, setRenderPrintLayouts] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown((current) => {
      const next = !current;
      if (next) setRenderPrintLayouts(true);
      return next;
    });
  };

  const handlePrint = async (type: 'FORM' | 'INVOICE' | 'LABEL') => {
    setPrinting(type);
    setShowDropdown(false);
    setRenderPrintLayouts(true);
    
    try {
      const elementId = type === 'FORM' ? 'print-service-form' : type === 'INVOICE' ? 'print-invoice' : 'print-service-label';
      const filename = type === 'FORM' 
        ? `Servis_Formu_${order.orderNumber}.pdf` 
        : type === 'INVOICE' 
          ? `Fatura_${order.orderNumber}.pdf` 
          : `Etiket_${order.vehicle.plate}.pdf`;

      const options = type === 'LABEL' 
        ? { format: [60, 60] as [number, number], margin: 0, filename } 
        : { format: 'a4', margin: 10, filename };

      const printElement = await waitForPrintElement(elementId);
      if (!printElement) {
        throw new Error(`Print element ${elementId} could not be prepared.`);
      }

      const { exportElementToPdf } = await import("@/lib/pdf-utils");
      await exportElementToPdf(elementId, options);
    } catch (err) {
      console.error("Yazdırma hatası:", err);
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={toggleDropdown}
        disabled={!!printing}
        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-md font-bold text-sm whitespace-nowrap disabled:opacity-50"
      >
        {printing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Printer className="w-4 h-4" />
        )}
        {printing ? "Hazırlanıyor..." : "Yazdır / PDF"}
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-20 overflow-hidden border border-gray-100 flex flex-col p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              onClick={() => handlePrint('FORM')}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all"
            >
              <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <span>Servis Giriş Formu</span>
            </button>
            
            <button
              onClick={() => handlePrint('INVOICE')}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all"
            >
              <div className="w-8 h-8 bg-green-50 group-hover:bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <Receipt className="w-4 h-4" />
              </div>
              <span>Fatura Çıktısı</span>
            </button>
            
            <button
              onClick={() => handlePrint('LABEL')}
              className="group flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-all"
            >
              <div className="w-8 h-8 bg-orange-50 group-hover:bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                <Tag className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span>Servis Etiketi</span>
                <span className="text-[10px] text-gray-400 font-normal">60x60mm (Yağ/Filtre)</span>
              </div>
            </button>
          </div>
        </>
      )}

      {renderPrintLayouts && <PrintLayoutsHost order={order} tenant={tenant} />}
    </div>
  );
}
