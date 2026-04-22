"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAddon } from "@/lib/actions/superadmin.actions";

type Props = {
  addonId: string;
  isActive: boolean;
};

export default function AddonToggleButton({ addonId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = isActive ? "devre dışı bırakmak" : "aktive etmek";
    if (!confirm(`Bu hizmeti ${action} istediğinizden emin misiniz?`)) {
      return;
    }
    setLoading(true);
    await updateAddon(addonId, { isActive: !isActive });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-[10px] font-bold hover:underline disabled:opacity-50 transition-opacity ${
        isActive ? "text-error" : "text-primary"
      }`}
    >
      {loading ? "…" : isActive ? "Deaktive Et" : "Aktive Et"}
    </button>
  );
}
