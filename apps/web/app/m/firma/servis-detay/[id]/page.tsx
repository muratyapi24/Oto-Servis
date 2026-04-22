import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  Car,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Package,
} from "lucide-react";

export const metadata = { title: "Servis Detayı | MS Oto Servis" };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Bekliyor", cls: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "İşlemde", cls: "bg-blue-100 text-blue-800" },
  WAITING_APPROVAL: { label: "Onay Bekliyor", cls: "bg-orange-100 text-orange-800" },
  COMPLETED: { label: "Tamamlandı", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "İptal", cls: "bg-red-100 text-red-800" },
};

export default async function ServisDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true, year: true } },
      customer: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          type: true,
          phone: true,
        },
      },
      assignedMechanic: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
      items: {
        select: { id: true, name: true, itemType: true, quantity: true, totalPrice: true },
      },
    },
  });

  if (!order) notFound();

  const customerName =
    order.customer.type === "CORPORATE"
      ? (order.customer.companyName ?? "—")
      : `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim() || "—";

  const status = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-700" };
  const pct = order.completionPercentage ?? 0;
  const isCloseable = order.status === "IN_PROGRESS" || order.status === "WAITING_APPROVAL";

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href="/m/firma/kuyruk"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kuyruğa Dön
      </Link>

      {/* Araç Hero */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
              İş Emri #{order.orderNumber}
            </p>
            <h2 className="text-2xl font-black font-mono">{order.vehicle.plate}</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {order.vehicle.brand} {order.vehicle.model}
              {order.vehicle.year ? ` · ${order.vehicle.year}` : ""}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {/* İlerleme Çubuğu */}
        <div>
          <div className="flex justify-between text-xs text-blue-200 mb-1.5">
            <span>Tamamlanma</span>
            <span className="font-bold">%{pct}</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#6cf8bb] h-full rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Müşteri & Usta */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <User className="w-3 h-3" /> Müşteri
          </p>
          <p className="text-sm font-bold text-gray-800 truncate">{customerName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{order.customer.phone}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Usta
          </p>
          {order.assignedMechanic ? (
            <p className="text-sm font-bold text-gray-800 truncate">
              {order.assignedMechanic.firstName} {order.assignedMechanic.lastName}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">Atanmadı</p>
          )}
        </div>
      </div>

      {/* Şikayet */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Şikayet / Açıklama
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{order.complaintDescription}</p>
        {order.inspectionNotes && (
          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2 mt-2 leading-relaxed">
            {order.inspectionNotes}
          </p>
        )}
      </div>

      {/* Servis Kalemleri */}
      {order.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Servis Kalemleri ({order.items.length})
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.itemType === "PART" ? "Parça" : "İşçilik"} · {Number(item.quantity)}x
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-700 font-mono">
                  ₺{Number(item.totalPrice).toLocaleString("tr-TR")}
                </p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-between">
            <span className="text-sm font-bold text-gray-600">Toplam</span>
            <span className="text-sm font-black text-gray-900 font-mono">
              ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
            </span>
          </div>
        </div>
      )}

      {/* Tarih Bilgisi */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span>
          Açılış: {dayjs(order.receptionDate).locale("tr").format("DD MMM YYYY HH:mm")}
        </span>
        {order.promisedDeliveryDate && (
          <>
            <span>·</span>
            <span>
              Söz: {dayjs(order.promisedDeliveryDate).locale("tr").format("DD MMM YYYY")}
            </span>
          </>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href={`/m/firma/parca-talep?serviceOrderId=${order.id}`}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#00236f] text-[#00236f] rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
        >
          <Package className="w-4 h-4" />
          Parça Talep Et
        </Link>
        {isCloseable ? (
          <Link
            href={`/m/firma/is-kapat/${order.id}`}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            İşi Kapat
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed">
            <CheckCircle2 className="w-4 h-4" />
            İşi Kapat
          </div>
        )}
      </div>
    </div>
  );
}
