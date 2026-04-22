"use client";

import { useState } from "react";
import { createCoupon } from "@/lib/actions/superadmin.actions";

type DiscountType = "PERCENT" | "FIXED";

type FormState = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  validUntil: string;
  usageLimit: string;
};

const INITIAL_STATE: FormState = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  validUntil: "",
  usageLimit: "100",
};

export default function CouponCreateForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createCoupon({
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      validUntil: new Date(form.validUntil),
      usageLimit: parseInt(form.usageLimit, 10),
    });

    if ("error" in result) {
      setMessage({ type: "error", text: result.error || "Bir hata oluştu" });
    } else {
      setMessage({ type: "success", text: "Kupon başarıyla oluşturuldu." });
      setForm(INITIAL_STATE);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Kupon Kodu
        </label>
        <input
          type="text"
          name="code"
          value={form.code}
          onChange={handleChange}
          required
          placeholder="örn. WELCOME20"
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary uppercase"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            İndirim Tipi
          </label>
          <select
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="PERCENT">Yüzde (%)</option>
            <option value="FIXED">Sabit Tutar (₺)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            İndirim Değeri
          </label>
          <input
            type="number"
            name="discountValue"
            value={form.discountValue}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder={form.discountType === "PERCENT" ? "20" : "50.00"}
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            Geçerlilik Tarihi
          </label>
          <input
            type="date"
            name="validUntil"
            value={form.validUntil}
            onChange={handleChange}
            required
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-outline mb-1">
            Kullanım Limiti
          </label>
          <input
            type="number"
            name="usageLimit"
            value={form.usageLimit}
            onChange={handleChange}
            required
            min="1"
            className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
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
        {loading ? "Oluşturuluyor…" : "Kupon Oluştur"}
      </button>
    </form>
  );
}
