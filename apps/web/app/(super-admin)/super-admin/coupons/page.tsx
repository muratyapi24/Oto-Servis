import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getCoupons } from "@/lib/actions/superadmin.actions";
import CouponCreateForm from "./CouponCreateForm";
import CouponDeactivateButton from "./CouponDeactivateButton";

export default async function CouponsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "list";

  const result = await getCoupons();
  const coupons = "coupons" in result && result.coupons ? result.coupons : [];

  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsed = coupons.reduce((acc, c) => acc + c.usedCount, 0);

  const TABS = [
    { id: "list", label: "Kupon Listesi" },
    { id: "new", label: "Yeni Kupon" },
  ];

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            local_offer
          </span>
          <h2 className="text-sm font-bold tracking-tight uppercase">
            İndirim ve Kupon Yönetimi
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-outline">
            {coupons.length} kupon
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
              Aktif Kuponlar
            </p>
            <p className="text-2xl font-bold text-primary">{activeCoupons}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <p className="text-[10px] font-bold uppercase text-outline mb-1">
              Toplam Kullanım
            </p>
            <p className="text-2xl font-bold text-on-surface">{totalUsed}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm">
            <p className="text-[10px] font-bold uppercase text-outline mb-1">
              Toplam Kupon
            </p>
            <p className="text-2xl font-bold text-on-surface">{coupons.length}</p>
          </div>
        </div>

        {tab === "list" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <table className="dense-table w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline/10">
                  <th className="text-left px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Kod
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Tip
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    İndirim
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Geçerlilik
                  </th>
                  <th className="text-center px-4 py-2 text-[10px] font-bold uppercase text-outline">
                    Kullanım
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
                {coupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-xs text-outline"
                    >
                      Henüz kupon bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className="border-b border-outline/5 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="text-xs font-mono font-bold text-on-surface">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            coupon.discountType === "PERCENT"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary-container/20 text-on-secondary-container"
                          }`}
                        >
                          {coupon.discountType === "PERCENT" ? "%" : "₺"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-on-surface">
                        {coupon.discountType === "PERCENT"
                          ? `%${coupon.discountValue}`
                          : `₺${coupon.discountValue.toLocaleString("tr-TR")}`}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-mono text-on-surface">
                        {new Date(coupon.validUntil).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-on-surface">
                        {coupon.usedCount} / {coupon.usageLimit}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            coupon.isActive
                              ? "bg-tertiary-fixed text-on-tertiary-fixed"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {coupon.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {coupon.isActive && (
                          <CouponDeactivateButton couponId={coupon.id} />
                        )}
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
                  Yeni Kupon Oluştur
                </h3>
              </div>
              <div className="p-4">
                <CouponCreateForm />
              </div>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  );
}
