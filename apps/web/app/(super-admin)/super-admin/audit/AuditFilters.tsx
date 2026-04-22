"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function AuditFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [module, setModule] = useState(searchParams.get("module") || "")
  const [level, setLevel] = useState(searchParams.get("level") || "")

  function applyFilters() {
    const params = new URLSearchParams()
    if (module) params.set("module", module)
    if (level) params.set("level", level)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  function clearFilters() {
    setModule("")
    setLevel("")
    router.push("?page=1")
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline/20 rounded">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-outline uppercase">Modül:</label>
        <input
          type="text"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder="TENANT-MGMT..."
          className="bg-surface-container-low border border-outline/10 rounded px-2 py-1 text-[11px] focus:ring-1 focus:ring-primary outline-none w-36"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-outline uppercase">Seviye:</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-surface-container-low border border-outline/10 rounded px-2 py-1 text-[11px] focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">Tümü</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>
      <button onClick={applyFilters} className="px-3 py-1 bg-primary text-white rounded text-[10px] font-bold uppercase">Filtrele</button>
      <button onClick={clearFilters} className="px-3 py-1 border border-outline/20 text-outline rounded text-[10px] font-bold uppercase hover:bg-surface-container">Temizle</button>
    </div>
  )
}
