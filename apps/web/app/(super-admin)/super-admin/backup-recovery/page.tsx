import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getBackupStatus } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Yedekleme ve Kurtarma | Super Admin" };

const TABS = [
  { id: "history", label: "Yedekleme Geçmişi" },
  { id: "schedule", label: "Zamanlama" },
  { id: "storage", label: "Depolama" },
];

export default async function BackupRecoveryPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "history";

  const data = await getBackupStatus();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const lastBackupDate = new Date(data.lastBackup).toLocaleString("tr-TR");

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">backup</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Yedekleme ve Kurtarma</h2>
        </div>
        <button className="bg-primary text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Anlık Snapshot Al
        </button>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 3 Metrik Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">schedule</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Son Yedek</p>
            </div>
            <p className="text-sm font-bold text-on-surface">{lastBackupDate}</p>
            <div className="mt-2">
              <span className={data.status === "SUCCESS"
                ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                : "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
              }>
                {data.status}
              </span>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">database</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Boyut</p>
            </div>
            <p className="text-2xl font-black text-on-surface">{data.size}</p>
            <p className="text-[10px] text-outline mt-1">Toplam</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${data.status === "SUCCESS" ? "text-on-tertiary-fixed-variant" : "text-error"}`}>
                {data.status === "SUCCESS" ? "check_circle" : "error"}
              </span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Durum</p>
            </div>
            <span className={data.status === "SUCCESS"
              ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
              : "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
            }>
              {data.status}
            </span>
          </div>
        </div>

        {/* Yedekleme Geçmişi */}
        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Yedekleme Geçmişi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tarih/Saat</th>
                    <th>Boyut</th>
                    <th>Süre (sn)</th>
                    <th>Durum</th>
                    <th>Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono text-[10px] font-bold text-on-surface">{b.id.toUpperCase()}</td>
                      <td className="font-mono text-[10px] text-outline whitespace-nowrap">
                        {new Date(b.date).toLocaleString("tr-TR")}
                      </td>
                      <td className="font-semibold text-on-surface">{b.size}</td>
                      <td className="font-mono text-on-surface">{b.duration > 0 ? b.duration : "—"}</td>
                      <td>
                        <span className={b.status === "SUCCESS"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                          : "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
                        }>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {b.status === "SUCCESS" && (
                            <>
                              <button className="text-[10px] font-bold text-primary hover:underline">İNDİR</button>
                              <button className="text-[10px] font-bold text-outline hover:underline">GERİ YÜKLE</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Zamanlama */}
        {tab === "schedule" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Zamanlama Konfigürasyonu</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Saatlik", desc: "Her saat başı", active: false },
                  { label: "Günlük", desc: "Her gün 02:00", active: true },
                  { label: "Haftalık", desc: "Her Pazar 03:00", active: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline/10">
                    <div>
                      <p className="text-xs font-bold text-on-surface">{item.label}</p>
                      <p className="text-[10px] text-outline">{item.desc}</p>
                    </div>
                    <span className={item.active
                      ? "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                      : "border border-outline/30 text-outline px-2 py-0.5 rounded text-[10px] font-bold"
                    }>
                      {item.active ? "AKTİF" : "PASİF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary text-base">settings</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Yedekleme Ayarları</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Saklama Süresi", value: "30 Gün" },
                  { label: "Şifreleme", value: "AES-256" },
                  { label: "Sıkıştırma", value: "GZIP" },
                  { label: "Depolama", value: "AWS S3" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-surface-container rounded">
                    <span className="text-xs font-semibold text-on-surface">{item.label}</span>
                    <span className="text-xs font-bold text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Depolama */}
        {tab === "storage" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-base">hard_drive</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Depolama Kullanımı</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-on-surface">Kullanılan Alan</span>
                  <span className="text-xs font-bold text-primary">1.2 TB / 2.0 TB</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: "60%" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-outline">0 TB</span>
                  <span className="text-[9px] font-bold text-primary">60%</span>
                  <span className="text-[9px] text-outline">2.0 TB</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Kullanılan</p>
                  <p className="text-sm font-black text-on-surface">1.2 TB</p>
                </div>
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Boş</p>
                  <p className="text-sm font-black text-on-surface">0.8 TB</p>
                </div>
                <div className="p-3 bg-surface-container rounded text-center">
                  <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Toplam</p>
                  <p className="text-sm font-black text-on-surface">2.0 TB</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary text-base">folder</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Depolama Dağılımı</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Günlük Yedekler", size: "480 GB", pct: 40, color: "bg-primary" },
                  { label: "Haftalık Yedekler", size: "360 GB", pct: 30, color: "bg-secondary" },
                  { label: "Aylık Arşiv", size: "240 GB", pct: 20, color: "bg-tertiary-fixed" },
                  { label: "Diğer", size: "120 GB", pct: 10, color: "bg-outline" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-on-surface-variant">{item.label}</span>
                      <span className="text-[10px] font-bold text-on-surface">{item.size}</span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
