"use client"

import { useRouter, useSearchParams } from "next/navigation"

const ROLES = [
  { value: "", label: "Tüm Roller" },
  { value: "SUPER_ADMIN", label: "Süper Admin" },
  { value: "TENANT_ADMIN", label: "Firma Yöneticisi" },
  { value: "MECHANIC", label: "Teknisyen" },
  { value: "RECEPTIONIST", label: "Resepsiyonist" },
  { value: "ACCOUNTANT", label: "Muhasebeci" },
]

export default function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentRole = searchParams.get("role") || ""
  const currentFilter = searchParams.get("filter") || "all"

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 on filter change
    params.delete("page")
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Arama inputu */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          defaultValue={currentSearch}
          onChange={(e) => updateParams("search", e.target.value)}
          className="bg-surface-container-low border border-outline/10 rounded py-1 pl-9 pr-3 w-72 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          placeholder="İsim, e-posta veya ID'ye göre ara..."
        />
      </div>

      {/* Rol filtresi */}
      <select
        value={currentRole}
        onChange={(e) => updateParams("role", e.target.value)}
        className="bg-surface-container-low border border-outline/10 rounded py-1 px-3 text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Aktif filtre göstergesi */}
      {(currentSearch || currentRole) && (
        <button
          onClick={() => {
            const params = new URLSearchParams()
            if (currentFilter !== "all") params.set("filter", currentFilter)
            router.push(`?${params.toString()}`)
          }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-error bg-error/10 rounded hover:bg-error/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
          Filtreleri Temizle
        </button>
      )}
    </div>
  )
}
