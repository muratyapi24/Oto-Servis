"use client";

import React, { useState, useEffect } from "react";
import { 
  Printer, 
  ChevronDown, 
  FileText, 
  Receipt, 
  Tag, 
  Loader2,
  FileDown
} from "lucide-react";
import { exportElementToPdf } from "@/lib/pdf-utils";
import { ServiceFormLayout, InvoiceLayout, ServiceLabelLayout } from "./PrintLayouts";
import { Tenant } from "@repo/database";

interface ServicePrintActionsProps {
  order: any;
  tenant: Tenant;
}

export function ServicePrintActions({ order, tenant }: ServicePrintActionsProps) {
  const [printing, setPrinting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = async (type: 'FORM' | 'INVOICE' | 'LABEL') => {
    setPrinting(type);
    setShowDropdown(false);
    
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

      // Elementin DOM'da olduğuna emin ol (hidden render alanı sayesinde var olacak)
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
        onClick={() => setShowDropdown(!showDropdown)}
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

      {/* RENDER AREA (Hidden from view) */}
      {mounted && (
      <div 
        style={{ 
          position: 'absolute', 
          top: '-9999px', 
          left: '-9999px', 
          pointerEvents: 'none',
          zIndex: -1000
        }}
      >
        <div id="print-service-form">
          <ServiceFormLayout order={order} tenant={tenant} />
        </div>
        <div id="print-invoice">
          <InvoiceLayout order={order} tenant={tenant} />
        </div>
        <div id="print-service-label">
          <ServiceLabelLayout order={order} tenant={tenant} />
        </div>
      </div>
      )}
    </div>
  );
}
