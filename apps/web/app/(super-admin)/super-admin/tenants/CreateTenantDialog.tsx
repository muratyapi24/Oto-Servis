"use client";

import { useState } from "react";
import { createTenantWithAdmin } from "@/lib/actions/superadmin.actions";
import { useRouter } from "next/navigation";

export default function CreateTenantDialog({ plans }: { plans: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("companyName") as string;
    const email = formData.get("email") as string;
    const taxNumber = formData.get("taxNumber") as string;
    const password = formData.get("password") as string;
    const planId = formData.get("planId") as string;

    const res = await createTenantWithAdmin({
      companyName,
      email,
      taxNumber,
      password,
      planId
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error || "Bir hata oluştu");
    } else {
      setIsOpen(false);
      router.refresh(); // sayfayı yenile ve yeni datayı göster
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Yeni Firma
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-lg font-bold text-on-surface">Yeni Firma Ekle</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-outline hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-error-container text-on-error-container text-xs rounded border border-error/20 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Firma Adı</label>
                <input
                  autoFocus
                  required
                  name="companyName"
                  type="text"
                  className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  placeholder="Örn: MS Oto Servis A.Ş."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Vergi / TC Kimlik No</label>
                <input
                  required
                  name="taxNumber"
                  type="text"
                  className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  placeholder="Vergi No veya TC Kimlik"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Yönetici E-posta</label>
                <input
                  required
                  name="email"
                  type="email"
                  className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  placeholder="admin@firma.com"
                />
                <p className="text-[10px] text-outline">Bu e-posta ile yönetici girişi yapılacaktır.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Geçici Şifre</label>
                <input
                  required
                  name="password"
                  type="password"
                  minLength={6}
                  className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Abonelik Paketi</label>
                <select
                  name="planId"
                  required
                  className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="">Paket Seçiniz</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₺{plan.priceMonthly}/ay
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 mt-6 border-t border-outline/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-outline hover:text-on-surface transition-colors"
                >
                  İPTAL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white text-xs font-bold rounded shadow-sm hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      OLUŞTURULUYOR...
                    </>
                  ) : (
                    "FİRMAYI OLUŞTUR"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
