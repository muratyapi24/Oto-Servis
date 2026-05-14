import { getServiceOrderById } from "@/lib/actions/service.actions";
import { AddServiceItemDialog } from "./AddServiceItemDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import ReturnPartButton from "./ReturnPartButton";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import {
  Wrench,
  Car,
  User as UserIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { ServicePrintActions } from "./ServicePrintActions";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import PhotoUploader from "@/components/dashboard/services/PhotoUploader";
import QualityControlSection from "@/components/dashboard/services/QualityControlSection";
import ServiceRatingSection from "@/components/dashboard/services/ServiceRatingSection";
import { ServiceQRCode } from "@/components/dashboard/services/ServiceQRCode";
import ServiceWorkspaceNav from "@/components/dashboard/services/ServiceWorkspaceNav";
import PageShell, { PageError } from "@/components/dashboard/PageShell";
import {
  DASHBOARD_DETAIL,
  dashboardStatusBadgeClass,
} from "@/lib/dashboard-ui-standards";

// Wrapper — client bileşeni server sayfasına dahil etmek için
function PhotoUploaderSection({ serviceOrderId }: { serviceOrderId: string }) {
  return <PhotoUploader serviceOrderId={serviceOrderId} initialDocuments={[]} />;
}

export const metadata = {
  title: "İş Emri Detayı | MS Oto Servis",
};

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.tenantId) return null;

  const { id } = await params;

  // DB Lookups
  const [dbParts, dbMechanics, dbSuppliers, orderRes, tenant, serviceRating] = await Promise.all([
    prisma.part.findMany({ where: { tenantId: session.user.tenantId, deletedAt: null } }),
    prisma.mechanic.findMany({ where: { tenantId: session.user.tenantId, deletedAt: null } }),
    prisma.supplier.findMany({
      where: { tenantId: session.user.tenantId, deletedAt: null },
      select: { id: true, name: true },
    }),
    getServiceOrderById(id),
    prisma.tenant.findUnique({ where: { id: session.user.tenantId } }),
    prisma.serviceRating.findUnique({ where: { serviceOrderId: id } }),
  ]);
  if (orderRes.error || !orderRes.order || !tenant) {
    return <PageError message={orderRes.error || "Sipariş veya firma bilgisi bulunamadı"} />;
  }

  const { order } = orderRes;

  const mappedParts = dbParts.map(p => ({ id: p.id, name: `${p.name} - ${p.brand || ""}`, price: Number(p.sellingPrice), currentStock: p.currentStock }));
  const mappedMechanics = dbMechanics.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, price: Number(m.hourlyRate || 500) }));

  // Parts for ReturnDialog (with stock info)
  const returnParts = dbParts.map(p => ({
    id: p.id,
    name: p.name,
    partNumber: p.partNumber,
    currentStock: p.currentStock,
    unit: p.unit,
  }));

  const canReturn = order.status === "IN_PROGRESS" || order.status === "COMPLETED";
  const qualityFields = order as typeof order & {
    qualityCheckNotes?: string | null;
    qualityCheckedAt?: Date | string | null;
    qualityCheckedBy?: string | null;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PENDING': return <span className={dashboardStatusBadgeClass("neutral")}><Clock className="w-4 h-4" /> BEKLİYOR</span>;
      case 'IN_PROGRESS': return <span className={dashboardStatusBadgeClass("info")}><Wrench className="w-4 h-4 animate-pulse" /> İŞLEMDE</span>;
      case 'WAITING_APPROVAL': return <span className={dashboardStatusBadgeClass("warning")}><AlertCircle className="w-4 h-4" /> ONAY BEKLİYOR</span>;
      case 'COMPLETED': return <span className={dashboardStatusBadgeClass("success")}><CheckCircle2 className="w-4 h-4" /> TAMAMLANDI</span>;
      case 'CANCELLED': return <span className={dashboardStatusBadgeClass("danger")}><XCircle className="w-4 h-4" /> İPTAL EDİLDİ</span>;
      default: return <span className={dashboardStatusBadgeClass("neutral")}>{status}</span>;
    }
  };

  return (
    <PageShell
      title={`İş Emri #${order.orderNumber}`}
      subtitle={`Açılış Tarihi: ${dayjs(order.receptionDate).locale('tr').format('DD MMMM YYYY - HH:mm')}`}
      sectionLabel="Servis Operasyonu"
      actions={(
        <div className="flex flex-wrap items-center gap-3">
          <ServicePrintActions order={JSON.parse(JSON.stringify(order))} tenant={JSON.parse(JSON.stringify(tenant))} />
          {canReturn && (
            <ReturnPartButton
              serviceOrderId={order.id}
              parts={returnParts}
              suppliers={dbSuppliers}
            />
          )}
          <div className={DASHBOARD_DETAIL.actionCluster}>
            <StatusBadge status={order.status} />
            <UpdateStatusDialog orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      )}
    >
      <ServiceWorkspaceNav />
      <div className="space-y-6">

        {/* MÜŞTERİ & ARAÇ BİLGİSİ */}
        <div className={`${DASHBOARD_DETAIL.infoGrid} relative`}>
          <div className={DASHBOARD_DETAIL.infoCardStack}>
            <h3 className={DASHBOARD_DETAIL.sectionTitleRow}><UserIcon className="w-4 h-4" /> Müşteri / Firma Bilgileri</h3>
            <div className={DASHBOARD_DETAIL.infoValueLarge}>
              {order.customer.type === 'CORPORATE' ? order.customer.companyName : `${order.customer.firstName} ${order.customer.lastName}`}
            </div>
            <div className={DASHBOARD_DETAIL.infoMetaStack}>
              <p>{order.customer.phone}</p>
              <p>{order.customer.email || "E-Posta belirtilmedi"}</p>
            </div>
          </div>

          <div className={DASHBOARD_DETAIL.infoCardStack}>
            <h3 className={DASHBOARD_DETAIL.sectionTitleRow}><Car className="w-4 h-4" /> Araç Bilgileri</h3>
            <div className={DASHBOARD_DETAIL.infoPlate}>
              {order.vehicle.plate}
            </div>
            <div className={`${DASHBOARD_DETAIL.infoMeta} font-medium`}>
              {order.vehicle.brand} {order.vehicle.model} - {order.vehicle.year || "Belirsiz Yıl"}
            </div>
            {order.vehicle.notes && (
              <div className={DASHBOARD_DETAIL.infoCustomerNote}>Müşteri Notu: {order.vehicle.notes}</div>
            )}
          </div>
        </div>

        {/* ŞİKAYET VE USTA NOTLARI */}
        <div className={DASHBOARD_DETAIL.infoCardStack}>
          <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
            <FileText className="w-4 h-4" /> Servis Notları ve Şikayetler
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={DASHBOARD_DETAIL.notePanel}>
              <div className={DASHBOARD_DETAIL.noteLabel}>Geliş Şikayeti</div>
              <p className={DASHBOARD_DETAIL.noteText}>{order.complaintDescription}</p>
            </div>
            <div className={DASHBOARD_DETAIL.notePanelAccent}>
              <div className={DASHBOARD_DETAIL.noteLabelAccent}>Usta Notu & Gözlem</div>
              <p className={DASHBOARD_DETAIL.noteTextAccent}>{order.inspectionNotes || "Muayene notu girilmedi."}</p>
            </div>
          </div>
        </div>

        {/* SERVİS KALEMLERİ (HİZMET VE PARÇALAR) */}
        <div className={`${DASHBOARD_DETAIL.tableShell} mt-8`}>

          <div className={DASHBOARD_DETAIL.tableToolbarSplit}>
            <h2 className={DASHBOARD_DETAIL.tableTitleLarge}>
              <Wrench className={DASHBOARD_DETAIL.tableTitleIcon} />
              Servis & Parça Kalemleri
            </h2>
            <div className="mt-4 sm:mt-0">
              {(order.status === "PENDING" || order.status === "IN_PROGRESS" || order.status === "WAITING_APPROVAL") && (
                <AddServiceItemDialog
                  serviceOrderId={order.id}
                  parts={mappedParts}
                  mechanics={mappedMechanics}
                />
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`${DASHBOARD_DETAIL.tableHead} font-bold text-[11px]`}>
                <tr>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>İşlem / Parça Adı</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>Miktar/Saat</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>Birim Fiyat</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>KDV %</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWide}>İndirim</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellWideRight}>Toplam (₺)</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_DETAIL.tableBody}>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={DASHBOARD_DETAIL.tableEmptyWide}>
                      <Wrench className={DASHBOARD_DETAIL.tableEmptyIcon} />
                      Henüz işçilik veya yedek parça eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  order.items.map((item) => (
                    <tr key={item.id} className={DASHBOARD_DETAIL.tableRow}>
                      <td className={`${DASHBOARD_DETAIL.tableCellWide} relative`}>
                        {/* Sol tarafta ufak renk belirteci (işçilik vs parça) */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${DASHBOARD_DETAIL.itemAccent[item.itemType === 'PART' ? 'part' : 'labor']}`}></div>

                        <div className={DASHBOARD_DETAIL.tableCellStrong}>{item.name}</div>
                        <div className={DASHBOARD_DETAIL.tableCellMeta}>
                          {item.itemType === 'PART' ? 'Yedek Parça' : 'İşçilik Emeği'}
                        </div>
                      </td>
                      <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellMoney}`}>
                        {item.quantity} x
                      </td>
                      <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellMoney}`}>
                        ₺{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellMutedSmall}`}>
                        %{item.taxRate}
                      </td>
                      <td className={`${DASHBOARD_DETAIL.tableCellWide} ${DASHBOARD_DETAIL.tableCellDanger}`}>
                        {item.discount > 0 ? `-₺${item.discount.toLocaleString('tr-TR')}` : '-'}
                      </td>
                      <td className={`${DASHBOARD_DETAIL.tableCellWideRight} ${DASHBOARD_DETAIL.tableCellMoneyStrong}`}>
                        ₺{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOPLAMLAR BÖLÜMÜ */}
          <div className={DASHBOARD_DETAIL.tableSummaryWide}>
            <div className={DASHBOARD_DETAIL.summaryRowWide}>
              <span>Ara Toplam (KDV hariç):</span>
              <span className="font-mono">₺{Number(order.subTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={DASHBOARD_DETAIL.summaryDiscountRowWide}>
              <span>Toplam İndirim:</span>
              <span className="font-mono">- ₺{Number(order.discountAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={DASHBOARD_DETAIL.summaryRowWideOffset}>
              <span>KDV Toplamı:</span>
              <span className="font-mono">₺{Number(order.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={DASHBOARD_DETAIL.summaryTotalRowWide}>
              <span>GENEL TOPLAM:</span>
              <span className="font-mono">₺{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

      </div>

      {/* QR Takip Kodu */}
      <div className="max-w-xs">
        <ServiceQRCode
          serviceOrderId={order.id}
          orderNumber={order.orderNumber}
          plate={order.vehicle.plate}
        />
      </div>

      <PhotoUploaderSection serviceOrderId={order.id} />

      <div className="space-y-4">
        <QualityControlSection
          serviceOrderId={order.id}
          status={order.status}
          qualityCheckNotes={qualityFields.qualityCheckNotes ?? null}
          qualityCheckedAt={qualityFields.qualityCheckedAt ? new Date(qualityFields.qualityCheckedAt).toISOString() : null}
          qualityCheckedBy={qualityFields.qualityCheckedBy ?? null}
        />
        <ServiceRatingSection
          rating={serviceRating ? {
            id: serviceRating.id,
            rating: serviceRating.rating,
            comment: serviceRating.comment,
            createdAt: serviceRating.createdAt.toISOString(),
          } : null}
        />
      </div>
    </PageShell>
  );
}
