"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTenantStatus, deleteTenant, updateTenant } from "@/lib/actions/superadmin.actions";

export default function TenantActionMenu({ tenant }: { tenant: any }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggleStatus() {
    setLoading(true);
    setMenuOpen(false);
    const newStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await updateTenantStatus(tenant.id, newStatus);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    await deleteTenant(tenant.id);
    setLoading(false);
    setIsDeleteOpen(false);
    router.refresh();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const taxNumber = formData.get("taxNumber") as string;
    const phone = formData.get("phone") as string;

    const res = await updateTenant(tenant.id, { name, email, taxNumber, phone });
    setLoading(false);

    if (res?.error) {
      setError(res.error || "Bir hata oluştu");
    } else {
      setIsEditOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-1 text-outline hover:text-primary transition-all rounded hover:bg-surface-container-low ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="İşlemler"
        >
          <span className="material-symbols-outlined text-sm">more_vert</span>
        </button>

        {menuOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-outline/10">
            <div className="py-1">
              <button
                onClick={() => { setMenuOpen(false); setIsEditOpen(true); }}
                className="group flex w-full items-center px-4 py-2 text-[11px] font-medium text-on-surface hover:bg-surface-container-low hover:text-primary"
              >
                <span className="material-symbols-outlined text-sm mr-2">edit</span>
                Düzenle
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className="group flex w-full items-center px-4 py-2 text-[11px] font-medium text-on-surface hover:bg-surface-container-low hover:text-secondary-container"
              >
                <span className="material-symbols-outlined text-sm mr-2">
                  {tenant.status === "ACTIVE" ? "pause_circle" : "play_circle"}
                </span>
                {tenant.status === "ACTIVE" ? "Askıya Al" : "Aktifleştir"}
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setMenuOpen(false); setIsDeleteOpen(true); }}
                disabled={loading}
                className="group flex w-full items-center px-4 py-2 text-[11px] font-medium text-error hover:bg-error/10"
              >
                <span className="material-symbols-outlined text-sm mr-2 text-error">delete</span>
                Sil (Arşivle)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DÜZENLEME MODALI */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-lg font-bold text-on-surface">Firma Bilgilerini Düzenle</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-outline hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-error-container text-on-error-container text-xs rounded font-medium">{error}</div>}

              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Firma Adı</label>
                <input required name="name" defaultValue={tenant.name} className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">E-posta</label>
                <input name="email" type="email" defaultValue={tenant.email} className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Vergi/TC No</label>
                <input name="taxNumber" defaultValue={tenant.taxNumber} className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase">Telefon</label>
                <input name="phone" defaultValue={tenant.phone} className="w-full bg-surface-container-low border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-outline/10">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-xs font-bold text-outline">İPTAL</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90">KAYDET</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error border-4 border-error/20">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Firmayı Sil Onayı</h3>
                <p className="text-sm text-outline mt-1">
                  <strong>{tenant.name}</strong> firmasını silmek istediğinize emin misiniz? Bu işlem soft-delete (arşivleme) olarak kaydedilecektir.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-4">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-4 py-2 text-xs font-bold border border-outline/20 rounded text-on-surface hover:bg-surface-container-low transition-colors">İPTAL</button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 px-4 py-2 text-xs font-bold bg-error text-white rounded hover:bg-error/90 transition-colors">
                  {loading ? "SİLİNİYOR..." : "EVET, SİL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
