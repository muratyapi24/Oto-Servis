import { getMechanics, getCommissionRules, getMechanicPerformance } from "@/lib/actions/mechanic.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import MechanicAnalyticsClient from "@/components/dashboard/analytics/MechanicAnalyticsClient";
import TeamWorkspaceNav from "@/components/dashboard/team/TeamWorkspaceNav";

export const metadata = {
  title: "Teknisyen Performans Raporları | MS Oto Servis",
};

export default async function MechanicAnalyticsPage() {
  const [mechanicsRes, rulesRes] = await Promise.all([
    getMechanics(),
    getCommissionRules()
  ]);

  if ("error" in mechanicsRes && mechanicsRes.error) {
    return <PageError message={mechanicsRes.error} />;
  }

  const rawMechanics = mechanicsRes.mechanics || [];
  const rules = ("rules" in rulesRes ? rulesRes.rules : []) || [];

  // Fetch performance metrics for current month for all mechanics in parallel
  const mechanicsWithPerformance = await Promise.all(
    rawMechanics.map(async (mechanic) => {
      const perfCurrent = await getMechanicPerformance(mechanic.id, "current");
      const perfPrevious = await getMechanicPerformance(mechanic.id, "previous");
      return {
        ...mechanic,
        performanceCurrent: perfCurrent.error ? null : perfCurrent,
        performancePrevious: perfPrevious.error ? null : perfPrevious,
      };
    })
  );

  return (
    <PageShell
      title="Teknisyen Performansı"
      subtitle="Teknisyenlerin çözdüğü iş emri sayısı, komisyon hesaplamaları ve genel başarı raporları."
      sectionLabel="Ekip"
    >
      <TeamWorkspaceNav />
      <MechanicAnalyticsClient mechanics={mechanicsWithPerformance} rules={rules} />
    </PageShell>
  );
}
