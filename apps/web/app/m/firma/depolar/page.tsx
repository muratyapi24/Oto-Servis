import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";
import Link from "next/link";
import { Warehouse, Package, MapPin, ChevronRight, AlertCircle } from "lucide-react";

export const metadata = { title: "Depolar | MS Oto Servis" };

export default async function DepolarPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const tenantId = session.user.tenantId;

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });

  const partCounts = await prisma.part.groupBy({
    by: ["locationId"],
    where: { tenantId, locationId: { not: null }, deletedAt: null },
    _count: { id: true },
  });
  const countMap = new Map(partCounts.map((r) => [r.locationId, r._count.id]));

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Depolar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stok lokasyonları ve kalem sayıları</p>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Warehouse className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-base font-bold text-gray-600">Henüz depo tanımlanmamış</p>
          <p className="text-sm text-gray-400">
            Dashboard üzerinden lokasyon ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const count = countMap.get(loc.id) ?? 0;
            return (
              <Link
                key={loc.id}
                href={`/m/firma/depo/${loc.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#00236f]/30 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Warehouse className="w-6 h-6 text-[#00236f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{loc.name}</p>
                  {loc.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {loc.address}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Package className="w-3 h-3" />
                    <span className="font-medium">{count}</span> kalem
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00236f] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Stok Hareketleri Linki */}
      <Link
        href="/m/firma/stok-hareketler"
        className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 p-4 hover:bg-white transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Tüm Stok Hareketleri</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </Link>
    </div>
  );
}
