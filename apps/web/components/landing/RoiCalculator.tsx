"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Clock, MessageSquare, FileText, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------
const AVG_MINS_SAVED_PER_ORDER = 25;   // dakika / iş emri (kağıt vs dijital fark)
const HOURLY_RATE = 150;               // TRY/saat (personel maliyeti)
const MISSED_COLLECTION_RATE = 0.08;  // %8 fatura gecikmesi/kaybı ortalaması
const SMS_COST_MANUAL = 2;            // manuel SMS maliyeti TRY (zaman dahil)
const SMS_AUTO_COST = 0.35;           // otomatik SMS TRY

// ---------------------------------------------------------------------------
// Yardımcı
// ---------------------------------------------------------------------------
function currency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span className="text-lg font-black text-blue-700">{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600 h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ana bileşen
// ---------------------------------------------------------------------------
export function RoiCalculator() {
  const [dailyOrders, setDailyOrders] = useState(10);
  const [avgInvoice, setAvgInvoice] = useState(1500);
  const [smsPerMonth, setSmsPerMonth] = useState(200);

  const monthlyOrders = dailyOrders * 22; // iş günü

  // Zaman tasarrufu
  const timeSavedHours = (monthlyOrders * AVG_MINS_SAVED_PER_ORDER) / 60;
  const timeSavedValue = Math.round(timeSavedHours * HOURLY_RATE);

  // Kaçan tahsilat
  const totalRevenue = monthlyOrders * avgInvoice;
  const missedCollection = Math.round(totalRevenue * MISSED_COLLECTION_RATE);

  // SMS tasarrufu
  const smsSavings = Math.round(smsPerMonth * (SMS_COST_MANUAL - SMS_AUTO_COST));

  const totalSavings = timeSavedValue + missedCollection + smsSavings;
  const starterPrice = 799;
  const roi = totalSavings > 0 ? Math.round(((totalSavings - starterPrice) / starterPrice) * 100) : 0;

  const metrics = [
    {
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      label: "Zaman Tasarrufu",
      value: currency(timeSavedValue),
      sub: `${Math.round(timeSavedHours)} saat/ay kurtarılır`,
      color: "bg-blue-50 border-blue-100",
    },
    {
      icon: <FileText className="h-5 w-5 text-emerald-600" />,
      label: "Tahsilat İyileştirme",
      value: currency(missedCollection),
      sub: "%8 gecikme/kayıp azalır",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-violet-600" />,
      label: "SMS Otomasyonu",
      value: currency(smsSavings),
      sub: `${smsPerMonth} SMS/ay otomatik`,
      color: "bg-violet-50 border-violet-100",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-slate-100">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            ROI Hesaplayıcı
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">
            Servisinizde Ne Kadar<br className="hidden md:block" /> Tasarruf Edersiniz?
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Kendi verilerinizi girin — MS Oto Servis'in size aylık kazandıracağı tahmini tutarı görün.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Sliderlar */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-8">
            <Slider
              label="Günlük Ortalama İş Emri Sayısı"
              value={dailyOrders} min={1} max={50} step={1}
              onChange={setDailyOrders} suffix=" iş emri"
            />
            <Slider
              label="Ortalama Fatura Tutarı"
              value={avgInvoice} min={500} max={10000} step={100}
              onChange={setAvgInvoice} suffix=" ₺"
            />
            <Slider
              label="Aylık Müşteri SMS / Bildirim Sayısı"
              value={smsPerMonth} min={50} max={2000} step={50}
              onChange={setSmsPerMonth} suffix=" adet"
            />

            <div className="pt-2 border-t border-slate-200 text-xs text-slate-400 space-y-1">
              <p>* İş emri başına 25 dk zaman tasarrufu, ₺150/saat personel maliyeti esas alınmıştır.</p>
              <p>* Tahsilat iyileştirme: sektör ortalaması %8 gecikme/kayıp azalması.</p>
            </div>
          </div>

          {/* Sonuçlar */}
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${m.color}`}>
                <div className="shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{m.label}</p>
                  <p className="text-base font-black text-slate-800">{m.value} <span className="text-xs font-normal text-slate-500">/ ay</span></p>
                  <p className="text-xs text-slate-400">{m.sub}</p>
                </div>
              </div>
            ))}

            {/* Toplam */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Tahmini Aylık Kazanım</p>
                  <p className="text-4xl font-black tracking-tighter">{currency(totalSavings)}</p>
                  <p className="text-blue-200 text-xs mt-1">Başlangıç Paketi ({currency(starterPrice)}/ay) düşüldükten sonra</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">ROI</p>
                  <p className="text-3xl font-black text-emerald-300">%{roi}</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/20">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 bg-white text-blue-700 font-black py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
                >
                  14 Gün Ücretsiz Başla <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
