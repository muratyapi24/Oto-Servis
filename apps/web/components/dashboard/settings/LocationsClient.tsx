"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Plus, Trash2 } from "lucide-react";
import { createLocation, deleteLocation } from "@/lib/actions/location.actions";

type Location = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  isDefault: boolean;
  _count: { serviceOrders: number; appointments: number };
};

type Report = {
  locations: Array<{
    id: string;
    name: string;
    city: string | null;
    serviceOrderCount: number;
    appointmentCount: number;
    totalRevenue: number;
  }>;
  totals: { serviceOrderCount: number; appointmentCount: number; totalRevenue: number };
};

export function LocationsClient({
  locations,
  report,
}: {
  locations: Location[];
  report: Report | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

  async function handleCreate() {
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    const result = await createLocation({ name, city, phone, isDefault });

    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setName("");
      setCity("");
      setPhone("");
      setIsDefault(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu lokasyonu silmek istediğinize emin misiniz?")) return;

    const result = await deleteLocation(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {report && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Toplam Servis</p>
            <p className="mt-2 text-3xl font-black text-blue-700 dark:text-blue-400">{report.totals.serviceOrderCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Toplam Randevu</p>
            <p className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">{report.totals.appointmentCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Toplam Gelir</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatMoney(report.totals.totalRevenue)}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-gray-700 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Şube Listesi</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Stok, randevu ve servis kayıtlarında kullanılan lokasyonları yönetin.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            Yeni Şube
          </button>
        </div>

        {showForm && (
          <div className="border-b border-slate-100 bg-slate-50 dark:bg-gray-800/50/70 p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                placeholder="Şube adı *"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                placeholder="Şehir"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                placeholder="Telefon"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                />
                Varsayılan
              </label>
            </div>
            {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {locations.length === 0 ? (
            <div className="py-14 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">Henüz şube tanımlanmamış.</p>
            </div>
          ) : (
            locations.map((location) => (
              <div key={location.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white">{location.name}</h3>
                      {location.isDefault && (
                        <span className="rounded-lg bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-black text-blue-700">Varsayılan</span>
                      )}
                      {!location.isActive && (
                        <span className="rounded-lg bg-slate-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-black text-slate-500">Pasif</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {[location.city, location.phone].filter(Boolean).join(" · ") || "Adres bilgisi girilmemiş"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                      {location._count.serviceOrders} servis · {location._count.appointments} randevu
                    </p>
                  </div>
                </div>

                {!location.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDelete(location.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 md:self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
