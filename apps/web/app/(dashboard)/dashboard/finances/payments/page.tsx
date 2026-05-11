import { getPayments } from "@/lib/actions/payment.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import PaymentListClient, { type PaymentListItem } from "@/components/dashboard/finances/PaymentListClient";
import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";

export const metadata = {
  title: "Ödemeler | MS Oto Servis",
};

export default async function PaymentsPage() {
  const result = await getPayments({ pageSize: 100 });

  if (!result.success) {
    return <PageError message={result.error ?? "Ödemeler yüklenemedi."} />;
  }

  const payments = JSON.parse(JSON.stringify(result.data?.payments ?? [])) as PaymentListItem[];
  const total = result.data?.total ?? 0;

  return (
    <PageShell
      title="Ödemeler"
      subtitle="Tahsilatları kaydedin ve ödeme geçmişini takip edin."
      sectionLabel="Finans & Kasa"
      actions={
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finances/payments/checks"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            Çek/Senet Takibi
          </Link>
          <Link
            href="/dashboard/finances/payments/new"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Ödeme Kaydet
          </Link>
        </div>
      }
    >
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">Henüz ödeme yok</h3>
          <p className="text-slate-400 text-sm mb-6">İlk ödemeyi kaydedin.</p>
          <Link
            href="/dashboard/finances/payments/new"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Ödeme Kaydet
          </Link>
        </div>
      ) : (
        <PaymentListClient payments={payments} total={total} />
      )}
    </PageShell>
  );
}
