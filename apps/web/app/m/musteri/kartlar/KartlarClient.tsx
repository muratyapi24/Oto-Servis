"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Card {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export default function KartlarClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/musteri/kartlar");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yüklenemedi.");
      setCards(data.cards ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  async function handleDelete(cardId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/musteri/kartlar/${cardId}`, { method: "DELETE" });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setDeleteConfirm(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  const BRAND_ICONS: Record<string, string> = {
    visa: "VISA",
    mastercard: "MC",
    amex: "AMEX",
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Kayıtlı Kartlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ödeme yöntemleriniz</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00236f] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Kart Ekle
        </button>
      </div>

      {/* Kart Ekleme Formu (Stripe Elements placeholder) */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-bold text-[#00236f]">Yeni Kart Ekle</p>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 text-center py-4">
              Stripe Elements burada yüklenecek.
              <br />
              <span className="text-[10px]">(Stripe publishable key gereklidir)</span>
            </p>
          </div>
          {addSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Kart başarıyla eklendi.
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-500">Kayıtlı kart yok</p>
          <p className="text-sm text-gray-400">Kart ekleyerek hızlı ödeme yapabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4"
            >
              <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">
                  {BRAND_ICONS[card.brand.toLowerCase()] ?? card.brand.toUpperCase().slice(0, 4)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">•••• •••• •••• {card.last4}</p>
                <p className="text-xs text-gray-400">
                  Son kullanma: {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirm(card.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Silme Onay Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800">Kartı Sil</h3>
            <p className="text-sm text-gray-500">Bu kartı silmek istediğinizden emin misiniz?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
