import { getInvoices } from "@/lib/actions/invoice.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InvoiceListClient from "./InvoiceListClient";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

export const metadata = {
  title: "Faturalar | MS Oto Servis",
};

export default async function InvoicesPage() {
  const result = await getInvoices({ pageSize: 100 });

  if (!result.success) {
    return <PageError message={result.error ?? "Faturalar yüklenemedi."} />;
  }

  const invoices = (result.data?.invoices ?? []) as any[];
  const total = result.data?.total ?? 0;

  const draftCount = invoices.filter((i) => i.status === "DRAFT").length;
  const sentCount = invoices.filter((i) => i.status === "SENT").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const cancelledCount = invoices.filter((i) => i.status === "CANCELLED").length;

  return (
    <PageShell
      title="Faturalar"
      subtitle="Fatura oluşturun, takip edin ve ödeme durumlarını yönetin."
      sectionLabel="Finans & Muhasebe"
      actions={
        <Link
          href="/dashboard/finance/invoices/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Fatura
        </Link>
      }
    >
      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Toplam", count: total, color: "text-slate-900" },
          { label: "Taslak", count: draftCount, color: "text-slate-500" },
          { label: "Gönderildi", count: sentCount, color: "text-blue-600" },
          { label: "Ödendi", count: paidCount, color: "text-emerald-600" },
          { label: "İptal", count: cancelledCount, color: "text-red-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {item.label}
            </span>
            <span className={`text-3xl font-black ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">
            Henüz fatura yok
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            İlk faturanızı oluşturun.
          </p>
          <Link
            href="/dashboard/finance/invoices/new"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Fatura Oluştur
          </Link>
        </div>
      ) : (
        <InvoiceListClient invoices={invoices} total={total} />
      )}
    </PageShell>
  );
}
