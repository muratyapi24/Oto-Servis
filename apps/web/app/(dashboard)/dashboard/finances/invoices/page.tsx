import { getAllInvoices } from "@/lib/actions/invoice-list.actions";
import { getCustomers } from "@/lib/actions/customer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InvoiceListClient from "@/components/dashboard/finances/InvoiceListClient";
import FinanceWorkspaceNav from "@/components/dashboard/finances/FinanceWorkspaceNav";

export const metadata = {
  title: "Tüm Faturalar | MS Oto Servis"
};

export default async function InvoicesPage() {
  const [invoicesRes, customersRes] = await Promise.all([
    getAllInvoices(),
    getCustomers()
  ]);

  if (invoicesRes.error) {
    return <PageError message={invoicesRes.error} />;
  }

  const invoices = invoicesRes.invoices || [];
  const customers = 'customers' in customersRes ? customersRes.customers : [];

  return (
    <PageShell
      title="Fatura Yönetimi"
      subtitle="Tüm satış ve alış faturalarınızı görüntüleyin, filtreleyin ve yönetin."
      sectionLabel="Finans"
    >
      <FinanceWorkspaceNav />
      <InvoiceListClient invoices={invoices} customers={customers} />
    </PageShell>
  );
}
