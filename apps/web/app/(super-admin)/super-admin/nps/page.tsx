import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getNPSMetrics, getNPSResponses } from "@/lib/actions/superadmin.actions";

export const metadata = { title: "NPS Paneli | Super Admin" };

export default async function NPSPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const [metricsResult, responsesResult] = await Promise.all([
    getNPSMetrics(),
    getNPSResponses(),
  ]);

  if ("error" in metricsResult) return <div className="p-8 text-error font-mono">{metricsResult.error}</div>;
  if ("error" in responsesResult) return <div className="p-8 text-error font-mono">{responsesResult.error}</div>;

  const data = { ...metricsResult, responses: responsesResult.responses };

  const TABS = [
    { id: "overview", label: "Genel Bakış" },
    { id: "responses", label: "Yanıtlar" },
    { id: "trend", label: "Trend" },
  ];

  const scoreBadge = (score: number) => {
    if (score >= 9) return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    if (score >= 7) return "bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
  };

  // Mock bar heights for 0-10 distribution
  const barHeights = [5, 3, 4, 2, 3, 8, 12, 15, 22, 18, 8];
  const maxHeight = Math.max(...barHeights);

  // Trend chart points
  const trendArray = data.trend || [];
  const trendMax = Math.max(...trendArray.map((t) => t.score));
  const trendMin = Math.min(...trendArray.map((t) => t.score));
  const trendRange = trendMax - trendMin || 1;
  const chartW = 400;
  const chartH = 80;
  const trendPoints = trendArray.map((t, i) => {
    const x = (i / (trendArray.length - 1)) * chartW;
    const y = chartH - ((t.score - trendMin) / trendRange) * chartH;
    return `${x},${y}`;
  });

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">sentiment_satisfied</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">NPS Paneli</h2>
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
        {/* NPS Skoru Büyük Kartı */}
        <div className="bg-primary text-white p-6 rounded shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Net Promoter Score</p>
            <p className="text-6xl font-black">{data.score}</p>
            <p className="text-sm text-white/70 mt-1">Mükemmel</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-tertiary-fixed">{data.promoters}%</p>
                <p className="text-[10px] text-white/70 uppercase">Promoters</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white/60">{data.passives}%</p>
                <p className="text-[10px] text-white/70 uppercase">Passives</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-error-container">{data.detractors}%</p>
                <p className="text-[10px] text-white/70 uppercase">Detractors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Genel Bakış Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            {/* NPS Dağılım Bar Chart */}
            <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">NPS Dağılımı (0-10)</h3>
              <div className="flex items-end gap-1 h-24">
                {barHeights.map((h, i) => {
                  const barColor =
                    i <= 6 ? "bg-error" : i <= 8 ? "bg-outline" : "bg-tertiary-fixed";
                  const heightPct = Math.round((h / maxHeight) * 100);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                      <div
                        className={`w-full rounded-t ${barColor}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[9px] text-outline">{i}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-error inline-block" />
                  <span className="text-[10px] text-outline">Detractors (0-6)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-outline inline-block" />
                  <span className="text-[10px] text-outline">Passives (7-8)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-tertiary-fixed inline-block" />
                  <span className="text-[10px] text-outline">Promoters (9-10)</span>
                </div>
              </div>
            </div>

            {/* Trend Grafiği */}
            <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">6 Aylık NPS Trendi</h3>
              <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-28">
                <polyline
                  points={trendPoints.join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />
                {trendArray.map((t, i) => {
                  const x = (i / (trendArray.length - 1)) * chartW;
                  const y = chartH - ((t.score - trendMin) / trendRange) * chartH;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3" className="fill-primary" />
                      <text x={x} y={chartH + 16} textAnchor="middle" className="fill-outline text-[8px]" fontSize="8">
                        {t.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Yanıtlar Tab */}
        {tab === "responses" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Skor</th>
                    <th>Yorum</th>
                    <th>Firma</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {data.responses.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={scoreBadge(r.score)}>{r.score}</span>
                      </td>
                      <td className="max-w-xs text-on-surface-variant">{r.comment}</td>
                      <td className="text-on-surface">{r.tenantName}</td>
                      <td className="text-outline font-mono text-[10px]">
                        {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trend Tab */}
        {tab === "trend" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Dönem</th>
                    <th>NPS Skoru</th>
                    <th>Değişim</th>
                  </tr>
                </thead>
                <tbody>
                  {trendArray.map((t, i) => {
                    const prev = i > 0 ? trendArray[i - 1]?.score ?? null : null;
                    const change = prev !== null && typeof prev === 'number' ? t.score - prev : null;
                    return (
                      <tr key={i}>
                        <td className="font-medium text-on-surface">{t.label}</td>
                        <td>
                          <span className="font-black text-primary">{t.score}</span>
                        </td>
                        <td>
                          {change !== null ? (
                            <span className={change >= 0 ? "text-on-tertiary-fixed-variant font-bold text-[10px]" : "text-error font-bold text-[10px]"}>
                              {change >= 0 ? `+${change}` : change}
                            </span>
                          ) : (
                            <span className="text-outline text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
