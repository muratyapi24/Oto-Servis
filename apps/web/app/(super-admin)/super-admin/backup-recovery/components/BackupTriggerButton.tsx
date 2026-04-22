"use client";

import { useState } from "react";
import { triggerBackup } from "@/lib/actions/superadmin.actions";

export default function BackupTriggerButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleBackup() {
    setPending(true);
    setMessage(null);
    const result = await triggerBackup();
    if ("success" in result) {
      setMessage(result.success || null);
    } else if ("error" in result) {
      setMessage(result.error || null);
    }
    setPending(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleBackup}
        disabled={pending}
        className="bg-primary text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Yedekleniyor..." : "Manuel Yedek Al"}
      </button>
      {message && (
        <span className="text-xs text-on-surface-variant">{message}</span>
      )}
    </div>
  );
}
