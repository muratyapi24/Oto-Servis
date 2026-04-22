
import { redirect } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/finance.actions";
import PageShell from "@/components/dashboard/PageShell";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const metadata = { title: "Fatura Detayı | MS Oto Servis" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoiceById(id);

  if (result.error || !result.invoice) {
    redirect("/dashboard/finances");
  }

  return (
    <PageShell
      title={`Fatura ${result.invoice.invoiceNumber ?? ""}`}
      subtitle="Fatura detayları, ödeme geçmişi ve ödeme kaydetme."
      sectionLabel="Finans & Kasa"
    >
      <InvoiceDetailClient invoice={result.invoice} />
    </PageShell>
  );
}
