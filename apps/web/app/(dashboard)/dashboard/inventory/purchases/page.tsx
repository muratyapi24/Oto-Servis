import { getPurchaseInvoices } from "@/lib/actions/stock.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import InventoryWorkspaceNav from "@/components/dashboard/inventory/InventoryWorkspaceNav";
import { PurchaseDialog } from "./PurchaseDialog";
import {
  ShoppingCart,
  FileText,
  Building2,
  Calendar,
  Filter,
  ArrowDownLeft,
} from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/tr';

export const metadata = {
  title: "Stok Alım Faturaları | MS Oto Servis",
};

type PurchaseInvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  issueDate: Date | string;
  totalAmount: unknown;
  supplier?: { name: string | null } | null;
};

export default async function PurchasesPage() {
  const { invoices, error } = await getPurchaseInvoices();

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <PageShell
      title="Stok Alım Faturaları"
      subtitle="Tedarikçilerden alınan ürünlerin fatura ve irsaliye kayıtları."
      sectionLabel="Stok & Tedarik"
      actions={<PurchaseDialog />}
    >
      <InventoryWorkspaceNav />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" /> Kayıtlı Faturalar
            </h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Fatura No veya Tedarikçi Ara..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm transition-all focus:bg-white focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {!invoices || invoices.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Fatura Kaydı Bulunamadı</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">
                  Henüz bir stok girişi yapmamışsınız. Stok Girişi Yap butonu ile ilk alım kaydını oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fatura Bilgisi</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tedarikçi</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Tutar</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Durum</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: PurchaseInvoiceRow) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-bold">
                            <ArrowDownLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{inv.invoiceNumber}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              {dayjs(inv.issueDate).locale('tr').format("DD MMMM YYYY")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">{inv.supplier?.name || "Bilinmiyor"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-lg font-mono font-bold text-gray-900">
                          ₺{Number(inv.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">KDV Dahil</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wider">
                          İŞLENDİ
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-primary transition-colors">
                          <FileText className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </PageShell>
  );
}
