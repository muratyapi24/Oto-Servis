"use client";

import { useEffect, useState } from "react";

interface Location {
  id: string;
  name: string;
  isDefault: boolean;
}

const LOCATION_KEY = "bst_selected_location";

export function LocationSelector({ locations }: { locations: Location[] }) {
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_KEY);
    const defaultLoc = locations.find((l) => l.isDefault);
    setSelected(stored ?? defaultLoc?.id ?? locations[0]?.id ?? "");
  }, [locations]);

  function handleChange(id: string) {
    setSelected(id);
    localStorage.setItem(LOCATION_KEY, id);
    // Sayfayı yenile — server component'ler yeni lokasyonla render edilsin
    window.location.reload();
  }

  if (locations.length <= 1) return null;

  return (
    <select
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
      aria-label="Lokasyon seç"
    >
      <option value="">Tüm Lokasyonlar</option>
      {locations.map((loc) => (
        <option key={loc.id} value={loc.id}>
          {loc.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Server-side'da seçili lokasyonu cookie'den oku
 * (Client-side localStorage yerine cookie kullanmak için)
 */
export function getSelectedLocationId(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${LOCATION_KEY}=([^;]+)`));
  return match?.[1] ?? null;
}
