"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  X,
  ScanBarcode,
  Package,
  Tag,
  Layers,
  BadgeDollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { findPartByBarcode, quickStockEntry } from "@/lib/actions/inventory.actions";

// @zxing/library is not SSR-compatible — load with ssr: false
const BarcodeScanner = dynamic(
  () => import("@/components/dashboard/inventory/BarcodeScanner"),
  { ssr: false, loading: () => <BarcodeScannerSkeleton /> }
);

function BarcodeScannerSkeleton() {
  return (
    <div className="w-full aspect-video bg-slate-100 dark:bg-gray-700 rounded-2xl animate-pulse flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-spin" />
    </div>
  );
}

interface FoundPart {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  category?: { id: string; name: string } | null;
}

type DialogStep = "scan" | "part-found" | "part-not-found" | "confirm" | "success" | "error";

interface BarcodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BarcodeScannerDialog({
  open,
  onClose,
  onSuccess,
}: BarcodeScannerDialogProps) {
  const [step, setStep] = useState<DialogStep>("scan");
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [foundPart, setFoundPart] = useState<FoundPart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

  const handleScan = useCallback(
    async (barcode: string) => {
      if (isLoading) return;
      setScannedBarcode(barcode);
      setIsLoading(true);

      try {
        const result = await findPartByBarcode(barcode);

        if ("error" in result && result.error) {
          setErrorMessage(result.error);
          setStep("error");
          return;
        }

        const part = result.data?.part;

        if (!part) {
          setStep("part-not-found");
          return;
        }

        setFoundPart(part as FoundPart);
        setQuantity(1);
        setReason("");
        setStep("part-found");
      } catch {
        setErrorMessage("Barkod araması sırasında bir hata oluştu.");
        setStep("error");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleStockEntry = async () => {
    if (!foundPart || quantity <= 0) return;
    setIsLoading(true);

    try {
      const result = await quickStockEntry(
        foundPart.id,
        quantity,
        reason || "Barkod ile Hızlı Stok Girişi"
      );

      if ("error" in result && result.error) {
        setErrorMessage(result.error);
        setStep("error");
        return;
      }

      setSuccessMessage(
        `${foundPart.name} için ${quantity} ${foundPart.unit} stok girişi başarıyla yapıldı.`
      );
      setStep("success");
      onSuccess?.();
    } catch {
      setErrorMessage("Stok girişi sırasında bir hata oluştu.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("scan");
    setScannedBarcode("");
    setFoundPart(null);
    setQuantity(1);
    setReason("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!open) return null;

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
            <ScanBarcode className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">Barkod ile Stok Girişi</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP: scan */}
          {step === "scan" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Kamera ile barkod okutun veya parça numarasını manuel girin.
              </p>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="ml-3 text-sm font-bold text-slate-600 dark:text-slate-400">Parça aranıyor...</span>
                </div>
              ) : (
                <BarcodeScanner onScan={handleScan} />
              )}
            </div>
          )}

          {/* STEP: part-found */}
          {step === "part-found" && foundPart && (
            <div className="space-y-5">
              {/* Part card */}
              <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm leading-tight">{foundPart.name}</h3>
                    <span className="inline-block mt-1 text-[10px] font-black tracking-widest text-slate-500 bg-slate-200 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">
                      {foundPart.partNumber}
                    </span>
                  </div>
                  <Package className="w-8 h-8 text-amber-400 shrink-0" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Layers className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{foundPart.currentStock}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Mevcut Stok</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Tag className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{foundPart.unit}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Birim</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
                      <BadgeDollarSign className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{formatMoney(foundPart.sellingPrice)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Satış Fiyatı</p>
                  </div>
                </div>

                {foundPart.category && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Kategori: {foundPart.category.name}
                  </p>
                )}
              </div>

              {/* Quantity input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">
                  Eklenecek Miktar
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
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center px-4 py-2.5 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm font-black focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reason input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">
                  Açıklama <span className="text-slate-400 dark:text-slate-500 font-medium normal-case">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Tedarikçi teslimatı"
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Yeni Tarama
                </button>
                <button
                  type="button"
                  onClick={handleStockEntry}
                  disabled={isLoading || quantity <= 0}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Stok Ekle
                </button>
              </div>
            </div>
          )}

          {/* STEP: part-not-found */}
          {step === "part-not-found" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Parça Bulunamadı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-bold text-slate-700 dark:text-gray-300">{scannedBarcode}</span> barkoduna sahip
                  parça sistemde kayıtlı değil.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard/inventory?new=true"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Parça Oluştur
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Tekrar Tara
                </button>
              </div>
            </div>
          )}

          {/* STEP: success */}
          {step === "success" && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Stok Girişi Başarılı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{successMessage}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Yeni Tarama
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
