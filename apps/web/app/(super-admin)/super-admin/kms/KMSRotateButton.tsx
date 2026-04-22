"use client"
import { useState, useTransition } from "react"
import { rotateKMSKey } from "@/lib/actions/superadmin.actions"

export default function KMSRotateButton({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  if (status === "EXPIRED") return <span className="text-[10px] text-outline">Süresi Dolmuş</span>
  if (done) return <span className="text-[10px] text-on-tertiary-fixed-variant font-bold">Rotasyon Başlatıldı</span>

  function handleRotate() {
    if (!showConfirm) { setShowConfirm(true); return }
    startTransition(async () => {
      await rotateKMSKey(id)
      setDone(true)
      setShowConfirm(false)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {showConfirm ? (
        <>
          <span className="text-[10px] text-error font-bold">Emin misiniz?</span>
          <button onClick={handleRotate} disabled={isPending} className="text-[10px] font-bold text-error hover:underline">
            {isPending ? "..." : "EVET"}
          </button>
          <button onClick={() => setShowConfirm(false)} className="text-[10px] font-bold text-outline hover:underline">HAYIR</button>
        </>
      ) : (
        <button onClick={handleRotate} className="text-[10px] font-bold text-primary hover:underline">ROTASYON</button>
      )}
    </div>
  )
}
