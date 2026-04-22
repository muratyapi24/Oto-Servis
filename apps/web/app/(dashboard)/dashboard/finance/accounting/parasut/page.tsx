import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import ParasutSettingsClient from "./ParasutSettingsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Paraşüt Entegrasyonu | MS Oto Servis",
};

export default async function ParasutPage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  const [integration, recentLogs] = await Promise.all([
    prisma.accountingIntegration.findFirst({
      where: { tenantId },
      select: { id: true, provider: true, isActive: true, companyId: true, username: true },
    }),
    prisma.parasutSyncLog.findMany({
      where: { tenantId },
      orderBy: { attemptedAt: "desc" },
      take: 20,
      include: {
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    }),
  ]);

  return (
    <PageShell
      title="Paraşüt Entegrasyonu"
      subtitle="Paraşüt bağlantısını test edin ve senkronizasyon loglarını görüntüleyin."
      sectionLabel="Muhasebe"
      actions={
        <Link
          href="/dashboard/finance/accounting"
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Link>
      }
    >
      <ParasutSettingsClient
        integration={integration}
        logs={JSON.parse(JSON.stringify(recentLogs))}
      />
    </PageShell>
  );
}
