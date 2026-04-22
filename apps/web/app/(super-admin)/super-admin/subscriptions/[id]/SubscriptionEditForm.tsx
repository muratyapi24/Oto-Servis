"use client";

import { useState } from "react";
import { updateSubscription } from "@/lib/actions/superadmin.actions";

type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
};

type Props = {
  subscriptionId: string;
  currentPlanId: string;
  currentStatus: string;
  plans: Plan[];
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "TRIAL", label: "Deneme" },
  { value: "CANCELLED", label: "İptal Edildi" },
  { value: "PAST_DUE", label: "Gecikmiş" },
];

export default function SubscriptionEditForm({
  subscriptionId,
  currentPlanId,
  currentStatus,
  plans,
}: Props) {
  const [planId, setPlanId] = useState(currentPlanId);
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateSubscription(subscriptionId, { planId, status });

    if ("error" in result) {
      setMessage({ type: "error", text: result.error || "Bir hata oluştu" });
    } else {
      setMessage({ type: "success", text: "Abonelik başarıyla güncellendi." });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Plan
        </label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₺{p.priceMonthly.toLocaleString("tr-TR")}/ay
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Durum
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          className={`px-3 py-2 rounded text-xs font-semibold ${
            message.type === "success"
              ? "bg-tertiary-fixed/20 text-on-tertiary-fixed-variant"
              : "bg-error/10 text-error"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white text-xs font-bold uppercase py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
