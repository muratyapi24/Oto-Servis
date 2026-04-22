import React from "react";
import { prisma } from "@repo/database";
import { auth } from "@/auth";

export const metadata = {
  title: "Ayarlar | MS Oto Servis",
};

export default async function MobileAyarlarPage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-error font-bold text-center">Yetkisiz işlem.</p>
      </div>
    );
  }

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-error font-bold text-center">Firma bilgileri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto -mx-2">
      {/* Header Section (Editorial Style) */}
      <section className="space-y-1 mb-8">
        <span className="font-bold text-[11px] uppercase tracking-wider text-secondary">Yönetim Paneli</span>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Ayarlar</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">İşletme yapılandırmanızı ve güvenlik tercihlerinizi buradan yönetin.</p>
      </section>

      {/* Business Profile Section */}
      <section className="space-y-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary" data-icon="business_center">business_center</span>
          <h3 className="font-bold text-sm tracking-wider uppercase text-on-surface-variant">İşletme Profili</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(30,64,175,0.04)] space-y-6">
          <div className="space-y-1.5">
            <label className="font-semibold text-[11px] uppercase text-outline tracking-widest px-1">İşletme Adı</label>
            <input
              readOnly
              className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium outline-none cursor-not-allowed opacity-80"
              type="text"
              value={tenant.name}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[11px] uppercase text-outline tracking-widest px-1">İletişim e-posta & Telefon</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                readOnly
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium outline-none cursor-not-allowed opacity-80"
                type="text"
                value={tenant.email || "E-posta yok"}
              />
              <input
                readOnly
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium outline-none cursor-not-allowed opacity-80"
                type="text"
                value={tenant.phone || "Telefon yok"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[11px] uppercase text-outline tracking-widest px-1">Hizmet Adresi</label>
            <textarea
              readOnly
              className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium resize-none outline-none cursor-not-allowed opacity-80"
              rows={3}
              value={tenant.address || "Adres bilgisi eklenmemiş."}
            />
          </div>

          <button className="w-full bg-primary text-white border-none py-4 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-primary/20 hover:bg-primary-container transition-all active:scale-95">
            PROFİLİ GÜNCELLE
          </button>
        </div>
      </section>

      {/* Notification Preferences Section */}
      <section className="space-y-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary" data-icon="notifications_active">notifications_active</span>
          <h3 className="font-bold text-sm tracking-wider uppercase text-on-surface-variant">Bildirim Tercihleri</h3>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(30,64,175,0.04)] overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-surface-container">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-surface-container rounded-lg">
                <span className="material-symbols-outlined text-primary" data-icon="sms">sms</span>
              </div>
              <div>
                <p className="font-bold text-xs text-on-surface">Müşteri SMS Bilgilendirme</p>
                <p className="text-[10px] text-outline">Araç tesliminde otomatik mesaj</p>
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary-container"></div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-surface-container">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-surface-container rounded-lg">
                <span className="material-symbols-outlined text-primary" data-icon="mail">mail</span>
              </div>
              <div>
                <p className="font-bold text-xs text-on-surface">Günlük Analiz Raporu</p>
                <p className="text-[10px] text-outline">E-posta ile akşam özeti</p>
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary-container"></div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-surface-container rounded-lg">
                <span className="material-symbols-outlined text-primary" data-icon="priority_high">priority_high</span>
              </div>
              <div>
                <p className="font-bold text-xs text-on-surface">Kritik Stok Uyarıları</p>
                <p className="text-[10px] text-outline">Parça azaldığında anlık uyarı</p>
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary-container"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-error" data-icon="warning">warning</span>
          <h3 className="font-bold text-sm tracking-wider uppercase text-error">Kritik Alan</h3>
        </div>

        <div className="bg-error-container/20 rounded-xl p-6 border-2 border-dashed border-error/20 space-y-4">
          <div className="space-y-1">
            <p className="font-bold text-on-error-container text-sm">Veri Yönetimi & Sıfırlama</p>
            <p className="text-xs text-on-error-container/70">Bu alandaki işlemler geri alınamaz. Lütfen dikkatli ilerleyin.</p>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 border-none bg-white/50 rounded-lg shadow-sm hover:bg-white transition-colors group">
              <span className="text-sm font-semibold text-on-surface">Tüm Servis Kayıtlarını İndir</span>
              <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform" data-icon="download">download</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-none bg-error text-white rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
              <span className="text-sm font-bold">Verileri Kalıcı Olarak Sil</span>
              <span className="material-symbols-outlined" data-icon="delete_forever">delete_forever</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
