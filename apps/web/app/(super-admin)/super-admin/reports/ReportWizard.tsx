"use client"

import { useState } from "react"
import { generateReport } from "@/lib/actions/superadmin.actions"

type ChartType = "line" | "bar" | "pie" | "table"
type Period = "7d" | "30d" | "90d" | "year" | "custom"

const METRICS = [
  { id: "mrr", label: "MRR (Aylık Yinelenen Gelir)" },
  { id: "arr", label: "ARR (Yıllık Yinelenen Gelir)" },
  { id: "active_tenants", label: "Aktif Tenant Sayısı" },
  { id: "new_registrations", label: "Yeni Kayıtlar" },
  { id: "churn_rate", label: "Churn Oranı" },
  { id: "user_activity", label: "Kullanıcı Aktivitesi" },
  { id: "service_orders", label: "Servis Emri Sayısı" },
  { id: "payment_success", label: "Ödeme Başarı Oranı" },
]

const PERIODS: { id: Period; label: string }[] = [
  { id: "7d", label: "Son 7 Gün" },
  { id: "30d", label: "Son 30 Gün" },
  { id: "90d", label: "Son 90 Gün" },
  { id: "year", label: "Bu Yıl" },
  { id: "custom", label: "Özel Aralık" },
]

const CHART_TYPES: { id: ChartType; label: string; icon: string }[] = [
  { id: "line", label: "Çizgi Grafik", icon: "show_chart" },
  { id: "bar", label: "Bar Grafik", icon: "bar_chart" },
  { id: "pie", label: "Pasta Grafik", icon: "pie_chart" },
  { id: "table", label: "Tablo", icon: "table_chart" },
]

export default function ReportWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [selectedChart, setSelectedChart] = useState<ChartType>("line")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleMetric(id: string) {
    setSelectedMetrics((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await generateReport({
        metrics: selectedMetrics,
        period: selectedPeriod,
        chartType: selectedChart,
      })
      if ("error" in res) {
        setError(res.error || "Bir hata oluştu")
      } else {
        setResult("Rapor başarıyla oluşturuldu.")
      }
    } catch {
      setError("Rapor oluşturulurken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const periodLabel = PERIODS.find((p) => p.id === selectedPeriod)?.label ?? selectedPeriod
  const chartLabel = CHART_TYPES.find((c) => c.id === selectedChart)?.label ?? selectedChart

  return (
    <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-outline/10 flex items-center gap-3">
        {([1, 2, 3, 4] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                s === step
                  ? "bg-primary text-white"
                  : s < step
                  ? "bg-tertiary-fixed text-on-tertiary-fixed"
                  : "bg-surface-container text-outline"
              }`}
            >
              {s < step ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                s
              )}
            </div>
            {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-tertiary-fixed" : "bg-outline/20"}`} />}
          </div>
        ))}
        <span className="ml-2 text-xs text-outline font-medium">
          {step === 1 && "Metrik Seçimi"}
          {step === 2 && "Dönem Filtresi"}
          {step === 3 && "Grafik Tipi"}
          {step === 4 && "Önizleme & Export"}
        </span>
      </div>

      <div className="p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-4">Hangi metrikleri raporlamak istiyorsunuz?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {METRICS.map((m) => {
                const selected = selectedMetrics.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 bg-surface-container-lowest border p-3 rounded cursor-pointer hover:border-primary/40 transition-all ${
                      selected ? "border-primary bg-primary/5" : "border-outline/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleMetric(m.id)}
                      className="accent-primary"
                    />
                    <span className="text-xs font-medium text-on-surface">{m.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-4">Hangi dönem için rapor oluşturulsun?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERIODS.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 bg-surface-container-lowest border p-3 rounded cursor-pointer hover:border-primary/40 transition-all ${
                    selectedPeriod === p.id ? "border-primary bg-primary/5" : "border-outline/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="period"
                    value={p.id}
                    checked={selectedPeriod === p.id}
                    onChange={() => setSelectedPeriod(p.id)}
                    className="accent-primary"
                  />
                  <span className="text-xs font-medium text-on-surface">{p.label}</span>
                </label>
              ))}
            </div>
            {selectedPeriod === "custom" && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-outline uppercase">Başlangıç</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-outline uppercase">Bitiş</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-4">Rapor nasıl görselleştirilsin?</h3>
            <div className="grid grid-cols-2 gap-4">
              {CHART_TYPES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChart(c.id)}
                  className={`bg-surface-container-lowest border-2 p-4 rounded cursor-pointer flex flex-col items-center gap-3 transition-all ${
                    selectedChart === c.id ? "border-primary bg-primary/5" : "border-outline/20 hover:border-primary/40"
                  }`}
                >
                  <span className={`material-symbols-outlined text-3xl ${selectedChart === c.id ? "text-primary" : "text-outline"}`}>
                    {c.icon}
                  </span>
                  <span className={`text-xs font-bold ${selectedChart === c.id ? "text-primary" : "text-on-surface"}`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <h3 className="text-sm font-bold text-on-surface mb-4">Rapor Önizlemesi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-container-lowest border border-outline/20 p-3 rounded">
                <p className="text-[10px] font-bold text-outline uppercase mb-1">Seçilen Metrikler</p>
                <p className="text-xs text-on-surface">
                  {selectedMetrics.length > 0
                    ? selectedMetrics.map((id) => METRICS.find((m) => m.id === id)?.label).join(", ")
                    : "—"}
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-3 rounded">
                <p className="text-[10px] font-bold text-outline uppercase mb-1">Dönem</p>
                <p className="text-xs text-on-surface">
                  {selectedPeriod === "custom" ? `${customStart} — ${customEnd}` : periodLabel}
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-3 rounded">
                <p className="text-[10px] font-bold text-outline uppercase mb-1">Grafik Tipi</p>
                <p className="text-xs text-on-surface">{chartLabel}</p>
              </div>
            </div>

            {/* Mock Preview */}
            <div className="bg-surface-container border border-outline/20 rounded p-4 mb-6 flex items-center justify-center min-h-[160px]">
              <svg viewBox="0 0 400 120" className="w-full max-w-md" aria-label="Rapor önizlemesi">
                <polyline
                  points="0,100 66,80 133,90 200,60 266,40 333,50 400,30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />
                {[0, 66, 133, 200, 266, 333, 400].map((x, i) => {
                  const ys = [100, 80, 90, 60, 40, 50, 30]
                  return <circle key={i} cx={x} cy={ys[i]} r="3" className="fill-primary" />
                })}
                <text x="0" y="115" className="text-[8px] fill-outline" fontSize="8">Oca</text>
                <text x="60" y="115" className="text-[8px] fill-outline" fontSize="8">Şub</text>
                <text x="127" y="115" className="text-[8px] fill-outline" fontSize="8">Mar</text>
                <text x="194" y="115" className="text-[8px] fill-outline" fontSize="8">Nis</text>
                <text x="260" y="115" className="text-[8px] fill-outline" fontSize="8">May</text>
                <text x="327" y="115" className="text-[8px] fill-outline" fontSize="8">Haz</text>
              </svg>
            </div>

            {result && (
              <div className="mb-4 p-3 bg-tertiary-fixed/20 border border-tertiary-fixed/40 rounded text-xs font-bold text-on-surface">
                {result}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-error-container border border-error/20 rounded text-xs font-bold text-on-error-container">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button className="bg-primary text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF Olarak İndir
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="border border-primary text-primary px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">save</span>
                )}
                Raporu Kaydet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-outline/10 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 border border-outline/30 text-outline rounded text-xs font-bold disabled:opacity-40 hover:border-outline/60 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Geri
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
            disabled={step === 1 && selectedMetrics.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            İleri
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading || selectedMetrics.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {loading ? "Oluşturuluyor..." : "Rapor Oluştur"}
            <span className="material-symbols-outlined text-sm">summarize</span>
          </button>
        )}
      </div>
    </div>
  )
}
