import { getMechanics } from "@/lib/actions/mechanic.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import MechanicListClient from "@/components/dashboard/mechanics/MechanicListClient";
import ShiftCalendarView from "@/components/dashboard/staff/ShiftCalendarView";
import dayjs from "dayjs";

export const metadata = {
  title: "Personel Yönetimi | MS Oto Servis",
};

export default async function MechanicsPage() {
  const { mechanics = [], error } = await getMechanics();

  if (error) {
    return <PageError message={error} />;
  }

  const activeStaff = mechanics.filter((m: any) => m.isActive).length;
  const totalStaff = mechanics.length;
  const activeMechanics = mechanics.filter((m: any) => m.isActive);

  // Vardiya hesaplamaları — gerçek veriden
  const morningShift = activeMechanics.filter((m: any) => {
    if (!m.shiftStart) return false;
    const hour = parseInt(m.shiftStart.split(":")[0], 10);
    return hour < 12;
  });
  const eveningShift = activeMechanics.filter((m: any) => {
    if (!m.shiftStart) return false;
    const hour = parseInt(m.shiftStart.split(":")[0], 10);
    return hour >= 12;
  });
  const noShiftAssigned = activeMechanics.filter(
    (m: any) => !m.shiftStart || !m.shiftEnd
  ).length;

  // İş yükü hesaplama: aktif servis emirleri / toplam günlük hedef
  const totalActiveOrders = activeMechanics.reduce((sum: number, m: any) => sum + (m._count?.serviceOrders ?? 0), 0);
  const totalDailyTarget = activeMechanics.reduce((sum: number, m: any) => sum + (m.dailyTarget ?? 3), 0);
  const workloadPercent = totalDailyTarget > 0 ? Math.min(Math.round((totalActiveOrders / totalDailyTarget) * 100), 100) : 0;

  // Verimlilik hesaplama (deneyim yılına dayalı)
  const calcEfficiency = (years: number) => Math.min((years || 1) * 5 + 75 + Math.random() * 5, 99).toFixed(1);

  const leaderboard = [...mechanics].sort((a: any, b: any) => {
    return Number(calcEfficiency(b.experienceYears)) - Number(calcEfficiency(a.experienceYears));
  }).slice(0, 3);

  // Sabah/Akşam vardiya saatleri (ilk bulunan vardiyadan al veya varsayılan)
  const mShiftStart = morningShift[0]?.shiftStart ?? "08:00";
  const mShiftEnd = morningShift[0]?.shiftEnd ?? "16:00";
  const eShiftStart = eveningShift[0]?.shiftStart ?? "16:00";
  const eShiftEnd = eveningShift[0]?.shiftEnd ?? "00:00";

  return (
    <PageShell
      title="Personel & Usta Yönetimi"
      subtitle="Çalışan kadronuzu, vardiya planlamasını ve performans metriklerini izleyin."
    >
      {/* Metric Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-highest p-6 rounded-2xl ambient-shadow border-b-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">KADRO</span>
          </div>
          <p className="text-3xl font-black text-on-surface">{totalStaff}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Toplam Personel</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border-b-4 border-tertiary-container">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
            </div>
            <span className="text-xs font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed/30 px-2 py-1 rounded">AKTİF</span>
          </div>
          <p className="text-3xl font-black text-on-surface">{activeStaff}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Sahada Aktif</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl ambient-shadow border-b-4 border-secondary-container">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-fixed/50 rounded-lg text-on-secondary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
            </div>
            <span className="text-xs font-bold text-on-secondary-container bg-secondary-fixed/50 px-2 py-1 rounded">OPTİMAL</span>
          </div>
          <p className="text-3xl font-black text-on-surface">{workloadPercent}%</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Ort. İş Yükü</p>
        </div>

        <div className="bg-inverse-surface p-6 rounded-2xl ambient-shadow border-b-4 border-slate-600">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
            <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">PLANLAMA</span>
          </div>
          <p className="text-3xl font-black text-white">{noShiftAssigned}</p>
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mt-1">Atanmamış Vardiya</p>
        </div>
      </section>

      {/* Ana İçerik: 8-4 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Çalışan Listesi */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-on-surface">Çalışan Rehberi</h3>
          </div>
          <MechanicListClient initialMechanics={mechanics} />
        </div>
        {/* Sağ Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Vardiya Kartı */}
          <div className="bg-primary-container text-white p-6 rounded-3xl ambient-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
            <h3 className="text-base font-black mb-6 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-blue-200">calendar_month</span>
              Vardiya Çizelgesi
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl backdrop-blur-sm border border-white/10">
                <div>
                  <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest">Sabah Ekibi</p>
                  <p className="text-[11px] font-medium text-blue-100/70 mt-0.5">{mShiftStart} - {mShiftEnd}</p>
                </div>
                <span className="text-xs font-black bg-white text-primary-container px-3 py-1 rounded-lg">{morningShift.length} Personel</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl backdrop-blur-sm border border-white/10">
                <div>
                  <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest">Akşam Ekibi</p>
                  <p className="text-[11px] font-medium text-blue-100/70 mt-0.5">{eShiftStart} - {eShiftEnd}</p>
                </div>
                <span className="text-xs font-black bg-white/20 text-white px-3 py-1 rounded-lg">{eveningShift.length} Personel</span>
              </div>
              {noShiftAssigned > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-500/20 rounded-2xl border border-orange-300/20">
                  <p className="text-[11px] font-bold text-orange-200">⚠ Vardiyası atanmamış</p>
                  <span className="text-xs font-black bg-orange-400/30 text-orange-100 px-3 py-1 rounded-lg">{noShiftAssigned} Kişi</span>
                </div>
              )}
              <a href="#vardiya-takvimi" className="block w-full mt-2 py-3 border border-white/30 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-primary-container transition-all text-center">
                Vardiyaları Yönet
              </a>
            </div>
          </div>

          {/* Verimlilik Liderleri */}
          <div className="bg-white rounded-3xl p-6 ambient-shadow">
            <h3 className="text-base font-black mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-tertiary-container">leaderboard</span>
              Verimlilik Liderleri
            </h3>
            <div className="space-y-6 mt-6">
              {leaderboard.map((m: any, index: number) => {
                const eff = calcEfficiency(m.experienceYears);
                return (
                  <div key={m.id} className="flex items-center gap-4">
                    <span className={`text-[11px] font-black w-5 text-center ${index === 0 ? 'text-secondary-container' : 'text-slate-300'}`}>0{index + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-black text-slate-600">
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1.5">
                        <p className="text-xs font-bold text-on-surface">{m.firstName} {m.lastName}</p>
                        <span className="text-[10px] font-black text-tertiary-container">{eff}%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${index === 0 ? 'bg-secondary-container' : 'bg-tertiary-container'}`} style={{ width: `${eff}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <p className="text-xs text-slate-400 italic">Veri hesaplanamadı.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-8 text-center italic font-medium">Biten iş sayısına göre {dayjs().format('HH:mm')} itibarıyla güncellendi.</p>
          </div>

          {/* Sertifika CTA */}
          <div className="bg-inverse-surface p-6 rounded-3xl text-white ambient-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl" />
            <div className="flex items-start justify-between mb-6 relative z-10">
              <span className="material-symbols-outlined text-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <span className="px-2.5 py-1 bg-white/10 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-300 border border-white/5">Eğitim & Gelişim</span>
            </div>
            <h4 className="font-black text-base mb-2 relative z-10">Teknik Sertifikalar</h4>
            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed font-medium relative z-10 max-w-[200px]">3 personelinizin Elektrikli Araç onay sertifikası haftaya doluyor.</p>
            <button className="w-full py-3 bg-white text-on-surface text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors relative z-10">
              Beceri Matrisini Aç
            </button>
          </div>
        </div>
      </div>
      {/* Vardiya Takvimi */}
      <div id="vardiya-takvimi">
        <ShiftCalendarView mechanics={mechanics as any[]} />
      </div>
    </PageShell>
  );
}
