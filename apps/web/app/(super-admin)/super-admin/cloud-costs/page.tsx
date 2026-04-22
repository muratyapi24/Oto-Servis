import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getCloudCostMetrics } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "Bulut Maliyet Yönetimi | Super Admin" };

const TABS = [
  { id: "overview", label: "Genel Bakış" },
  { id: "services", label: "Servis Bazlı" },
  { id: "trend", label: "Trend" },
];

const SERVICE_COLORS = [
  "#00175c",
  "#6ffbbe",
  "#e8def8",
  "#625b71",
  "#7d5260",
  "#b0bec5",
];

export default async function CloudCostsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const data = await getCloudCostMetrics();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const totalCost = data.byService.reduce((acc, s) => acc + s.cost, 0);

  // SVG donut chart hesaplamaları
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;
  const donutSegments = data.byService.map((s, i) => {
    const pct = s.cost / totalCost;
    const dashArray = pct * circumference;
    const dashOffset = circumference - cumulativeOffset;
    cumulativeOffset += dashArray;
    return { ...s, dashArray, dashOffset, color: SERVICE_COLORS[i % SERVICE_COLORS.length] };
  });

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">cloud_done</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Bulut Maliyet Yönetimi</h2>
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
        {/* 3 Metrik Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">payments</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Bu Ay</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.thisMonth.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Cari Dönem</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-outline text-lg">history</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Geçen Ay</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.lastMonth.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Önceki Dönem</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">trending_up</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Tahmin</p>
            </div>
            <p className="text-2xl font-black text-on-surface">₺{data.forecast.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] text-outline mt-1">Ay Sonu Tahmini</p>
          </div>
        </div>

        {/* Genel Bakış */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut Chart */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Servis Dağılımı</h3>
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <svg viewBox="0 0 120 120" className="w-32 h-32 transform -rotate-90">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="16" />
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={i}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
                        strokeDashoffset={seg.dashOffset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-outline">TOPLAM</p>
                      <p className="text-xs font-black text-on-surface">₺{totalCost.toLocaleString("tr-TR")}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  {donutSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] text-on-surface-variant truncate flex-1">{seg.name}</span>
                      <span className="text-[10px] font-bold text-on-surface">₺{seg.cost.toLocaleString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Özet */}
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Maliyet Özeti</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-container rounded">
                  <span className="text-xs text-on-surface-variant">Toplam Maliyet</span>
                  <span className="text-sm font-black text-on-surface">₺{totalCost.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container rounded">
                  <span className="text-xs text-on-surface-variant">Aylık Değişim</span>
                  <span className={`text-xs font-bold ${data.thisMonth > data.lastMonth ? "text-error" : "text-on-tertiary-fixed-variant"}`}>
                    {data.thisMonth > data.lastMonth ? "+" : ""}
                    {(((data.thisMonth - data.lastMonth) / data.lastMonth) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container rounded">
                  <span className="text-xs text-on-surface-variant">Tahmin vs Bu Ay</span>
                  <span className={`text-xs font-bold ${data.forecast > data.thisMonth ? "text-secondary-container" : "text-on-tertiary-fixed-variant"}`}>
                    {data.forecast > data.thisMonth ? "+" : ""}
                    {(((data.forecast - data.thisMonth) / data.thisMonth) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Servis Bazlı */}
        {tab === "services" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">cloud</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Servis Bazlı Maliyetler</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Servis</th>
                    <th>Maliyet (₺)</th>
                    <th>Oran (%)</th>
                    <th>Dağılım</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byService.map((s, i) => {
                    const pct = ((s.cost / totalCost) * 100).toFixed(1);
                    return (
                      <tr key={i}>
                        <td className="font-semibold text-on-surface">{s.name}</td>
                        <td className="font-mono font-bold text-on-surface">₺{s.cost.toLocaleString("tr-TR")}</td>
                        <td className="font-mono text-on-surface-variant">{pct}%</td>
                        <td className="w-32">
                          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trend */}
        {tab === "trend" && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary-container text-base">trending_up</span>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">6 Aylık Maliyet Trendi</h3>
              </div>
              {/* SVG Line Chart */}
              <svg viewBox="0 0 400 80" className="w-full h-20">
                {[0, 20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e0e0e0" strokeWidth="0.5" />
                ))}
                {[2400, 2500, 2650, 2600, 2800, 2950].map((val, i) => {
                  const x = (i / 5) * 380 + 10;
                  const y = 80 - ((val - 2000) / 1200) * 80;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3" fill="#00175c" />
                      <text x={x} y={75} textAnchor="middle" fontSize="7" fill="#888">
                        {["Oca", "Şub", "Mar", "Nis", "May", "Haz"][i]}
                      </text>
                    </g>
                  );
                })}
                <polyline
                  points={[2400, 2500, 2650, 2600, 2800, 2950].map((val, i) => {
                    const x = (i / 5) * 380 + 10;
                    const y = 80 - ((val - 2000) / 1200) * 80;
                    return `${x},${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#00175c"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-primary">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Bu Ay (Gerçek)</p>
                <p className="text-xl font-black text-on-surface">₺{data.thisMonth.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Sonraki Ay (Tahmin)</p>
                <p className="text-xl font-black text-on-surface">₺{data.forecast.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-outline">
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Yıllık Projeksiyon</p>
                <p className="text-xl font-black text-on-surface">₺{(data.forecast * 12).toLocaleString("tr-TR")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
