import { redirect } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { getQuoteById } from "@/lib/actions/quote.actions";
import PageShell from "@/components/dashboard/PageShell";
import ServiceWorkspaceNav from "@/components/dashboard/services/ServiceWorkspaceNav";
import QuoteDetailActions from "./QuoteDetailActions";
import {
  DASHBOARD_DETAIL,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";

export const metadata = { title: "Teklif Detayı | MS Oto Servis" };

type QuoteItemRow = {
  id: string;
  name: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getQuoteById(id);

  if (result.error || !result.quote) redirect("/dashboard/quotes");

  const q = result.quote;
  const customerName = q.customer?.type === "CORPORATE"
    ? q.customer?.companyName
    : `${q.customer?.firstName ?? ""} ${q.customer?.lastName ?? ""}`.trim();

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Taslak", SENT: "Gönderildi", ACCEPTED: "Kabul Edildi",
    REJECTED: "Reddedildi", EXPIRED: "Süresi Doldu",
  };
  const STATUS_TONES: Record<string, DashboardStatusTone> = {
    DRAFT: "neutral",
    SENT: "info",
    ACCEPTED: "success",
    REJECTED: "danger",
    EXPIRED: "warning",
  };

  return (
    <PageShell
      title={`Teklif #${q.quoteNumber}`}
      subtitle={`${customerName} — ${dayjs(q.createdAt).locale("tr").format("DD MMMM YYYY")}`}
      sectionLabel="Teklifler"
    >
      <ServiceWorkspaceNav />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <span className={dashboardStatusBadgeClass(STATUS_TONES[q.status] ?? "neutral")}>
              {STATUS_LABELS[q.status] ?? q.status}
            </span>
          </div>
          <QuoteDetailActions quote={JSON.parse(JSON.stringify(q))} />
        </div>

        <div className={DASHBOARD_DETAIL.infoGrid}>
          <div className={DASHBOARD_DETAIL.infoCard}>
            <h3 className={DASHBOARD_DETAIL.sectionTitle}>Müşteri</h3>
            <p className={DASHBOARD_DETAIL.infoValue}>{customerName}</p>
            {q.customer?.phone && <p className={DASHBOARD_DETAIL.infoMeta}>{q.customer.phone}</p>}
            {q.vehicle && <p className={`${DASHBOARD_DETAIL.infoMeta} font-mono`}>{q.vehicle.plate} — {q.vehicle.brand} {q.vehicle.model}</p>}
          </div>
          <div className={DASHBOARD_DETAIL.infoCard}>
            <h3 className={DASHBOARD_DETAIL.sectionTitle}>Teklif Bilgileri</h3>
            <p className={DASHBOARD_DETAIL.infoMeta}>Oluşturulma: {dayjs(q.createdAt).locale("tr").format("DD MMM YYYY")}</p>
            {q.validUntil && <p className={DASHBOARD_DETAIL.infoMeta}>Geçerlilik: {dayjs(q.validUntil).locale("tr").format("DD MMM YYYY")}</p>}
            {q.notes && <p className={`${DASHBOARD_DETAIL.infoMeta} italic`}>{q.notes}</p>}
          </div>
        </div>

        <div className={DASHBOARD_DETAIL.tableShell}>
          <div className={DASHBOARD_DETAIL.tableToolbar}>
            <h3 className={DASHBOARD_DETAIL.tableTitle}>Teklif Kalemleri</h3>
          </div>
          <table className="w-full text-sm">
            <thead className={DASHBOARD_DETAIL.tableHead}>
              <tr>
                <th className={DASHBOARD_DETAIL.tableHeaderCell}>Kalem</th>
                <th className={DASHBOARD_DETAIL.tableHeaderCell}>Tür</th>
                <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>Miktar</th>
                <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>Birim Fiyat</th>
                <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>KDV %</th>
                <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>Toplam</th>
              </tr>
            </thead>
            <tbody className={DASHBOARD_DETAIL.tableBody}>
              {q.items.length === 0 ? (
                <tr><td colSpan={6} className={DASHBOARD_DETAIL.tableEmpty}>Kalem eklenmemiş.</td></tr>
              ) : q.items.map((item: QuoteItemRow) => (
                <tr key={item.id} className={DASHBOARD_DETAIL.tableRow}>
                  <td className={`${DASHBOARD_DETAIL.tableCell} ${DASHBOARD_DETAIL.tableCellPrimary}`}>{item.name}</td>
                  <td className={`${DASHBOARD_DETAIL.tableCell} ${DASHBOARD_DETAIL.tableCellMutedSmall}`}>{item.itemType === "PART" ? "Parça" : item.itemType === "LABOR" ? "İşçilik" : "Diğer"}</td>
                  <td className={`${DASHBOARD_DETAIL.tableCellRight} font-mono`}>{item.quantity}</td>
                  <td className={`${DASHBOARD_DETAIL.tableCellRight} font-mono`}>₺{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className={`${DASHBOARD_DETAIL.tableCellRight} ${DASHBOARD_DETAIL.tableCellMuted}`}>%{item.taxRate}</td>
                  <td className={`${DASHBOARD_DETAIL.tableCellRight} font-bold font-mono`}>₺{item.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={DASHBOARD_DETAIL.tableSummary}>
            <div className={DASHBOARD_DETAIL.summaryRow}><span>Ara Toplam:</span><span className="font-mono">₺{q.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={DASHBOARD_DETAIL.summaryRow}><span>KDV:</span><span className="font-mono">₺{q.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            <div className={DASHBOARD_DETAIL.summaryTotalRow}><span>Genel Toplam:</span><span className="font-mono">₺{q.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
