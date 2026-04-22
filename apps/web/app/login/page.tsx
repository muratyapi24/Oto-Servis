"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser } from "@/lib/actions/auth.actions";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorInfo(null);
    try {
      const result = await loginUser(data);
      if (result && result.error) {
        setErrorInfo(result.error);
      } else if (result && result.success) {
        if (result.role === "SUPER_ADMIN") {
          setErrorInfo("Yetkisiz giriş. Lütfen Sistem Yönetimi sayfasını kullanın.");
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (e) {
      console.error(e);
      setErrorInfo("Bağlantı hatası. Lütfen sayfayı yenileyerek tekrar deneyiniz.");
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-surface to-surface-variant pt-20 pb-20">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-blue-400/5 blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md px-6"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/5 p-8 md:p-10 border border-white/50">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">lock_open</span>
              </div>
              <h1 className="text-3xl font-black text-on-surface tracking-tighter mb-2">Hoş Geldiniz</h1>
              <p className="text-on-surface-variant font-medium">Servis yönetim panelinize erişmek için giriş yapın.</p>
            </div>

            {errorInfo && (
              <div className="p-4 mb-6 text-sm text-error bg-error/10 rounded-xl flex items-center gap-2 border border-error/20">
                <AlertCircle className="h-5 w-5" />
                {errorInfo}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="email">
                  E-posta veya Kullanıcı Adı
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">person</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="ornek@servis.com"
                    {...register("email")}
                    className={`w-full bg-surface-container-lowest border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-on-surface ${errors.email ? 'border-error focus:ring-error focus:border-error' : 'border-outline-variant/30'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="password">
                  Şifre
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none">lock</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                {errors.password && (
                  <p className="text-error text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer bg-white"
                  />
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">Beni Hatırla</span>
                </label>
                <Link className="text-sm font-bold text-primary hover:text-primary/80 transition-colors" href="/forgot-password">
                  Şifremi Unuttum
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-xl shadow-xl shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
              <p className="text-on-surface-variant text-sm">
                Henüz bir hesabınız yok mu?{" "}
                <Link className="text-primary font-bold hover:underline" href="/register">
                  Hemen Ücretsiz Deneyin
                </Link>
              </p>
            </div>
          </div>
          
          <p className="mt-8 text-center text-slate-500 text-xs font-medium tracking-widest uppercase">
            Güvenli Giriş • SSL Korumalı
          </p>
        </motion.div>
      </main>

      <LandingFooter />
    </div>
  );
}
