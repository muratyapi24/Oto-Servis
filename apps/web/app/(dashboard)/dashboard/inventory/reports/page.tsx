import { Suspense } from "react";
import {
  getStockValueReport,
  getTopUsedParts,
  getCriticalStockReport,
  getStockMovementReport,
} from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import ReportWorkspaceNav from "@/components/dashboard/reports/ReportWorkspaceNav";
import ReportsTabs from "./ReportsTabs";
import { BarChart2 } from "lucide-react";

export const metadata = {
  title: "Gelişmiş Raporlar | MS Oto Servis",
};

type ReportsTabsProps = Parameters<typeof ReportsTabs>[0];

function ReportsLoading() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm">Rapor verileri yükleniyor...</p>
    </div>
  );
}

async function ReportsContent() {
  // Son 30 günlük tarih aralığı (varsayılan)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [stockValueResult, topUsedResult, criticalResult, movementResult] =
    await Promise.all([
      getStockValueReport(),
      getTopUsedParts({ startDate: thirtyDaysAgo, endDate: now }, 20),
      getCriticalStockReport(),
      getStockMovementReport({ page: 1, pageSize: 20 }),
    ]);

  if (stockValueResult.error) {
    return <PageError message={stockValueResult.error} />;
  }

  const stockValueData = stockValueResult.data ?? {
    categories: [],
    summary: {
      totalCategories: 0,
      totalPartTypes: 0,
      grandTotalStock: 0,
      grandTotalValue: 0,
    },
  };

  const topUsedParts: ReportsTabsProps["topUsedParts"] =
    topUsedResult.success && topUsedResult.data
      ? (topUsedResult.data.parts.filter(Boolean) as ReportsTabsProps["topUsedParts"])
      : [];

  const criticalParts: ReportsTabsProps["criticalParts"] =
    criticalResult.success && criticalResult.data
      ? (criticalResult.data.parts as ReportsTabsProps["criticalParts"])
      : [];

  const criticalSummary =
    criticalResult.success && criticalResult.data
      ? criticalResult.data.summary
      : { totalCritical: 0, outOfStock: 0, belowMinimum: 0 };

  const initialMovements: ReportsTabsProps["initialMovements"] =
    movementResult.success && movementResult.data
      ? (movementResult.data.movements as ReportsTabsProps["initialMovements"])
      : [];

  const initialPagination =
    movementResult.success && movementResult.data
      ? movementResult.data.pagination
      : { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  const defaultDateRange = {
    startDate: thirtyDaysAgo.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };

  return (
    <ReportsTabs
      stockValueCategories={stockValueData.categories}
      stockValueSummary={stockValueData.summary}
      topUsedParts={topUsedParts}
      defaultDateRange={defaultDateRange}
      criticalParts={criticalParts}
      criticalSummary={criticalSummary}
      initialMovements={initialMovements}
      initialPagination={initialPagination}
    />
  );
}

export default function ReportsPage() {
  return (
    <PageShell
      title="Gelişmiş Raporlar"
      subtitle="Stok değeri, hareket geçmişi ve kritik stok analizleri."
      sectionLabel="Stok & Envanter"
      actions={
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <BarChart2 className="w-4 h-4" />
          <span>Anlık Veriler</span>
        </div>
      }
    >
      <ReportWorkspaceNav />
      <Suspense fallback={<ReportsLoading />}>
        <ReportsContent />
      </Suspense>
    </PageShell>
  );
}
