"use client";

import { useState } from "react";
import { createSubscriptionPlan } from "@/lib/actions/superadmin.actions";

type FormState = {
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  trialDays: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  description: "",
  priceMonthly: "",
  priceYearly: "",
  trialDays: "14",
};

export default function PlanCreateForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createSubscriptionPlan({
      name: form.name,
      description: form.description,
      priceMonthly: form.priceMonthly,
      priceYearly: form.priceYearly || undefined,
      trialDays: form.trialDays,
    });

    if ("error" in result) {
      setMessage({ type: "error", text: result.error || "Bir hata oluştu" });
    } else {
      setMessage({ type: "success", text: "Paket başarıyla oluşturuldu." });
      setForm(INITIAL_STATE);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Paket Adı
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="örn. Starter, Professional, Enterprise"
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Açıklama
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Paket açıklaması…"
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            Aylık Fiyat (₺)
          </label>
          <input
            type="number"
            name="priceMonthly"
            value={form.priceMonthly}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            Yıllık Fiyat (₺)
          </label>
          <input
            type="number"
            name="priceYearly"
            value={form.priceYearly}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Boş bırakılırsa otomatik"
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Deneme Süresi (gün)
        </label>
        <input
          type="number"
          name="trialDays"
          value={form.trialDays}
          onChange={handleChange}
          min="0"
          max="90"
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
        />
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
        {loading ? "Oluşturuluyor…" : "Paket Oluştur"}
      </button>
    </form>
  );
}
