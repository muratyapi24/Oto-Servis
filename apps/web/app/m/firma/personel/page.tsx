import React from "react";
import { getFirmaPersonelData } from "@/lib/actions/mobile.actions";
import Link from "next/link";

export const metadata = { title: "Personel Kadrosu | MS Oto Servis" };

export default async function FirmaPersonelPage() {
  const dataRes = await getFirmaPersonelData();

  if (dataRes.error || !dataRes.personel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
        <p className="text-on-surface-variant">{dataRes.error || "Veriler alınamadı"}</p>
      </div>
    );
  }

  const { personel, summary } = dataRes;

  return (
    <>
      {/* Başlık */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest">YÖNETİM</span>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tighter">Personel</h2>
        </div>
        <Link
          href="/dashboard/mechanics"
          className="bg-primary text-on-primary rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span className="text-xs font-bold uppercase tracking-wider">EKLE</span>
        </Link>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-container-highest p-4 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Toplam Ekip</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{summary.totalActive}</span>
            <span className="text-xs font-medium text-on-surface-variant">aktif</span>
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Açık İş Emri</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-secondary">{summary.totalOpenOrders}</span>
            <span className="material-symbols-outlined text-secondary text-sm">build</span>
          </div>
        </div>
        <div className="col-span-2 bg-surface-container-low border border-outline-variant/15 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Ortalama Doluluk</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">{summary.avgLoad.toFixed(1)}</span>
            <span className="text-xs text-on-surface-variant">iş emri / usta</span>
            <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary-container rounded-full"
                style={{ width: `${Math.min(100, summary.avgLoad * 20)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personel Listesi */}
      <div className="space-y-4">
        {personel.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block">group</span>
            <p className="font-bold">Kayıtlı personel bulunamadı.</p>
          </div>
        ) : (
          personel.map((p) => {
            const loadPct = Math.min(100, p.activeOrderCount * 25);
            const statusLabel = !p.isActive ? "İZİNLİ" : p.activeOrderCount === 0 ? "MÜSAİT" : "MEŞGUL";
            const statusClass = !p.isActive
              ? "bg-gray-100 text-gray-600"
              : p.activeOrderCount === 0
                ? "bg-tertiary-fixed text-on-surface"
                : "bg-secondary-fixed text-on-secondary-fixed-variant";

            return (
              <Link
                key={p.id}
                href={`/dashboard/mechanics/${p.id}`}
                className="bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgb(30,64,175,0.06)] p-5 relative overflow-hidden group block"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="flex gap-4 items-start relative z-10">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-lg bg-primary-container flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                      </span>
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest ${!p.isActive ? "bg-gray-400" : p.activeOrderCount === 0 ? "bg-tertiary" : "bg-secondary-container"
                      }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-on-surface text-lg truncate">{p.firstName} {p.lastName}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {p.specialties.length > 0 ? p.specialties.join(", ") : "Genel Usta"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">AKTİF İŞ EMRİ</span>
                      <p className="text-sm font-semibold text-primary">{p.activeOrderCount} iş emri</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">DOLULUK</span>
                      <p className="text-lg font-black text-on-surface">{loadPct}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary-container rounded-full transition-all"
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                  {p.phone && (
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      {p.phone}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
