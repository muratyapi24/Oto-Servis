"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Phone, ShieldCheck, AlertCircle, ArrowRight, RefreshCw, KeyRound } from "lucide-react";
import { sendCustomerOTP, verifyCustomerOTP } from "@/lib/actions/auth.actions";

export default function MusteriGirisPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [plate, setPlate] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  function startResendTimer() {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim() || !phone.trim()) return;

    // Plaka formatı doğrulaması (Boşlukları kaldırarak kontrol et)
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();
    const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])[A-ZÇĞIİÖŞÜ]{1,3}\d{2,4}$/;
    if (!plateRegex.test(cleanPlate)) {
      setError("Geçersiz plaka formatı. Lütfen geçerli bir Türkiye plakası girin (Örn: 34ABC123).");
      return;
    }

    // Telefon formatı doğrulaması (Başında 0 veya 0 olmadan, toplam 10 veya 11 hane, 5 ile başlamalı)
    const cleanPhone = phone.replace(/\s+/g, '');
    const phoneRegex = /^(05|5)[0-9]{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Geçersiz telefon numarası. Lütfen 10 veya 11 haneli geçerli bir numara girin (Örn: 05321234567).");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await sendCustomerOTP(plate, phone);
      if (result.error) {
        setError(result.error);
      } else {
        setStep("otp");
        startResendTimer();
      }
    } catch {
      setError("Bağlantı hatası. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await verifyCustomerOTP(plate, phone, otp);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        window.location.href = "/m/musteri/panel";
      }
    } catch {
      setError("Bağlantı hatası. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const result = await sendCustomerOTP(plate, phone);
      if (result.error) {
        setError(result.error);
      } else {
        startResendTimer();
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" id="customer-login-page">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: "32px 32px", width: "100%", height: "100%" }} />
        </div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl" />
        <div className="relative text-center text-white px-12 max-w-lg z-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/10 backdrop-blur-md mb-8 border border-white/20 shadow-2xl">
            <ShieldCheck className="h-16 w-16 text-tertiary-fixed" />
          </div>
          <h2 className="text-4xl font-extrabold mb-5 tracking-tight">Aracınız Güvende</h2>
          <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
            Servisimizdeki aracınızın durumunu, onarım aşamalarını ve maliyetleri anlık olarak Müşteri Portalından takip edebilirsiniz.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-surface">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <Car className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">MS Oto Servis</span>
          </div>

          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">Müşteri Portalı</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              {step === "form" ? "Araç Takibi" : "Kod Doğrulama"}
            </h1>
            <p className="text-on-surface-variant">
              {step === "form"
                ? "Aracınızın durumunu görmek için bilgilerinizi girin. Şifreye gerek yok!"
                : `Telefon numaranıza gönderilen 6 haneli kodu girin.`}
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-error bg-error-container/50 rounded-2xl flex items-start gap-3 border border-error/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <>
            {step === "form" ? (
              <form
                key="form"
                className="space-y-5"
                onSubmit={handleSendOTP}
              >
                {/* Plate */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-on-surface">Araç Plakası</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-600 rounded-l-xl flex items-center justify-center z-10">
                      <span className="text-white font-bold text-xs">TR</span>
                    </div>
                    <input
                      type="text"
                      placeholder="34 ABC 123"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className="w-full pl-16 pr-4 py-3.5 rounded-xl border border-outline-variant/40 bg-white text-on-surface placeholder:text-outline-variant font-bold text-lg uppercase focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-sm font-bold text-on-surface">Kayıtlı Cep Telefonu</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-outline-variant/40 bg-white text-on-surface placeholder:text-outline-variant font-medium text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                      required
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant ml-1">Başında sıfır (0) ile veya olmadan girebilirsiniz.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex items-center justify-center gap-2 w-full mt-10 py-4 text-base font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {loading ? "Kontrol ediliyor..." : "SMS Kodu Gönder"}
                  {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
            ) : (
              <form
                key="otp"
                className="space-y-5"
                onSubmit={handleVerifyOTP}
              >
                {/* OTP info badge */}
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15">
                  <KeyRound className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm text-on-surface-variant">
                    <strong>{phone}</strong> numarasına 6 haneli kod gönderildi.
                  </span>
                </div>

                {/* OTP input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-on-surface">Doğrulama Kodu</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[0.5em] py-4 text-2xl font-bold rounded-xl border border-outline-variant/40 bg-white text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="group flex items-center justify-center gap-2 w-full py-4 text-base font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {loading ? "Doğrulanıyor..." : "Doğrula ve Giriş Yap"}
                  {!loading && <ShieldCheck className="h-5 w-5" />}
                </button>

                {/* Resend + back */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep("form"); setOtp(""); setError(null); }}
                    className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    ← Geri dön
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {resendCountdown > 0 ? `Tekrar gönder (${resendCountdown}s)` : "Tekrar gönder"}
                  </button>
                </div>
              </form>
            )}
          </>

          <div className="mt-12 text-center">
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors inline-block">
              Firma veya Usta girişi yapmak için tıklayın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
