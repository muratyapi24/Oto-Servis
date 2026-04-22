import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import Link from "next/link";
import { Settings, Zap, FileText } from "lucide-react";

export const metadata = {
  title: "Muhasebe Entegrasyonu | MS Oto Servis",
};

export default async function AccountingPage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  const integration = await prisma.accountingIntegration.findFirst({
    where: { tenantId },
    select: { id: true, provider: true, isActive: true, companyId: true },
  });

  return (
    <PageShell
      title="Muhasebe Entegrasyonu"
      subtitle="Paraşüt ve e-Fatura entegrasyonlarını yönetin."
      sectionLabel="Finans & Muhasebe"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paraşüt */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Paraşüt</h3>
              <p className="text-xs text-slate-500">Bulut muhasebe senkronizasyonu</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${integration?.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-sm text-slate-600">
                {integration?.isActive ? "Aktif" : "Yapılandırılmamış"}
              </span>
            </div>
            {integration?.companyId && (
              <p className="text-xs text-slate-400 mt-1">Şirket ID: {integration.companyId}</p>
            )}
          </div>
          <Link
            href="/dashboard/finance/accounting/parasut"
            className="flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-black transition-colors"
          >
            Paraşüt Ayarları
          </Link>
        </div>

        {/* e-Fatura */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">e-Fatura / e-Arşiv</h3>
              <p className="text-xs text-slate-500">GİB uyumlu elektronik fatura</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${process.env.E_INVOICE_INTEGRATOR_URL ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-sm text-slate-600">
                {process.env.E_INVOICE_INTEGRATOR_URL ? "Entegratör Yapılandırıldı" : "Yapılandırılmamış"}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/finance/accounting/e-invoice"
            className="flex items-center justify-center gap-2 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2.5 rounded-xl text-sm font-black transition-colors"
          >
            e-Fatura Ayarları
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
