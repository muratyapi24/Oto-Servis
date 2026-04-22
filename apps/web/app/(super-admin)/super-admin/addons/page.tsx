import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getAddons } from "@/lib/actions/superadmin.actions";
import AddonCreateForm from "./AddonCreateForm";
import AddonToggleButton from "./AddonToggleButton";

export default async function AddonsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "list";

  const result = await getAddons();
  const addons = "addons" in result && result.addons ? result.addons : [];

  const activeAddons = addons.filter((a) => a.isActive).length;
  const totalSubscribers = addons.reduce((acc, a) => acc + a.subscriberCount, 0);

  const TABS = [
    { id: "list", label: "Hizmet Listesi" },
    { id: "new", label: "Yeni Hizmet" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            extension
          </span>
          <h2 className="text-sm font-bold tracking-tight uppercase">
            Ek Hizmetler (Add-ons)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-outline">
            {addons.length} hizmet
          </span>
        </div>
      </header>

      <nav className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <p className="text-[10px] font-bold uppercase text-outline mb-1">
              Aktif Hizmetler
            </p>
            <p className="text-2xl font-bold text-primary">{activeAddons}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <p className="text-[10px] font-bold uppercase text-outline mb-1">
              Toplam Abone
            </p>
            <p className="text-2xl font-bold text-on-surface">{totalSubscribers}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <p className="text-[10px] font-bold uppercase text-outline mb-1">
              Toplam Hizmet
            </p>
            <p className="text-2xl font-bold text-on-surface">{addons.length}</p>
          </div>
        </div>

        {tab === "list" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <table className="dense-table w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline/10">
                  <th className="text-left px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Hizmet Adı
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Açıklama
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Fiyat (₺)
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Abone Sayısı
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Durum
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {addons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs text-outline"
                    >
                      Henüz ek hizmet bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  addons.map((addon) => (
                    <tr
                      key={addon.id}
                      className="border-b border-outline/5 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-xs font-semibold text-on-surface">
                          {addon.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-outline truncate max-w-xs block">
                          {addon.description}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-on-surface">
                        ₺{addon.price.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-on-surface">
                        {addon.subscriberCount}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            addon.isActive
                              ? "bg-tertiary-fixed text-on-tertiary-fixed"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {addon.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <AddonToggleButton
                          addonId={addon.id}
                          isActive={addon.isActive}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "new" && (
          <div className="max-w-lg">
            <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/10 bg-surface-container-low">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Yeni Ek Hizmet Oluştur
                </h3>
              </div>
              <div className="p-4">
                <AddonCreateForm />
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
