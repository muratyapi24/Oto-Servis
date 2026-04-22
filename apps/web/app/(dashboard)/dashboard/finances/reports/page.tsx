import { getMonthlyFinanceReport } from "@/lib/actions/finance.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import MonthlyReportClient from "@/components/dashboard/finances/MonthlyReportClient";

export const metadata = {
  title: "Aylık Gelir/Gider Raporu | MS Oto Servis"
};

export default async function ReportsPage() {
  const reportRes = await getMonthlyFinanceReport();

  if (reportRes.error) {
    return <PageError message={reportRes.error} />;
  }

  return (
    <PageShell
      title="Aylık Gelir & Gider Raporu"
      subtitle="Son 6 aylık gelir-gider trendlerini ve kârlılık performansınızı analiz edin."
      sectionLabel="Finans Raporları"
    >
      <MonthlyReportClient data={reportRes.data || []} />
    </PageShell>
  );
}
