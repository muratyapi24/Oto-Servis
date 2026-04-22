import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getPaymentOperations } from "@/lib/actions/superadmin.actions";
import dayjs from "dayjs";
import "dayjs/locale/tr";

export const metadata = { title: "Ödeme Operasyonları | Super Admin" };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Aktif",          cls: "bg-tertiary-fixed text-on-tertiary-fixed" },
  TRIAL:     { label: "Deneme",         cls: "bg-primary/10 text-primary" },
  PAST_DUE:  { label: "Gecikme",        cls: "bg-secondary-container/20 text-secondary-container" },
  CANCELLED: { label: "İptal",          cls: "bg-error/10 text-error" },
  EXPIRED:   { label: "Süresi Doldu",   cls: "bg-surface-variant text-on-surface-variant" },
};

export default async function PaymentOperationsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "overview";

  const data = await getPaymentOperations();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "overview",     label: "Genel Bakış" },
    { id: "subscriptions", label: "Abonelikler" },
    { id: "pastdue",      label: "Gecikmiş Ödemeler" },
  ];

  const displayedSubs =
    tab === "pastdue"
      ? data.subscriptions.filter((s) => s.status === "PAST_DUE")
      : data.subscriptions;

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">payments</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Ödeme Operasyonları</h2>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Özet Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Aktif</p>
            <p className="text-3xl font-black text-on-tertiary-fixed-variant">{data.summary.activeCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Gecikme</p>
            <p className="text-3xl font-black text-secondary-container">{data.summary.pastDueCount}</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-1">İptal</p>
            <p className="text-3xl font-black text-error">{data.summary.cancelledCount}</p>
          </div>
        </div>

        {/* Abonelik Tablosu */}
        <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-outline/10">
            <h3 className="text-[9px] font-bold text-outline uppercase tracking-widest">
              {tab === "pastdue" ? "Gecikmiş Ödemeler" : "Tüm Abonelikler"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="dense-table w-full">
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>E-posta</th>
                  <th>Plan</th>
                  <th className="text-right">Aylık Ücret</th>
                  <th>Durum</th>
                  <th>Dönem Sonu</th>
                </tr>
              </thead>
              <tbody>
                {displayedSubs.map((s) => {
                  const status = STATUS_MAP[s.status] ?? { label: s.status, cls: "bg-surface-variant text-on-surface-variant" };
                  return (
                    <tr key={s.id}>
                      <td className="font-bold text-on-surface">{s.tenantName}</td>
                      <td className="text-outline">{s.tenantEmail}</td>
                      <td className="text-on-surface-variant">{s.planName}</td>
                      <td className="text-right font-mono font-bold text-on-surface">
                        {s.priceMonthly.toLocaleString("tr-TR")} {s.currency}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="text-outline font-mono">
                        {s.currentPeriodEnd
                          ? dayjs(s.currentPeriodEnd).locale("tr").format("DD MMM YYYY")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayedSubs.length === 0 && (
            <div className="p-10 text-center text-outline text-sm">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>

      <SuperAdminFooter />
    </>
  );
}
