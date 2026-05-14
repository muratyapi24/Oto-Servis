import { getCustomers } from "@/lib/actions/customer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import CustomerWorkspaceNav from "@/components/dashboard/customers/CustomerWorkspaceNav";
import CustomerTableClient from "@/components/dashboard/customers/CustomerTableClient";
import { getCustomerDisplayName, type CustomerListItem } from "@/components/dashboard/customers/types";
import { DASHBOARD_INSIGHT_RAIL } from "@/lib/dashboard-ui-standards";

export const metadata = {
  title: "Müşteri Yönetimi | MS Oto Servis",
};

export default async function CustomersPage() {
  const result = await getCustomers();
  const customers: CustomerListItem[] = "customers" in result ? result.customers : [];
  const error = "error" in result ? result.error : null;

  if (error) {
    return <PageError message={error} />;
  }

  const totalReceivables = customers.reduce((sum, customer) => (customer.balance > 0 ? sum + customer.balance : sum), 0);
  const totalVehicles = customers.reduce((acc, customer) => acc + (customer._count?.vehicles ?? 0), 0);
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <PageShell
      title="Müşteri Yönetimi"
      subtitle="Aktif müşteri portföyünüzü, kurumsal firmaları ve araç geçmişlerini yönetin."
      sectionLabel="Müşteri & Araç"
    >
      <CustomerWorkspaceNav />
      <div className={DASHBOARD_INSIGHT_RAIL.layout}>
        {/* Left Side: Customer Table */}
        <section className={DASHBOARD_INSIGHT_RAIL.content}>
          <CustomerTableClient initialCustomers={customers} />
        </section>

        {/* Right Side Panel */}
        {customers.length > 0 && (
          <aside className={DASHBOARD_INSIGHT_RAIL.rail}>
            {/* Portföy Analizi Kartı */}
            <div className={DASHBOARD_INSIGHT_RAIL.heroCard}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className={DASHBOARD_INSIGHT_RAIL.heroEyebrow}>Portföy Geneli</span>
                </div>
                <h3 className={DASHBOARD_INSIGHT_RAIL.heroTitle}>Portföy Analizi</h3>
                <p className={DASHBOARD_INSIGHT_RAIL.heroText}>Aktif müşteri portföyünüze ait özet mali performans tablosu.</p>
              </div>
            </div>

            {/* İstatistik Bento */}
            <div className={DASHBOARD_INSIGHT_RAIL.statGrid}>
              <div className={DASHBOARD_INSIGHT_RAIL.statCard}>
                <div>
                  <div className={DASHBOARD_INSIGHT_RAIL.statLabel}>Müşteri Alacağı</div>
                  <div className={DASHBOARD_INSIGHT_RAIL.statValueDanger}>₺ {(totalReceivables).toLocaleString('tr-TR')}</div>
                </div>
                <div className={DASHBOARD_INSIGHT_RAIL.statMeta}>
                  <span className="material-symbols-outlined text-xs">star</span> Açık Hesaplar
                </div>
              </div>

              <div className={DASHBOARD_INSIGHT_RAIL.statCard}>
                <div>
                  <div className={DASHBOARD_INSIGHT_RAIL.statLabel}>Toplam Araç</div>
                  <div className={DASHBOARD_INSIGHT_RAIL.statValue}>
                    {totalVehicles} Kayıt
                  </div>
                </div>
                <div className={DASHBOARD_INSIGHT_RAIL.statMeta}>
                  <span className="material-symbols-outlined text-xs">directions_car</span> Garaj Envanteri
                </div>
              </div>
            </div>

            {/* Platform Günlüğü */}
            <div className={DASHBOARD_INSIGHT_RAIL.activityCard}>
              <h4 className={DASHBOARD_INSIGHT_RAIL.activityTitle}>
                <span className={DASHBOARD_INSIGHT_RAIL.activityTitleIcon}>history</span>
                Platform Günlüğü
              </h4>
              <div className={DASHBOARD_INSIGHT_RAIL.activityTimeline}>
                
                {recentCustomers.map((rc) => (
                  <div key={rc.id} className={DASHBOARD_INSIGHT_RAIL.activityItem}>
                    <div className={DASHBOARD_INSIGHT_RAIL.activityDot}>
                      <span className={DASHBOARD_INSIGHT_RAIL.activityDotIcon}>person_add</span>
                    </div>
                    <div className={DASHBOARD_INSIGHT_RAIL.activityName}>
                      {getCustomerDisplayName(rc)}
                    </div>
                    <div className={DASHBOARD_INSIGHT_RAIL.activityMeta}>
                      Yeni Müşteri Kaydı
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </aside>
        )}
      </div>
    </PageShell>
  );
}
