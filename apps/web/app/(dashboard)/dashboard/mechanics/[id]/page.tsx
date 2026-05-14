import { notFound } from "next/navigation";
import { getMechanicById, getMechanicPerformance, getCommissionRules, calculateCommission } from "@/lib/actions/mechanic.actions";
import PageShell from "@/components/dashboard/PageShell";
import MechanicDetailClient from "./MechanicDetailClient";
import PerformanceReport from "@/components/dashboard/mechanics/PerformanceReport";
import TeamWorkspaceNav from "@/components/dashboard/team/TeamWorkspaceNav";

export const metadata = { title: "Usta Detayı | MS Oto Servis" };

type PerformanceData = {
  period: "current" | "previous";
  completedCount: number;
  totalLaborAmount: number;
  avgDurationHours: number;
};

type PerformanceReportProps = Parameters<typeof PerformanceReport>[0];

function emptyPerformance(period: "current" | "previous"): PerformanceData {
  return { period, completedCount: 0, totalLaborAmount: 0, avgDurationHours: 0 };
}

export default async function MechanicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [result, currentPerf, previousPerf, rulesRes, commissionRes] = await Promise.all([
    getMechanicById(id),
    getMechanicPerformance(id, "current"),
    getMechanicPerformance(id, "previous"),
    getCommissionRules(id),
    calculateCommission(id, new Date()),
  ]);

  if (!result.mechanic) notFound();

  const current: PerformanceData = "error" in currentPerf ? emptyPerformance("current") : currentPerf;
  const previous: PerformanceData = "error" in previousPerf ? emptyPerformance("previous") : previousPerf;
  const rules: PerformanceReportProps["commissionRules"] = "error" in rulesRes
    ? []
    : (rulesRes.rules ?? []).map((rule) => ({
        id: rule.id,
        ruleType: rule.ruleType,
        value: rule.value,
        minAmount: rule.minAmount,
        maxAmount: rule.maxAmount,
        mechanic: rule.mechanic,
      }));
  const commissionAmount = "error" in commissionRes ? 0 : (commissionRes.amount ?? 0);

  return (
    <PageShell
      title={`${result.mechanic.firstName} ${result.mechanic.lastName}`}
      subtitle="Usta profili, aktif ve tamamlanan iş emirleri"
      sectionLabel="Ekip"
    >
      <TeamWorkspaceNav />
      <MechanicDetailClient mechanic={result.mechanic} />
      <PerformanceReport
        mechanicId={id}
        current={current}
        previous={previous}
        commissionRules={rules}
        commissionAmount={commissionAmount}
      />
    </PageShell>
  );
}
