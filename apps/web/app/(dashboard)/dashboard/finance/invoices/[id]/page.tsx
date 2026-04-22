import { getInvoiceById } from "@/lib/actions/invoice.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InvoiceDetailClient from "./InvoiceDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getInvoiceById(id);
  if (!result.success || !result.data) return { title: "Fatura | MS Oto Servis" };
  const inv = result.data.invoice as any;
  return { title: `${inv.invoiceNumber ?? "Taslak"} | Fatura | MS Oto Servis` };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getInvoiceById(id);

  if (!result.success || !result.data) {
    if (result.error === "Fatura bulunamadı.") notFound();
    return <PageError message={result.error ?? "Fatura yüklenemedi."} />;
  }

  const invoice = result.data.invoice as any;

  return (
    <PageShell
      title={invoice.invoiceNumber ?? "Taslak Fatura"}
      subtitle={`${invoice.customer?.companyName ?? [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(" ") ?? "Müşteri"} · ${invoice.items?.length ?? 0} kalem`}
      sectionLabel="Finans & Muhasebe"
      actions={
        <Link
          href="/dashboard/finance/invoices"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Faturalara Dön
        </Link>
      }
    >
      <InvoiceDetailClient invoice={invoice} />
    </PageShell>
  );
}
