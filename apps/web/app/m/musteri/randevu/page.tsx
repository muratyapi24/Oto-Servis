"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────
interface VehicleData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  nextMaintenanceMileage?: number;
  color?: string;
}

interface AppointmentData {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  type?: string;
  status: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  {
    id: "periodic",
    title: "Periyodik Bakım",
    description: "Yağ değişimi, filtre kontrolleri ve genel sıvı seviyesi ölçümleri.",
    icon: "build",
    estimateMin: 2500,
    estimateMax: 4500,
  },
  {
    id: "brakes",
    title: "Fren Sistemi",
    description: "Balata değişimi, disk kontrolü ve fren hidroliği testi.",
    icon: "speed",
    estimateMin: 1800,
    estimateMax: 3500,
  },
  {
    id: "engine",
    title: "Motor / Mekanik",
    description: "Motor arıza tespiti, triger seti ve şanzıman kontrolleri.",
    icon: "engineering",
    estimateMin: 3000,
    estimateMax: 8000,
  },
  {
    id: "electrical",
    title: "Elektrik / Elektronik",
    description: "Akü testi, aydınlatma grubu ve beyin arıza kodları okuma.",
    icon: "bolt",
    estimateMin: 800,
    estimateMax: 3000,
  },
  {
    id: "body",
    title: "Kaporta / Boya",
    description: "Hasar onarımı, boyasız göçük düzeltme ve profesyonel pasta cila işlemleri.",
    icon: "format_paint",
    estimateMin: 2000,
    estimateMax: 12000,
  },
];

const TIME_SLOTS = [
  "09:00", "09:45", "10:30", "11:15",
  "13:00", "13:45", "14:30", "15:15", "16:00",
];

const STEPS = [
  { label: "Araç", icon: "directions_car" },
  { label: "Hizmet", icon: "build" },
  { label: "Zaman", icon: "schedule" },
  { label: "Onay", icon: "check_circle" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Mon=1
  const days: { date: string; day: number; disabled: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    days.push({
      date: dateObj.toISOString().split("T")[0] ?? "",
      day: d,
      disabled: dateObj <= today || dayOfWeek === 0, // geçmiş veya pazar
    });
  }
  return { days, startDayOfWeek, daysInMonth };
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MusteriRandevuPage() {
  const router = useRouter();

  // Data state
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const calendarData = useMemo(() => generateCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];

  // Derived
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedService = SERVICE_TYPES.find((s) => s.id === selectedServiceType);

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/musteri/randevu");
        const data = await res.json();
        if (data.vehicles) setVehicles(data.vehicles);
        if (data.appointments) setExistingAppointments(data.appointments);
      } catch {
        setError("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Navigation
  function nextStep() {
    setError(null);
    if (step === 1 && !selectedVehicleId) {
      setError("Lütfen bir araç seçin.");
      return;
    }
    if (step === 2 && !selectedServiceType) {
      setError("Lütfen bir hizmet türü seçin.");
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      setError("Lütfen tarih ve saat seçin.");
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  // Submit
  async function handleSubmit() {
    if (!acceptTerms) {
      setError("Lütfen servis şartlarını kabul edin.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/musteri/randevu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          date: selectedDate,
          time: selectedTime,
          serviceType: selectedService?.title || selectedServiceType,
          notes: notes || undefined,
          estimatedCostMin: selectedService?.estimateMin,
          estimatedCostMax: selectedService?.estimateMax,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Randevu oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  // Month navigation
  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="px-5 pt-6 pb-32 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-blue-600">progress_activity</span>
          <p className="text-slate-400 text-sm font-medium">Yükleniyor...</p>
        </div>
      </main>
    );
  }

  // ─── Success State ────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="px-5 pt-6 pb-32 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        {/* Animated check */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-[bounceIn_0.6s_ease-out]">
            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/30 animate-ping" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          Randevunuz Alındı!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-2">
          Servisimiz en kısa sürede randevunuzu onaylayacak. Detaylar e-posta adresinize gönderildi.
        </p>

        {/* Summary mini card */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mt-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>{selectedVehicle?.brand} {selectedVehicle?.model} — {selectedVehicle?.plate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">build</span>
            <span>{selectedService?.title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">event</span>
            <span>{formatDate(selectedDate)}, {selectedTime}</span>
          </div>
        </div>

        <Link
          href="/m/musteri/panel"
          className="w-full py-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25"
        >
          <span className="material-symbols-outlined">home</span>
          Panele Dön
        </Link>
      </main>
    );
  }

  // ─── Main Wizard ──────────────────────────────────────────────────────────
  return (
    <main className="px-5 pt-5 pb-32 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/m/musteri/panel" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Servis Randevusu</h1>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Adım {step}/4 — {STEPS[step - 1]?.label || ""}</p>
        </div>
      </div>

      {/* ─── Step Indicator ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isComplete = stepNum < step;
          return (
            <div key={s.label} className="flex-1 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isComplete
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : isActive
                    ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {isComplete ? (
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-400"}`}>
                {s.label}
              </span>
              {/* Progress line */}
              {i < STEPS.length - 1 && (
                <div className="absolute" style={{ display: "none" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-4 animate-[fadeIn_0.3s_ease-out]">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 1: ARAÇ SEÇİMİ
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Yeni Randevu</h2>
            <p className="text-xs text-slate-400">Lütfen bakım yapılacak aracınızı seçin.</p>
          </div>

          {/* Kayıtlı Araçlar Başlık */}
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kayıtlı Araçlarım</p>

          {vehicles.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">directions_car</span>
              <p className="text-sm text-slate-400">Kayıtlı aracınız bulunmuyor.</p>
              <p className="text-xs text-slate-400 mt-1">Lütfen servis ile iletişime geçin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Car icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-700 to-blue-500 shadow-md shadow-blue-500/25"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}>
                        <span className={`material-symbols-outlined text-xl ${isSelected ? "text-white" : "text-slate-400"}`}>
                          directions_car
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-800 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>
                          {v.brand} {v.model}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {v.plate} {v.year ? `• ${v.year}` : ""}
                        </p>
                        {v.mileage ? (
                          <p className="text-[10px] text-slate-400 mt-0.5">{v.mileage?.toLocaleString("tr-TR")} km</p>
                        ) : null}
                      </div>

                      {/* Check */}
                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Periyodik Bakım Hatırlatması */}
          {selectedVehicle && selectedVehicle.nextMaintenanceMileage && selectedVehicle.mileage && (
            (() => {
              const remaining = selectedVehicle.nextMaintenanceMileage - selectedVehicle.mileage;
              if (remaining > 0 && remaining < 1000) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/15 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-amber-600 text-lg">notification_important</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Periyodik Bakım Hatırlatması</p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                        Seçili {selectedVehicle.brand} {selectedVehicle.model} aracınızın{" "}
                        {selectedVehicle.nextMaintenanceMileage?.toLocaleString("tr-TR")} km bakımı için {remaining.toLocaleString("tr-TR")} km kalmış.
                        Bu randevuda periyodik bakım paketini seçmenizi öneririz.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 2: HİZMET TÜRÜ
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Hizmet Seçimi</h2>
            <p className="text-xs text-slate-400">Aracınız için hangi hizmeti almak istiyorsunuz?</p>
          </div>

          <div className="space-y-3">
            {SERVICE_TYPES.map((svc) => {
              const isSelected = selectedServiceType === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => setSelectedServiceType(svc.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-700 to-blue-500 shadow-md shadow-blue-500/25"
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}>
                      <span className={`material-symbols-outlined text-lg ${isSelected ? "text-white" : "text-slate-400"}`}>
                        {svc.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isSelected ? "text-blue-800 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>
                        {svc.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{svc.description}</p>
                    </div>

                    {isSelected && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Multi-service note */}
          <p className="text-[11px] text-slate-400 text-center italic">
            Birden fazla hizmet seçimi yapmak için lütfen özet adımında not bırakın.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 3: TARİH VE SAAT
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
          {/* Calendar */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-sm text-slate-500">chevron_left</span>
              </button>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {monthNames[calMonth]} {calYear}
              </h3>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: calendarData.startDayOfWeek - 1 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarData.days.map((d) => {
                const isSelected = selectedDate === d.date;
                const isToday = d.date === new Date().toISOString().split("T")[0];
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={d.disabled}
                    onClick={() => setSelectedDate(d.date)}
                    className={`h-9 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      d.disabled
                        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        : isSelected
                        ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25"
                        : isToday
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90"
                    }`}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Müsait Saat Dilimleri</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.95] ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25"
                        : "bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 dark:bg-blue-900/15 rounded-2xl p-3 flex gap-2.5 items-start">
            <span className="material-symbols-outlined text-blue-500 text-lg shrink-0 mt-0.5">info</span>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
              Seçtiğiniz saat dilimi yaklaşık 90 dakikalık bir servis süresini kapsamaktadır.
              Ekspertiz sonrası süre değişebilir.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 4: ÖZET VE ONAY
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Randevu Detayları</h2>
            <p className="text-xs text-slate-400">Bilgilerinizi kontrol edip onaylayın.</p>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3">
            {/* Araç */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">directions_car</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Seçilen Araç</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {selectedVehicle?.brand} {selectedVehicle?.model} — {selectedVehicle?.plate}
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-blue-500 text-xs font-semibold">Değiştir</button>
            </div>

            {/* Hizmet */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">{selectedService?.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hizmet</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedService?.title}</p>
              </div>
              <button type="button" onClick={() => setStep(2)} className="text-blue-500 text-xs font-semibold">Değiştir</button>
            </div>

            {/* Tarih/Saat */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 text-lg">event</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tarih ve Saat</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDate(selectedDate)}, {selectedTime}
                </p>
              </div>
              <button type="button" onClick={() => setStep(3)} className="text-blue-500 text-xs font-semibold">Değiştir</button>
            </div>
          </div>

          {/* Tahmini Maliyet */}
          {selectedService && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/60 dark:to-blue-900/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tahmini Maliyet Aralığı</p>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Teklif İçerir
                </span>
              </div>
              <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {selectedService.estimateMin.toLocaleString("tr-TR")} ₺ — {selectedService.estimateMax.toLocaleString("tr-TR")} ₺
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Kesin fiyat ekspertiz sonrası belirlenecektir.</p>
            </div>
          )}

          {/* Ek Notlar */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Ek Notlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Şikayetinizi veya özel taleplerinizi belirtin..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Şartlar */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                acceptTerms
                  ? "bg-blue-600 border-blue-600"
                  : "border-slate-300 dark:border-slate-600"
              }`}
              onClick={() => setAcceptTerms(!acceptTerms)}
            >
              {acceptTerms && (
                <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed" onClick={() => setAcceptTerms(!acceptTerms)}>
              &ldquo;Randevuyu Onayla&rdquo; butonuna basarak{" "}
              <span className="text-blue-500 font-semibold">servis şartlarını</span> ve{" "}
              <span className="text-blue-500 font-semibold">KVKK aydınlatma metnini</span> kabul etmiş olursunuz.
            </p>
          </label>
        </div>
      )}

      {/* ─── Navigation Buttons ──────────────────────────────────────────────── */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Geri
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={
              (step === 1 && !selectedVehicleId) ||
              (step === 2 && !selectedServiceType) ||
              (step === 3 && (!selectedDate || !selectedTime))
            }
            className="flex-1 py-3.5 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:shadow-none"
          >
            Devam Et
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !acceptTerms}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {submitting ? "Gönderiliyor..." : "Randevuyu Onayla"}
          </button>
        )}
      </div>
    </main>
  );
}
