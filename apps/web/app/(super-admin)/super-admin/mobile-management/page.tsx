import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getMobileAppStats } from "@/lib/actions/superadmin.actions"

export const metadata = { title: "Mobil Uygulama Yönetimi | Super Admin" }

export default async function MobileManagementPage(props: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "overview"

  const data = await getMobileAppStats()
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>

  const TABS = [
    { id: "overview", label: "Genel Bakış" },
    { id: "versions", label: "Sürüm Dağılımı" },
    { id: "push", label: "Push Bildirimleri" },
  ]

  const totalDevices = data.iosCount + data.androidCount
  const iosPercent = totalDevices > 0 ? Math.round((data.iosCount / totalDevices) * 100) : 0
  const androidPercent = totalDevices > 0 ? Math.round((data.androidCount / totalDevices) * 100) : 0

  const deliveryRate =
    data.pushStats.sent > 0
      ? Math.round((data.pushStats.delivered / data.pushStats.sent) * 100)
      : 0
  const openRate =
    data.pushStats.sent > 0
      ? Math.round((data.pushStats.opened / data.pushStats.sent) * 100)
      : 0

  const maxVersionCount = Math.max(...data.versionDistribution.map((v) => v.count), 1)

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">phone_android</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Mobil Uygulama Yönetimi</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container/30 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
          {data.activeDevices.toLocaleString("tr-TR")} Aktif Cihaz
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 4 Metrik Kartı */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">devices</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Cihaz</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.activeDevices.toLocaleString("tr-TR")}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">phone_iphone</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">iOS</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.iosCount.toLocaleString("tr-TR")}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">android</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Android</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.androidCount.toLocaleString("tr-TR")}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-outline text-lg">notifications</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Push Gönderilen</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.pushStats.sent.toLocaleString("tr-TR")}</p>
          </div>
        </div>

        {/* Genel Bakış Tab */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* iOS vs Android */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary text-white rounded shadow-sm p-6 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl">phone_iphone</span>
                <p className="text-4xl font-black">{iosPercent}%</p>
                <p className="text-sm font-bold uppercase tracking-widest opacity-80">iOS</p>
                <p className="text-lg font-mono">{data.iosCount.toLocaleString("tr-TR")} cihaz</p>
              </div>
              <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded shadow-sm p-6 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl">android</span>
                <p className="text-4xl font-black">{androidPercent}%</p>
                <p className="text-sm font-bold uppercase tracking-widest opacity-80">Android</p>
                <p className="text-lg font-mono">{data.androidCount.toLocaleString("tr-TR")} cihaz</p>
              </div>
            </div>

            {/* Sürüm Dağılımı Tablosu */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">update</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Sürüm Dağılımı</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Sürüm</th>
                      <th>Cihaz Sayısı</th>
                      <th>Oran %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.versionDistribution.map((v) => {
                      const pct =
                        data.activeDevices > 0
                          ? Math.round((v.count / data.activeDevices) * 100)
                          : 0
                      return (
                        <tr key={v.version}>
                          <td className="font-mono font-bold text-on-surface">{v.version}</td>
                          <td className="font-mono">{v.count.toLocaleString("tr-TR")}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-outline w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sürüm Dağılımı Tab */}
        {tab === "versions" && (
          <div className="space-y-4">
            {/* SVG Bar Chart */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-6">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">Sürüm Bazlı Cihaz Dağılımı</h3>
              <svg
                viewBox={`0 0 ${data.versionDistribution.length * 120} 200`}
                className="w-full"
                aria-label="Sürüm dağılımı bar grafiği"
              >
                {data.versionDistribution.map((v, i) => {
                  const barHeight = Math.round((v.count / maxVersionCount) * 140)
                  const x = i * 120 + 20
                  const y = 160 - barHeight
                  return (
                    <g key={v.version}>
                      <rect
                        x={x}
                        y={y}
                        width={80}
                        height={barHeight}
                        rx={4}
                        className="fill-primary"
                        opacity={0.85}
                      />
                      <text
                        x={x + 40}
                        y={y - 6}
                        textAnchor="middle"
                        className="fill-on-surface"
                        fontSize={11}
                        fontWeight="bold"
                      >
                        {v.count.toLocaleString("tr-TR")}
                      </text>
                      <text
                        x={x + 40}
                        y={178}
                        textAnchor="middle"
                        className="fill-outline"
                        fontSize={10}
                      >
                        {v.version}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Sürüm Tablosu */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Sürüm Detayları</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Sürüm</th>
                      <th>Cihaz Sayısı</th>
                      <th>Oran %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.versionDistribution.map((v) => {
                      const pct =
                        data.activeDevices > 0
                          ? Math.round((v.count / data.activeDevices) * 100)
                          : 0
                      return (
                        <tr key={v.version}>
                          <td className="font-mono font-bold text-on-surface">{v.version}</td>
                          <td className="font-mono">{v.count.toLocaleString("tr-TR")}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-container-low rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-outline w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Push Bildirimleri Tab */}
        {tab === "push" && (
          <div className="space-y-4">
            {/* 3 Metrik Kartı */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Gönderilen</p>
                <p className="text-3xl font-black text-on-surface">{data.pushStats.sent.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Teslim Edilen</p>
                <p className="text-3xl font-black text-on-surface">{data.pushStats.delivered.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Açılan</p>
                <p className="text-3xl font-black text-on-surface">{data.pushStats.opened.toLocaleString("tr-TR")}</p>
              </div>
            </div>

            {/* Oranlar */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-6 space-y-6">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Performans Oranları</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-outline uppercase">Teslim Oranı</span>
                  <span className="text-sm font-black text-on-surface">{deliveryRate}%</span>
                </div>
                <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-outline">
                  {data.pushStats.delivered.toLocaleString("tr-TR")} / {data.pushStats.sent.toLocaleString("tr-TR")} bildirim teslim edildi
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-outline uppercase">Açılma Oranı</span>
                  <span className="text-sm font-black text-on-surface">{openRate}%</span>
                </div>
                <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${openRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-outline">
                  {data.pushStats.opened.toLocaleString("tr-TR")} / {data.pushStats.sent.toLocaleString("tr-TR")} bildirim açıldı
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  )
}
