import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "e-Fatura Ayarları | MS Oto Servis",
};

export default async function EInvoicePage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  // Son e-Fatura durumlarını getir
  const recentEInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      eInvoiceStatus: { not: null },
      deletedAt: null,
    },
    select: {
      id: true,
      invoiceNumber: true,
      eInvoiceStatus: true,
      eInvoiceType: true,
      eInvoiceSentAt: true,
      eInvoiceUUID: true,
      eInvoiceErrorMessage: true,
    },
    orderBy: { eInvoiceSentAt: "desc" },
    take: 20,
  });

  const isConfigured = !!(
    process.env.E_INVOICE_INTEGRATOR_URL &&
    process.env.E_INVOICE_USERNAME &&
    process.env.E_INVOICE_PASSWORD
  );

  return (
    <PageShell
      title="e-Fatura / e-Arşiv Ayarları"
      subtitle="GİB uyumlu elektronik fatura entegrasyonu."
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <div className="space-y-6">
        {/* Entegratör Durumu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="font-black text-slate-900">Entegratör Durumu</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-3 h-3 rounded-full ${isConfigured ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="text-sm font-bold text-slate-700">
              {isConfigured ? "Entegratör Yapılandırıldı" : "Yapılandırılmamış"}
            </span>
          </div>
          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <p className="font-bold mb-1">Yapılandırma Gerekli</p>
              <p>Aşağıdaki ortam değişkenlerini ayarlayın:</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>E_INVOICE_INTEGRATOR_URL</li>
                <li>E_INVOICE_USERNAME</li>
                <li>E_INVOICE_PASSWORD</li>
              </ul>
            </div>
          )}
        </div>

        {/* Son e-Fatura Durumları */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900">Son e-Fatura Durumları</h3>
          </div>
          {recentEInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              Henüz e-Fatura gönderilmemiş.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Fatura No</th>
                    <th className="px-6 py-3 text-left">Tür</th>
                    <th className="px-6 py-3 text-left">Durum</th>
                    <th className="px-6 py-3 text-left">Gönderim Tarihi</th>
                    <th className="px-6 py-3 text-left">UUID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentEInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-bold text-slate-800">
                        <Link href={`/dashboard/finances/invoices/${inv.id}`} className="hover:text-amber-600 transition-colors">
                          {inv.invoiceNumber ?? "TASLAK"}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {inv.eInvoiceType === "E_INVOICE" ? "e-Fatura" : "e-Arşiv"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-bold ${
                          inv.eInvoiceStatus === "ACCEPTED" ? "text-emerald-600" :
                          inv.eInvoiceStatus === "REJECTED" ? "text-red-600" :
                          inv.eInvoiceStatus === "SENT" ? "text-blue-600" :
                          "text-slate-500"
                        }`}>
                          {inv.eInvoiceStatus}
                        </span>
                        {inv.eInvoiceErrorMessage && (
                          <p className="text-xs text-red-500 mt-0.5">{inv.eInvoiceErrorMessage}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {inv.eInvoiceSentAt ? new Date(inv.eInvoiceSentAt).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-xs font-mono">
                        {inv.eInvoiceUUID ? inv.eInvoiceUUID.slice(0, 16) + "..." : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
