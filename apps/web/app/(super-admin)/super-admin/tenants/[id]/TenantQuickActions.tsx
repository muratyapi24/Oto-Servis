"use client"

import { useState, useTransition } from "react"
import { updateTenantStatus } from "@/lib/actions/superadmin.actions"

export default function TenantQuickActions({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"ACTIVE" | "SUSPENDED" | null>(null)

  function requestStatusChange(newStatus: "ACTIVE" | "SUSPENDED") {
    setPendingStatus(newStatus)
    setShowConfirm(true)
  }

  function confirmChange() {
    if (!pendingStatus) return
    startTransition(async () => {
      await updateTenantStatus(tenantId, pendingStatus)
      setStatus(pendingStatus)
      setShowConfirm(false)
      setPendingStatus(null)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {showConfirm ? (
        <div className="flex items-center gap-2 bg-error/5 border border-error/20 rounded px-3 py-1">
          <span className="text-[10px] text-error font-bold">
            {pendingStatus === "SUSPENDED"
              ? "Askıya almak istediğinizden emin misiniz?"
              : "Aktif etmek istediğinizden emin misiniz?"}
          </span>
          <button
            onClick={confirmChange}
            disabled={isPending}
            className="text-[10px] font-bold text-error hover:underline"
          >
            {isPending ? "..." : "EVET"}
          </button>
          <button
            onClick={() => {
              setShowConfirm(false)
              setPendingStatus(null)
            }}
            className="text-[10px] font-bold text-outline hover:underline"
          >
            HAYIR
          </button>
        </div>
      ) : (
        <>
          {status === "ACTIVE" ? (
            <button
              onClick={() => requestStatusChange("SUSPENDED")}
              className="flex items-center gap-1 px-3 py-1 border border-error/30 text-error rounded text-[10px] font-bold hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">pause_circle</span>
              Askıya Al
            </button>
          ) : (
            <button
              onClick={() => requestStatusChange("ACTIVE")}
              className="flex items-center gap-1 px-3 py-1 border border-tertiary-fixed/30 text-on-tertiary-fixed-variant rounded text-[10px] font-bold hover:bg-tertiary-fixed/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">play_circle</span>
              Aktif Et
            </button>
          )}
        </>
      )}
    </div>
  )
}
