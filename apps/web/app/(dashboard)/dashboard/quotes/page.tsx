import { getQuotes } from "@/lib/actions/quote.actions";
import { getCustomers } from "@/lib/actions/customer.actions";
import { getParts } from "@/lib/actions/inventory.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import QuoteBoardClient from "@/components/dashboard/quotes/QuoteBoardClient";

export const metadata = { title: "Teklifler | MS Oto Servis" };

export default async function QuotesPage() {
  const [quotesRes, customersRes, partsRes] = await Promise.all([
    getQuotes(),
    getCustomers(),
    getParts(),
  ]);

  if (quotesRes.error) return <PageError message={quotesRes.error} />;

  return (
    <PageShell
      title="Teklif Yönetimi"
      subtitle="Müşterilere sunulan servis tekliflerini oluşturun, gönderin ve takip edin."
      sectionLabel="Satış & Teklifler"
    >
      <QuoteBoardClient
        quotes={('quotes' in quotesRes ? quotesRes.quotes : null) ?? []}
        customers={('customers' in customersRes ? customersRes.customers : null) ?? []}
        parts={('parts' in partsRes ? partsRes.parts : null) ?? []}
      />
    </PageShell>
  );
}
