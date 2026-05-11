import { getServiceOrderById } from "@/lib/actions/service.actions";
import { AddServiceItemDialog } from "./AddServiceItemDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import ReturnPartButton from "./ReturnPartButton";
import { prisma } from "@repo/database";
import { auth } from "@/auth";
import {
  Wrench,
  MapPin,
  Car,
  User as UserIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  CalendarDays
} from "lucide-react";
import { ServicePrintActions } from "./ServicePrintActions";
import Link from "next/link";
import dayjs from "dayjs";
import 'dayjs/locale/tr';
import PhotoUploader from "@/components/dashboard/services/PhotoUploader";
import QualityControlSection from "@/components/dashboard/services/QualityControlSection";
import ServiceRatingSection from "@/components/dashboard/services/ServiceRatingSection";
import { ServiceQRCode } from "@/components/dashboard/services/ServiceQRCode";

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
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {orderRes.error || "Sipariş veya firma bilgisi bulunamadı"}
        </div>
      </div>
    );
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

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'PENDING': return <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5"><Clock className="w-4 h-4" /> BEKLİYOR</span>;
      case 'IN_PROGRESS': return <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 border border-blue-200"><Wrench className="w-4 h-4 animate-pulse" /> İŞLEMDE</span>;
      case 'WAITING_APPROVAL': return <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 border border-orange-200"><AlertCircle className="w-4 h-4" /> ONAY BEKLİYOR</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 border border-green-200"><CheckCircle2 className="w-4 h-4" /> TAMAMLANDI</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4" /> İPTAL EDiLDİ</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* BAŞLIK & KONTROLLER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/services" className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">◄ Geri Dön</Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">İş Emri #{order.orderNumber}</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Açılış Tarihi: {dayjs(order.receptionDate).locale('tr').format('DD MMMM YYYY - HH:mm')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ServicePrintActions order={JSON.parse(JSON.stringify(order))} tenant={JSON.parse(JSON.stringify(tenant))} />
            {canReturn && (
              <ReturnPartButton
                serviceOrderId={order.id}
                parts={returnParts}
                suppliers={dbSuppliers}
              />
            )}
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <StatusBadge status={order.status} />
              <UpdateStatusDialog orderId={order.id} currentStatus={order.status} />
            </div>
          </div>
        </div>

        {/* MÜŞTERİ & ARAÇ BİLGİSİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Müşteri / Firma Bilgileri</h3>
            <div className="font-medium text-lg text-gray-900 mt-2">
              {order.customer.type === 'CORPORATE' ? order.customer.companyName : `${order.customer.firstName} ${order.customer.lastName}`}
            </div>
            <div className="text-sm text-gray-600 space-y-1 mt-1 font-mono">
              <p>{order.customer.phone}</p>
              <p>{order.customer.email || "E-Posta belirtilmedi"}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Car className="w-4 h-4" /> Araç Bilgileri</h3>
            <div className="font-bold text-2xl text-blue-900 mt-2">
              {order.vehicle.plate}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {order.vehicle.brand} {order.vehicle.model} - {order.vehicle.year || "Belirsiz Yıl"}
            </div>
            {order.vehicle.notes && (
              <div className="text-xs text-orange-700 bg-orange-50 p-1.5 mt-2 rounded inline-block">Müşteri Notu: {order.vehicle.notes}</div>
            )}
          </div>
        </div>

        {/* ŞİKAYET VE USTA NOTLARI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" /> Servis Notları ve Şikayetler
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg relative">
              <div className="absolute -top-3 left-4 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Geliş Şikayeti</div>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">"{order.complaintDescription}"</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg relative flex flex-col pb-6">
              <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Usta Notu & Gözlem</div>
              <p className="text-sm text-blue-900 mt-1 leading-relaxed">{order.inspectionNotes || "Muayene notu girilmedi."}</p>
            </div>
          </div>
        </div>

        {/* SERVİS KALEMLERİ (HİZMET VE PARÇALAR) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-8">

          <div className="bg-gray-50 p-5 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-gray-500" />
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
              <thead className="bg-white text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b">
                <tr>
                  <th className="px-6 py-4">İşlem / Parça Adı</th>
                  <th className="px-6 py-4">Miktar/Saat</th>
                  <th className="px-6 py-4">Birim Fiyat</th>
                  <th className="px-6 py-4">KDV %</th>
                  <th className="px-6 py-4">İndirim</th>
                  <th className="px-6 py-4 text-right">Toplam (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <Wrench className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                      Henüz işçilik veya yedek parça eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 relative">
                        {/* Sol tarafta ufak renk belirteci (işçilik vs parça) */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.itemType === 'PART' ? 'bg-blue-500' : 'bg-green-500'}`}></div>

                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                          {item.itemType === 'PART' ? 'Yedek Parça' : 'İşçilik EmEğİ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-700">
                        {item.quantity} x
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-700">
                        ₺{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        %{item.taxRate}
                      </td>
                      <td className="px-6 py-4 text-red-500 text-xs font-bold">
                        {item.discount > 0 ? `-₺${item.discount.toLocaleString('tr-TR')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 text-base font-mono">
                        ₺{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TOPLAMLAR BÖLÜMÜ */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col items-end gap-2 text-sm text-right">
            <div className="w-full max-w-sm flex justify-between py-1 text-gray-600">
              <span>Ara Toplam (KDV'siz):</span>
              <span className="font-mono">₺{Number(order.subTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full max-w-sm flex justify-between py-1 text-red-600 border-b border-gray-200 border-dashed pb-2">
              <span>Toplam İndirim:</span>
              <span className="font-mono">- ₺{Number(order.discountAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full max-w-sm flex justify-between py-1 text-gray-600 pt-2">
              <span>KDV Toplamı:</span>
              <span className="font-mono">₺{Number(order.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full max-w-sm flex justify-between py-3 mt-2 text-2xl font-bold text-blue-950 border-t border-gray-300">
              <span>GENEL TOPLAM:</span>
              <span className="font-mono">₺{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

      </div>

      {/* QR Takip Kodu */}
      <div className="px-6 max-w-5xl mx-auto mt-4">
        <div className="max-w-xs">
          <ServiceQRCode
            serviceOrderId={order.id}
            orderNumber={order.orderNumber}
            plate={order.vehicle.plate}
          />
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto mt-6">
        <PhotoUploaderSection serviceOrderId={order.id} />
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <QualityControlSection
          serviceOrderId={order.id}
          status={order.status}
          qualityCheckNotes={(order as any).qualityCheckNotes ?? null}
          qualityCheckedAt={(order as any).qualityCheckedAt ? new Date((order as any).qualityCheckedAt).toISOString() : null}
          qualityCheckedBy={(order as any).qualityCheckedBy ?? null}
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
    </>
  );
}
