"use client";

import { useState } from "react";
import { adjustStock } from "@/lib/actions/inventory.actions";
import { Target, X, AlertTriangle, Save } from "lucide-react";

interface StockAdjustDialogProps {
  part: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockAdjustDialog({ part, onClose, onSuccess }: StockAdjustDialogProps) {
  const [quantity, setQuantity] = useState<number>(part.currentStock);
  const [reason, setReason] = useState<string>("Stok sayımı düzeltmesi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await adjustStock(part.id, Number(quantity), reason);
    setLoading(false);
    
    if (res.error) {
      setError(res.error);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Stok Düzeltme</h2>
              <p className="text-xs text-slate-500 font-medium">Manuel sayım ve stok ayarlama</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-sm font-bold text-slate-800">{part.name}</p>
            <p className="text-xs text-slate-500 mt-1">Stok Kodu: {part.partNumber} / Mevcut Stok: {part.currentStock} {part.unit}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Yeni Gerçek Stok Miktarı</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Değişim Nedeni</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-slate-800"
                placeholder="Örn: Sayım eksiği, hatalı giriş düzeltme..."
                required
              />
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || quantity === part.currentStock}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
