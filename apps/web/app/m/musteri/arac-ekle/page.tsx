"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Constants ──────────────────────────────────────────────────────────────
const POPULAR_BRANDS = [
  "Audi", "BMW", "Chevrolet", "Citroën", "Dacia", "Fiat", "Ford", "Honda",
  "Hyundai", "Kia", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Renault",
  "Seat", "Škoda", "Toyota", "Volkswagen", "Volvo",
];

const FUEL_TYPES = [
  { id: "Benzin", icon: "local_gas_station" },
  { id: "Dizel", icon: "oil_barrel" },
  { id: "LPG", icon: "propane" },
  { id: "Hibrit", icon: "eco" },
  { id: "Elektrik", icon: "bolt" },
];

const TRANSMISSION_TYPES = [
  { id: "Manuel", icon: "settings" },
  { id: "Otomatik", icon: "auto_mode" },
  { id: "Yarı Otomatik", icon: "tune" },
];

const STEPS = [
  { label: "Bilgiler", icon: "edit_note" },
  { label: "Belgeler", icon: "description" },
  { label: "Onay", icon: "check_circle" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9\s]/g, "").slice(0, 12);
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function YeniAracEklePage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Bilgiler
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">(currentYear);
  const [mileage, setMileage] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [color, setColor] = useState("");

  // Step 2: Belgeler
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Navigation ───────────────────────────────────────────────────────────
  function nextStep() {
    setError(null);
    if (step === 1) {
      if (!plate.trim()) { setError("Plaka numarası zorunludur."); return; }
      if (!brand) { setError("Marka seçimi zorunludur."); return; }
      if (!model.trim()) { setError("Model girilmelidir."); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  // ─── File Handling ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Sadece .jpg, .png veya .pdf dosyalar kabul edilir.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya boyutu 5MB'den küçük olmalıdır.");
      return;
    }

    setError(null);
    setDocFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocPreview(null);
    }
  }

  function removeDoc() {
    setDocFile(null);
    setDocPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("plate", plate.trim());
      formData.append("brand", brand);
      formData.append("model", model.trim());
      if (year) formData.append("year", year.toString());
      if (mileage) formData.append("mileage", mileage);
      if (fuelType) formData.append("fuelType", fuelType);
      if (transmission) formData.append("transmission", transmission);
      if (color) formData.append("color", color.trim());
      if (docFile) formData.append("document", docFile);

      const res = await fetch("/api/musteri/arac", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Araç kaydedilemedi.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading spinner (not needed since no initial data fetch) ─────────

  // ─── Success State ────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="px-5 pt-6 pb-32 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-[bounceIn_0.6s_ease-out]">
            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/30 animate-ping" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          Aracınız Başarıyla Kaydedildi!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-2">
          Araç bilgileriniz sisteme eklendi. Servis geçmişi otomatik olarak takip edilecektir.
        </p>

        {/* Summary mini card */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mt-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span className="font-bold">{plate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>{brand} {model} {year ? `• ${year}` : ""}</span>
          </div>
          {mileage && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">speed</span>
              <span>{parseInt(mileage).toLocaleString("tr-TR")} km</span>
            </div>
          )}
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
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Yeni Araç Ekle</h1>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Adım {step}/3 — {STEPS[step - 1]?.label || ''}</p>
        </div>
      </div>

      {/* ─── Step Indicator ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5">
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
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
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
           STEP 1: BİLGİLER
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          {/* Plaka */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">badge</span> Plaka No *
            </label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(formatPlate(e.target.value))}
              placeholder="34 ABC 123"
              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400 uppercase tracking-wider"
            />
            <p className="text-[10px] text-slate-400">Boşluksuz veya boşluklu girilebilir.</p>
          </div>

          {/* Marka */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">directions_car</span> Marka *
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
            >
              <option value="">Marka seçin...</option>
              {POPULAR_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Model */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">label</span> Model *
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Örn: Focus, C200d, Passat..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400"
            />
          </div>

          {/* Yıl + Kilometre (yan yana) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Model Yılı</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
              >
                <option value="">Seçin</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kilometre</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="42500"
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Yakıt Tipi */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Yakıt Tipi</label>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((ft) => {
                const isSelected = fuelType === ft.id;
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setFuelType(ft.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25"
                        : "bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{ft.icon}</span>
                    {ft.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vites Tipi */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vites Tipi</label>
            <div className="flex flex-wrap gap-2">
              {TRANSMISSION_TYPES.map((tt) => {
                const isSelected = transmission === tt.id;
                return (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => setTransmission(tt.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25"
                        : "bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{tt.icon}</span>
                    {tt.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Renk */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">palette</span> Renk
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Örn: Siyah, Beyaz, Gri..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400"
            />
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/15 rounded-2xl p-4 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-lg">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Güvencemiz</p>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/70 mt-0.5 leading-relaxed">
                Girdiğiniz veriler servis geçmişiyle senkronize edilerek aracın değerini korumanıza yardımcı olur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 2: BELGELER
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Ruhsat ve Belgeler</h2>
            <p className="text-xs text-slate-400">Aracın ruhsat bilgilerini otomatik tanımlamak için fotoğrafını çekin.</p>
          </div>

          {/* Upload Zone */}
          {!docFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200 active:scale-[0.98] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-500 transition-colors">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Ruhsat Fotoğrafı Yükle</p>
                <p className="text-[11px] text-slate-400 mt-1">veya kameradan çekin</p>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                .jpg, .png veya .pdf — Maks. 5MB
              </span>
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Dosya yüklendi
                </p>
                <button
                  type="button"
                  onClick={removeDoc}
                  className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:text-red-600"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  Kaldır
                </button>
              </div>

              {/* Preview */}
              {docPreview ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={docPreview} alt="Ruhsat" className="w-full object-contain max-h-48" />
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{docFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(docFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Guide Note */}
          <div className="bg-amber-50 dark:bg-amber-900/15 rounded-2xl p-3 flex gap-2.5 items-start">
            <span className="material-symbols-outlined text-amber-500 text-lg shrink-0 mt-0.5">tips_and_updates</span>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
              Ruhsatın ön yüzünü net bir şekilde çekin. Yazıların okunabilir olduğundan emin olun.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
           STEP 3: ONAY
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-emerald-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Harika Gözüküyor!</h2>
            <p className="text-xs text-slate-400 mt-1">Araç bilgilerini son kez kontrol edin.</p>
          </div>

          {/* Plaka Badge */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-4 flex items-center justify-center">
            <p className="text-xl font-extrabold text-white tracking-[0.15em]">{plate}</p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Marka" value={brand} icon="directions_car" />
            <InfoCard label="Model" value={model} icon="label" />
            <InfoCard label="Yıl" value={year ? year.toString() : "—"} icon="calendar_month" />
            <InfoCard label="Kilometre" value={mileage ? `${parseInt(mileage).toLocaleString("tr-TR")} km` : "—"} icon="speed" />
            <InfoCard label="Yakıt Tipi" value={fuelType || "—"} icon="local_gas_station" />
            <InfoCard label="Vites" value={transmission || "—"} icon="settings" />
          </div>

          {color && (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-lg">palette</span>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Renk</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{color}</p>
              </div>
            </div>
          )}

          {/* Document thumbnail */}
          {docFile && (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-3 flex items-center gap-3">
              {docPreview ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  <img src={docPreview} alt="Ruhsat" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Ruhsat Belgesi</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{docFile.name}</p>
              </div>
              <span className="material-symbols-outlined text-emerald-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          )}

          {/* Service Reminder Info */}
          <div className="bg-violet-50 dark:bg-violet-900/15 rounded-2xl p-4 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-800/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-violet-600 text-lg">notifications_active</span>
            </div>
            <div>
              <p className="text-xs font-bold text-violet-700 dark:text-violet-400">Servis Hatırlatıcı</p>
              <p className="text-[11px] text-violet-600/80 dark:text-violet-400/70 mt-0.5 leading-relaxed">
                Bu aracı eklediğinizde, km verisine dayanarak bir sonraki periyodik bakım zamanını otomatik hesaplayacağız.
              </p>
            </div>
          </div>
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

        {step === 2 && !docFile && (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
          >
            Adımı Atla
            <span className="material-symbols-outlined text-sm">skip_next</span>
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={step === 1 && (!plate.trim() || !brand || !model.trim())}
            className="flex-1 py-3.5 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:shadow-none"
          >
            Devam Et
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {submitting ? "Kaydediliyor..." : "Aracı Kaydet"}
          </button>
        )}
      </div>
    </main>
  );
}

// ─── Info Card Component ────────────────────────────────────────────────────
function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-slate-400 text-xs">{icon}</span>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
