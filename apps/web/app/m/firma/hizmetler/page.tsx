import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";
import { Wrench, Tag } from "lucide-react";

export const metadata = { title: "Hizmetler | MS Oto Servis" };

export default async function HizmetlerPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const tenantId = session.user.tenantId;

  // İşçilik kategorisindeki parçaları hizmet olarak göster
  const parts = await prisma.part.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  // Kategoriye göre grupla
  const grouped = new Map<string, typeof parts>();
  parts.forEach((p) => {
    const cat = p.category?.name ?? "Diğer";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(p);
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Hizmet Kataloğu</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {parts.length} hizmet / parça
        </p>
      </div>

      {parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Wrench className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-500">Henüz hizmet tanımlanmamış</p>
          <p className="text-sm text-gray-400">
            Dashboard üzerinden stok/hizmet ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              {/* Kategori Başlığı */}
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  {category}
                </h3>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>

              {/* Hizmet Kartları */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-[#00236f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{item.partNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-gray-900 font-mono">
                        ₺{Number(item.sellingPrice).toLocaleString("tr-TR")}
                      </p>
                      <p className="text-[10px] text-gray-400">/ {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
