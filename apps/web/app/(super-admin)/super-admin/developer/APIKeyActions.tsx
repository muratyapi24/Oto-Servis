"use client"
import { useState, useTransition } from "react"
import { revokeAPIKey } from "@/lib/actions/superadmin.actions"

export default function APIKeyActions({ keyId, isActive }: { keyId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [revoked, setRevoked] = useState(!isActive)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleRevoke() {
    if (!showConfirm) { setShowConfirm(true); return }
    startTransition(async () => {
      await revokeAPIKey(keyId)
      setRevoked(true)
      setShowConfirm(false)
    })
  }

  if (revoked) return <span className="text-[10px] text-outline">İptal Edildi</span>

  return (
    <div className="flex items-center gap-2">
      {showConfirm ? (
        <>
          <button onClick={handleRevoke} disabled={isPending} className="text-[10px] font-bold text-error hover:underline">
            {isPending ? "..." : "ONAYLA"}
          </button>
          <button onClick={() => setShowConfirm(false)} className="text-[10px] font-bold text-outline hover:underline">İPTAL</button>
        </>
      ) : (
        <button onClick={handleRevoke} className="text-[10px] font-bold text-error hover:underline">İPTAL ET</button>
      )}
    </div>
  )
}
