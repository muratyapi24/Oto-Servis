"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { requestPlanUpgrade, requestCancelSubscription } from "@/lib/actions/subscription.actions";

interface UsageItem {
  key: string;
  label: string;
  current: number;
  limit: number;
  percentage: number;
}

interface FeatureItem {
  key: string;
  label: string;
  enabled: boolean;
}

export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  currency: string;
  trialDays: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

interface BillingClientProps {
  subscription: {
    id: string;
    status: string;
    startDate: Date;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    daysRemaining?: number;
  } | null;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number | null;
    currency: string;
    trialDays: number;
  } | null;
  usage: {
    planName: string;
    status: string;
    daysRemaining?: number;
    usage: UsageItem[];
    features: FeatureItem[];
  } | null;
  plans: BillingPlan[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TRIAL: { label: "Deneme Sürümü", color: "bg-blue-100 text-blue-700" },
  ACTIVE: { label: "Aktif", color: "bg-emerald-100 text-emerald-700" },
  PAST_DUE: { label: "Ödeme Gecikmiş", color: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "İptal Edildi", color: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Süresi Doldu", color: "bg-slate-100 text-slate-600" },
};

function formatCurrency(amount: number, currency: string = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
}

export default function BillingClient({ subscription, currentPlan, usage, plans }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setMessage({ type: "success", text: "Ödemeniz başarıyla alındı. Aboneliğiniz aktif edildi!" });
    } else if (payment === "failed") {
      setMessage({ type: "error", text: "Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin veya destek ile iletişime geçin." });
    }
  }, [searchParams]);

  const defaultStatus = { label: "Bilinmiyor", color: "bg-slate-100 text-slate-600" };
  const statusInfo = STATUS_LABELS[subscription?.status || ""] ?? defaultStatus;

  function handleUpgrade(planId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await requestPlanUpgrade(planId);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.success || "Paket güncellendi!" });
      }
    });
  }

  function handleCancel() {
    setMessage(null);
    startTransition(async () => {
      const result = await requestCancelSubscription(cancelReason);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.success || "İptal talebi alındı." });
      }
      setShowCancelModal(false);
      setCancelReason("");
    });
  }

  return (
    <div className="space-y-8">
      {/* Bildirim mesajı */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-lg leading-none opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Mevcut Plan Kartı */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Bilgisi */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl ambient-shadow">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-on-surface">Mevcut Paketiniz</h3>
              <p className="text-xs text-slate-400 mt-1">Abonelik detayları ve kullanım durumu</p>
            </div>
            {subscription && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}
          </div>

          {currentPlan ? (
            <div className="space-y-5">
              {/* Plan adı & fiyat */}
              <div className="flex items-end justify-between bg-surface-container-lowest p-5 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Plan</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{currentPlan.name}</p>
                  {currentPlan.description && (
                    <p className="text-xs text-slate-400 mt-1">{currentPlan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">
                    {formatCurrency(currentPlan.priceMonthly, currentPlan.currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">/ ay</p>
                  {currentPlan.priceYearly && (
                    <p className="text-xs text-slate-500 mt-1">
                      Yıllık: {formatCurrency(currentPlan.priceYearly, currentPlan.currency)}
                    </p>
                  )}
                </div>
              </div>

              {/* Dönem bilgisi */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {subscription?.currentPeriodEnd && (
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dönem Sonu</p>
                    <p className="text-sm font-black text-on-surface mt-1">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                )}
                {subscription?.daysRemaining !== undefined && (
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kalan Gün</p>
                    <p className={`text-sm font-black mt-1 ${subscription.daysRemaining <= 7 ? "text-error" : "text-on-surface"}`}>
                      {subscription.daysRemaining} gün
                    </p>
                  </div>
                )}
                {subscription?.startDate && (
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Başlangıç</p>
                    <p className="text-sm font-black text-on-surface mt-1">
                      {new Date(subscription.startDate).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">İptal Talebi</p>
                    <p className="text-sm font-bold text-red-600 mt-1">Dönem sonunda iptal</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">credit_card_off</span>
              <p className="text-sm text-slate-400">Henüz bir abonelik paketiniz bulunmuyor.</p>
              <p className="text-xs text-slate-300 mt-1">Aşağıdan bir paket seçerek başlayın.</p>
            </div>
          )}
        </div>

        {/* Kullanım Durumu */}
        <div className="bg-inverse-surface p-6 rounded-3xl text-white">
          <h3 className="text-lg font-bold mb-5">Kullanım Durumu</h3>
          {usage && usage.usage.length > 0 ? (
            <div className="space-y-4">
              {usage.usage.map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-white/70">{item.label}</span>
                    <span className="font-black">
                      {item.current}/{item.limit === 0 ? "∞" : item.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.percentage >= 90
                          ? "bg-red-400"
                          : item.percentage >= 70
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">Kullanım verisi yok.</p>
          )}

          {/* Özellikler */}
          {usage && usage.features.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Özellikler</p>
              <div className="space-y-2">
                {usage.features.map((feat) => (
                  <div key={feat.key} className="flex items-center gap-2 text-xs">
                    <span
                      className={`material-symbols-outlined text-[16px] ${feat.enabled ? "text-emerald-400" : "text-white/20"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {feat.enabled ? "check_circle" : "cancel"}
                    </span>
                    <span className={feat.enabled ? "text-white/80" : "text-white/30 line-through"}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mevcut Planlar — Yükseltme Seçenekleri */}
      <section>
        <h3 className="text-xl font-black text-on-surface mb-2">Paket Seçenekleri</h3>
        <p className="text-xs text-slate-400 mb-6">İhtiyacınıza en uygun paketi seçin</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isUpgrade = currentPlan ? plan.priceMonthly > currentPlan.priceMonthly : true;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 transition-all ${
                  isCurrentPlan
                    ? "bg-primary/5 border-2 border-primary ambient-shadow"
                    : "bg-white border border-slate-100 hover:border-primary/30 hover:shadow-lg"
                }`}
              >
                {/* Badge */}
                {isCurrentPlan && (
                  <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    Mevcut Paketiniz
                  </div>
                )}

                <h4 className="text-lg font-black text-on-surface">{plan.name}</h4>
                {plan.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{plan.description}</p>
                )}

                {/* Fiyat */}
                <div className="mt-4 mb-5">
                  <span className="text-3xl font-black text-primary">
                    {formatCurrency(plan.priceMonthly, plan.currency)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / ay</span>
                </div>

                {/* Limitler */}
                <div className="space-y-2 mb-5">
                  {Object.entries(plan.limits as Record<string, number>)
                    .filter(([, v]) => v > 0)
                    .slice(0, 5)
                    .map(([key, value]) => {
                      const limitLabels: Record<string, string> = {
                        maxUsers: "Kullanıcı",
                        maxMechanics: "Personel",
                        maxCustomers: "Müşteri",
                        maxVehicles: "Araç",
                        maxLocations: "Lokasyon",
                        maxSmsPerMonth: "SMS/ay",
                        maxWhatsappPerMonth: "WhatsApp/ay",
                      };
                      return (
                        <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                          {value === 0 ? "Sınırsız" : value} {limitLabels[key] || key}
                        </div>
                      );
                    })}
                </div>

                {/* Aksiyon */}
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed"
                  >
                    Aktif Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isPending}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isPending ? "İşleniyor..." : "Yükselt"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-50 text-slate-300 text-sm font-bold cursor-not-allowed"
                  >
                    Alt Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* İptal Bölümü */}
      {subscription && !subscription.cancelAtPeriodEnd && subscription.status !== "CANCELLED" && (
        <section className="bg-surface-container-low p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-600">Aboneliği İptal Et</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Mevcut dönem sonuna kadar tüm özellikleri kullanmaya devam edebilirsiniz.
              </p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
            >
              İptal Et
            </button>
          </div>
        </section>
      )}

      {/* İptal Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <span
                className="material-symbols-outlined text-5xl text-red-400 mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <h3 className="text-xl font-black text-on-surface">Aboneliği İptal Et</h3>
              <p className="text-sm text-slate-400 mt-2">
                İptal işlemi dönem sonunda geçerli olacaktır. Verileriniz korunur.
              </p>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                İptal Nedeni (Opsiyonel)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Deneyiminizi iyileştirmemize yardımcı olun..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "İşleniyor..." : "İptal Et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
