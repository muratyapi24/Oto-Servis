"use client";

import { useState } from "react";
import { createAddon } from "@/lib/actions/superadmin.actions";

type FormState = {
  name: string;
  description: string;
  price: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  description: "",
  price: "",
};

export default function AddonCreateForm() {
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

    const result = await createAddon({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
    });

    if ("error" in result) {
      setMessage({ type: "error", text: result.error || "Bir hata oluştu" });
    } else {
      setMessage({ type: "success", text: "Ek hizmet başarıyla oluşturuldu." });
      setForm(INITIAL_STATE);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Hizmet Adı
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="örn. SMS Paketi"
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
          placeholder="Hizmet açıklaması…"
          className="w-full border border-outline/30 rounded px-3 py-2 text-xs bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase text-outline mb-1">
          Fiyat (₺/ay)
        </label>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
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
        {loading ? "Oluşturuluyor…" : "Hizmet Oluştur"}
      </button>
    </form>
  );
}
