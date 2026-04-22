import { redirect } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { getQuoteById } from "@/lib/actions/quote.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import QuoteDetailActions from "./QuoteDetailActions";

export const metadata = { title: "Teklif Detayı | MS Oto Servis" };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getQuoteById(id);

  if (result.error || !result.quote) redirect("/dashboard/quotes");

  const q = result.quote;
  const customerName = q.customer?.type === "CORPORATE"
    ? q.customer?.companyName
    : `${q.customer?.firstName ?? ""} ${q.customer?.lastName ?? ""}`.trim();

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Taslak", SENT: "Gönderildi", ACCEPTED: "Kabul Edildi",
    REJECTED: "Reddedildi", EXPIRED: "Süresi Doldu",
  };

  return (
    <PageShell
      title={`Teklif #${q.quoteNumber}`}
      subtitle={`${customerName} — ${dayjs(q.createdAt).locale("tr").format("DD MMMM YYYY")}`}
      sectionLabel="Teklifler"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/quotes" className="text-sm font-bold text-gray-400 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded">◄ Geri</Link>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${q.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                q.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  q.status === "EXPIRED" ? "bg-orange-100 text-orange-800" :
                    q.status === "SENT" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-700"
              }`}>{STATUS_LABELS[q.status] ?? q.status}</span>
          </div>
          <QuoteDetailActions quote={JSON.parse(JSON.stringify(q))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Müşteri</h3>
            <p className="font-bold text-gray-900">{customerName}</p>
            {q.customer?.phone && <p className="text-sm text-gray-500">{q.customer.phone}</p>}
            {q.vehicle && <p className="text-sm text-gray-500 font-mono">{q.vehicle.plate} — {q.vehicle.brand} {q.vehicle.model}</p>}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Teklif Bilgileri</h3>
            <p className="text-sm text-gray-600">Oluşturulma: {dayjs(q.createdAt).locale("tr").format("DD MMM YYYY")}</p>
            {q.validUntil && <p className="text-sm text-gray-600">Geçerlilik: {dayjs(q.validUntil).locale("tr").format("DD MMM YYYY")}</p>}
            {q.notes && <p className="text-sm text-gray-500 italic">{q.notes}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-5 py-4 border-b">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Teklif Kalemleri</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white border-b text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Kalem</th>
                <th className="px-5 py-3 text-left">Tür</th>
                <th className="px-5 py-3 text-right">Miktar</th>
                <th className="px-5 py-3 text-right">Birim Fiyat</th>
                <th className="px-5 py-3 text-right">KDV %</th>
                <th className="px-5 py-3 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {q.items.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Kalem eklenmemiş.</td></tr>
              ) : q.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{item.itemType === "PART" ? "Parça" : item.itemType === "LABOR" ? "İşçilik" : "Diğer"}</td>
                  <td className="px-5 py-3 text-right font-mono">{item.quantity}</td>
                  <td className="px-5 py-3 text-right font-mono">₺{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 text-right text-gray-500">%{item.taxRate}</td>
                  <td className="px-5 py-3 text-right font-bold font-mono">₺{item.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 border-t p-5 flex flex-col items-end gap-1 text-sm">
            <div className="flex justify-between w-full max-w-xs text-gray-600"><span>Ara Toplam:</span><span className="font-mono">₺{q.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between w-full max-w-xs text-gray-600"><span>KDV:</span><span className="font-mono">₺{q.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between w-full max-w-xs font-bold text-lg border-t pt-2 mt-1"><span>Genel Toplam:</span><span className="font-mono">₺{q.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
