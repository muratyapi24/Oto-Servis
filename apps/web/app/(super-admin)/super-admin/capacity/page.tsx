import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getCapacityMetrics } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Kapasite Planlama | Super Admin" };

const TABS = [
  { id: "current", label: "Anlık Durum" },
  { id: "trend", label: "Trend" },
  { id: "forecast", label: "Tahmin" },
];

function metricColor(value: number) {
  if (value > 80) return "text-error";
  if (value > 60) return "text-secondary-container";
  return "text-primary";
}

function progressColor(value: number) {
  if (value > 80) return "bg-error";
  if (value > 60) return "bg-secondary-container";
  return "bg-primary";
}

function borderColor(label: string) {
  switch (label) {
    case "CPU": return "border-l-primary";
    case "RAM": return "border-l-secondary";
    case "Disk": return "border-l-secondary-container";
    case "Ağ": return "border-l-tertiary-fixed";
    default: return "border-l-primary";
  }
}

export default async function CapacityPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "current";

  const data = await getCapacityMetrics();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const metrics = [
    { label: "CPU", icon: "memory", value: data.cpu },
    { label: "RAM", icon: "storage", value: data.ram },
    { label: "Disk", icon: "hard_drive", value: data.disk },
    { label: "Ağ", icon: "network_check", value: data.network },
  ];

  const barWidth = 28;
  const barGap = 12;
  const chartHeight = 80;
  const maxVal = 100;

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">speed</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Kapasite Planlama</h2>
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
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 4 Metrik Kartı */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className={`bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 ${borderColor(m.label)}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-lg ${metricColor(m.value)}`}>{m.icon}</span>
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{m.label}</p>
              </div>
              <p className={`text-3xl font-black ${metricColor(m.value)}`}>
                {m.value}<span className="text-sm font-normal text-outline">%</span>
              </p>
              <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${progressColor(m.value)}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Anlık Durum */}
        {tab === "current" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Kaynak Kullanım Detayı</h3>
              <div className="space-y-4">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-on-surface">{m.label} Kullanımı</span>
                      <span className={`text-xs font-bold ${metricColor(m.value)}`}>{m.value}%</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${progressColor(m.value)}`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-outline">0%</span>
                      <span className="text-[9px] text-outline">100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kapasite Özet Tablosu */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Kapasite Özeti</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Kaynak</th>
                      <th>Mevcut</th>
                      <th>Maks</th>
                      <th>Kullanım %</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { resource: "CPU", current: `${data.cpu}%`, max: "100%", pct: data.cpu },
                      { resource: "RAM", current: `${data.ram}%`, max: "100%", pct: data.ram },
                      { resource: "Disk", current: `${data.disk}%`, max: "100%", pct: data.disk },
                      { resource: "Ağ", current: `${data.network}%`, max: "100%", pct: data.network },
                    ].map((row) => (
                      <tr key={row.resource}>
                        <td className="font-semibold text-on-surface">{row.resource}</td>
                        <td className="font-mono text-on-surface">{row.current}</td>
                        <td className="font-mono text-outline">{row.max}</td>
                        <td className={`font-mono font-bold ${metricColor(row.pct)}`}>{row.pct}%</td>
                        <td>
                          <span className={row.pct > 80
                            ? "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
                            : row.pct > 60
                            ? "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold"
                            : "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                          }>
                            {row.pct > 80 ? "KRİTİK" : row.pct > 60 ? "UYARI" : "NORMAL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Trend */}
        {tab === "trend" && (
          <div className="space-y-4">
            {/* SVG Bar Chart */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">7 Günlük CPU & RAM Trendi</h3>
              <svg viewBox={`0 0 ${data.trend.length * (barWidth + barGap)} ${chartHeight + 16}`} className="w-full h-24">
                {data.trend.map((d, i) => {
                  const x = i * (barWidth + barGap);
                  const cpuH = (d.cpu / maxVal) * chartHeight;
                  const ramH = (d.ram / maxVal) * chartHeight;
                  return (
                    <g key={i}>
                      {/* CPU bar */}
                      <rect
                        x={x}
                        y={chartHeight - cpuH}
                        width={barWidth / 2 - 1}
                        height={cpuH}
                        fill="#00175c"
                        rx="2"
                      />
                      {/* RAM bar */}
                      <rect
                        x={x + barWidth / 2 + 1}
                        y={chartHeight - ramH}
                        width={barWidth / 2 - 1}
                        height={ramH}
                        fill="#6ffbbe"
                        rx="2"
                      />
                      <text x={x + barWidth / 2} y={chartHeight + 12} textAnchor="middle" fontSize="7" fill="#888">
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm bg-primary inline-block" />
                  <span className="text-[10px] text-outline">CPU</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-sm bg-tertiary-fixed inline-block" />
                  <span className="text-[10px] text-outline">RAM</span>
                </div>
              </div>
            </div>

            {/* Trend Tablosu */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Günlük Veriler</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Gün</th>
                      <th>CPU (%)</th>
                      <th>RAM (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trend.map((d, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-on-surface">{d.label}</td>
                        <td className={`font-mono ${metricColor(d.cpu)}`}>{d.cpu}</td>
                        <td className={`font-mono ${metricColor(d.ram)}`}>{d.ram}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tahmin */}
        {tab === "forecast" && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary-container text-base">trending_up</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Kapasite Tahmini (30 Gün)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((m) => {
                  const projected = Math.min(100, Math.round(m.value * 1.15));
                  return (
                    <div key={m.label} className="p-3 bg-surface-container rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-on-surface">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-outline">Şu an: {m.value}%</span>
                          <span className={`text-[10px] font-bold ${metricColor(projected)}`}>→ {projected}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${progressColor(projected)}`}
                          style={{ width: `${projected}%` }}
                        />
                      </div>
                      {projected > 80 && (
                        <p className="text-[9px] text-error mt-1 font-bold">⚠ Kapasite artırımı önerilir</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kapasite Özet Tablosu */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Kapasite Özet Tablosu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Kaynak</th>
                      <th>Mevcut</th>
                      <th>Maks</th>
                      <th>Kullanım %</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => {
                      const projected = Math.min(100, Math.round(m.value * 1.15));
                      return (
                        <tr key={m.label}>
                          <td className="font-semibold text-on-surface">{m.label}</td>
                          <td className="font-mono text-on-surface">{m.value}%</td>
                          <td className="font-mono text-outline">100%</td>
                          <td className={`font-mono font-bold ${metricColor(projected)}`}>{projected}%</td>
                          <td>
                            <span className={projected > 80
                              ? "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold"
                              : projected > 60
                              ? "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold"
                              : "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold"
                            }>
                              {projected > 80 ? "KRİTİK" : projected > 60 ? "UYARI" : "NORMAL"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
