import type { Metadata } from "next";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Hizmet Düzeyi Sözleşmesi (SLA) — MS Oto Servis",
  description: "MS Oto Servis hizmet düzeyi taahhütleri, uptime garantisi ve destek yanıt süreleri.",
};

const SLA_VERSION = "1.0";
const EFFECTIVE_DATE = "1 Mayıs 2026";

const SUPPORT_TIERS = [
  { plan: "Başlangıç", firstResponse: "2 iş günü", resolution: "5 iş günü", channel: "E-posta" },
  { plan: "Profesyonel", firstResponse: "1 iş günü", resolution: "3 iş günü", channel: "E-posta + WhatsApp" },
  { plan: "Kurumsal", firstResponse: "4 saat (mesai)", resolution: "1 iş günü", channel: "E-posta + WhatsApp + Telefon" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-black text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600 leading-relaxed mb-3">{children}</p>;
}

export default function SlaPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 pt-28 pb-20 w-full">
        {/* Başlık */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Hizmet Düzeyi Sözleşmesi
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
            Hizmet Düzeyi Sözleşmesi (SLA)
          </h1>
          <p className="text-slate-500 text-sm">
            Sürüm {SLA_VERSION} — Yürürlük tarihi: {EFFECTIVE_DATE}
          </p>
        </div>

        <Section title="1. Kapsam ve Amaç">
          <P>
            Bu Hizmet Düzeyi Sözleşmesi ("SLA"), MS Oto Servis SaaS platformunu ("Platform") kullanan
            müşterilere ("Müşteri") sağlanan hizmet kalitesi taahhütlerini belirler. Bu SLA,
            Kullanım Koşulları ve Veri İşleme Sözleşmesi ile birlikte geçerlidir.
          </P>
        </Section>

        <Section title="2. Uptime (Hizmet Erişilebilirliği) Garantisi">
          <P>
            MS Oto Servis, aylık bazda <strong>%99,5 uptime</strong> garanti eder. Bu, aylık en fazla
            yaklaşık <strong>3 saat 36 dakika</strong> planlanmış ya da planlanmamış kesinti anlamına gelir.
          </P>
          <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-700">Uptime Oranı</th>
                  <th className="text-left p-4 font-bold text-slate-700">Aylık Kesinti Süresi</th>
                  <th className="text-left p-4 font-bold text-slate-700">Hizmet Kredisi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["≥ %99,5", "≤ 3s 36dk", "—"],
                  ["%99,0 – %99,4", "3s 36dk – 7s 12dk", "Aylık ücretin %10'u"],
                  ["%95,0 – %98,9", "7s 12dk – 36s", "Aylık ücretin %25'i"],
                  ["< %95,0", "> 36 saat", "Aylık ücretin %50'si"],
                ].map(([uptime, downtime, credit], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-4 text-slate-600 font-mono">{uptime}</td>
                    <td className="p-4 text-slate-600">{downtime}</td>
                    <td className="p-4 font-semibold text-slate-800">{credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            Hizmet kredisi talepleri, kesinti tarihinden itibaren <strong>15 takvim günü</strong> içinde
            destek kanallarından yazılı olarak iletilmelidir.
          </P>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            <em>
              Uptime hesaplamasının dışında kalan durumlar: Planlı bakım pencereleri (önceden duyurulur),
              Müşterinin kendi tarayıcısından veya ağından kaynaklanan sorunlar, Üçüncü taraf
              hizmetlerden (Twilio, iyzico, Resend vb.) kaynaklanan kesintiler, Mücbir sebepler.
            </em>
          </p>
        </Section>

        <Section title="3. Destek Yanıt ve Çözüm Süreleri">
          <P>
            Destek talepleri aşağıdaki SLA'lara göre yanıtlanır. Süreler mesai saatleri
            (Pazartesi–Cuma, 09:00–18:00 TSİ) içindir.
          </P>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Plan", "İlk Yanıt", "Çözüm Süresi", "Kanal"].map((h) => (
                    <th key={h} className="text-left p-4 font-bold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUPPORT_TIERS.map((tier, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-4 font-semibold text-slate-800">{tier.plan}</td>
                    <td className="p-4 text-slate-600">{tier.firstResponse}</td>
                    <td className="p-4 text-slate-600">{tier.resolution}</td>
                    <td className="p-4 text-slate-600">{tier.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Veri Yedekleme ve Kurtarma">
          <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
            {[
              "Tüm müşteri veritabanları günlük otomatik tam yedekleme ile korunur.",
              "Yedekler 30 gün boyunca güvenli, şifreli ortamlarda saklanır.",
              "Olası veri kaybı veya bozulması durumunda kurtarma hedefi: RPO ≤ 24 saat, RTO ≤ 4 saat.",
              "Yedekleme tamamlanma oranı aylık %99,9 hedeflenir.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 text-lg leading-none">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Veri Dışa Aktarma">
          <P>
            Abonelik iptali veya hesap kapatma talebini takip eden <strong>5 iş günü</strong> içinde
            müşteri verileri CSV/Excel formatında sunulur. Veriler, son erişim tarihinden itibaren
            <strong> 30 takvim günü</strong> boyunca saklanır; akabinde kalıcı olarak silinir.
          </P>
        </Section>

        <Section title="6. Planlı Bakım">
          <P>
            Bakım pencereleri Pazar günleri 02:00–06:00 TSİ arasında gerçekleştirilir. Bakım en az
            <strong> 48 saat öncesinde</strong> e-posta veya uygulama içi bildirim ile duyurulur.
            Acil güvenlik yamaları önceden duyurulmadan uygulanabilir; ancak etkilenen müşteriler
            en geç 24 saat içinde bilgilendirilir.
          </P>
        </Section>

        <Section title="7. Güvenlik Taahhütleri">
          <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
            {[
              "Tüm veri iletişimi TLS 1.2+ ile şifrelenir.",
              "Hassas veriler (şifreler, ödeme bilgileri) veritabanında şifreli saklanır.",
              "Kritik güvenlik açıkları 72 saat içinde yamalanır.",
              "Şüpheli erişim tespitinde müşteri derhal bilgilendirilir.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 text-lg leading-none">🔒</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="8. SLA Dışında Kalan Durumlar">
          <P>
            Aşağıdaki durumlarda SLA taahhütleri geçerli değildir:
          </P>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
            <li>Müşterinin API veya uygulama yanlış kullanımından kaynaklanan sorunlar</li>
            <li>Üçüncü taraf ödeme, SMS veya e-posta servis sağlayıcılarının kesintileri</li>
            <li>Müşterinin kendi altyapısından (internet, cihaz) kaynaklanan sorunlar</li>
            <li>Doğal afet, savaş, salgın gibi mücbir sebep halleri</li>
            <li>Beta veya deneme (trial) sürecindeki kiracılar</li>
          </ul>
        </Section>

        <Section title="9. İletişim">
          <P>
            SLA kapsamında talep veya şikayetlerinizi aşağıdaki kanallar üzerinden iletebilirsiniz:
          </P>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "E-posta", value: "destek@bstoto.com", href: "mailto:destek@bstoto.com" },
              { label: "WhatsApp", value: "+90 555 123 45 67", href: "https://wa.me/905551234567" },
              { label: "Mesai saatleri", value: "Pzt–Cum 09:00–18:00", href: undefined },
            ].map((c) => (
              <div key={c.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="text-sm font-semibold text-blue-600 hover:underline">{c.value}</a>
                ) : (
                  <p className="text-sm font-semibold text-slate-700">{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Footer link */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500 flex flex-wrap gap-4">
          <Link href="/terms" className="hover:text-blue-600 hover:underline">Kullanım Koşulları</Link>
          <Link href="/privacy" className="hover:text-blue-600 hover:underline">Gizlilik Politikası</Link>
          <Link href="/kvkk" className="hover:text-blue-600 hover:underline">KVKK Aydınlatma</Link>
          <Link href="/dpa" className="hover:text-blue-600 hover:underline">Veri İşleme Sözleşmesi</Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
