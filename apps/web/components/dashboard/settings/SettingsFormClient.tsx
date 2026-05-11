"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTenantSchema, UpdateTenantInput } from "@/lib/validations/tenant";
import { updateTenantProfile } from "@/lib/actions/tenant.actions";
import {
  Building2,
  MapPin,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Users,
  Clock,
  Wrench,
  BellRing,
  CheckCircle,
  CreditCard,
  Zap,
} from "lucide-react";
import PaymentProviderSection from "./PaymentProviderSection";

interface SettingsFormClientProps {
  initialData?: SettingsFormInitialData | null;
  metrics?: {
    staffCount: number;
    monthlyVolume: number;
    approvedItems: number;
    rating: number;
  };
}

type TenantSettings = NonNullable<UpdateTenantInput["settings"]> & {
  paymentProvider?: string | null;
  paymentApiKey?: string | null;
  paymentSecretKey?: string | null;
  paymentMerchantId?: string | null;
};

type SettingsFormInitialData = Partial<Omit<UpdateTenantInput, "settings">> & {
  settings?: Partial<TenantSettings> | null;
};

export default function SettingsFormClient({ initialData, metrics }: SettingsFormClientProps) {
  const [isPending, setIsPending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const settings = initialData?.settings;
  const defaultSettings: Partial<TenantSettings> = typeof settings === 'object' && settings !== null 
    ? settings 
    : {};

  const { register, handleSubmit, control, formState: { errors } } = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: initialData?.name || "",
      taxNumber: initialData?.taxNumber || "",
      address: initialData?.address || "",
      settings: {
        logoUrl: defaultSettings.logoUrl || "",
        openingHours: {
          weekdays: defaultSettings.openingHours?.weekdays || "08:30 - 18:30",
          saturday: defaultSettings.openingHours?.saturday || "09:00 - 15:00",
          sunday: defaultSettings.openingHours?.sunday || "Kapalı"
        },
        serviceTypes: defaultSettings.serviceTypes?.length ? defaultSettings.serviceTypes : ["Periyodik Bakım", "Motor Tamiri"],
        notificationPreferences: {
          sms: defaultSettings.notificationPreferences?.sms ?? true,
          email: defaultSettings.notificationPreferences?.email ?? true,
          push: defaultSettings.notificationPreferences?.push ?? false,
        }
      }
    }
  });

  const onSubmit = async (data: UpdateTenantInput) => {
    setIsPending(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await updateTenantProfile(data);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.success || "Profil ayarları başarıyla kaydedildi.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Sistem hatası. Kaydedilemedi.");
    } finally {
      setIsPending(false);
    }
  };

  const currentMetrics = metrics || { staffCount: 12, monthlyVolume: 180, approvedItems: 4500, rating: 4.9 };

  return (
    <div className="flex-1 space-y-8 min-h-screen pb-12">
      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* Messages */}
        <div className="mb-6 space-y-3">
            {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-3 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
            </div>
            )}
            {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {successMsg}
            </div>
            )}
        </div>

        {/* Header Section with Asymmetry */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Ayarlar & Konfigürasyon</p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Firma Profili</h2>
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={() => window.location.reload()} className="px-6 py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50:bg-slate-800 transition-colors shadow-sm text-sm">İptal</button>
                <button type="submit" disabled={isPending} className="px-8 py-2.5 bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-700/20 hover:scale-[1.02] active:scale-95 transition-all outline-none text-sm min-w-[140px] flex items-center justify-center disabled:opacity-75">
                   {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
                </button>
            </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Business Details Card (Large) */}
            <div className="md:col-span-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 group">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                           <Building2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">İşletme Bilgileri</h3>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="relative group/logo">
                            <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kurumsal Logo Temsili</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                                <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center shadow-inner overflow-hidden relative">
                                    <ImageIcon className="text-slate-300 w-8 h-8 z-10" />
                                </div>
                                <div className="flex-1 w-full">
                                    <input 
                                       type="text" 
                                       {...register("settings.logoUrl")}
                                       className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium p-3" 
                                       placeholder="Resim linki giriniz (https://...)" 
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Bu versiyonda doğrudan resim URL adresi tutulmaktadır.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Resmi (Ticari) Unvan *</label>
                            <input 
                              type="text" 
                              {...register("name")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-bold p-3.5" 
                              placeholder="Firma Ticari İsmi..." 
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1 font-bold">{errors.name.message}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vergi No / TCKN</label>
                            <input 
                              type="text" 
                              {...register("taxNumber")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium p-3.5" 
                              placeholder="1234567890" 
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">İşletme Adresi</label>
                            <textarea 
                              rows={4} 
                              {...register("address")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm font-medium p-3.5 resize-none" 
                              placeholder="Fatura & İletişim açık adresi..."
                            ></textarea>
                        </div>
                        <div className="pt-2">
                            <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Lokasyon Önizlemesi</label>
                            <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative group/map border border-slate-200">
                                {/* Sembolik Harita Görseli, Static Image veya Iframe */}
                                <div className="absolute inset-0 bg-blue-100 flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #1e3a8a 0, #1e3a8a 3px, transparent 3px), radial-gradient(circle at 0 0, #1e3a8a 0, #1e3a8a 3px, transparent 3px), radial-gradient(circle at 100% 0, #1e3a8a 0, #1e3a8a 3px, transparent 3px), radial-gradient(circle at 0 100%, #1e3a8a 0, #1e3a8a 3px, transparent 3px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>
                                <div className="absolute inset-0 flex items-center justify-center text-blue-800 pointer-events-none">
                                   <MapPin className="w-8 h-8 drop-shadow-lg opacity-50 relative top-2" />
                                </div>
                                <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center opacity-0 group-hover/map:opacity-100 transition-opacity backdrop-blur-sm">
                                    <Link href="/dashboard/settings/locations" className="bg-white text-blue-800 px-4 py-1.5 text-xs font-bold rounded-full shadow-lg">
                                        Şubeleri Yönet
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Management Link (Small Callout) */}
            <div className="md:col-span-4 flex flex-col gap-6">
                <div className="bg-blue-800 p-8 rounded-3xl text-white flex flex-col justify-between h-full relative overflow-hidden group shadow-lg shadow-blue-800/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Users className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <Users className="w-8 h-8 mb-5" />
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Ekip Yönetimi</h3>
                        <p className="text-sm opacity-80 mb-6 leading-relaxed font-medium">Birim erişim seviyelerini yönetin, usta davetleri yollayın ve personel takibini düzenleyin.</p>
                    </div>
                    <Link href="/dashboard/mechanics" className="relative z-10 w-full bg-white text-blue-800 py-3.5 rounded-xl font-black flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 shadow-md text-sm">
                        Personel Listesine Git
                    </Link>
                </div>
            </div>

            {/* Opening Hours (Bento Item) */}
            <div className="md:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center space-x-3 mb-8">
                    <Clock className="w-6 h-6 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-800">Çalışma Saatleri</h3>
                </div>
                
                <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100:border-slate-700">
                        <span className="text-sm font-bold text-slate-700">Pzt - Cuma</span>
                        <input 
                           type="text" 
                           {...register("settings.openingHours.weekdays")}
                           className="text-xs bg-slate-100 border-none px-3 py-1.5 rounded-lg font-black text-slate-700 focus:ring-2 focus:ring-amber-500 text-right w-36" 
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100:border-slate-700">
                        <span className="text-sm font-bold text-slate-700">Cumartesi</span>
                        <input 
                           type="text" 
                           {...register("settings.openingHours.saturday")}
                           className="text-xs bg-slate-100 border-none px-3 py-1.5 rounded-lg font-black text-slate-700 focus:ring-2 focus:ring-amber-500 text-right w-36" 
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50:bg-red-900/10 transition-colors">
                        <span className="text-sm font-bold text-red-500">Pazar</span>
                        <input 
                           type="text" 
                           {...register("settings.openingHours.sunday")}
                           className="text-xs bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg font-black focus:ring-2 focus:ring-red-500 uppercase text-right w-36" 
                        />
                    </div>
                </div>
            </div>

            {/* Service Types (Bento Item) */}
            <div className="md:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-6">
                    <Wrench className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-800">Verilen Hizmet Türleri</h3>
                </div>
                
                <Controller
                  control={control}
                  name="settings.serviceTypes"
                  defaultValue={[]}
                  render={({ field }) => (
                     <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                           {(field.value || []).map((type, idx) => (
                             <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                               <CheckCircle className="w-3.5 h-3.5" /> {type}
                             </span>
                           ))}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Etiketleri virgül ile ayırarak belirtin..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-medium p-3 mt-2" 
                          value={(field.value || []).join(", ")}
                          onChange={(e) => {
                             const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                             field.onChange(vals);
                          }}
                        />
                     </div>
                  )}
                />

                <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ana Uzmanlık Dalı</p>
                    <div className="flex items-center space-x-2.5 text-slate-800">
                        <span className="shrink-0">🏆</span>
                        <input 
                           type="text" 
                           className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 flex-1 placeholder-slate-400 focus:outline-none focus:border-b-2 focus:border-slate-800 transition-all"
                           placeholder="Ana uzmanlık belirtin Örn: Ağır Vasıta & Özel Servis"
                        />
                    </div>
                </div>
            </div>

            {/* Notification Settings (Bento Item) */}
            <div className="md:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                    <div className="flex items-center space-x-3 mb-8">
                        <BellRing className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-800">Müşteri Bildirimleri</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">SMS Gönderimleri</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Servis bitişi ve hazır alarmları</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register("settings.notificationPreferences.sms")} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">Email Bültenleri</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Otomatik tahsilat dekontları</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register("settings.notificationPreferences.email")} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between opacity-50 cursor-not-allowed grayscale">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">App Push</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Birim içi mobil acil alarmlar</span>
                            </div>
                            <label className="relative inline-flex items-center pointer-events-none">
                                <input type="checkbox" disabled checked={false} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="flex justify-between items-center mb-1.5">
                       <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">SMS Kota Kullanımı</p>
                       <span className="text-xs font-bold text-orange-700">75%</span>
                    </div>
                    <div className="w-full h-1.5 bg-orange-200 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-[10px] font-medium text-orange-800/70">1000 tanımlı kredi, <span className="font-bold">250 kredi kaldı.</span></p>
                </div>
            </div>

        </div>

      </form>

      {/* Analytics Hook (Dynamic if supplied by parent) */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Servis Kapasitesi & Performans</h2>
            <Link href="/dashboard/analytics" className="text-xs font-bold text-blue-600 underline hover:text-blue-800 transition-colors">
              Tüm Raporu İncele
            </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Aylık Açılan Hacim</p>
                <p className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter">{currentMetrics.monthlyVolume}<span className="text-2xl opacity-50 ml-1">+</span></p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Gerçekleşen Servis İşlemi</p>
            </div>
            
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kayıtlı Uzman</p>
                <p className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tighter">{currentMetrics.staffCount}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Aktif platform personeli</p>
            </div>
            
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Onaylanmış İş Kalemi</p>
                <p className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter">{currentMetrics.approvedItems}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Toplam işlenen operasyon hareketi</p>
            </div>
            
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 text-center md:text-left bx-shadow-glow relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Hizmet Puanı</p>
                    <div className="flex items-baseline justify-center md:justify-start">
                        <p className="text-4xl md:text-5xl font-black tracking-tighter">{currentMetrics.rating}</p>
                        <span className="text-amber-500 ml-1.5 text-xl">★</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium w-3/4 mx-auto md:mx-0">Sistem genel değerlendirmesi</p>
                </div>
            </div>
        </div>
      </section>



      {/* Entegrasyonlar Yönlendirme */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Entegrasyonlar</h2>
        </div>
        
        <Link href="/dashboard/settings/parasut" className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
               <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Paraşüt & Bulut Muhasebe</h3>
              <p className="text-sm text-slate-500 font-medium">Cari hesap bağlama ve otomatik fatura senkronizasyonu.</p>
            </div>
          </div>
          <span className="px-5 py-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            Yönet
          </span>
        </Link>

        <Link href="/dashboard/settings/e-invoice" className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
               <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">e-Fatura / e-Arşiv</h3>
              <p className="text-sm text-slate-500 font-medium">GİB uyumlu elektronik fatura ve entegratör ayarları.</p>
            </div>
          </div>
          <span className="px-5 py-2 text-sm font-bold text-purple-700 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
            Yönet
          </span>
        </Link>

        <Link href="/dashboard/settings/notifications" className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
               <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Bildirim & İletişim Kanalları</h3>
              <p className="text-sm text-slate-500 font-medium">NetGSM, Twilio ve İleti Merkezi SMS/WhatsApp entegrasyonu.</p>
            </div>
          </div>
          <span className="px-5 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            Yönet
          </span>
        </Link>

        {/* Ödeme Sağlayıcısı */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Türk Ödeme Sağlayıcısı</h3>
              <p className="text-sm text-slate-500 font-medium">Müşteri online ödemeleri için iyzico veya PayTR kullanın.</p>
            </div>
          </div>
          <PaymentProviderSection currentSettings={defaultSettings} />
        </div>
      </section>

    </div>
  );
}
