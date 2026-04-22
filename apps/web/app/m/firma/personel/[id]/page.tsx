import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@repo/database";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  Mail,
  Wrench,
  Clock,
  Target,
  Calendar,
  Car,
  CheckCircle2,
} from "lucide-react";

export const metadata = { title: "Personel Detayı | MS Oto Servis" };

const DAY_MAP: Record<string, string> = {
  MON: "Pzt", TUE: "Sal", WED: "Çar",
  THU: "Per", FRI: "Cum", SAT: "Cmt", SUN: "Paz",
};

export default async function PersonelDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) return notFound();

  const { id } = await params;
  const tenantId = session.user.tenantId;

  const mechanic = await prisma.mechanic.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!mechanic) notFound();

  const [activeOrders, completedCount] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: {
        tenantId,
        assignedMechanicId: id,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
      },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        customer: { select: { firstName: true, lastName: true, companyName: true, type: true } },
      },
      orderBy: { receptionDate: "desc" },
      take: 10,
    }),
    prisma.serviceOrder.count({
      where: { tenantId, assignedMechanicId: id, status: "COMPLETED" },
    }),
  ]);

  const initials = `${mechanic.firstName[0]}${mechanic.lastName[0]}`.toUpperCase();
  const shiftText =
    mechanic.shiftStart && mechanic.shiftEnd
      ? `${mechanic.shiftStart} – ${mechanic.shiftEnd}`
      : "Tanımlanmamış";
  const workDaysText =
    mechanic.workDays?.length > 0
      ? mechanic.workDays.map((d: string) => DAY_MAP[d] ?? d).join(", ")
      : "Tanımlanmamış";

  const dailyPct =
    mechanic.dailyTarget && mechanic.dailyTarget > 0
      ? Math.min(Math.round((activeOrders.length / mechanic.dailyTarget) * 100), 100)
      : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Geri */}
      <Link
        href="/m/firma/personel"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Personele Dön
      </Link>

      {/* Profil Hero */}
      <div className="bg-gradient-to-br from-[#00236f] to-[#1e3a8a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
            {mechanic.avatarUrl ? (
              <Image
                src={mechanic.avatarUrl}
                alt={`${mechanic.firstName} ${mechanic.lastName}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{initials}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black">
                {mechanic.firstName} {mechanic.lastName}
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  mechanic.isActive
                    ? "bg-[#6cf8bb]/20 text-[#6cf8bb]"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {mechanic.isActive ? "AKTİF" : "PASİF"}
              </span>
            </div>
            {mechanic.experienceYears != null && (
              <p className="text-blue-200 text-sm mt-0.5">
                {mechanic.experienceYears} yıl deneyim
              </p>
            )}
          </div>
        </div>

        {/* Uzmanlıklar */}
        {mechanic.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {mechanic.specialties.map((s: string) => (
              <span
                key={s}
                className="text-[10px] font-bold uppercase px-2.5 py-1 bg-white/10 text-blue-100 rounded-lg"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* İletişim */}
        <div className="flex flex-wrap gap-4 text-sm text-blue-200">
          {mechanic.phone && (
            <a href={`tel:${mechanic.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {mechanic.phone}
            </a>
          )}
          {mechanic.email && (
            <a href={`mailto:${mechanic.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {mechanic.email}
            </a>
          )}
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Aktif İş
          </p>
          <p className="text-2xl font-black text-gray-900">{activeOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Tamamlanan
          </p>
          <p className="text-2xl font-black text-gray-900">{completedCount}</p>
        </div>
      </div>

      {/* Vardiya & Hedef */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          Vardiya & Hedef
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Vardiya
            </p>
            <p className="text-sm font-bold text-gray-800">{shiftText}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Çalışma Günleri</p>
            <p className="text-sm font-bold text-gray-800">{workDaysText}</p>
          </div>
        </div>
        {mechanic.dailyTarget && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3" /> Günlük Hedef
              </p>
              <span className="text-xs font-bold text-gray-700">
                {activeOrders.length} / {mechanic.dailyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#00236f] h-full rounded-full transition-all"
                style={{ width: `${dailyPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Aktif Servis Emirleri */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Aktif Servis Emirleri
          </span>
          <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {activeOrders.length}
          </span>
        </div>
        {activeOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Aktif servis emri yok.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeOrders.map((order) => {
              const customerName =
                order.customer.type === "CORPORATE"
                  ? (order.customer.companyName ?? "—")
                  : `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim() || "—";
              return (
                <Link
                  key={order.id}
                  href={`/m/firma/servis-detay/${order.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-[#00236f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#00236f] font-mono">
                      {order.vehicle.plate}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.vehicle.brand} {order.vehicle.model} · {customerName}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
