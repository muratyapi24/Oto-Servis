"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateCoupon } from "@/lib/actions/superadmin.actions";

type Props = {
  couponId: string;
};

export default function CouponDeactivateButton({ couponId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDeactivate() {
    if (!confirm("Bu kuponu devre dışı bırakmak istediğinizden emin misiniz?")) {
      return;
    }
    setLoading(true);
    await deactivateCoupon(couponId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDeactivate}
      disabled={loading}
      className="text-[10px] font-bold text-error hover:underline disabled:opacity-50 transition-opacity"
    >
      {loading ? "…" : "Deaktive Et"}
    </button>
  );
}
