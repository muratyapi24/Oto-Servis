"use client";

import { useState, useTransition } from "react";
import { requestDemo, type DemoRequestInput } from "@/lib/actions/demo.actions";
import { CheckCircle, Phone, Mail, Building2, User, MessageSquare, TrendingUp, Loader2 } from "lucide-react";

const DAILY_ORDER_OPTIONS = [
  "1-5 iş emri/gün",
  "6-15 iş emri/gün",
  "16-30 iş emri/gün",
  "30+ iş emri/gün",
];

export function DemoRequestSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [form, setForm] = useState<DemoRequestInput>({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    dailyOrders: "",
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await requestDemo(form);
      setResult(res);
      if (res.success) {
        setForm({ firstName: "", lastName: "", company: "", email: "", phone: "", dailyOrders: "", message: "" });
      }
    });
  }

  return (
    <section id="demo-talep" className="py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Ücretsiz Demo
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">
            30 Dakikada Servisinizi<br className="hidden md:block" /> Nasıl Dönüştürdüğümüzü Gösteririz
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Oto servisinize özel canlı demo. Sorularınızı yanıtlıyoruz, pilot dönemi planlıyoruz.
            Taahhüt yok, kredi kartı gerekmez.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Sol: Faydalar */}
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: <TrendingUp className="h-5 w-5 text-blue-600" />, title: "Veriye Dayalı Demo", desc: "Servisinizin iş emri ve gelir yapısına göre özelleştirilmiş gösterim." },
              { icon: <Phone className="h-5 w-5 text-green-600" />, title: "En Geç 1 İş Günü", desc: "Talebinizi aldıktan sonra ekibimiz sizi arayarak görüşme planlar." },
              { icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, title: "30 Gün Ücretsiz Pilot", desc: "Demo sonrası isterseniz 30 gün tam destekli pilot süreç başlatıyoruz." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Telefon CTA */}
            <a
              href="tel:+905551234567"
              className="flex items-center gap-3 bg-green-600 text-white rounded-2xl px-5 py-4 hover:bg-green-700 transition-colors shadow-md"
            >
              <Phone className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs opacity-80">Hemen arayın</p>
                <p className="font-black text-base tracking-wide">+90 555 123 45 67</p>
              </div>
            </a>
          </div>

          {/* Sağ: Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            {result?.success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-black text-xl text-slate-800">Talebiniz Alındı!</h3>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed">{result.success}</p>
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-blue-600 hover:underline mt-2"
                >
                  Yeni talep gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-black text-lg text-slate-800 mb-2">Demo Talebi Oluştur</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        name="firstName"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Ahmet"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Soyad *</label>
                    <input
                      name="lastName"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Yılmaz"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Firma Adı *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      name="company"
                      required
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Yılmaz Oto Servis"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="ahmet@firma.com"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="05551234567"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Günlük Ortalama İş Emri Sayısı</label>
                  <select
                    name="dailyOrders"
                    value={form.dailyOrders}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                  >
                    <option value="">Seçiniz (opsiyonel)</option>
                    {DAILY_ORDER_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Not (opsiyonel)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Çözmek istediğiniz problem veya sormak istediğiniz soru..."
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                    />
                  </div>
                </div>

                {result?.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {result.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</>
                  ) : (
                    <>Demo Talebi Oluştur — Ücretsiz</>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400">
                  Kişisel verileriniz yalnızca demo sürecinde kullanılır. <br />
                  KVKK kapsamında işlenmektedir.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
