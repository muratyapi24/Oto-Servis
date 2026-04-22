"use client"

import { useState } from "react"

type Metric = { id: string; label: string; category: string }

const METRIC_LIBRARY: { category: string; icon: string; metrics: Metric[] }[] = [
  {
    category: "Finansal",
    icon: "payments",
    metrics: [
      { id: "mrr", label: "MRR", category: "Finansal" },
      { id: "arr", label: "ARR", category: "Finansal" },
      { id: "ltv", label: "LTV", category: "Finansal" },
      { id: "churn_rate", label: "Churn Rate", category: "Finansal" },
      { id: "arpu", label: "ARPU", category: "Finansal" },
    ],
  },
  {
    category: "Kullanıcı",
    icon: "group",
    metrics: [
      { id: "active_tenants", label: "Aktif Tenant", category: "Kullanıcı" },
      { id: "new_registrations", label: "Yeni Kayıt", category: "Kullanıcı" },
      { id: "user_activity", label: "Kullanıcı Aktivitesi", category: "Kullanıcı" },
    ],
  },
  {
    category: "Operasyonel",
    icon: "build",
    metrics: [
      { id: "service_orders", label: "Servis Emri", category: "Operasyonel" },
      { id: "payment_success", label: "Ödeme Başarı", category: "Operasyonel" },
      { id: "api_calls", label: "API Çağrısı", category: "Operasyonel" },
    ],
  },
  {
    category: "Altyapı",
    icon: "dns",
    metrics: [
      { id: "cpu_usage", label: "CPU Kullanımı", category: "Altyapı" },
      { id: "ram_usage", label: "RAM Kullanımı", category: "Altyapı" },
      { id: "uptime", label: "Uptime", category: "Altyapı" },
    ],
  },
]

const CHART_OPTIONS = [
  { value: "line", label: "Çizgi Grafik" },
  { value: "bar", label: "Bar Grafik" },
  { value: "pie", label: "Pasta Grafik" },
  { value: "table", label: "Tablo" },
]

export default function CustomReportBuilder() {
  const [openCategories, setOpenCategories] = useState<string[]>(["Finansal"])
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>([])
  const [reportName, setReportName] = useState("")
  const [chartType, setChartType] = useState("line")

  function toggleCategory(cat: string) {
    setOpenCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function addMetric(metric: Metric) {
    if (!selectedMetrics.find((m) => m.id === metric.id)) {
      setSelectedMetrics((prev) => [...prev, metric])
    }
  }

  function removeMetric(id: string) {
    setSelectedMetrics((prev) => prev.filter((m) => m.id !== id))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedMetrics((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      const current = next[index]
      if (temp && current) {
        next[index - 1] = current
        next[index] = temp
      }
      return next
    })
  }

  function moveDown(index: number) {
    if (index === selectedMetrics.length - 1) return
    setSelectedMetrics((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      const current = next[index]
      if (temp && current) {
        next[index + 1] = current
        next[index] = temp
      }
      return next
    })
  }

  function handleReset() {
    setSelectedMetrics([])
    setReportName("")
    setChartType("line")
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Sol Panel — Metrik Kütüphanesi */}
      <div className="w-1/3 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">library_books</span>
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Metrik Kütüphanesi</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {METRIC_LIBRARY.map((group) => {
            const isOpen = openCategories.includes(group.category)
            return (
              <div key={group.category} className="border-b border-outline/10 last:border-0">
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">{group.icon}</span>
                    <span className="text-xs font-bold text-on-surface">{group.category}</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">
                    {isOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-1">
                    {group.metrics.map((metric) => {
                      const isAdded = selectedMetrics.some((m) => m.id === metric.id)
                      return (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between px-4 py-2 hover:bg-surface-container rounded mx-2 cursor-pointer"
                          onClick={() => !isAdded && addMetric(metric)}
                        >
                          <span className={`text-xs ${isAdded ? "text-outline line-through" : "text-on-surface"}`}>
                            {metric.label}
                          </span>
                          <button
                            disabled={isAdded}
                            onClick={(e) => { e.stopPropagation(); addMetric(metric) }}
                            className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              isAdded
                                ? "bg-surface-container text-outline cursor-not-allowed"
                                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                            }`}
                          >
                            {isAdded ? (
                              <span className="material-symbols-outlined text-xs">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-xs">add</span>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sağ Panel — Rapor Tasarımı */}
      <div className="flex-1 bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">design_services</span>
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Rapor Tasarımı</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Rapor Adı */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">Rapor Adı</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Rapor adını girin..."
              className="form-input w-full text-xs"
            />
          </div>

          {/* Grafik Tipi */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">Grafik Tipi</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="form-input w-full text-xs"
            >
              {CHART_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Seçilen Metrikler */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase mb-2">
              Seçilen Metrikler ({selectedMetrics.length})
            </label>
            {selectedMetrics.length === 0 ? (
              <div className="border-2 border-dashed border-outline/20 rounded p-6 text-center text-outline text-xs">
                Sol panelden metrik ekleyin
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMetrics.map((metric, index) => (
                  <div
                    key={metric.id}
                    className="bg-surface-container-lowest border border-outline/20 p-2 rounded flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-outline w-5 text-center">{index + 1}</span>
                      <span className="text-xs font-medium text-on-surface">{metric.label}</span>
                      <span className="text-[9px] text-outline bg-surface-container px-1.5 py-0.5 rounded">
                        {metric.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface disabled:opacity-30 transition-colors"
                        title="Yukarı taşı"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === selectedMetrics.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface disabled:opacity-30 transition-colors"
                        title="Aşağı taşı"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                      <button
                        onClick={() => removeMetric(metric.id)}
                        className="w-6 h-6 flex items-center justify-center text-error hover:bg-error-container rounded transition-colors"
                        title="Kaldır"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-outline/10 flex items-center gap-3">
          <button
            disabled={selectedMetrics.length === 0 || !reportName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">summarize</span>
            Raporu Oluştur
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-outline text-outline rounded text-xs font-bold hover:border-on-surface hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Sıfırla
          </button>
        </div>
      </div>
    </div>
  )
}
