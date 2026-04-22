"use client"
import { useState, useTransition } from "react"
import { toggleAutomationWorkflow } from "@/lib/actions/superadmin.actions"

export default function WorkflowToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleAutomationWorkflow(id)
      setActive(!active)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        active ? "bg-primary" : "bg-outline/30"
      } disabled:opacity-50`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        active ? "translate-x-4" : "translate-x-1"
      }`} />
    </button>
  )
}
