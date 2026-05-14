import { prisma } from "@repo/database";
import { auth } from "@/auth";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import NotificationListClient from "./NotificationListClient";
import NotificationWorkspaceNav from "@/components/dashboard/notifications/NotificationWorkspaceNav";
import type { NotificationListItem } from "@/components/dashboard/notifications/types";
import { DASHBOARD_SURFACES } from "@/lib/dashboard-ui-standards";

export const metadata = {
  title: "Bildirimler | MS Oto Servis",
};

const metricCardClass = `${DASHBOARD_SURFACES.panel} p-4`;
const metricLabelClass = "text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <PageError message="Yetkisiz erişim." />;

  const tenantId = session.user.tenantId;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { tenantId } }),
  ]);

  // Son 7 günün başarı oranı
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentTotal, recentSent] = await Promise.all([
    prisma.notification.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.notification.count({
      where: { tenantId, createdAt: { gte: sevenDaysAgo }, status: "SENT" },
    }),
  ]);

  const successRate = recentTotal > 0 ? Math.round((recentSent / recentTotal) * 100) : 0;
  const serializedNotifications = JSON.parse(JSON.stringify(notifications)) as NotificationListItem[];

  return (
    <PageShell
      title="Bildirimler"
      subtitle="Gönderilen bildirimlerin geçmişini görüntüleyin ve yönetin."
      sectionLabel="İletişim"
    >
      <NotificationWorkspaceNav />

      {/* Özet Kart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={metricCardClass}>
          <span className={metricLabelClass}>Toplam Bildirim</span>
          <span className="text-3xl font-black text-on-surface block mt-1">{total}</span>
        </div>
        <div className={metricCardClass}>
          <span className={metricLabelClass}>Son 7 Gün Başarı</span>
          <span className={`text-3xl font-black block mt-1 ${successRate >= 80 ? "text-tertiary" : successRate >= 50 ? "text-secondary" : "text-error"}`}>
            %{successRate}
          </span>
          <p className="text-xs text-on-surface-variant/70 mt-1">{recentSent}/{recentTotal} gönderildi</p>
        </div>
        <div className={metricCardClass}>
          <span className={metricLabelClass}>Kanallar</span>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["SMS", "WHATSAPP", "EMAIL", "IN_APP"].map((ch) => (
              <span key={ch} className="text-xs font-bold bg-surface-container-low text-on-surface-variant border border-outline-variant/25 px-2 py-1 rounded-lg">
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      <NotificationListClient
        notifications={serializedNotifications}
        total={total}
      />
    </PageShell>
  );
}
