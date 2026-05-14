"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  completeOnboardingStep1,
  completeOnboardingStep2,
  completeOnboardingStep3,
  completeOnboarding,
} from "@/lib/actions/onboarding.actions";

interface OnboardingWizardProps {
  initialStep: number;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
}

const STEPS = [
  { label: "Firma Bilgileri", icon: "business" },
  { label: "Logo & Tema", icon: "palette" },
  { label: "Hizmetler", icon: "build" },
  { label: "Tamamla", icon: "check_circle" },
];

const SERVICE_TYPE_OPTIONS = [
  "Genel Bakım & Onarım",
  "Motor Tamiri",
  "Boya & Kaporta",
  "Yağ Değişimi",
  "Fren Sistemi",
  "Lastik Hizmetleri",
  "Elektrik & Elektronik",
  "Klima Bakımı",
  "Egzoz Sistemi",
  "Şanzıman Tamiri",
  "Triger Seti Değişimi",
  "Ön Düzen Ayarı",
];

export default function OnboardingWizardClient({
  initialStep,
  tenantName = "",
  tenantEmail = "",
  tenantPhone = "",
}: OnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(Math.max(0, Math.min(initialStep, 3)));
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [s1, setS1] = useState({
    name: tenantName,
    phone: tenantPhone,
    email: tenantEmail,
    taxNumber: "",
    taxOffice: "",
    address: "",
    city: "",
  });

  // Step 2 fields
  const [s2, setS2] = useState({ logoUrl: "", slogan: "", theme: "system" });

  // Step 3 fields
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [s3, setS3] = useState({
    weekdays: "08:30 - 18:30",
    saturday: "09:00 - 15:00",
    sunday: "Kapalı",
  });

  function handleNext() {
    setError(null);
    startTransition(async () => {
      try {
        if (step === 0) {
          if (!s1.name.trim()) {
            setError("Firma adı zorunludur.");
            return;
          }
          const res = await completeOnboardingStep1(s1);
          if (res.error) { setError(res.error); return; }
        } else if (step === 1) {
          const res = await completeOnboardingStep2(s2);
          if (res.error) { setError(res.error); return; }
        } else if (step === 2) {
          const res = await completeOnboardingStep3({
            serviceTypes: selectedServices,
            openingHoursWeekdays: s3.weekdays,
            openingHoursSaturday: s3.saturday,
            openingHoursSunday: s3.sunday,
          });
          if (res.error) { setError(res.error); return; }
        } else if (step === 3) {
          const res = await completeOnboarding();
          if (res.error) { setError(res.error); return; }
          router.push("/dashboard");
          return;
        }
        setStep((prev) => Math.min(prev + 1, 3));
      } catch {
        setError("Beklenmeyen bir hata oluştu.");
      }
    });
  }

  function handleBack() {
    if (step > 0) setStep((prev) => prev - 1);
  }

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            Kurulum Sihirbazı
          </div>
          <h1 className="text-3xl font-black text-on-surface">Hoş Geldiniz!</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Birkaç adımda firmanızı hazırlayalım. Tüm ayarlar sonradan değiştirilebilir.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  i === step
                    ? "bg-primary text-on-primary shadow-md"
                    : i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: i <= step ? "'FILL' 1" : "" }}
                >
                  {i < step ? "check_circle" : s.icon}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full ${i < step ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          {/* Step 0: Firma Bilgileri */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Firma Bilgileri</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Temel firma bilgilerinizi girin</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Firma Adı *</label>
                  <input
                    type="text"
                    value={s1.name}
                    onChange={(e) => setS1({ ...s1, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Örn: Yıldız Oto Servis"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Telefon</label>
                  <input type="tel" value={s1.phone} onChange={(e) => setS1({ ...s1, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0 (5XX) XXX XX XX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">E-posta</label>
                  <input type="email" value={s1.email} onChange={(e) => setS1({ ...s1, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="info@firmaadi.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Vergi No</label>
                  <input type="text" value={s1.taxNumber} onChange={(e) => setS1({ ...s1, taxNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="12345678901" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Vergi Dairesi</label>
                  <input type="text" value={s1.taxOffice} onChange={(e) => setS1({ ...s1, taxOffice: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Merkez VD" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Şehir</label>
                  <input type="text" value={s1.city} onChange={(e) => setS1({ ...s1, city: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="İstanbul" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Adres</label>
                  <textarea value={s1.address} onChange={(e) => setS1({ ...s1, address: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-16" placeholder="Açık adres..." />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Logo & Tema */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-secondary-fixed/50 rounded-xl">
                  <span className="material-symbols-outlined text-on-secondary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Logo & Tema</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Markanızı özelleştirin</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Logo URL (Opsiyonel)</label>
                <input type="url" value={s2.logoUrl} onChange={(e) => setS2({ ...s2, logoUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="https://... (.png, .jpg)" />
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Logo yüklemek için Ayarlar sayfasını da kullanabilirsiniz.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Slogan</label>
                <input type="text" value={s2.slogan} onChange={(e) => setS2({ ...s2, slogan: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Güvenilir Servis, Kaliteli Hizmet" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Tema Tercihi</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: "Açık", icon: "light_mode" },
                    { value: "dark", label: "Koyu", icon: "dark_mode" },
                    { value: "system", label: "Sistem", icon: "settings_suggest" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setS2({ ...s2, theme: opt.value })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        s2.theme === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {opt.icon}
                      </span>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hizmetler */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-tertiary-fixed/30 rounded-xl">
                  <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">Hizmetler & Çalışma Saatleri</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Sunduğunuz hizmetleri belirleyin</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Hizmet Türleri</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SERVICE_TYPE_OPTIONS.map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedServices.includes(service)
                          ? "border-primary bg-primary/5 text-primary font-bold"
                          : "border-slate-100 text-slate-500 hover:border-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px] mr-1.5 align-middle" style={{ fontVariationSettings: selectedServices.includes(service) ? "'FILL' 1" : "" }}>
                        {selectedServices.includes(service) ? "check_box" : "check_box_outline_blank"}
                      </span>
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">Çalışma Saatleri</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">Hafta İçi</label>
                    <input type="text" value={s3.weekdays} onChange={(e) => setS3({ ...s3, weekdays: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">Cumartesi</label>
                    <input type="text" value={s3.saturday} onChange={(e) => setS3({ ...s3, saturday: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">Pazar</label>
                    <input type="text" value={s3.sunday} onChange={(e) => setS3({ ...s3, sunday: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tamamla */}
          {step === 3 && (
            <div className="py-4 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                </div>
                <h2 className="text-2xl font-black text-on-surface mb-2">Temel Kurulum Tamamlandı!</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                  Firmanız yapılandırıldı. Aşağıdaki entegrasyonları tamamlayarak platformu tam kapasiteyle kullanabilirsiniz.
                </p>
              </div>

              {/* Sonraki Adımlar */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Önerilen Sonraki Adımlar</p>
                <Link href="/dashboard/settings/notifications" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>sms</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slate-800 dark:text-gray-200 text-sm">SMS & WhatsApp Kanalı Kur</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">NetGSM, İleti Merkezi veya Twilio bağlayın</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">arrow_forward</span>
                </Link>

                <Link href="/dashboard/settings#payment" className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slate-800 dark:text-gray-200 text-sm">Ödeme Sağlayıcısı Ekle</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">iyzico veya PayTR ile online ödeme alın</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">arrow_forward</span>
                </Link>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Hemen Başla</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard/services" className="bg-primary/5 hover:bg-primary/10 p-4 rounded-2xl transition-colors text-center group">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Servis Emri Aç</p>
                  </Link>
                  <Link href="/dashboard/customers" className="bg-primary/5 hover:bg-primary/10 p-4 rounded-2xl transition-colors text-center group">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>people</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Müşteri Ekle</p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-gray-700">
            {step > 0 ? (
              <button
                onClick={handleBack}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-500 text-sm font-bold hover:text-slate-700 dark:text-gray-300 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Geri
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={isPending}
              className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Kaydediliyor...
                </>
              ) : step === 3 ? (
                <>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Dashboard&apos;a Git
                </>
              ) : (
                <>
                  Devam Et
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip Button */}
        {step < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                startTransition(async () => {
                  await completeOnboarding();
                  router.push("/dashboard");
                });
              }}
              disabled={isPending}
              className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-400 font-medium transition-colors"
            >
              Atla, sonra tamamlarım →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
