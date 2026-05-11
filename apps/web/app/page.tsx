import type { Metadata } from "next";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { DemoRequestSection } from "@/components/landing/DemoRequestSection";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CookieBanner } from "@/components/landing/CookieBanner";

export const metadata: Metadata = {
  title: "MS Oto Servis | Türkiye'nin En İyi Oto Servis Yönetim Platformu",
  description:
    "Randevu yönetimi, iş emri takibi, stok kontrolü, faturalama ve SMS/WhatsApp bildirimleri tek platformda. 14 gün ücretsiz deneyin.",
  keywords: [
    "oto servis programı",
    "oto servis yönetim yazılımı",
    "servis takip sistemi",
    "araç bakım programı",
    "oto servis SaaS",
    "iş emri yönetimi",
  ],
  openGraph: {
    title: "MS Oto Servis | Modern Oto Servis Yönetim Platformu",
    description: "Türkiye'nin oto servislerine özel bulut tabanlı yönetim yazılımı.",
    type: "website",
    locale: "tr_TR",
  },
};

const FEATURES = [
  {
    icon: "calendar_month",
    title: "Randevu & İş Emri",
    desc: "Online randevu, dijital iş emri ve müşteri onay linki ile servis süreçlerini otomatikleştirin.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: "directions_car",
    title: "Müşteri & Araç Takibi",
    desc: "VIN, sigorta, bakım tarihi ve servis geçmişini tek ekranda görün. Müşteri portalı ile şeffaf iletişim.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: "inventory_2",
    title: "Stok & Parça Yönetimi",
    desc: "Çoklu depo, barkod okuma, satın alma siparişleri ve kritik stok uyarıları.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: "receipt_long",
    title: "Fatura & Muhasebe",
    desc: "e-Fatura, Paraşüt entegrasyonu, iyzico/PayTR online ödeme ve çek takibi.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: "sms",
    title: "SMS & WhatsApp Bildirimleri",
    desc: "Servis durumu, randevu hatırlatma ve toplu kampanya. NetGSM, İleti Merkezi ve Meta Cloud API desteği.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: "phone_android",
    title: "Mobil Uygulama",
    desc: "iOS ve Android uygulaması ile usta ve müşteri portalı. Çevrimdışı çalışma ve biyometrik giriş.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: "bar_chart",
    title: "Raporlama & Analitik",
    desc: "Gelir trendi, usta performansı, müşteri yaşam boyu değeri ve PDF/Excel rapor çıktısı.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: "shield_person",
    title: "KVKK & IYS Uyumlu",
    desc: "Açık rıza yönetimi, veri sahibi hakları ve IYS pazarlama izni kontrolü ile yasal uyum.",
    color: "bg-rose-50 text-rose-600",
  },
];

const STATS = [
  { value: "80.000+", label: "Oto Servis İşletmesi" },
  { value: "5 dk", label: "Ortalama Kurulum Süresi" },
  { value: "%99.9", label: "Uptime Garantisi" },
  { value: "7/24", label: "Teknik Destek" },
];

export default function HomePage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 pt-40 pb-32 px-6 text-center">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Türkiye'de 80.000+ Oto Servis İşletmesi
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-6">
              Oto Servisinizi<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                Dijitalleştirin
              </span>
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10">
              Randevu, iş emri, stok, fatura ve müşteri yönetimini tek platformda birleştirin.
              Kağıt ve Excel'e elveda deyin. <strong className="text-white">14 gün ücretsiz deneyin.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-black px-8 py-4 rounded-2xl shadow-2xl shadow-black/30 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                Ücretsiz Başla
              </Link>
              <Link
                href="#demo-talep"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                Demo Talep Et
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-slate-100 py-12 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-black text-blue-700 tracking-tighter">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Competitive Differentiators */}
        <section className="bg-blue-50 py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-3">
            {[
              { icon: "language", text: "Tam Türkçe Arayüz" },
              { icon: "support_agent", text: "Yerli Müşteri Desteği" },
              { icon: "credit_card", text: "iyzico & PayTR Entegrasyonu" },
              { icon: "shield_person", text: "KVKK & IYS Uyumlu" },
              { icon: "car_repair", text: "Oto Servise Özel Tasarım" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-slate-700 shadow-sm border border-slate-100"
              >
                <span className="material-symbols-outlined text-blue-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">
                Temel Değer Önerimiz
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Oto servisinizin ihtiyaç duyduğu her şey, tek platformda.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group"
                >
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Hesaplayıcı */}
        <RoiCalculator />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Demo Talep Formu */}
        <DemoRequestSection />

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-indigo-900 py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-blue-200 mb-8 leading-relaxed">
              Kredi kartı gerekmez. 14 günlük ücretsiz deneme. İstediğiniz zaman iptal edin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                14 Gün Ücretsiz Dene
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
      <CookieBanner />
    </div>
  );
}
