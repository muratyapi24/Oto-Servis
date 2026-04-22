import { notFound } from "next/navigation";
import Link from "next/link";
import { getMechanicById, getMechanicPerformance, getCommissionRules, calculateCommission } from "@/lib/actions/mechanic.actions";
import PageShell from "@/components/dashboard/PageShell";
import MechanicDetailClient from "./MechanicDetailClient";
import PerformanceReport from "@/components/dashboard/mechanics/PerformanceReport";

export const metadata = { title: "Usta Detayı | MS Oto Servis" };

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

  const current = "error" in currentPerf ? { period: "current", completedCount: 0, totalLaborAmount: 0, avgDurationHours: 0 } : currentPerf;
  const previous = "error" in previousPerf ? { period: "previous", completedCount: 0, totalLaborAmount: 0, avgDurationHours: 0 } : previousPerf;
  const rules = "error" in rulesRes ? [] : (rulesRes.rules ?? []);
  const commissionAmount = "error" in commissionRes ? 0 : (commissionRes.amount ?? 0);

  return (
    <PageShell
      title={`${result.mechanic.firstName} ${result.mechanic.lastName}`}
      subtitle="Usta profili, aktif ve tamamlanan iş emirleri"
      sectionLabel="Ustalar"
      actions={
        <Link
          href="/dashboard/mechanics"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Geri
        </Link>
      }
    >
      <MechanicDetailClient mechanic={result.mechanic} />
      <PerformanceReport
        mechanicId={id}
        current={current as any}
        previous={previous as any}
        commissionRules={rules as any}
        commissionAmount={commissionAmount}
      />
    </PageShell>
  );
}
