"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscription } from "@/lib/actions/superadmin.actions";

type Tenant = {
  id: string;
  name: string;
  email: string | null;
};

type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
};

type Props = {
  tenants: Tenant[];
  plans: Plan[];
};

export default function NewSubscriptionForm({ tenants, plans }: Props) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setError("Lütfen bir firma seçin.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await createSubscription({
      tenantId,
      planId,
      startDate: new Date(startDate || new Date()),
    });

    if ("error" in result) {
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    } else {
      router.push("/super-admin/subscriptions");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Firma
        </label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          required
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— Firma Seçin —</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.email ? `(${t.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Plan
        </label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          required
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
          Başlangıç Tarihi
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && (
        <div className="px-3 py-2 rounded text-xs font-semibold bg-error/10 text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white text-xs font-bold uppercase py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Oluşturuluyor…" : "Abonelik Oluştur"}
      </button>
    </form>
  );
}
