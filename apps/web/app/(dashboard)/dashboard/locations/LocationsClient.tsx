"use client";

import { useState } from "react";
import { createLocation, deleteLocation } from "@/lib/actions/location.actions";

interface Location {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  isDefault: boolean;
  _count: { serviceOrders: number; appointments: number };
}

interface Report {
  locations: { id: string; name: string; city: string | null; serviceOrderCount: number; appointmentCount: number; totalRevenue: number }[];
  totals: { serviceOrderCount: number; appointmentCount: number; totalRevenue: number };
}

export function LocationsClient({ locations, report }: { locations: Location[]; report: Report | null }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const result = await createLocation({ name, city, phone, isDefault });
    if ("error" in result) {
      setError(result.error ?? "Hata oluştu");
    } else {
      setShowForm(false);
      setName(""); setCity(""); setPhone(""); setIsDefault(false);
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu lokasyonu silmek istediğinize emin misiniz?")) return;
    await deleteLocation(id);
    window.location.reload();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lokasyon / Şube Yönetimi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Yeni Lokasyon
        </button>
      </div>

      {/* Konsolide Özet */}
      {report && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{report.totals.serviceOrderCount}</div>
            <div className="text-sm text-blue-600">Toplam Servis</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{report.totals.appointmentCount}</div>
            <div className="text-sm text-green-600">Toplam Randevu</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              ₺{report.totals.totalRevenue.toLocaleString("tr-TR")}
            </div>
            <div className="text-sm text-purple-600">Toplam Gelir</div>
          </div>
        </div>
      )}

      {/* Yeni Lokasyon Formu */}
      {showForm && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Yeni Lokasyon Ekle</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Lokasyon adı *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Şehir"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Varsayılan lokasyon
            </label>
          </div>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Lokasyon Listesi */}
      <div className="space-y-3">
        {locations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Henüz lokasyon eklenmemiş. İlk lokasyonunuzu ekleyin.
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{loc.name}</span>
                  {loc.isDefault && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Varsayılan</span>
                  )}
                  {!loc.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Pasif</span>
                  )}
                </div>
                {loc.city && <div className="text-sm text-gray-500">{loc.city}</div>}
                <div className="text-xs text-gray-400 mt-1">
                  {loc._count.serviceOrders} servis · {loc._count.appointments} randevu
                </div>
              </div>
              {!loc.isDefault && (
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Sil
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
