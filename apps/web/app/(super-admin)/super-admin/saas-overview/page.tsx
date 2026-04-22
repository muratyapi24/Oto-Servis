import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getSaaSOverviewMetrics } from "@/lib/actions/superadmin.actions"

export const metadata = { title: "SaaS Genel Bakış | Super Admin" }

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"]

const PLAN_DISTRIBUTION = [
  { label: "Enterprise", pct: 52, color: "text-primary", fill: "#6750A4" },
  { label: "Professional", pct: 31, color: "text-secondary", fill: "#958DA5" },
  { label: "Starter", pct: 17, color: "text-tertiary-fixed", fill: "#B58392" },
]

const REVENUE_TABLE = [
  { plan: "Enterprise", subscribers: 12, monthly: 59880, yearly: 718560 },
  { plan: "Professional", subscribers: 28, monthly: 41720, yearly: 500640 },
  { plan: "Starter", subscribers: 45, monthly: 22275, yearly: 267300 },
]

function buildDonutPath(pct: number, offset: number, r: number, cx: number, cy: number) {
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const gap = circumference - dash
  const rotation = (offset / 100) * 360 - 90
  return { strokeDasharray: `${dash} ${gap}`, transform: `rotate(${rotation}, ${cx}, ${cy})` }
}

export default async function SaaSOverviewPage(props: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "overview"
  const data = await getSaaSOverviewMetrics()
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>

  const mrrTrend = [2200, 2450, 2380, 2650, 2800, data.mrr]
  const maxMrr = Math.max(...mrrTrend)
  const minMrr = Math.min(...mrrTrend)
  const range = maxMrr - minMrr || 1

  function toY(val: number) {
    return 70 - ((val - minMrr) / range) * 60
  }

  const polylinePoints = mrrTrend
    .map((v, i) => `${(i / (mrrTrend.length - 1)) * 380 + 10},${toY(v)}`)
    .join(" ")

  const ARPU = data.activeSubscriptions > 0
    ? Math.round(data.mrr / data.activeSubscriptions)
    : 0

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">cloud</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">SaaS Genel Bakış</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          Büyüme: %{data.growthRate}
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Genel Bakış" },
          { id: "revenue", label: "Gelir Analizi" },
          { id: "growth", label: "Büyüme" },
        ].map((t) => (
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
        {/* Ana Metrik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">payments</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">MRR</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.mrr.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Aylık Yinelenen Gelir</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">trending_up</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">ARR</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.arr.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Yıllık Yinelenen Gelir</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">trending_down</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Churn</p>
            </div>
            <p className="text-2xl font-black text-error">{data.churnRate}%</p>
            <p className="text-[10px] text-outline mt-1">Kayıp Oranı</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-lg">loyalty</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">LTV</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.ltv.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Müşteri Yaşam Değeri</p>
          </div>
        </div>

        {/* İkincil Metrik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">apartment</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Tenant</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.activeTenants}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-lg">group</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Toplam Kullanıcı</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.totalUsers}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-lg">subscriptions</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif Abonelik</p>
            </div>
            <p className="text-3xl font-black text-on-surface">{data.activeSubscriptions}</p>
          </div>
        </div>

        {/* Genel Bakış Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MRR Trend Grafiği */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">show_chart</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">6 Aylık MRR Trendi</h3>
              </div>
              <div className="p-4">
                <svg viewBox="0 0 400 90" className="w-full" aria-label="MRR trend grafiği">
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="10"
                      y1={10 + i * 20}
                      x2="390"
                      y2={10 + i * 20}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-outline/20"
                    />
                  ))}
                  {/* Area fill */}
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6750A4" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6750A4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`10,80 ${polylinePoints} 390,80`}
                    fill="url(#mrrGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#6750A4"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {mrrTrend.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / (mrrTrend.length - 1)) * 380 + 10}
                      cy={toY(v)}
                      r="3"
                      fill="#6750A4"
                    />
                  ))}
                  {/* X labels */}
                  {MONTHS.map((m, i) => (
                    <text
                      key={m}
                      x={(i / (MONTHS.length - 1)) * 380 + 10}
                      y="88"
                      textAnchor="middle"
                      fontSize="7"
                      fill="#938F99"
                    >
                      {m}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Plan Dağılımı Donut */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">pie_chart</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Plan Dağılımı</h3>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-20 h-20" aria-label="Plan dağılımı donut grafiği">
                    {(() => {
                      let offset = 0
                      return PLAN_DISTRIBUTION.map((p) => {
                        const { strokeDasharray, transform } = buildDonutPath(p.pct, offset, 28, 40, 40)
                        offset += p.pct
                        return (
                          <circle
                            key={p.label}
                            cx="40"
                            cy="40"
                            r="28"
                            fill="none"
                            stroke={p.fill}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            transform={transform}
                          />
                        )
                      })
                    })()}
                    <text x="40" y="37" textAnchor="middle" fontSize="6" fill="#49454F" fontWeight="bold">
                      Toplam
                    </text>
                    <text x="40" y="46" textAnchor="middle" fontSize="8" fill="#1C1B1F" fontWeight="900">
                      {data.activeSubscriptions}
                    </text>
                  </svg>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {PLAN_DISTRIBUTION.map((p) => (
                    <div key={p.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                        <span className="text-[10px] text-on-surface">{p.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-outline">{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gelir Analizi Tab */}
        {tab === "revenue" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "MRR", value: `₺${data.mrr.toLocaleString("tr-TR")}`, icon: "payments", color: "text-primary" },
                { label: "ARR", value: `₺${data.arr.toLocaleString("tr-TR")}`, icon: "trending_up", color: "text-secondary" },
                { label: "LTV", value: `₺${data.ltv.toLocaleString("tr-TR")}`, icon: "loyalty", color: "text-tertiary-fixed" },
                { label: "ARPU", value: `₺${ARPU.toLocaleString("tr-TR")}`, icon: "person", color: "text-primary" },
              ].map((m) => (
                <div key={m.label} className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined ${m.color} text-lg`}>{m.icon}</span>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{m.label}</p>
                  </div>
                  <p className="text-xl font-black text-on-surface">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface font-medium">Büyüme Oranı:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tertiary-fixed/20 text-on-surface rounded text-xs font-bold">
                <span className="material-symbols-outlined text-sm text-tertiary-fixed">trending_up</span>
                %{data.growthRate}
              </span>
            </div>

            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">table_chart</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Gelir Dağılımı</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Abone Sayısı</th>
                      <th>Aylık Gelir</th>
                      <th>Yıllık Gelir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REVENUE_TABLE.map((r) => (
                      <tr key={r.plan}>
                        <td className="font-bold text-on-surface">{r.plan}</td>
                        <td className="text-on-surface-variant">{r.subscribers}</td>
                        <td className="font-mono text-on-surface">₺{r.monthly.toLocaleString("tr-TR")}</td>
                        <td className="font-mono text-on-surface">₺{r.yearly.toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-surface-container">
                      <td className="font-black text-on-surface">Toplam</td>
                      <td className="text-on-surface">{REVENUE_TABLE.reduce((a, r) => a + r.subscribers, 0)}</td>
                      <td className="font-mono text-primary">₺{REVENUE_TABLE.reduce((a, r) => a + r.monthly, 0).toLocaleString("tr-TR")}</td>
                      <td className="font-mono text-primary">₺{REVENUE_TABLE.reduce((a, r) => a + r.yearly, 0).toLocaleString("tr-TR")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Büyüme Tab */}
        {tab === "growth" && (
          <div className="space-y-4">
            {/* Aylık Büyüme Bar Chart */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">bar_chart</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Aylık Büyüme</h3>
              </div>
              <div className="p-4">
                <svg viewBox="0 0 400 100" className="w-full" aria-label="Aylık büyüme bar grafiği">
                  {[2200, 2450, 2380, 2650, 2800, data.mrr].map((v, i) => {
                    const barH = (v / maxMrr) * 70
                    const x = i * 65 + 10
                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={80 - barH}
                          width="40"
                          height={barH}
                          rx="2"
                          fill="#6750A4"
                          fillOpacity={i === 5 ? 1 : 0.6}
                        />
                        <text x={x + 20} y="92" textAnchor="middle" fontSize="7" fill="#938F99">
                          {MONTHS[i]}
                        </text>
                        <text x={x + 20} y={80 - barH - 3} textAnchor="middle" fontSize="6" fill="#49454F">
                          {(v / 1000).toFixed(1)}k
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>

            {/* Churn Analizi */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-base">analytics</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Churn Analizi</h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                {[
                  { label: "Promoters", pct: 62, color: "bg-tertiary-fixed", textColor: "text-on-tertiary-fixed" },
                  { label: "Passives", pct: 24, color: "bg-secondary-container", textColor: "text-on-secondary-container" },
                  { label: "Detractors", pct: 14, color: "bg-error-container", textColor: "text-on-error-container" },
                ].map((item) => (
                  <div key={item.label} className={`${item.color} p-4 rounded flex flex-col items-center gap-1`}>
                    <span className={`text-2xl font-black ${item.textColor}`}>{item.pct}%</span>
                    <span className={`text-[10px] font-bold ${item.textColor} uppercase`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Büyüme Oranı Trend */}
            <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Büyüme Oranı Trendi</p>
                <p className="text-3xl font-black text-on-surface">%{data.growthRate}</p>
                <p className="text-[10px] text-outline mt-1">Geçen aya göre</p>
              </div>
              <span className="material-symbols-outlined text-6xl text-primary/20">trending_up</span>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  )
}
