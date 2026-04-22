"use client"

import { useState, useTransition } from "react"
import { purgeArchivedData } from "@/lib/actions/superadmin.actions"

export default function PurgeConfirmDialog({
  recordId,
  recordType,
}: {
  recordId: string
  recordType: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return <span className="text-[10px] text-on-tertiary-fixed-variant font-bold">Silindi</span>

  function handlePurge() {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }
    startTransition(async () => {
      await purgeArchivedData({ olderThanDays: 0, types: [recordType] })
      setDone(true)
      setShowConfirm(false)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {showConfirm ? (
        <>
          <span className="text-[10px] text-error font-bold">Emin misiniz?</span>
          <button
            onClick={handlePurge}
            disabled={isPending}
            className="text-[10px] font-bold text-error hover:underline"
          >
            {isPending ? "..." : "SİL"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-[10px] font-bold text-outline hover:underline"
          >
            İPTAL
          </button>
        </>
      ) : (
        <button
          onClick={handlePurge}
          className="text-[10px] font-bold text-error hover:underline"
        >
          TEMİZLE
        </button>
      )}
    </div>
  )
}
