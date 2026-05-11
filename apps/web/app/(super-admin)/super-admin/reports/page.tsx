import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getReportTemplates } from "@/lib/actions/superadmin.actions"
import ReportWizard from "./ReportWizard"
import { MockPageGuard } from "@/components/super-admin/MockPageGuard"

export const metadata = { title: "Dinamik Rapor Sihirbazı | Super Admin" }

const MOCK_HISTORY = [
  { id: "RPT-001", metrics: "MRR, ARR", period: "Son 30 Gün", createdAt: "2025-01-15" },
  { id: "RPT-002", metrics: "Aktif Tenant, Yeni Kayıtlar", period: "Son 90 Gün", createdAt: "2025-01-12" },
  { id: "RPT-003", metrics: "Churn Oranı", period: "Bu Yıl", createdAt: "2025-01-10" },
  { id: "RPT-004", metrics: "Ödeme Başarı Oranı", period: "Son 7 Gün", createdAt: "2025-01-08" },
  { id: "RPT-005", metrics: "Servis Emri Sayısı, Kullanıcı Aktivitesi", period: "Son 30 Gün", createdAt: "2025-01-05" },
]

export default async function ReportsPage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "wizard"
  const result = await getReportTemplates()
  const templates = "error" in result ? [] : result.templates

  return (
    <MockPageGuard title="Dinamik Rapor Sihirbazı" description="Özel rapor oluşturma ve şablon yönetimi yakında gerçek veriye bağlanacaktır.">
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">summarize</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Dinamik Rapor Sihirbazı</h2>
        </div>
        <Link
          href="/super-admin/reports/custom"
          className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded text-[10px] font-bold uppercase"
        >
          <span className="material-symbols-outlined text-sm">edit_note</span>
          Özel Rapor
        </Link>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link
          href="?tab=wizard"
          className={
            tab === "wizard"
              ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
              : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
          }
        >
          Rapor Sihirbazı
        </Link>
        <Link
          href="?tab=templates"
          className={
            tab === "templates"
              ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
              : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
          }
        >
          Şablonlar
        </Link>
        <Link
          href="?tab=history"
          className={
            tab === "history"
              ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
              : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
          }
        >
          Geçmiş Raporlar
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "wizard" && <ReportWizard />}

        {tab === "templates" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">description</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Rapor Şablonları</h3>
            </div>
            {templates.length === 0 ? (
              <div className="p-8 text-center text-outline text-sm">Şablon bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Şablon Adı</th>
                      <th>Açıklama</th>
                      <th>Metrikler</th>
                      <th>Son Kullanım</th>
                      <th>Eylem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t.id}>
                        <td className="font-bold text-on-surface">{t.name}</td>
                        <td className="text-on-surface-variant">{t.description}</td>
                        <td className="text-[10px] text-outline">{t.metrics.join(", ")}</td>
                        <td className="font-mono text-[10px] text-outline">
                          {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString("tr-TR") : "—"}
                        </td>
                        <td>
                          <button className="text-[10px] font-bold text-primary hover:underline">KULLAN</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Geçmiş Raporlar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Rapor ID</th>
                    <th>Metrikler</th>
                    <th>Dönem</th>
                    <th>Oluşturulma</th>
                    <th>İndir</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORY.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-[10px] font-bold text-on-surface">{r.id}</td>
                      <td className="text-on-surface-variant text-[10px]">{r.metrics}</td>
                      <td className="text-outline text-[10px]">{r.period}</td>
                      <td className="font-mono text-[10px] text-outline">{r.createdAt}</td>
                      <td>
                        <button className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                          <span className="material-symbols-outlined text-xs">download</span>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
    </MockPageGuard>
  )
}
