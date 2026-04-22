"use client";

import { useState } from "react";
import { blockThreat } from "@/lib/actions/superadmin.actions";

interface ThreatActionMenuProps {
  threatId: string;
}

export default function ThreatActionMenu({ threatId }: ThreatActionMenuProps) {
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  async function handleBlock() {
    setBlocking(true);
    const result = await blockThreat(threatId);
    if ("success" in result) {
      setBlocked(true);
    }
    setBlocking(false);
  }

  if (blocked) {
    return (
      <span className="bg-error/10 text-error px-2 py-0.5 rounded text-[10px] font-bold uppercase">
        Engellendi
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleBlock}
        disabled={blocking}
        className="bg-error text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase hover:bg-error/80 transition-colors disabled:opacity-50"
      >
        {blocking ? "..." : "Engelle"}
      </button>
      <button className="border border-outline/30 text-outline px-2 py-0.5 rounded text-[10px] font-bold uppercase hover:bg-surface-container-low transition-colors">
        İzle
      </button>
    </div>
  );
}
