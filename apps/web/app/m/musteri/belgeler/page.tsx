import React from "react";
import { getMusteriBelgeleri } from "@/lib/actions/musteri-belgeler.actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export const metadata = {
  title: "Belgelerim | Müşteri Portalı",
};

const categoryConfig: Record<string, { title: string; icon: string; color: string; bg: string }> = {
  ruhsat: { title: "Ruhsat Belgeleri", icon: "badge", color: "text-primary", bg: "bg-primary-fixed" },
  sigorta: { title: "Sigorta Belgeleri", icon: "security", color: "text-secondary", bg: "bg-secondary-fixed" },
  fatura: { title: "Fatura & Makbuzlar", icon: "receipt_long", color: "text-tertiary", bg: "bg-tertiary-fixed" },
  servis: { title: "Servis Belgeleri", icon: "build", color: "text-primary", bg: "bg-primary-fixed" },
  diger: { title: "Diğer Belgeler", icon: "folder", color: "text-on-surface-variant", bg: "bg-surface-container" },
};

export default async function MusteriBelgelerPage() {
  const result = await getMusteriBelgeleri();

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <span className="material-symbols-outlined text-border text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
        <p className="text-on-surface-variant text-center">{result.error}</p>
      </div>
    );
  }

  const { documents, categorized, customer, vehicles } = result;
  const totalDocs = documents?.length || 0;

  return (
    <main className="px-6 pt-4 space-y-6 max-w-md mx-auto pb-32">
      {/* Header */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-extrabold text-on-surface tracking-tight">Belgelerim</h1>
          <p className="text-[12px] text-on-surface-variant mt-0.5">{totalDocs} belge • {vehicles?.length || 0} araç</p>
        </div>
        <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>
      </section>

      {/* Araç Filtresi - Yatay Scroll */}
      {vehicles && vehicles.length > 0 && (
        <section className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
          <div className="bg-primary text-white text-[11px] font-bold px-4 py-2 rounded-full shrink-0">
            Tümü ({totalDocs})
          </div>
          {vehicles.map((v: any) => (
            <div key={v.id} className="bg-surface-container-lowest text-on-surface-variant text-[11px] font-bold px-4 py-2 rounded-full shrink-0 border border-outline-variant/15">
              {v.plate}
            </div>
          ))}
        </section>
      )}

      {/* Kategori Bazlı Belgeler */}
      {categorized && Object.entries(categorized).map(([key, docs]) => {
        const config = categoryConfig[key];
        const docList = docs as any[];
        if (!config || docList.length === 0) return null;

        return (
          <section key={key} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-lg ${config.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-on-surface">{config.title}</h3>
                <p className="text-[10px] text-on-surface-variant">{docList.length} belge</p>
              </div>
            </div>

            <div className="space-y-2">
              {docList.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-surface-container rounded-xl active:scale-[0.98] transition-transform group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {doc.fileType?.includes('pdf') ? 'picture_as_pdf' : 
                       doc.fileType?.includes('image') ? 'image' : 'description'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-on-surface truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.vehicle && (
                        <span className="text-[10px] text-on-surface-variant">{doc.vehicle.plate}</span>
                      )}
                      <span className="text-[10px] text-on-surface-variant">
                        {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: tr })}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-lg group-hover:text-primary transition-colors">download</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {/* Boş Durum */}
      {totalDocs === 0 && (
        <section className="flex flex-col items-center justify-center p-10 bg-surface-container-lowest rounded-2xl text-center shadow-sm">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-outline">folder_off</span>
          </div>
          <p className="text-[15px] font-bold text-on-surface">Belge Bulunamadı</p>
          <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
            Araçlarınıza ait kayıtlı belge bulunmamaktadır.
          </p>
        </section>
      )}

      {/* Belge Yükleme CTA */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-2xl">cloud_upload</span>
        </div>
        <div className="flex-1">
          <h4 className="text-[14px] font-bold text-on-surface">Belge Yükle</h4>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Ruhsat, sigorta poliçesi veya faturalarınızı güvenle yükleyin.</p>
        </div>
        <button className="bg-primary text-white text-[10px] font-bold px-3.5 py-2 rounded-lg active:scale-95 transition-transform shrink-0">
          Yükle
        </button>
      </section>
    </main>
  );
}
