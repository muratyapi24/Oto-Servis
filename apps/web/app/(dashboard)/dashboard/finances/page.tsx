import { getFinanceDashboard } from "@/lib/actions/finance.actions";
import { getCustomers } from "@/lib/actions/customer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import FinanceBoardClient from "@/components/dashboard/finances/FinanceBoardClient";
import FinanceWorkspaceNav from "@/components/dashboard/finances/FinanceWorkspaceNav";

export const metadata = {
  title: "Finans & Kasa Yönetimi | MS Oto Servis"
};

export default async function FinancesPage() {
  const [metricsResponse, customersResponse] = await Promise.all([
    getFinanceDashboard(),
    getCustomers()
  ]);

  if ("error" in metricsResponse && metricsResponse.error) {
    return <PageError message={metricsResponse.error} />;
  }

  const metrics = {
    unpaidInvoices: metricsResponse.unpaidInvoices || [],
    cashMetrics: metricsResponse.cashMetrics || { dailyCashIn: 0, dailyTrend: 0, netCash: 0, totalInflow: 0, totalOutflow: 0 },
    receivables: metricsResponse.receivables || { aging_0_30: 0, aging_31_60: 0, aging_60_plus: 0 },
    upcomingExpenses: metricsResponse.upcomingExpenses || []
  };

  const customers = 'customers' in customersResponse ? customersResponse.customers : [];

  return (
    <PageShell
      title="Kasa & Cari Takip"
      subtitle="Satış faturaları, tahsilatlar, kasa hareketleri ve müşteri cari hesaplarını yönetin."
      sectionLabel="Muhasebe ve Finans"
    >
      <FinanceWorkspaceNav />
      <FinanceBoardClient metrics={metrics} customers={customers} />
    </PageShell>
  );
}
