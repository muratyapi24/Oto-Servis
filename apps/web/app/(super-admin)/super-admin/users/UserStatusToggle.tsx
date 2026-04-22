"use client"

import { useState, useTransition } from "react"
import { updateUserStatus } from "@/lib/actions/superadmin.actions"

interface UserStatusToggleProps {
  userId: string
  isActive: boolean
}

export default function UserStatusToggle({ userId, isActive: initialIsActive }: UserStatusToggleProps) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await updateUserStatus(userId, !isActive)
      if (!("error" in result)) {
        setIsActive((prev) => !prev)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? "Pasife Al" : "Aktife Al"}
      className={`
        status-badge transition-colors cursor-pointer disabled:opacity-50
        ${isActive
          ? "bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed/80"
          : "bg-error/10 text-error hover:bg-error/20"
        }
      `}
    >
      {isPending ? (
        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      )}
      {isActive ? "Aktif" : "Pasif"}
    </button>
  )
}
