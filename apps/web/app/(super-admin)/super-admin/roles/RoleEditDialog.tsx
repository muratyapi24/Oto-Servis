"use client"

import { useState, useTransition } from "react"
import { updateRolePermissions } from "@/lib/actions/superadmin.actions"

interface RoleEditDialogProps {
  roleName: string
  permissions: string[]
  allPermissions: string[]
}

export default function RoleEditDialog({ roleName, permissions, allPermissions }: RoleEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(permissions)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function togglePermission(perm: string) {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateRolePermissions(roleName, selected)
      if ("error" in result) {
        setMessage({ type: "error", text: result.error || "Bir hata oluştu" })
      } else {
        setMessage({ type: "success", text: "İzinler başarıyla güncellendi." })
        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
        }, 1200)
      }
    })
  }

  function handleClose() {
    setIsOpen(false)
    setSelected(permissions)
    setMessage(null)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">edit</span>
        Düzenle
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Rol İzinlerini Düzenle</h3>
                  <p className="text-[10px] text-outline font-mono">{roleName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 max-h-80 overflow-y-auto">
              <p className="text-[10px] text-outline mb-3 font-mono uppercase tracking-wider">
                {selected.length} / {allPermissions.length} izin seçili
              </p>
              <div className="space-y-1.5">
                {allPermissions.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-3 px-3 py-2 rounded hover:bg-surface-container-low cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-[11px] font-mono text-on-surface group-hover:text-primary transition-colors">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-outline/20 flex items-center justify-between">
              {message && (
                <span
                  className={`text-[10px] font-bold ${
                    message.type === "success" ? "text-tertiary-fixed" : "text-error"
                  }`}
                >
                  {message.text}
                </span>
              )}
              {!message && <span />}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-[10px] font-bold text-outline border border-outline/20 rounded hover:bg-surface-container transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
