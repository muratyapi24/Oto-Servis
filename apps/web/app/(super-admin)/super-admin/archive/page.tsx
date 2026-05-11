import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getArchiveData } from "@/lib/actions/superadmin.actions"
import PurgeConfirmDialog from "./PurgeConfirmDialog"
import { MockPageGuard } from "@/components/super-admin/MockPageGuard"

export const metadata = { title: "Sistem Arşiv ve Veri Temizleme | Super Admin" }

const TYPE_BADGE: Record<string, string> = {
  AUDIT_LOG: "bg-primary/10 text-primary",
  SERVICE_ORDER: "bg-secondary-container/20 text-secondary",
  INVOICE: "bg-tertiary-fixed text-on-tertiary-fixed",
  NOTIFICATION: "bg-surface-variant text-on-surface-variant",
}

const MOCK_PURGE_HISTORY = [
  { date: "12.06.2025", type: "AUDIT_LOG", deleted: 4820, by: "system@admin.com", status: "TAMAMLANDI" },
  { date: "01.06.2025", type: "NOTIFICATION", deleted: 12300, by: "admin@bst.com", status: "TAMAMLANDI" },
  { date: "15.05.2025", type: "SERVICE_ORDER", deleted: 980, by: "system@admin.com", status: "TAMAMLANDI" },
  { date: "01.05.2025", type: "INVOICE", deleted: 540, by: "admin@bst.com", status: "TAMAMLANDI" },
  { date: "15.04.2025", type: "AUDIT_LOG", deleted: 7200, by: "system@admin.com", status: "TAMAMLANDI" },
]

export default async function ArchivePage(props: {
  searchParams?: Promise<{ tab?: string; olderThan?: string }>
}) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "archive"
  const olderThan = parseInt(searchParams?.olderThan || "90")

  const data = await getArchiveData({ olderThanDays: olderThan })
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>

  const TABS = [
    { id: "archive", label: "Arşiv Verileri" },
    { id: "history", label: "Temizleme Geçmişi" },
    { id: "policy", label: "Politika" },
  ]

  return (
    <MockPageGuard title="Sistem Arşiv ve Veri Temizleme" description="Veri arşivleme ve toplu temizleme işlemleri yakında gerçek veriye bağlanacaktır.">
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">archive</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Sistem Arşiv ve Veri Temizleme</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low border border-outline/20 rounded text-[10px] font-bold text-outline uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">storage</span>
          Toplam: {data.totalSize}
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}&olderThan=${olderThan}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Yaş Filtresi */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-lowest border-b border-outline/10">
        <span className="text-[10px] font-bold text-outline uppercase">Yaş Filtresi:</span>
        {[30, 60, 90, 180, 365].map((days) => (
          <Link
            key={days}
            href={`?tab=${tab}&olderThan=${days}`}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              olderThan === days
                ? "bg-primary text-white"
                : "border border-outline/20 text-outline hover:bg-surface-container"
            }`}
          >
            {days}g+
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Özet Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Toplam Kayıt</p>
            <p className="text-3xl font-black text-on-surface">{data.totalCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Toplam Boyut</p>
            <p className="text-3xl font-black text-on-surface">{data.totalSize}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Yaş Filtresi</p>
            <p className="text-3xl font-black text-on-surface">{olderThan} gün+</p>
          </div>
        </div>

        {/* Arşiv Verileri Tab */}
        {tab === "archive" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">folder_open</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Arşiv Kayıtları</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Açıklama</th>
                    <th>Boyut</th>
                    <th>Arşivlenme Tarihi</th>
                    <th className="text-right pr-4">Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            TYPE_BADGE[r.type] ?? "bg-surface-variant text-on-surface-variant"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="text-on-surface-variant">{r.description}</td>
                      <td className="font-mono text-[10px]">{r.size}</td>
                      <td className="text-outline text-[10px]">
                        {new Date(r.archivedAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="text-right pr-4">
                        <PurgeConfirmDialog recordId={r.id} recordType={r.type} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Temizleme Geçmişi Tab */}
        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Temizleme Geçmişi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Tip</th>
                    <th>Silinen Kayıt</th>
                    <th>Yapan</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PURGE_HISTORY.map((row, i) => (
                    <tr key={i}>
                      <td className="font-mono text-[10px]">{row.date}</td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            TYPE_BADGE[row.type] ?? "bg-surface-variant text-on-surface-variant"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="font-mono text-[10px]">{row.deleted.toLocaleString("tr-TR")}</td>
                      <td className="text-outline text-[10px]">{row.by}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Politika Tab */}
        {tab === "policy" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3">Veri Saklama Politikası</h3>
              <div className="space-y-3">
                {[
                  { type: "Denetim Logları (AUDIT_LOG)", retention: "90 gün", action: "Otomatik arşivleme" },
                  { type: "Servis Emirleri (SERVICE_ORDER)", retention: "180 gün", action: "Manuel onay gerekli" },
                  { type: "Faturalar (INVOICE)", retention: "365 gün (yasal zorunluluk)", action: "Sadece manuel silme" },
                  { type: "Bildirimler (NOTIFICATION)", retention: "30 gün", action: "Otomatik temizleme" },
                ].map((item) => (
                  <div
                    key={item.type}
                    className="flex items-start justify-between p-3 bg-surface-container-low rounded border border-outline/10"
                  >
                    <div>
                      <p className="text-xs font-bold text-on-surface">{item.type}</p>
                      <p className="text-[10px] text-outline mt-0.5">{item.action}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.retention}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-outline/10 pt-4">
              <p className="text-[10px] text-outline">
                Veri saklama politikaları KVKK ve GDPR gerekliliklerine uygun olarak belirlenmiştir. Fatura verileri
                yasal zorunluluk gereği minimum 5 yıl saklanmalıdır. Politika değişiklikleri için sistem yöneticisiyle
                iletişime geçin.
              </p>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
    </MockPageGuard>
  )
}
