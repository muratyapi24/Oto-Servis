"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

interface PlanData {
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

interface PlanFeatureRow {
  id: string;
  category: string;
  featureName: string;
  starterValue: string;
  professionalValue: string;
  enterpriseValue: string;
  sortOrder: number;
}

interface PricingClientProps {
  starter: PlanData | null;
  professional: PlanData | null;
  enterprise: PlanData | null;
  groupedFeatures: Record<string, PlanFeatureRow[]>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function FeatureValue({ value }: { value: string }) {
  if (value === "check") {
    return (
      <span className="material-symbols-outlined text-secondary font-bold">
        check
      </span>
    );
  }
  if (value === "close") {
    return (
      <span className="material-symbols-outlined text-error font-bold">
        close
      </span>
    );
  }
  if (value === "remove") {
    return (
      <span className="material-symbols-outlined text-on-surface-variant/40">
        remove
      </span>
    );
  }
  return <span>{value}</span>;
}

// Plan kartındaki feature listesi
function PlanFeatureList({
  features,
}: {
  features: Record<string, unknown>;
}) {
  const featureLabels: Record<string, string> = {
    users: "",
    crm: "Müşteri Yönetimi (CRM)",
    serviceOrder: "Servis Kaydı Oluşturma",
    advancedServiceOrder: "Gelişmiş Servis & İş Emri",
    stock: "Stok & Envanter Takibi",
    sms: "SMS Bildirimleri",
    mobileApp: "Mobil Uygulama Erişimi",
    multiBranch: "Çoklu Şube Yönetimi",
    biReports: "Gelişmiş BI Raporları",
    accounting: "Muhasebe Entegrasyonu",
    dedicatedSupport: "7/24 Özel Danışman",
  };

  return (
    <div className="space-y-4 mb-10 flex-grow">
      {Object.entries(features).map(([key, value]) => {
        const label = featureLabels[key];
        if (label === undefined) return null;

        // "users" alanı string olarak kullanıcı sayısını tutuyor
        if (key === "users" && typeof value === "string") {
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary font-bold">
                check
              </span>
              <span className="text-on-surface-variant font-medium">
                {value}
              </span>
            </div>
          );
        }

        const enabled = value === true;
        return (
          <div key={key} className="flex items-center gap-3">
            <span
              className={`material-symbols-outlined font-bold ${enabled ? "text-secondary" : "text-error"}`}
            >
              {enabled ? "check" : "close"}
            </span>
            <span
              className={`font-medium ${enabled ? "text-on-surface-variant" : "text-on-surface-variant/40"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PricingClient({
  starter,
  professional,
  enterprise,
  groupedFeatures,
}: PricingClientProps) {
  const [isYearly, setIsYearly] = useState(true);

  function getDisplayPrice(plan: PlanData | null): string {
    if (!plan) return "—";
    if (isYearly && plan.priceYearly) {
      const monthly = Math.round(plan.priceYearly / 12);
      return formatPrice(monthly);
    }
    return formatPrice(plan.priceMonthly);
  }

  const categories = Object.keys(groupedFeatures);

  return (
    <>
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 milled-gradient object-cover pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOmj2EPjCOMnA1XzvNrY2Ag0lVWY21p_NSA2rQOfiLa0V_rsTpaFWLdJnoZs9QVZupuANLRlNZKVn5y2EWNAsTloKLN9-KLbHdcFnBNfzjq69X0nUfca5tdJHgmJ706rFDVvXk-QJzeJHd6OFR2TGhGUS1O1RCNykWYccjE2v_0xervbTV1RPNXmS2V8yhju0fNtFXKpI5wxzHBwHfRVsz0bvWKKa3wbgbUCRyWlw8zWwq5CjsyiUvD-7NtQyjB_BuGkhWpazN6U6X')",
          }}
        ></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
            Şeffaf Fiyatlandırma,
            <br />
            Gizli Ücret Yok
          </h1>
          <p className="text-xl text-on-primary-container/80 mb-12 font-medium">
            İşletmenizin büyüklüğüne en uygun planı seçin, verimliliğinizi
            hemen artırın.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`font-semibold cursor-pointer transition-colors ${!isYearly ? "text-white" : "text-white/60"}`}
              onClick={() => setIsYearly(false)}
            >
              Aylık
            </span>
            <button
              className="w-16 h-8 bg-white/20 rounded-full relative p-1 flex items-center transition-all"
              onClick={() => setIsYearly(!isYearly)}
              aria-label="Aylık/Yıllık geçişi"
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${isYearly ? "translate-x-8" : "translate-x-0"}`}
              ></div>
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold cursor-pointer transition-colors ${isYearly ? "text-white" : "text-white/60"}`}
                onClick={() => setIsYearly(true)}
              >
                Yıllık
              </span>
              <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                %20 İndirim
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Starter */}
        {starter && (
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-xl shadow-on-surface/5 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-on-surface-variant mb-2">
                {starter!.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-on-surface">
                  {getDisplayPrice(starter)}
                </span>
                <span className="text-on-surface-variant/60 font-medium">
                  /ay
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">
                {starter!.description}
              </p>
            </div>
            <PlanFeatureList
              features={starter!.features as Record<string, unknown>}
            />
            <Link
              href="/register"
              className="w-full py-4 rounded-lg font-bold text-primary bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 text-center block"
            >
              Ücretsiz Başlayın
            </Link>
          </div>
        )}

        {/* Professional */}
        {professional && (
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-2xl shadow-primary/20 border-t-8 border-primary relative flex flex-col scale-105 transform">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest">
              En Popüler
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary mb-2">
                {professional!.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-on-surface">
                  {getDisplayPrice(professional)}
                </span>
                <span className="text-on-surface-variant/60 font-medium">
                  /ay
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">
                {professional!.description}
              </p>
            </div>
            <PlanFeatureList
              features={professional!.features as Record<string, unknown>}
            />
            <Link
              href="/register"
              className="w-full py-4 rounded-lg font-bold text-white milled-gradient shadow-lg shadow-primary/30 hover:scale-[0.98] transition-transform active:scale-90 text-center block"
            >
              {professional!.trialDays} Gün Ücretsiz Dene
            </Link>
          </div>
        )}

        {/* Enterprise */}
        {enterprise && (
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-xl shadow-on-surface/5 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-on-surface-variant mb-2">
                {enterprise!.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-on-surface">
                  {getDisplayPrice(enterprise)}
                </span>
                <span className="text-on-surface-variant/60 font-medium">
                  /ay
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">
                {enterprise!.description}
              </p>
            </div>
            <PlanFeatureList
              features={enterprise!.features as Record<string, unknown>}
            />
            <Link
              href="/contact"
              className="w-full py-4 rounded-lg font-bold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 text-center block"
            >
              Bize Ulaşın
            </Link>
          </div>
        )}
      </section>

      {/* PLAN COMPARISON TABLE */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-32">
          <h2 className="text-4xl font-black tracking-tighter text-center mb-16 text-on-surface">
            Detaylı Plan Karşılaştırması
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="p-6 rounded-tl-xl text-on-surface-variant font-bold uppercase text-xs tracking-widest">
                    Özellik
                  </th>
                  <th className="p-6 text-on-surface font-black">
                    {starter?.name ?? "Starter"}
                  </th>
                  <th className="p-6 text-primary font-black">
                    {professional?.name ?? "Professional"}
                  </th>
                  <th className="p-6 rounded-tr-xl text-on-surface font-black">
                    {enterprise?.name ?? "Enterprise"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {categories.map((category) => {
                  const categoryFeatures = groupedFeatures[category] ?? [];
                  return (
                    <Fragment key={`group-${category}`}>
                      {/* Kategori Başlığı */}
                      <tr className="bg-surface-container-lowest">
                        <td
                          className="p-6 font-bold text-primary uppercase text-xs tracking-widest bg-surface-container-low/50"
                          colSpan={4}
                        >
                          {category}
                        </td>
                      </tr>
                      {/* Özellik Satırları */}
                      {categoryFeatures.map((feature) => (
                        <tr key={feature.id}>
                          <td className="p-6 text-on-surface-variant font-medium">
                            {feature.featureName}
                          </td>
                          <td className="p-6">
                            <FeatureValue value={feature.starterValue} />
                          </td>
                          <td className="p-6">
                            <FeatureValue value={feature.professionalValue} />
                          </td>
                          <td className="p-6">
                            <FeatureValue value={feature.enterpriseValue} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
