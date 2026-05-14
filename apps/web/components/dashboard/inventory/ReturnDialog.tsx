"use client";

import { useState } from "react";
import {
  X,
  RotateCcw,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  returnPartFromService,
  returnPartToSupplier,
} from "@/lib/actions/inventory.actions";

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

interface ReturnDialogProps {
  open: boolean;
  onClose: () => void;
  type: "service" | "supplier";
  serviceOrderId?: string;
  parts: Part[];
  suppliers?: Supplier[];
  onSuccess?: () => void;
}

type DialogStep = "form" | "success" | "error";

export default function ReturnDialog({
  open,
  onClose,
  type,
  serviceOrderId,
  parts,
  suppliers = [],
  onSuccess,
}: ReturnDialogProps) {
  const [step, setStep] = useState<DialogStep>("form");
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null;
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) ?? null;

  const handleReset = () => {
    setStep("form");
    setSelectedPartId("");
    setQuantity(1);
    setSelectedSupplierId("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (type === "service") {
        if (!serviceOrderId) {
          setErrorMessage("Servis emri ID bulunamadı.");
          setStep("error");
          return;
        }

        const result = await returnPartFromService({
          partId: selectedPartId,
          quantity,
          serviceOrderId,
        });

        if ("error" in result && result.error) {
          setErrorMessage(result.error);
          setStep("error");
          return;
        }

        setSuccessMessage(
          `${selectedPart?.name ?? "Parça"} için ${quantity} ${selectedPart?.unit ?? "adet"} servis iadesi başarıyla kaydedildi.`
        );
      } else {
        if (!selectedSupplierId) {
          setErrorMessage("Lütfen bir tedarikçi seçin.");
          setStep("error");
          return;
        }

        const result = await returnPartToSupplier({
          partId: selectedPartId,
          quantity,
          supplierId: selectedSupplierId,
          supplierName: selectedSupplier?.name ?? "",
        });

        if ("error" in result && result.error) {
          setErrorMessage(result.error);
          setStep("error");
          return;
        }

        setSuccessMessage(
          `${selectedPart?.name ?? "Parça"} için ${quantity} ${selectedPart?.unit ?? "adet"} tedarikçi iadesi başarıyla kaydedildi.`
        );
      }

      setStep("success");
      onSuccess?.();
    } catch {
      setErrorMessage("İade işlemi sırasında bir hata oluştu.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const isServiceReturn = type === "service";
  const title = isServiceReturn ? "Servis → Depo İadesi" : "Tedarikçiye İade";
  const accentColor = isServiceReturn ? "amber" : "blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RotateCcw
              className={`w-5 h-5 ${isServiceReturn ? "text-amber-500" : "text-blue-500"}`}
            />
            <h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP: form */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Servis emri bilgisi (sadece servis iadesi için) */}
              {isServiceReturn && serviceOrderId && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                      Servis Emri
                    </p>
                    <p className="text-sm font-bold text-amber-900">#{serviceOrderId}</p>
                  </div>
                </div>
              )}

              {/* Parça seçimi */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">
                  İade Edilecek Parça
                </label>
                <div className="relative">
                  <select
                    value={selectedPartId}
                    onChange={(e) => {
                      setSelectedPartId(e.target.value);
                      setQuantity(1);
                    }}
                    required
                    className="w-full appearance-none px-4 py-2.5 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none pr-10"
                  >
                    <option value="">Parça seçin...</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name} ({part.partNumber}) — Stok: {part.currentStock}{" "}
                        {part.unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Seçilen parça bilgisi */}
              {selectedPart && (
                <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {selectedPart.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Mevcut Stok: {selectedPart.currentStock} {selectedPart.unit}
                    </p>
                  </div>
                </div>
              )}

              {/* Miktar */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">
                  İade Miktarı
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={
                      isServiceReturn
                        ? undefined
                        : selectedPart?.currentStock ?? undefined
                    }
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="flex-1 text-center px-4 py-2.5 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm font-black focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        !isServiceReturn && selectedPart
                          ? Math.min(selectedPart.currentStock, q + 1)
                          : q + 1
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                {!isServiceReturn && selectedPart && quantity > selectedPart.currentStock && (
                  <p className="text-xs text-red-500 font-medium">
                    Mevcut stoktan fazla miktar girilemez ({selectedPart.currentStock}{" "}
                    {selectedPart.unit})
                  </p>
                )}
              </div>

              {/* Tedarikçi seçimi (sadece tedarikçi iadesi için) */}
              {!isServiceReturn && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">
                    Tedarikçi
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      required
                      className="w-full appearance-none px-4 py-2.5 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none pr-10"
                    >
                      <option value="">Tedarikçi seçin...</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Sistemde kayıtlı tedarikçi bulunamadı.
                    </p>
                  )}
                </div>
              )}

              {/* Özet */}
              {selectedPart && (isServiceReturn || selectedSupplierId) && (
                <div
                  className={`rounded-xl p-3 border text-xs font-medium ${
                    isServiceReturn
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  {isServiceReturn ? (
                    <>
                      <strong>{quantity} {selectedPart.unit}</strong> {selectedPart.name} depoya iade edilecek.
                      Stok <strong>{selectedPart.currentStock}</strong> →{" "}
                      <strong>{selectedPart.currentStock + quantity}</strong> olacak.
                    </>
                  ) : (
                    <>
                      <strong>{quantity} {selectedPart.unit}</strong> {selectedPart.name},{" "}
                      <strong>{selectedSupplier?.name}</strong> tedarikçisine iade edilecek.
                      Stok <strong>{selectedPart.currentStock}</strong> →{" "}
                      <strong>{selectedPart.currentStock - quantity}</strong> olacak.
                    </>
                  )}
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !selectedPartId ||
                    quantity <= 0 ||
                    (!isServiceReturn && !selectedSupplierId) ||
                    (!isServiceReturn &&
                      selectedPart != null &&
                      quantity > selectedPart.currentStock)
                  }
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isServiceReturn
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  İadeyi Onayla
                </button>
              </div>
            </form>
          )}

          {/* STEP: success */}
          {step === "success" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">İade Başarılı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{successMessage}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Yeni İade
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-black hover:bg-emerald-600 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {/* STEP: error */}
          {step === "error" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Hata Oluştu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Tekrar Dene
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-red-100 text-red-700 dark:text-red-400 rounded-xl text-sm font-black hover:bg-red-200 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
