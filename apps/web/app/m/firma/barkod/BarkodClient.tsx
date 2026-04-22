"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Search,
  Package,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";

interface PartResult {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  sellingPrice: number;
  unit: string;
}

type CameraState = "idle" | "requesting" | "active" | "denied";

export default function BarkodClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<PartResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Kamerayı temizle
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setCameraState("denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
  }

  const searchPart = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/mobile/firma/stok?barcode=${encodeURIComponent(code.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arama başarısız.");
      if (data.part) {
        setResult(data.part);
      } else {
        setNotFound(true);
      }
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    searchPart(manualCode);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Barkod Tarayıcı</h1>
        <p className="text-sm text-gray-500 mt-0.5">Parça barkodunu okutarak stok araması yapın</p>
      </div>

      {/* Kamera Bölümü */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {cameraState === "idle" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-[#00236f]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">Kamera ile Barkod Tara</p>
              <p className="text-xs text-gray-400 mt-1">Kamera erişimi gereklidir</p>
            </div>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              <Camera className="w-4 h-4" />
              Kamerayı Aç
            </button>
          </div>
        )}

        {cameraState === "requesting" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00236f]" />
            <p className="text-sm text-gray-500">Kamera izni isteniyor...</p>
          </div>
        )}

        {cameraState === "active" && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              playsInline
              muted
            />
            {/* Tarama çerçevesi */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-[#6cf8bb] rounded-lg opacity-80">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#6cf8bb] rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#6cf8bb] rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#6cf8bb] rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#6cf8bb] rounded-br" />
              </div>
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <p className="text-xs text-white bg-black/40 inline-block px-3 py-1 rounded-full">
                Barkodu çerçeve içine getirin
              </p>
            </div>
          </div>
        )}

        {cameraState === "denied" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 px-6 text-center">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <p className="text-sm font-bold text-gray-700">Kamera erişimi reddedildi</p>
            <p className="text-xs text-gray-400">
              Tarayıcı ayarlarından kamera iznini etkinleştirin veya aşağıdan manuel arama yapın.
            </p>
          </div>
        )}
      </div>

      {/* Manuel Arama */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          Manuel Barkod / Parça Kodu Ara
        </p>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Barkod veya parça kodu girin..."
            className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
          />
          <button
            type="submit"
            disabled={searching || !manualCode.trim()}
            className="px-4 py-3 bg-[#00236f] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Arama Sonucu */}
      {searchError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {searchError}
        </div>
      )}

      {notFound && (
        <div className="flex flex-col items-center justify-center py-8 space-y-2 bg-gray-50 rounded-2xl border border-gray-200">
          <Package className="w-8 h-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">Parça bulunamadı</p>
          <p className="text-xs text-gray-400">Farklı bir barkod veya parça kodu deneyin.</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-[#006c49] shadow-sm overflow-hidden">
          <div className="bg-[#006c49] text-white px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-bold">Parça Bulundu</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-lg font-black text-gray-900">{result.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{result.partNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stok</p>
                <p className={`text-lg font-black ${result.currentStock <= 0 ? "text-red-600" : "text-gray-900"}`}>
                  {result.currentStock} {result.unit}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Satış Fiyatı</p>
                <p className="text-lg font-black text-gray-900 font-mono">
                  ₺{Number(result.sellingPrice).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
            {result.currentStock <= 0 && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Bu parça stokta bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
