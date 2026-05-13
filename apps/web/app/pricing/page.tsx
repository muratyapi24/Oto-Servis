import Link from "next/link";
import { prisma } from "@repo/database";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { Providers } from "@/components/Providers";
import PricingClient from "./PricingClient";

// Plan verileri nadiren değişir; 1 saatlik ISR yeterli
export const revalidate = 3600;

export const metadata = {
  title: "Fiyatlandırma - ÖNCÜ OTO SERVİS PROGRAMI",
  description:
    "İşletmenizin büyüklüğüne en uygun planı seçin. Şeffaf fiyatlandırma, gizli ücret yok. Starter, Professional ve Enterprise paketleri ile servisinizi dijitalleştirin.",
};

// Plan feature tipi
interface PlanFeatureRow {
  id: string;
  category: string;
  featureName: string;
  starterValue: string;
  professionalValue: string;
  enterpriseValue: string;
  sortOrder: number;
}

interface SubscriptionPlanData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  trialDays: number;
  features: Record<string, unknown>;
  sortOrder: number;
}

async function getPricingData() {
  try {
    const [plans, features] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          priceMonthly: true,
          priceYearly: true,
          trialDays: true,
          features: true,
          sortOrder: true,
        },
      }),
      prisma.planFeature.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          category: true,
          featureName: true,
          starterValue: true,
          professionalValue: true,
          enterpriseValue: true,
          sortOrder: true,
        },
      }),
    ]);

    const groupedFeatures: Record<string, PlanFeatureRow[]> = {};
    for (const feature of features) {
      if (!groupedFeatures[feature.category]) {
        groupedFeatures[feature.category] = [];
      }
      groupedFeatures[feature.category]!.push(feature);
    }

    return { plans: plans as SubscriptionPlanData[], groupedFeatures };
  } catch {
    return { plans: [] as SubscriptionPlanData[], groupedFeatures: {} };
  }
}

export default async function PricingPage() {
  const { plans, groupedFeatures } = await getPricingData();

  // 3 plan bekliyoruz: Starter, Professional, Enterprise
  const starter = plans.find((p) => p.slug === "starter-plan");
  const professional = plans.find((p) => p.slug === "professional-plan");
  const enterprise = plans.find((p) => p.slug === "enterprise-plan");

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col scroll-smooth">
      <LandingNavbar />

      <main className="pt-20 flex-1">
        {/* Pricing Client renders HERO, TIERS and COMPARISON, sharing state seamlessly */}
        <Providers>
          <PricingClient
            starter={starter ?? null}
            professional={professional ?? null}
            enterprise={enterprise ?? null}
            groupedFeatures={groupedFeatures}
          />
        </Providers>

        {/* ADD-ONS */}
        <section className="bg-surface-container-low py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tighter mb-4">
                Ek Hizmetler &amp; Paketler
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Planınıza dilediğiniz zaman ekleyebileceğiniz özel çözümlerle
                gücünüzü artırın.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "sms",
                  title: "Ek SMS Paketi",
                  desc: "Müşterilerinize otomatik bilgilendirme SMS'leri gönderin.",
                  price: "₺99'dan başlayan",
                  color: "bg-primary-container/10 text-primary",
                },
                {
                  icon: "support_agent",
                  title: "Premium Destek",
                  desc: "Size özel atanan müşteri temsilcisi ile anında çözüm.",
                  price: "₺149/ay",
                  color: "bg-secondary-container/20 text-secondary",
                },
                {
                  icon: "analytics",
                  title: "Gelişmiş BI",
                  desc: "Derinlemesine veri analizi ve özel dashboardlar.",
                  price: "₺199/ay",
                  color: "bg-tertiary-fixed/20 text-tertiary",
                },
                {
                  icon: "directions_car",
                  title: "Filo Yönetimi",
                  desc: "Kurumsal müşterileriniz için özel portal ve takip sistemi.",
                  price: "Teklif Alın",
                  color: "bg-on-surface/5 text-on-surface",
                },
              ].map((addon) => (
                <div
                  key={addon.title}
                  className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-xl transition-shadow flex flex-col items-center text-center"
                >
                  <div
                    className={`w-16 h-16 ${addon.color} rounded-full flex items-center justify-center mb-6`}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {addon.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{addon.title}</h4>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {addon.desc}
                  </p>
                  <span className="mt-auto text-primary font-bold">
                    {addon.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="max-w-4xl mx-auto px-6 py-32">
          <h2 className="text-4xl font-black tracking-tighter text-center mb-16">
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Ücretsiz deneme süresi ne kadar?",
                a: "Tüm Professional ve Enterprise özelliklerini 14 gün boyunca kredi kartı bilgisi girmeden ücretsiz deneyebilirsiniz.",
              },
              {
                q: "İstediğim zaman plan değişikliği yapabilir miyim?",
                a: "Evet, dilediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Fark ücreti orantılı olarak hesaplanır.",
              },
              {
                q: "Fiyatlara KDV dahil mi? Gizli ücretler var mı?",
                a: "Belirtilen fiyatlar KDV hariçtir. Bunun dışında hiçbir gizli ücret yoktur.",
              },
              {
                q: "Yıllık ödemede nasıl bir indirim uygulanıyor?",
                a: "Yıllık ödeme tercih ettiğinizde %20'ye varan indirim avantajından yararlanabilirsiniz.",
              },
              {
                q: "İptal politikası nedir? Verilerimi alabilir miyim?",
                a: "İstediğiniz zaman aboneliğinizi iptal edebilirsiniz. İptal sonrası 30 gün boyunca verilerinize erişim sağlayabilir ve dışa aktarabilirsiniz.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="bg-surface-container-lowest rounded-xl overflow-hidden group border-l-4 border-transparent hover:border-primary transition-all"
              >
                <summary className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-bold text-on-surface">{faq.q}</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="milled-gradient rounded-3xl p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/40">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCklWuQDMhvjqIYXliDotvnqPRkZOyMGePevILSz9nskrW_c1vdvAHngxp21ZqflZ7feIwdp_agAENmOvuAy1bCa7P1uJr1Hj_zYROEuNAulZsaGt6VUKr_mFgfiSVjuppuR_0HlACx3csW9cfL0UZF2-V7p6Xqmc1xdd8n1DvW5oJiE2AWPuj0QgOdAxXJU-6H26RX2pF3H6weuxRhUyBPkNO4v5U4SZqW_BbsPC27wyBwYVpDZxz5pAJyzMXzvOOVCMuJuSNmtm7s')",
              }}
            ></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                Hemen Başlamaya Hazır mısınız?
              </h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
                Saniyeler içinde kayıt olun, servisinizdeki karmaşaya son verin
                ve profesyonel yönetimin tadını çıkarın.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <Link
                  href="/register"
                  className="bg-white text-primary px-10 py-5 rounded-xl font-black text-lg shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-transform"
                >
                  14 Gün Ücretsiz Dene
                </Link>
                <Link
                  href="/contact"
                  className="text-white border-2 border-white/30 px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  Uzmanımızla Görüşün
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
