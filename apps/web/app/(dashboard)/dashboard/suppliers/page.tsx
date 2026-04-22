import { getSuppliers } from "@/lib/actions/supplier.actions";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import { SupplierDialog } from "./SupplierDialog";
import { Supplier } from "@repo/database";

export const metadata = {
  title: "Tedarikçiler | MS Oto Servis",
};

export default async function SuppliersPage() {
  const { suppliers, error } = await getSuppliers();

  if (error) {
    return <PageError message={error || "Tedarikçi verileri alınırken hata oluştu."} />;
  }

  return (
    <PageShell
      title="Tedarikçi Yönetimi"
      subtitle="Yedek parça tedarik ettiğiniz firmalar ve cari hesap takibi."
      sectionLabel="Satın Alma"
      actions={<SupplierDialog />}
    >
      {!suppliers || suppliers.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border-2 border-dashed border-outline-variant/30 text-center flex flex-col items-center justify-center ambient-shadow">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-300">local_shipping</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">Henüz Tedarikçi Eklenmemiş</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">
            Parça alımı yaptığınız toptancıları buraya ekleyerek bakiye ve stok takibi yapabilirsiniz.
          </p>
          <div className="mt-6">
            <SupplierDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(suppliers as Supplier[]).map((s) => (
            <div key={s.id} className="bg-white rounded-2xl ambient-shadow hover:shadow-lg transition-all p-6 flex flex-col group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-bold text-xl uppercase">
                  {s.name.substring(0, 2)}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cari Bakiye</div>
                  <div className={`text-lg font-mono font-bold ${Number(s.balance) > 0 ? 'text-error' : 'text-tertiary-container'}`}>
                    ₺{Number(s.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-on-surface line-clamp-1 mb-1">{s.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-sm">person</span> {s.contactPerson || "Yetkili Belirtilmemiş"}
              </p>

              <div className="space-y-2.5 mb-6 pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-sm">call</span>
                  </div>
                  {s.phone}
                </div>
                {s.email && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-sm">mail</span>
                    </div>
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex gap-2">
                <SupplierDialog
                  initialData={s}
                  trigger={
                    <button className="flex-1 bg-surface-container-low hover:bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">edit</span> Düzenle
                    </button>
                  }
                />
                <button className="px-3 bg-error-container hover:bg-error/10 text-error rounded-xl transition-all">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
