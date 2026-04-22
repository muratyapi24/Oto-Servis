import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import Link from "next/link";
import {
  ArrowLeft,
  Warehouse,
  Package,
  AlertTriangle,
  ChevronRight,
  MapPin,
} from "lucide-react";

export const metadata = { title: "Depo Detayı | MS Oto Servis" };

export default async function DepoDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;
  const tenantId = session.user.tenantId;

  const location = await prisma.location.findFirst({
    where: { id, tenantId },
  });
  if (!location) notFound();

  const parts = await prisma.part.findMany({
    where: { tenantId, locationId: id, deletedAt: null },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const lowStockCount = parts.filter((p) => p.currentStock <= p.minStockLevel).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href="/m/firma/depolar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Depolara Dön
      </Link>

      {/* Depo Hero */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">{location.name}</h2>
            {location.address && (
              <p className="text-blue-200 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {location.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-black">{parts.length}</p>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">Toplam Kalem</p>
          </div>
          {lowStockCount > 0 && (
            <div className="bg-red-500/30 border border-red-400/30 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-red-200">{lowStockCount}</p>
              <p className="text-red-200 text-[10px] uppercase tracking-wider">Kritik Stok</p>
            </div>
          )}
        </div>
      </div>

      {/* Parça Listesi */}
      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Package className="w-8 h-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">Bu depoda stok kalemi yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {parts.map((part) => {
            const isLow = part.currentStock <= part.minStockLevel;
            return (
              <div
                key={part.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
                  isLow ? "border-red-200 bg-red-50/30" : "border-gray-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLow ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  {isLow ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{part.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{part.partNumber}</p>
                  {part.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{part.category.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-lg font-black font-mono ${
                      isLow ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {part.currentStock}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    min: {part.minStockLevel} {part.unit}
                  </p>
                </div>
                <Link
                  href={`/m/firma/stok-guncelle/${part.id}`}
                  className="ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
