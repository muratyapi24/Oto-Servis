import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import SettingsWorkspaceNav from "@/components/dashboard/settings/SettingsWorkspaceNav";
import ParasutSettingsClient from "./ParasutSettingsClient";

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
      sectionLabel="Ayarlar"
    >
      <SettingsWorkspaceNav />
      <ParasutSettingsClient
        integration={integration}
        logs={JSON.parse(JSON.stringify(recentLogs))}
      />
    </PageShell>
  );
}
