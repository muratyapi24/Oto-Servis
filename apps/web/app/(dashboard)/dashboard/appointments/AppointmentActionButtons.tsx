"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "@/lib/actions/appointment.actions";
import { Wrench, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function AppointmentActionButtons({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusChange = (status: "COMPLETED" | "CANCELLED") => {
    startTransition(async () => {
      const res = await updateAppointmentStatus({ id: appointmentId, status });
      if (res?.success) {
        if (status === "COMPLETED") {
          // Servise yönlendir ama şimdilik sadece statü güncellesin
          // İlerde query param ile /dashboard/services?aptId=... yapılabilir
          router.push("/dashboard/services");
        }
      } else {
        alert(res?.error || "Bir hata oluştu");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => handleStatusChange("CANCELLED")}
        disabled={isPending}
        className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" /> İptal
      </button>
      <button 
        onClick={() => handleStatusChange("COMPLETED")}
        disabled={isPending}
        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm transition-colors disabled:opacity-50"
      >
        <Wrench className="w-3.5 h-3.5" /> {isPending ? "İşleniyor..." : "Servise Al"}
      </button>
    </div>
  );
}
