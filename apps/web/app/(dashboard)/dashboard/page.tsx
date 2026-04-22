import { redirect } from "next/navigation";
import { getDashboardOverview } from "@/lib/actions/dashboard.actions";
import { checkOnboardingStatus } from "@/lib/actions/onboarding.actions";
import DashboardBoardClient from "@/components/dashboard/overview/DashboardBoardClient";

export const metadata = {
  title: "Yönetim Paneli | MS Oto Servis",
};

export default async function DashboardPage() {
  // Onboarding kontrolü — tamamlanmamışsa sihirbaza yönlendir
  const onboarding = await checkOnboardingStatus();
  if (!onboarding.completed) {
    redirect("/dashboard/onboarding");
  }

  const dataRes = await getDashboardOverview();

  if ("error" in dataRes || !dataRes.overview) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <span className="material-symbols-outlined text-5xl text-error mb-4 opacity-50">error</span>
        <h2 className="text-xl font-bold text-on-surface">Veri Yükleme Hatası</h2>
        <p className="text-slate-500 mt-2">{('error' in dataRes ? dataRes.error : null) || "Dashboard verileri alınırken bir sorun oluştu."}</p>
      </div>
    );
  }

  return <DashboardBoardClient data={dataRes.overview} />;
}
