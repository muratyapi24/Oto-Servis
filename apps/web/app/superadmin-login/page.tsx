"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { superAdminLogin } from "@/lib/actions/auth.actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SuperAdminLoginPage() {
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
      const result = await superAdminLogin(data);
      if (result && result.error) {
        setErrorInfo(result.error);
      } else if (result && result.success) {
         // Kökten çözüm: CSR Router'ı by-pass ederek donmaları engeller, temiz cookie çeker.
         window.location.href = "/super-admin";
      }
    } catch (e) {
      console.error(e);
      setErrorInfo("Bağlantı hatası. Lütfen sayfayı yenileyerek tekrar deneyiniz.");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950" id="admin-login-page">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Centered Form for Super Admin */}
      <div className="w-full flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Visuals */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 text-white shadow-lg mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sistem Yönetimi
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Yalnızca Kurucu Girişine İzin Verilir
            </p>
          </div>

          {errorInfo && (
            <div className="p-4 mb-6 text-sm text-red-200 bg-red-950/50 rounded-xl flex items-start gap-3 border border-red-900/50">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{errorInfo}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Yönetici E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@sistem.com"
                  {...register("email")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-950/50 text-white placeholder:text-slate-600 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-800'}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Güvenlik Anahtarı
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-slate-950/50 text-white placeholder:text-slate-600 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-800'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center justify-center gap-2 w-full mt-8 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50 transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Doğrulanıyor..." : "Sisteme Eriş"}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              Firma paneline geri dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
