"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Car, Phone, Hash, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { customerLoginSchema, type CustomerLoginInput } from "@/lib/validations/auth";
import { loginCustomer } from "@/lib/actions/auth.actions";

export default function MusteriGirisPage() {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: { plate: "", phone: "", rememberMe: true },
  });

  const onSubmit = async (data: CustomerLoginInput) => {
    setErrorInfo(null);
    try {
      const result = await loginCustomer(data);
      if (result && result.error) {
        setErrorInfo(result.error);
      } else if (result && result.success) {
        // Successful login! Redirect to muster panel
        window.location.href = "/m/musteri/panel";
      }
    } catch (e) {
      console.error(e);
      setErrorInfo("Bağlantı hatası. Lütfen daha sonra tekrar deneyiniz.");
    }
  };

  return (
    <div className="min-h-screen flex" id="customer-login-page">
      {/* Left - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl text-primary" />

        <div className="relative text-center text-white px-12 max-w-lg z-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/10 backdrop-blur-md mb-8 border border-white/20 shadow-2xl">
            <ShieldCheck className="h-16 w-16 text-tertiary-fixed" />
          </div>
          <h2 className="text-4xl font-extrabold mb-5 tracking-tight">
            Aracınız Güvende
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
            Servisimizdeki aracınızın durumunu, onarım aşamalarını ve maliyetleri anlık olarak Müşteri Portalından takip edebilirsiniz.
          </p>
        </div>
      </div>

      {/* Right - Form (Full width on mobile) */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-surface">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 group lg:hidden justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <Car className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">
              MS Oto Servis
            </span>
          </div>

          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">Müşteri Portalı</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Araç Takibi
            </h1>
            <p className="text-on-surface-variant">
              Aracınızın durumunu görmek için bilgilerinizi girin. Şifreye gerek yok!
            </p>
          </div>

          {errorInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-8 text-sm text-error bg-error-container/50 rounded-2xl flex items-start gap-3 border border-error/20"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorInfo}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Plate Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-plate"
                className="block text-sm font-bold text-on-surface"
              >
                Araç Plakası
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-600 rounded-l-xl flex items-center justify-center border border-blue-600 z-10">
                  <span className="text-white font-bold text-xs">TR</span>
                </div>
                <input
                  type="text"
                  id="login-plate"
                  placeholder="34 ABC 123"
                  className={`w-full pl-16 pr-4 py-3.5 rounded-xl border bg-white text-on-surface placeholder:text-outline-variant font-bold text-lg uppercase transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.plate ? 'border-error/50 focus:border-error' : 'border-outline-variant/40 focus:border-primary hover:border-outline'}`}
                  {...register("plate")}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </div>
              {errors.plate && (
                <p className="text-error text-xs font-medium ml-1">{errors.plate.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 pt-2">
              <label
                htmlFor="login-phone"
                className="block text-sm font-bold text-on-surface"
              >
                Kayıtlı Cep Telefonu
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline transition-colors group-focus-within:text-primary" />
                <input
                  type="tel"
                  id="login-phone"
                  placeholder="05XX XXX XX XX"
                  {...register("phone")}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white text-on-surface placeholder:text-outline-variant font-medium text-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.phone ? 'border-error/50 focus:border-error' : 'border-outline-variant/40 focus:border-primary hover:border-outline'}`}
                />
              </div>
              <p className="text-xs text-on-surface-variant ml-1 mt-1 font-medium">Başında sıfır (0) ile veya olmadan girebilirsiniz.</p>
              {errors.phone && (
                <p className="text-error text-xs font-medium ml-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 w-full mt-10 py-4 text-base font-bold tracking-wide text-white bg-primary rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? "Sorgulanıyor..." : "Aracımı Bul ve Giriş Yap"}
              {!isSubmitting && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors inline-block"
            >
              Firma veya Usta girişi yapmak için tıklayın
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
