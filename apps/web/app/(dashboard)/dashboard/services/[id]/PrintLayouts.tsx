"use client";

import React from "react";
import dayjs from "dayjs";
import { ServiceOrder, Tenant, Customer, Vehicle, ServiceItem } from "@repo/database";

interface LayoutProps {
  order: any; // Mapped order with items
  tenant: Tenant;
}

/**
 * 1. SERVİS FORMU (A4)
 */
export const ServiceFormLayout = ({ order, tenant }: LayoutProps) => {
  return (
    <div id="print-service-form" className="bg-white p-8 w-[210mm] min-h-[297mm] text-gray-900 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
        <div className="flex gap-4 items-center">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              {tenant.name.substring(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-blue-900">{tenant.name}</h1>
            <p className="text-sm text-gray-600 max-w-xs">{tenant.address}</p>
            <p className="text-sm font-bold text-gray-800">{tenant.phone} | {tenant.email}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-blue-900 text-white px-4 py-2 font-bold mb-2 rounded shadow-sm">SERVİS İŞ FORMU</div>
          <p className="text-lg font-bold">No: <span className="text-blue-700">#{order.orderNumber}</span></p>
          <p className="text-sm text-gray-500">Tarih: {dayjs(order.receptionDate).format('DD.MM.YYYY HH:mm')}</p>
        </div>
      </div>

      {/* CUSTOMER & VEHICLE INFO */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/30">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Müşteri Bilgileri</h3>
          <p className="font-bold text-lg">{order.customer.type === 'CORPORATE' ? order.customer.companyName : `${order.customer.firstName} ${order.customer.lastName}`}</p>
          <p className="text-sm mt-1">{order.customer.phone}</p>
          <p className="text-sm">{order.customer.address}</p>
          <p className="text-sm font-mono mt-1 text-gray-500">{order.customer.taxOffice} / {order.customer.taxNumber}</p>
        </div>
        <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/30">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Araç Bilgileri</h3>
          <p className="font-bold text-xl text-blue-800">{order.vehicle.plate}</p>
          <p className="font-bold">{order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})</p>
          <p className="text-sm mt-1">KM: {order.vehicle.mileage.toLocaleString()}</p>
          <p className="text-sm">Şasi: {order.vehicle.chassisNo || '-'}</p>
        </div>
      </div>

      {/* COMPLAINTS & NOTES */}
      <div className="mb-8 space-y-4">
        <div className="border border-gray-200 p-4 rounded-lg">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 italic">Müşteri Şikayeti / Talep:</h3>
          <p className="text-sm leading-relaxed text-gray-800 font-medium">"{order.complaintDescription}"</p>
        </div>
        {order.inspectionNotes && (
          <div className="border border-blue-100 p-4 rounded-lg bg-blue-50/20">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 italic">Usta Gözlemi / Tespit:</h3>
            <p className="text-sm leading-relaxed text-blue-900">{order.inspectionNotes}</p>
          </div>
        )}
      </div>

      {/* SERVICE ITEMS TABLE */}
      <div className="mb-8">
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="py-2 px-3 text-left border-r border-gray-300">Yapılan İşlem / Değişen Parça</th>
              <th className="py-2 px-3 text-center border-r border-gray-300 w-24">Adet / Saat</th>
              <th className="py-2 px-3 text-left border-r border-gray-300">Usta / Teknisyen</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, idx: number) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="py-3 px-3 border-r border-b border-gray-200">
                  <span className="font-bold">{item.name}</span>
                  <div className="text-[10px] text-gray-400 opacity-60 uppercase tracking-tight">{item.itemType === 'PART' ? 'Yedek Parça' : 'İşçilik'}</div>
                </td>
                <td className="py-3 px-3 text-center border-r border-b border-gray-200 font-mono">{item.quantity}</td>
                <td className="py-3 px-3 border-r border-b border-gray-200 text-gray-600 italic"></td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - order.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="py-4 border-r border-b border-gray-100"></td>
                <td className="py-4 border-r border-b border-gray-100"></td>
                <td className="py-4 border-r border-b border-gray-100"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER / SIGNATURES */}
      <div className="mt-auto pt-10 grid grid-cols-2 gap-20 text-center">
        <div className="border-t-2 border-gray-200 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Teslim Eden (Müşteri)</p>
          <div className="h-16"></div>
          <p className="text-sm font-medium">Ad Soyad / İmza</p>
        </div>
        <div className="border-t-2 border-gray-200 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">Teslim Alan (Servis)</p>
          <div className="h-16"></div>
          <p className="text-sm font-medium">Kaşe / İmza</p>
        </div>
      </div>

      <div className="mt-12 text-[9px] text-gray-400 text-center uppercase tracking-widest border-t pt-2 border-dashed">
        Bu belge bir fatura değildir, sadece servis kayıt formudur. MS Oto Servis Yazılımı ile oluşturulmuştur.
      </div>
    </div>
  );
};

/**
 * 2. FATURA ÇIKTISI (A4)
 */
export const InvoiceLayout = ({ order, tenant }: LayoutProps) => {
  return (
    <div id="print-invoice" className="bg-white p-10 w-[210mm] min-h-[297mm] text-gray-900 font-sans shadow-lg">
      <div className="flex justify-between items-center mb-10">
        <div>
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-2" />
          ) : (
            <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-2">
              {tenant.name.substring(0, 1)}
            </div>
          )}
          <h1 className="text-xl font-black">{tenant.name}</h1>
          <p className="text-xs text-gray-500 italic">Profesyonel Oto Servis Çözümleri</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-gray-200 mb-1">FATURA</h2>
          <p className="font-bold">No: #{order.orderNumber}</p>
          <p className="text-sm text-gray-500">{dayjs(order.receptionDate).format('DD MMMM YYYY')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest border-b pb-1">Faturalandırılan</h4>
          <p className="font-bold text-lg">{order.customer.type === 'CORPORATE' ? order.customer.companyName : `${order.customer.firstName} ${order.customer.lastName}`}</p>
          <p className="text-sm text-gray-600">{order.customer.address}</p>
          <p className="text-sm font-bold mt-2">{order.customer.taxOffice} / {order.customer.taxNumber}</p>
          <p className="text-sm">{order.customer.phone}</p>
        </div>
        <div className="text-right">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest border-b pb-1">Firma Bilgileri</h4>
          <p className="font-bold">{tenant.name}</p>
          <p className="text-sm text-gray-600">{tenant.address}</p>
          <p className="text-sm font-bold mt-2">{tenant.taxOffice} / {tenant.taxNumber}</p>
          <p className="text-sm">{tenant.phone}</p>
        </div>
      </div>

      <table className="w-full mb-10 border-t border-b border-gray-100">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <th className="py-4 px-2 text-left">Açıklama</th>
            <th className="py-4 px-2 text-center">Miktar</th>
            <th className="py-4 px-2 text-right">Birim Fiyat</th>
            <th className="py-4 px-2 text-center">KDV %</th>
            <th className="py-4 px-2 text-right">Toplam</th>
          </tr>
        </thead>
        <tbody className="text-sm devide-y divide-gray-50 text-gray-700">
          {order.items.map((item: any) => (
            <tr key={item.id}>
              <td className="py-4 px-2 font-medium">
                {item.name}
                <div className="text-[10px] text-gray-400 font-normal italic">{item.itemType === 'PART' ? 'Parça' : 'İşçilik'}</div>
              </td>
              <td className="py-4 px-2 text-center font-mono">{item.quantity}</td>
              <td className="py-4 px-2 text-right font-mono">₺{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              <td className="py-4 px-2 text-center text-gray-400">%{item.taxRate}</td>
              <td className="py-4 px-2 text-right font-bold text-gray-900 font-mono">₺{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end pr-2">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-gray-500">
            <span className="text-sm">Ara Toplam:</span>
            <span className="font-mono">₺{Number(order.subTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span className="text-sm font-bold">İndirim:</span>
            <span className="font-mono">- ₺{Number(order.discountAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-500 border-b border-gray-100 pb-3">
            <span className="text-sm">KDV Toplamı (%20):</span>
            <span className="font-mono">₺{Number(order.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-2">
            <span>TOPLAM:</span>
            <span className="font-mono text-blue-900">₺{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-10">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-32">
          <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ödeme Bilgisi / Notlar</h5>
          <p className="text-xs text-gray-500">{order.internalNotes || "Ödeme tarihinden 7 gün sonra geçerliliğini yitirir."}</p>
        </div>
        <div className="text-center pt-10">
          <div className="border-t border-gray-900 pt-4 inline-block px-10">
            <span className="text-xs font-bold uppercase tracking-widest">Onaylayan / Kaşe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. SERVİS ETİKETİ (60x60mm)
 * Barkod yazıcılar için özel boyutlandırılmış, görsel referansa uygun tasarım.
 */
export const ServiceLabelLayout = ({ order, tenant }: LayoutProps) => {
  // Filtreleri ve yağı tespit et
  const filters = {
    oil: order.items.some((i: any) => i.name.toLocaleLowerCase('tr').includes('yağ fil')),
    air: order.items.some((i: any) => i.name.toLocaleLowerCase('tr').includes('hava fil')),
    fuel: order.items.some((i: any) => i.name.toLocaleLowerCase('tr').includes('mazot') || i.name.toLocaleLowerCase('tr').includes('yakıt fil')),
    cabin: order.items.some((i: any) => i.name.toLocaleLowerCase('tr').includes('polen') || i.name.toLocaleLowerCase('tr').includes('kabin fil')),
  };

  const oilBrand = order.items.find((i: any) => i.name.toLocaleLowerCase('tr').includes('yağ') && !i.name.toLocaleLowerCase('tr').includes('filtr'))?.name || '..........';

  return (
    <div
      id="print-service-label"
      className="bg-white border-2 border-gray-800 text-gray-900 font-sans font-bold flex flex-col p-1.5 overflow-hidden"
      style={{ width: '60mm', height: '60mm', fontSize: '9px' }}
    >
      <div className="text-center border-b border-gray-800 pb-1 mb-1">
        <div className="text-[12px] font-black uppercase leading-none text-blue-900">{tenant.name}</div>
        <div className="text-[7px] font-bold text-gray-500 tracking-tighter">ÖZEL OTO SERVİS | {tenant.phone}</div>
      </div>

      <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 mb-1.5">
        <div className="flex flex-col">
          <label className="text-[6px] uppercase tracking-tighter text-blue-700">TARİH</label>
          <div className="border border-gray-800 rounded px-1 h-3.5 flex items-center bg-gray-50 text-[8px]">{dayjs(order.receptionDate).format('DD/MM/YYYY')}</div>
        </div>
        <div className="flex flex-col">
          <label className="text-[6px] uppercase tracking-tighter text-blue-700">MOTOR YAĞI</label>
          <div className="border border-gray-800 rounded px-1 h-3.5 flex items-center bg-gray-50 text-[8px] truncate">{oilBrand}</div>
        </div>
        <div className="flex flex-col">
          <label className="text-[6px] uppercase tracking-tighter text-blue-700">DEĞİŞİM KM</label>
          <div className="border border-gray-800 rounded px-1 h-3.5 flex items-center bg-gray-50 font-mono text-[8px]">{order.vehicle.mileage.toLocaleString()}</div>
        </div>
        <div className="flex flex-col">
          <label className="text-[6px] uppercase tracking-tighter text-red-600 font-black">GELECEK KM</label>
          <div className="border-2 border-red-600 rounded px-1 h-3.5 flex items-center bg-red-50 text-red-700 font-mono text-[8px]">{(order.vehicle.mileage + 10000).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 text-white text-[7px] text-center uppercase py-0.5 tracking-widest rounded-sm mb-1">Değişen Filtreler</div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-1 py-0.5 border border-gray-200 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-[7px]">YAĞ FİL:</span>
            <div className={`w-2.5 h-2.5 border border-gray-800 flex items-center justify-center ${filters.oil ? 'bg-black text-white' : ''}`}>{filters.oil ? '✓' : ''}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[7px]">HAVA FİL:</span>
            <div className={`w-2.5 h-2.5 border border-gray-800 flex items-center justify-center ${filters.air ? 'bg-black text-white' : ''}`}>{filters.air ? '✓' : ''}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[7px]">YAKIT FİL:</span>
            <div className={`w-2.5 h-2.5 border border-gray-800 flex items-center justify-center ${filters.fuel ? 'bg-black text-white' : ''}`}>{filters.fuel ? '✓' : ''}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[7px]">POLEN FİL:</span>
            <div className={`w-2.5 h-2.5 border border-gray-800 flex items-center justify-center ${filters.cabin ? 'bg-black text-white' : ''}`}>{filters.cabin ? '✓' : ''}</div>
          </div>
        </div>

        <div className="mt-1 flex-1 flex flex-col justify-center">
          <div className="text-[6px] text-gray-400 text-center uppercase tracking-tighter leading-tight italic">
            Bir sonraki bakımı<br />geciktirmeyiniz.
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-800 pt-0.5 text-center text-[7px] font-black tracking-widest text-blue-900">
        TEŞEKKÜR EDERİZ.
      </div>
    </div>
  );
};
