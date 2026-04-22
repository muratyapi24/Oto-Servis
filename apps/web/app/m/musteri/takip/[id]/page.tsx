import React from "react";
import { getServisDetay } from "@/lib/actions/musteri.actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export const metadata = {
  title: "Servis Detayı | Müşteri Portalı",
};

export default async function ServisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getServisDetay(id);

  if (result.error || !result.order) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Servis Bulunamadı</h2>
        <p className="text-on-surface-variant text-center">{result.error}</p>
        <Link href="/m/musteri/takip" className="mt-6 bg-primary text-white font-bold py-3 px-6 rounded-xl active:scale-95 transition-transform">
          Geri Dön
        </Link>
      </div>
    );
  }

  const { order } = result;
  const pendingStatus = { label: "Bekliyor", color: "text-on-surface-variant", bg: "bg-surface-container" };
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: pendingStatus,
    IN_PROGRESS: { label: "Devam Ediyor", color: "text-primary", bg: "bg-primary-fixed" },
    WAITING_APPROVAL: { label: "Onay Bekliyor", color: "text-error", bg: "bg-error-container/50" },
    COMPLETED: { label: "Tamamlandı", color: "text-tertiary", bg: "bg-tertiary-fixed" },
    CANCELLED: { label: "İptal Edildi", color: "text-error", bg: "bg-error-container" },
  };
  const status = statusMap[order.status] ?? pendingStatus;
  
  // Kalemleri türlere ayır
  const partItems = order.items.filter((i: any) => i.itemType === "PART");
  const laborItems = order.items.filter((i: any) => i.itemType === "LABOR");
  const otherItems = order.items.filter((i: any) => i.itemType === "OTHER");

  return (
    <main className="px-6 pt-4 space-y-6 max-w-md mx-auto pb-32">
      {/* Geri Butonu & Başlık */}
      <section className="flex items-center gap-3">
        <Link href="/m/musteri/takip" className="w-9 h-9 bg-surface-container rounded-lg flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-on-surface tracking-tight">Servis Detayı</h1>
          <p className="text-[11px] text-on-surface-variant">İş Emri #{order.orderNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}>{status.label}</span>
      </section>

      {/* Araç & Durum Kartı */}
      <section className="bg-gradient-to-br from-primary to-blue-800 rounded-[1.75rem] p-5 text-white relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute right-3 bottom-3 opacity-[0.07]">
          <span className="material-symbols-outlined text-[80px]">directions_car</span>
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/60">Araç Bilgisi</p>
              <h2 className="text-xl font-extrabold tracking-tight mt-0.5">{order.vehicle.brand} {order.vehicle.model}</h2>
              <p className="text-sm text-white/60 font-mono tracking-widest">{order.vehicle.plate}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase tracking-widest">İlerleme</p>
              <p className="text-3xl font-extrabold">%{order.completionPercentage}</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary-container to-secondary rounded-full transition-all" style={{ width: `${order.completionPercentage}%` }}></div>
          </div>
        </div>
      </section>

      {/* Usta Bilgisi */}
      {order.assignedMechanic && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sorumlu Usta</p>
            <p className="font-bold text-on-surface text-[14px]">{order.assignedMechanic.firstName} {order.assignedMechanic.lastName}</p>
          </div>
        </section>
      )}

      {/* Arıza Açıklaması */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-lg">description</span>
          <h3 className="text-[13px] font-bold text-on-surface uppercase tracking-wider">Arıza / Şikayet</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">{order.complaintDescription || "Açıklama girilmedi."}</p>
        {order.inspectionNotes && (
          <div className="mt-3 pt-3 border-t border-outline-variant/15">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Muayene Notu</p>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">{order.inspectionNotes}</p>
          </div>
        )}
      </section>

      {/* İşlem Kalemleri - Yedek Parça */}
      {partItems.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
            </div>
            <h3 className="text-[13px] font-bold text-on-surface">Yedek Parça ({partItems.length})</h3>
          </div>
          <div className="space-y-2.5">
            {partItems.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{Number(item.quantity)} adet × {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(item.unitPrice))}</p>
                </div>
                <span className="text-[13px] font-bold text-on-surface shrink-0 ml-3">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(item.totalPrice))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* İşlem Kalemleri - İşçilik */}
      {laborItems.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-lg">build</span>
            </div>
            <h3 className="text-[13px] font-bold text-on-surface">İşçilik ({laborItems.length})</h3>
          </div>
          <div className="space-y-2.5">
            {laborItems.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{Number(item.quantity)} saat × {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(item.unitPrice))}</p>
                </div>
                <span className="text-[13px] font-bold text-on-surface shrink-0 ml-3">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(item.totalPrice))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Diğer Kalemler */}
      {otherItems.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">receipt_long</span>
            </div>
            <h3 className="text-[13px] font-bold text-on-surface">Diğer ({otherItems.length})</h3>
          </div>
          <div className="space-y-2.5">
            {otherItems.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">{item.name}</p>
                </div>
                <span className="text-[13px] font-bold text-on-surface shrink-0 ml-3">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(item.totalPrice))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toplam Maliyet */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
        <div className="space-y-2.5">
          <div className="flex justify-between text-[12px] text-on-surface-variant">
            <span>Ara Toplam</span>
            <span className="font-bold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(order.subTotal))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-[12px] text-secondary">
              <span>İndirim</span>
              <span className="font-bold">-{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(order.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-[12px] text-on-surface-variant">
            <span>KDV</span>
            <span className="font-bold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(order.taxAmount))}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-outline-variant/15">
            <span className="text-[13px] font-bold text-on-surface">GENEL TOPLAM</span>
            <span className="text-xl font-extrabold text-primary">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(order.totalAmount))}</span>
          </div>
        </div>
      </section>

      {/* Belgeler */}
      {order.documents && order.documents.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">folder</span>
            <h3 className="text-[13px] font-bold text-on-surface">Belgeler ({order.documents.length})</h3>
          </div>
          <div className="space-y-2">
            {order.documents.map((doc: any) => (
              <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 bg-surface-container rounded-lg active:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined text-primary text-lg">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-on-surface truncate">{doc.fileName}</p>
                  <p className="text-[10px] text-on-surface-variant">{format(new Date(doc.createdAt), "dd.MM.yyyy", { locale: tr })}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">download</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Tarihler */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Tarih Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-on-surface-variant mb-0.5">Giriş Tarihi</p>
            <p className="text-[13px] font-bold text-on-surface">{format(new Date(order.receptionDate), "dd MMM yyyy", { locale: tr })}</p>
          </div>
          {order.promisedDeliveryDate && (
            <div>
              <p className="text-[10px] text-on-surface-variant mb-0.5">Tahmini Teslim</p>
              <p className="text-[13px] font-bold text-on-surface">{format(new Date(order.promisedDeliveryDate), "dd MMM yyyy", { locale: tr })}</p>
            </div>
          )}
          {order.actualDeliveryDate && (
            <div>
              <p className="text-[10px] text-on-surface-variant mb-0.5">Teslim Tarihi</p>
              <p className="text-[13px] font-bold text-tertiary">{format(new Date(order.actualDeliveryDate), "dd MMM yyyy", { locale: tr })}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
