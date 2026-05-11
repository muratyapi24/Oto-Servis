/**
 * /servis-takip/[id] — Müşteri Servis Takip Sayfası
 *
 * QR kod veya link ile erişilen, oturum gerektirmeyen genel servis durumu sayfası.
 * Hassas finansal veri gösterilmez.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@repo/database";

export const metadata: Metadata = {
  title: "Servis Takip",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; color: string; icon: string; description: string }> = {
  PENDING: {
    label: "Araç Teslim Alındı",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "🔑",
    description: "Aracınız servisimizde; muayene ve ön değerlendirme aşamasında.",
  },
  IN_PROGRESS: {
    label: "Tamirde",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🔧",
    description: "Aracınız aktif olarak servis görmektedir.",
  },
  WAITING_APPROVAL: {
    label: "Onayınız Bekleniyor",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "📋",
    description: "Servis detayları hazırlandı. Onay bekleniyor.",
  },
  COMPLETED: {
    label: "Tamamlandı — Teslime Hazır",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✅",
    description: "Aracınız servisten çıktı, teslim almaya hazır.",
  },
  CANCELLED: {
    label: "İptal Edildi",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: "❌",
    description: "Bu servis emri iptal edildi.",
  },
};

async function getServiceOrderTracking(id: string) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      OR: [
        { id },
        { approvalToken: id },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      complaintDescription: true,
      receptionDate: true,
      promisedDeliveryDate: true,
      actualDeliveryDate: true,
      completionPercentage: true,
      vehicle: {
        select: {
          plate: true,
          brand: true,
          model: true,
          year: true,
        },
      },
      tenant: {
        select: {
          name: true,
          phone: true,
          logoUrl: true,
        },
      },
      assignedMechanic: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  return order;
}

export default async function ServisTakipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getServiceOrderTracking(id);

  if (!order) return notFound();

  const statusInfo = STATUS_MAP[order.status] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "ℹ️",
    description: "Servis durumu güncelleniyor.",
  };

  const formattedDate = (d?: Date | string | null) =>
    d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        {order.tenant.logoUrl && (
          <img src={order.tenant.logoUrl} alt="logo" className="h-8 w-auto" />
        )}
        <div>
          <p className="text-sm font-bold text-slate-900">{order.tenant.name}</p>
          {order.tenant.phone && (
            <a href={`tel:${order.tenant.phone}`} className="text-xs text-blue-600">
              {order.tenant.phone}
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-4">
        {/* Status Card */}
        <div className={`border-2 rounded-2xl p-6 text-center ${statusInfo.color}`}>
          <div className="text-5xl mb-3">{statusInfo.icon}</div>
          <h1 className="text-xl font-bold mb-1">{statusInfo.label}</h1>
          <p className="text-sm opacity-80">{statusInfo.description}</p>
        </div>

        {/* Vehicle Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase text-slate-400 mb-3">Araç Bilgileri</h2>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 rounded-xl p-3">
              <span className="text-2xl">🚗</span>
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {order.vehicle.brand} {order.vehicle.model}
                {order.vehicle.year ? ` (${order.vehicle.year})` : ""}
              </p>
              <p className="text-blue-700 font-mono font-bold text-lg">{order.vehicle.plate}</p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase text-slate-400">Servis Detayları</h2>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">İş Emri No</span>
            <span className="font-mono font-bold">#{order.orderNumber}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Teslim Tarihi</span>
            <span className="font-medium">{formattedDate(order.receptionDate)}</span>
          </div>

          {order.promisedDeliveryDate && order.status !== "COMPLETED" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Söz Verilen Teslim</span>
              <span className="font-medium text-blue-700">{formattedDate(order.promisedDeliveryDate)}</span>
            </div>
          )}

          {order.actualDeliveryDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gerçek Teslim</span>
              <span className="font-medium text-green-700">{formattedDate(order.actualDeliveryDate)}</span>
            </div>
          )}

          {order.assignedMechanic && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sorumlu Usta</span>
              <span className="font-medium">
                {order.assignedMechanic.firstName} {order.assignedMechanic.lastName}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        {order.completionPercentage > 0 && order.status !== "COMPLETED" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500 font-medium">Tamamlanma</span>
              <span className="font-bold text-blue-700">%{order.completionPercentage}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${order.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Complaint */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Şikayet / Talep</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{order.complaintDescription}</p>
        </div>

        {/* Contact */}
        {order.tenant.phone && (
          <a
            href={`tel:${order.tenant.phone}`}
            className="block bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 text-center font-bold transition-colors"
          >
            📞 Servisi Ara — {order.tenant.phone}
          </a>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">
          Bu sayfa otomatik olarak güncellenmez. Güncel durum için sayfayı yenileyin.
        </p>
      </main>
    </div>
  );
}
