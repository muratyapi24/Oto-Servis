import { getAnalyticsDashboard } from "@/lib/actions/analytics.actions";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import AnalyticsBoardClient from "@/components/dashboard/analytics/AnalyticsBoardClient";
import RatingMetricsSection from "@/components/dashboard/analytics/RatingMetricsSection";

export const metadata = {
  title: "Analitik & Raporlar | MS Oto Servis",
};

export default async function AnalyticsPage() {
  const session = await auth();
  const result = await getAnalyticsDashboard();

  if ("error" in result && result.error) {
    return <PageError message={result.error} />;
  }

  const data = {
    metrics: result.metrics!,
    monthlyTrend: result.monthlyTrend || [],
    serviceDistribution: result.serviceDistribution || [],
    recentActivity: result.recentActivity || [],
  };

  // ServiceRating metrikleri — son 30 gün
  let ratingAverage = 0;
  let ratingTotal = 0;
  const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  if (session?.user?.tenantId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [aggResult, distResult] = await Promise.all([
      prisma.serviceRating.aggregate({
        where: { tenantId: session.user.tenantId, createdAt: { gte: thirtyDaysAgo } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.serviceRating.groupBy({
        by: ["rating"],
        where: { tenantId: session.user.tenantId, createdAt: { gte: thirtyDaysAgo } },
        _count: { rating: true },
      }),
    ]);

    ratingAverage = aggResult._avg.rating ?? 0;
    ratingTotal = aggResult._count.rating;
    distResult.forEach((d) => {
      ratingDistribution[String(d.rating)] = d._count.rating;
    });
  }

  return (
    <PageShell
      title="Analitik & Raporlar"
      subtitle="Aylık performans göstergeleri, gelir trendi ve operasyonel istatistikleriniz."
      sectionLabel="İş Zekası"
    >
      <AnalyticsBoardClient data={data} />
      <div className="mt-8">
        <RatingMetricsSection
          average={ratingAverage}
          total={ratingTotal}
          distribution={ratingDistribution}
        />
      </div>
    </PageShell>
  );
}
