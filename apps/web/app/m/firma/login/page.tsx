"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Lock, Mail, ArrowRight, AlertCircle, Wrench } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser } from "@/lib/actions/auth.actions";

export default function FirmaGirisPage() {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorInfo(null);
    try {
      const result = await loginUser(data);
      if (result && result.error) {
        setErrorInfo(result.error);
      } else if (result && result.success) {
        // Successful login! Redirect to firma panel
        window.location.href = "/m/firma/panel";
      }
    } catch (e) {
      console.error(e);
      setErrorInfo("Bağlantı hatası. Lütfen daha sonra tekrar deneyiniz.");
    }
  };

  return (
    <div className="min-h-screen flex" id="firma-login-page">
      {/* Left - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-primary-dark to-primary relative overflow-hidden">
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
            <Wrench className="h-16 w-16 text-tertiary-fixed" />
          </div>
          <h2 className="text-4xl font-extrabold mb-5 tracking-tight">
            Servis Yönetimi
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed font-medium">
            Tüm iş emirlerini, araç kabullerini ve finansal işlemleri Mobil Firma Portalı üzerinden kolayca yönetin.
          </p>
        </div>
      </div>

      {/* Right - Form (Full width on mobile) */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-surface">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 group justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <Settings className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight">
              BST Yönetici Portalı
            </span>
          </div>

          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">Yetkili Girişi</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Hoş Geldiniz
            </h1>
            <p className="text-on-surface-variant">
              Firma işlemlerine erişmek için bilgilerinizi giriniz.
            </p>
          </div>

          {errorInfo && (
            <div className="p-4 mb-8 text-sm text-error bg-error-container/50 rounded-2xl flex items-start gap-3 border border-error/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorInfo}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-bold text-on-surface"
              >
                E-posta veya Kullanıcı Adı
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline transition-colors group-focus-within:text-primary z-10" />
                <input
                  type="email"
                  id="login-email"
                  placeholder="ornek@servis.com"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-white text-on-surface placeholder:text-outline-variant font-medium text-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.email ? 'border-error/50 focus:border-error' : 'border-outline-variant/40 focus:border-primary hover:border-outline'}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-error text-xs font-medium ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5 pt-2">
              <label
                htmlFor="login-password"
                className="block text-sm font-bold text-on-surface"
              >
                Şifre
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline transition-colors group-focus-within:text-primary z-10" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border bg-white text-on-surface placeholder:text-outline-variant font-medium text-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.password ? 'border-error/50 focus:border-error' : 'border-outline-variant/40 focus:border-primary hover:border-outline'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none z-10"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs font-medium ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">Beni Hatırla</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 w-full mt-10 py-4 text-base font-bold tracking-wide text-white bg-primary rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              {!isSubmitting && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-12 text-center">
            <Link
              href="/m/musteri/login"
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors inline-block"
            >
              Müşteri olarak aracınızı takip etmek için tıklayın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
