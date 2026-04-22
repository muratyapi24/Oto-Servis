import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";
import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export const metadata = { title: "Vardiya Takvimi | MS Oto Servis" };

const DAYS = [
  { key: "MON", label: "Pzt" },
  { key: "TUE", label: "Sal" },
  { key: "WED", label: "Çar" },
  { key: "THU", label: "Per" },
  { key: "FRI", label: "Cum" },
  { key: "SAT", label: "Cmt" },
  { key: "SUN", label: "Paz" },
];

export default async function VardiyaPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/m/firma/login");

  const mechanics = await prisma.mechanic.findMany({
    where: { tenantId: session.user.tenantId, isActive: true, deletedAt: null },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      shiftStart: true,
      shiftEnd: true,
      workDays: true,
      dailyTarget: true,
    },
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Vardiya Takvimi</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {mechanics.length} aktif usta
        </p>
      </div>

      {mechanics.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aktif personel bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {mechanics.map((m) => {
            const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
            const hasShift = m.shiftStart && m.shiftEnd;
            const workDays: string[] = m.workDays ?? [];

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* Usta Başlık */}
                <Link
                  href={`/m/firma/personel/${m.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-[#00236f]">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    {hasShift ? (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {m.shiftStart} – {m.shiftEnd}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-0.5">Vardiya tanımlanmamış</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>

                {/* Gün Göstergesi */}
                <div className="px-4 py-3">
                  <div className="flex gap-2">
                    {DAYS.map((day) => {
                      const active = workDays.includes(day.key);
                      return (
                        <div
                          key={day.key}
                          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-center transition-colors ${
                            active
                              ? "bg-[#00236f] text-white"
                              : "bg-gray-50 text-gray-300"
                          }`}
                        >
                          <span className="text-[10px] font-black">{day.label}</span>
                          {active && (
                            <div className="w-1 h-1 rounded-full bg-[#6cf8bb]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Günlük Hedef */}
                  {m.dailyTarget && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Günlük hedef:</span>
                      <span className="font-bold text-gray-700">{m.dailyTarget} iş</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
