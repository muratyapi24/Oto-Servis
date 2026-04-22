"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import ReturnDialog from "@/components/dashboard/inventory/ReturnDialog";

interface Part {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ReturnPartButtonProps {
  serviceOrderId: string;
  parts: Part[];
  suppliers: Supplier[];
}

export default function ReturnPartButton({
  serviceOrderId,
  parts,
  suppliers,
}: ReturnPartButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Parça İade Et
      </button>

      <ReturnDialog
        open={open}
        onClose={() => setOpen(false)}
        type="service"
        serviceOrderId={serviceOrderId}
        parts={parts}
        suppliers={suppliers}
        onSuccess={() => setOpen(false)}
      />
    </>
  );
}
