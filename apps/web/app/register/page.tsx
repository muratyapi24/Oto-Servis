"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerTenant } from "@/lib/actions/auth.actions";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      phone: "",
      password: "",
      acceptTerms: false,
    },
  });

  const nextStep = async () => {
    const fieldsToValidate: (keyof RegisterInput)[] = ["firstName", "lastName", "companyName"];
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(2);
  };

  const prevStep = () => setStep(1);

  const onSubmit = async (data: RegisterInput) => {
    setErrorInfo(null);
    setSuccessInfo(null);

    const result = await registerTenant(data);

    if (result.error) {
      setErrorInfo(result.error);
    } else if (result.success) {
      setSuccessInfo(result.success);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-surface to-surface-variant pt-24 pb-20">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-orange-400/5 blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-lg px-6"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/5 p-8 md:p-10 border border-white/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">rocket_launch</span>
              </div>
              <h1 className="text-3xl font-black text-on-surface tracking-tighter mb-2">Hesap Oluştur</h1>
              <p className="text-on-surface-variant font-medium flex items-center justify-center gap-2">
                Hemen ücretsiz denemeye başlayın.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-primary' : 'bg-surface-dim'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-surface-dim'}`} />
            </div>

            {errorInfo && (
              <div className="p-4 mb-6 text-sm text-error bg-error/10 rounded-xl flex items-center gap-2 border border-error/20">
                <AlertCircle className="h-5 w-5" />
                {errorInfo}
              </div>
            )}
            {successInfo && (
              <div className="p-4 mb-6 text-sm text-secondary bg-secondary-fixed/50 rounded-xl flex items-center gap-2 border border-secondary/20">
                <CheckCircle2 className="h-5 w-5" />
                {successInfo}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="firstName">Adınız</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">badge</span>
                          <input
                            id="firstName"
                            type="text"
                            placeholder="Ahmet"
                            {...register("firstName")}
                            className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.firstName ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                          />
                        </div>
                        {errors.firstName && <p className="text-error text-xs mt-1.5">{errors.firstName.message}</p>}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="lastName">Soyadınız</label>
                        <div className="relative">
                           <input
                              id="lastName"
                              type="text"
                              placeholder="Yılmaz"
                              {...register("lastName")}
                              className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.lastName ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                            />
                        </div>
                        {errors.lastName && <p className="text-error text-xs mt-1.5">{errors.lastName.message}</p>}
                      </div>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="companyName">Firma Adı</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">store</span>
                        <input
                          id="companyName"
                          type="text"
                          placeholder="Yılmaz Oto Servis Ltd. Şti."
                          {...register("companyName")}
                          className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.companyName ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                        />
                      </div>
                      {errors.companyName && <p className="text-error text-xs mt-1.5">{errors.companyName.message}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full mt-8 bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-xl shadow-xl shadow-primary/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
                    >
                      Sonraki Adım
                      <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="email">E-posta Adresi</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">mail</span>
                        <input
                          id="email"
                          type="email"
                          placeholder="ornek@sirket.com"
                          {...register("email")}
                          className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.email ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                        />
                      </div>
                      {errors.email && <p className="text-error text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="phone">Telefon Numarası</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm font-bold border-r border-outline-variant/30 pr-3">+90</span>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="5XX XXX XX XX"
                          {...register("phone")}
                          className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-16 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.phone ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                        />
                      </div>
                      {errors.phone && <p className="text-error text-xs mt-1.5">{errors.phone.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="password">Şifre</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">lock</span>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="En az 8 karakter"
                          {...register("password")}
                          className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.password ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                        />
                        <button
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                           <span className="material-symbols-outlined text-xl">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {errors.password && <p className="text-error text-xs mt-1.5">{errors.password.message}</p>}
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        {...register("acceptTerms")}
                        className="mt-1 h-5 w-5 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer bg-white"
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-on-surface-variant leading-tight cursor-pointer">
                        <Link href="/terms" className="text-primary hover:underline font-bold">Hizmet Sözleşmesi</Link>'ni ve 
                        <Link href="/privacy" className="text-primary hover:underline font-bold"> Gizlilik Politikası</Link>'nı okudum, kabul ediyorum.
                      </label>
                    </div>
                    {errors.acceptTerms && <p className="text-error text-xs mt-1.5">{errors.acceptTerms.message}</p>}

                    <div className="flex gap-4 mt-8">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center justify-center w-14 py-3.5 rounded-xl border-2 border-outline-variant/30 text-on-surface hover:bg-surface-dim transition-colors"
                      >
                         <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !!successInfo}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-xl shadow-xl shadow-primary/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmitting ? "Hesap Oluşturuluyor..." : successInfo ? "Oluşturuldu!" : "Kayıt Ol"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
              <p className="text-on-surface-variant text-sm">
                Zaten hesabınız var mı?{" "}
                <Link className="text-primary font-bold hover:underline" href="/login">
                  Giriş Yapın
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-500 text-xs font-medium tracking-widest uppercase mb-10">
            Güvenli İşlem • SSL Korumalı
          </p>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
