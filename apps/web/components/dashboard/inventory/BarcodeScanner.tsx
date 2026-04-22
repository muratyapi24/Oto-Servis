"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Keyboard, Loader2, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
  mode?: "camera" | "manual";
}

export default function BarcodeScanner({ onScan, onError, mode = "camera" }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeMode, setActiveMode] = useState<"camera" | "manual">(mode);
  const [manualInput, setManualInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const readerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch {
        // ignore
      }
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (activeMode !== "camera") return;
    setIsLoading(true);
    setCameraError(null);

    try {
      // Dynamic import — @zxing/library is not SSR-compatible
      const { BrowserMultiFormatReader } = await import("@zxing/library");

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoInputDevices.length === 0) {
        throw new Error("Kamera bulunamadı.");
      }

      const deviceId = videoInputDevices[0]!.deviceId;

      if (!videoRef.current) return;

      await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText());
        }
        // Ignore continuous scan errors (NotFoundException is normal between frames)
      });

      // Capture the stream reference for cleanup
      if (videoRef.current?.srcObject instanceof MediaStream) {
        streamRef.current = videoRef.current.srcObject;
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isPermissionDenied =
        error.name === "NotAllowedError" ||
        error.message.includes("Permission") ||
        error.message.includes("permission");

      if (isPermissionDenied) {
        setCameraError("Kamera izni reddedildi. Manuel giriş moduna geçildi.");
      } else {
        setCameraError(error.message || "Kamera başlatılamadı. Manuel giriş moduna geçildi.");
      }

      setActiveMode("manual");
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [activeMode, onScan, onError]);

  useEffect(() => {
    if (activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setManualInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveMode("camera")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMode === "camera"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Kamera
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("manual")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeMode === "manual"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          Manuel
        </button>
      </div>

      {/* Camera mode */}
      {activeMode === "camera" && (
        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {/* Scan overlay */}
          {!isLoading && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-amber-400 rounded-xl relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br" />
                {/* Scan line animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-400/70 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 p-4">
              <p className="text-amber-300 text-xs font-bold text-center">{cameraError}</p>
            </div>
          )}
        </div>
      )}

      {/* Manual mode */}
      {activeMode === "manual" && (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Barkod / parça numarası girin..."
            autoFocus
            className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ara
          </button>
        </form>
      )}
    </div>
  );
}
