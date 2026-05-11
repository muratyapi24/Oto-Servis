import { getCustomers } from "@/lib/actions/customer.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import CustomerTableClient from "@/components/dashboard/customers/CustomerTableClient";

export const metadata = {
  title: "Müşteri Yönetimi | MS Oto Servis",
};

export default async function CustomersPage() {
  const result = await getCustomers();
  const customers = 'customers' in result ? result.customers : [];
  const error = 'error' in result ? result.error : null;

  if (error) {
    return <PageError message={error} />;
  }

  const totalReceivables = customers.reduce((sum: number, c: any) => c.balance > 0 ? sum + c.balance : sum, 0);
  const totalVehicles = customers.reduce((acc: number, c: any) => acc + (c._count?.vehicles || 0), 0);
  const recentCustomers = [...customers].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <PageShell
      title="Müşteri Yönetimi"
      subtitle="Aktif müşteri portföyünüzü, kurumsal firmaları ve araç geçmişlerini yönetin."
      sectionLabel="CRM"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: CRM Table */}
        <section className="flex-1">
          <CustomerTableClient initialCustomers={customers} />
        </section>

        {/* Right Side Panel */}
        {customers.length > 0 && (
          <aside className="w-full lg:w-96 shrink-0 space-y-6">
            {/* CRM Analizi Kartı */}
            <div className="bg-primary-container text-white p-6 rounded-3xl ambient-shadow relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80 border-b border-white/30 pb-1">Portföy Geneli</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-none mb-2">CRM Analizi</h3>
                <p className="text-xs font-medium opacity-80 leading-relaxed max-w-[200px]">Aktif müşteri portföyünüze ait özet mali performans tablosu.</p>
              </div>
            </div>

            {/* İstatistik Bento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl ambient-shadow flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Müşteri Alacağı</div>
                  <div className="text-2xl font-black text-error leading-tight">₺ {(totalReceivables).toLocaleString('tr-TR')}</div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="material-symbols-outlined text-xs">star</span> Açık Hesaplar
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl ambient-shadow flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Toplam Araç</div>
                  <div className="text-2xl font-black text-on-surface leading-tight">
                    {totalVehicles} Kayıt
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="material-symbols-outlined text-xs">directions_car</span> Garaj Envanteri
                </div>
              </div>
            </div>

            {/* Platform Günlüğü */}
            <div className="bg-white rounded-2xl p-6 ambient-shadow">
              <h4 className="text-sm font-bold text-on-surface mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-sm text-primary">history</span>
                Platform Günlüğü
              </h4>
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
                
                {recentCustomers.map((rc: any) => (
                  <div key={rc.id} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center z-10">
                      <span className="material-symbols-outlined text-xs text-primary">person_add</span>
                    </div>
                    <div className="text-xs font-black text-on-surface leading-none mb-1">
                      {rc.type === 'INDIVIDUAL' ? `${rc.firstName} ${rc.lastName}` : rc.companyName}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
