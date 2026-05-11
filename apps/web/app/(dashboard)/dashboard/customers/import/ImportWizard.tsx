"use client";

import { useRef, useState } from "react";
import { Upload, Download, CheckCircle, AlertCircle, X, Users, Car } from "lucide-react";
import { importCustomers, importVehicles, type CustomerImportRow, type VehicleImportRow, type ImportResult } from "@/lib/actions/import.actions";

type TabType = "musteri" | "arac";
type Step = "upload" | "preview" | "result";

// ---------------------------------------------------------------------------
// CSV şablon verileri
// ---------------------------------------------------------------------------
const CUSTOMER_TEMPLATE_HEADERS = "ad,soyad,telefon,eposta,firma_adi,tip";
const CUSTOMER_TEMPLATE_EXAMPLE = [
  "Ahmet,Yılmaz,05551234567,ahmet@example.com,,BİREYSEL",
  "Ayşe,Kaya,05559876543,ayse@example.com,,BİREYSEL",
  "BST Yazılım,,05552223344,info@bst.com,BST Ltd Şti,KURUMSAL",
].join("\n");

const VEHICLE_TEMPLATE_HEADERS = "plaka,marka,model,yil,musteri_telefon";
const VEHICLE_TEMPLATE_EXAMPLE = [
  "34ABC123,Toyota,Corolla,2020,05551234567",
  "06XYZ456,Ford,Focus,2019,05559876543",
  "35DEF789,Renault,Megane,2021,05552223344",
].join("\n");

function downloadTemplate(type: TabType) {
  const headers = type === "musteri" ? CUSTOMER_TEMPLATE_HEADERS : VEHICLE_TEMPLATE_HEADERS;
  const example = type === "musteri" ? CUSTOMER_TEMPLATE_EXAMPLE : VEHICLE_TEMPLATE_EXAMPLE;
  const csv = `${headers}\n${example}`;
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = type === "musteri" ? "musteri_sablon.csv" : "arac_sablon.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CSV parse (client-side, papaparse yerine minimal)
// ---------------------------------------------------------------------------
function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((line) => {
      const cols: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          cols.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      return cols;
    });
}

function csvToCustomerRows(rows: string[][]): CustomerImportRow[] {
  if (rows.length < 2) return [];
  const [header, ...data] = rows;
  return data.map((r) => ({
    ad: r[0] ?? "",
    soyad: r[1],
    telefon: r[2] ?? "",
    eposta: r[3],
    firma_adi: r[4],
    tip: r[5],
  }));
}

function csvToVehicleRows(rows: string[][]): VehicleImportRow[] {
  if (rows.length < 2) return [];
  const [, ...data] = rows;
  return data.map((r) => ({
    plaka: r[0] ?? "",
    marka: r[1] ?? "",
    model: r[2] ?? "",
    yil: r[3],
    musteri_telefon: r[4] ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Bileşen
// ---------------------------------------------------------------------------
export function ImportWizard() {
  const [tab, setTab] = useState<TabType>("musteri");
  const [step, setStep] = useState<Step>("upload");
  const [parseError, setParseError] = useState<string | null>(null);
  const [customerRows, setCustomerRows] = useState<CustomerImportRow[]>([]);
  const [vehicleRows, setVehicleRows] = useState<VehicleImportRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setParseError(null);
    setCustomerRows([]);
    setVehicleRows([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function switchTab(t: TabType) {
    setTab(t);
    reset();
  }

  async function handleFile(file: File) {
    setParseError(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setParseError("Dosyada veri bulunamadı. Lütfen şablon formatını kullanın.");
      return;
    }
    if (tab === "musteri") {
      setCustomerRows(csvToCustomerRows(rows));
    } else {
      setVehicleRows(csvToVehicleRows(rows));
    }
    setStep("preview");
  }

  async function handleImport() {
    setLoading(true);
    try {
      const result =
        tab === "musteri"
          ? await importCustomers(customerRows)
          : await importVehicles(vehicleRows);

      if ("error" in result) {
        setParseError(result.error);
      } else {
        setImportResult(result);
        setStep("result");
      }
    } finally {
      setLoading(false);
    }
  }

  const previewRows = tab === "musteri" ? customerRows : vehicleRows;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Tab */}
      <div className="flex gap-2">
        {(["musteri", "arac"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              tab === t
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-on-surface-variant border-outline/30 hover:border-primary/50"
            }`}
          >
            {t === "musteri" ? <Users className="h-4 w-4" /> : <Car className="h-4 w-4" />}
            {t === "musteri" ? "Müşteri Aktarımı" : "Araç Aktarımı"}
          </button>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          {/* Template download */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900">Şablon ile başlayın</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Excel veya Google Sheets'te doldurup CSV olarak kaydedin.
              </p>
            </div>
            <button
              onClick={() => downloadTemplate(tab)}
              className="shrink-0 text-xs font-bold text-blue-700 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
            >
              Şablonu İndir
            </button>
          </div>

          {/* Sütun açıklamaları */}
          <div className="bg-white border border-outline/20 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              {tab === "musteri" ? "Müşteri" : "Araç"} CSV Sütunları
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {tab === "musteri" ? (
                <>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">ad</span> <span className="text-on-surface-variant">— Ad (zorunlu)</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">soyad</span> <span className="text-on-surface-variant">— Soyad</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">telefon</span> <span className="text-on-surface-variant">— Telefon (zorunlu)</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">eposta</span> <span className="text-on-surface-variant">— E-posta</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">firma_adi</span> <span className="text-on-surface-variant">— Firma adı</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">tip</span> <span className="text-on-surface-variant">— BİREYSEL / KURUMSAL</span></div>
                </>
              ) : (
                <>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">plaka</span> <span className="text-on-surface-variant">— Plaka (zorunlu)</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">marka</span> <span className="text-on-surface-variant">— Araç markası (zorunlu)</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">model</span> <span className="text-on-surface-variant">— Model (zorunlu)</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">yil</span> <span className="text-on-surface-variant">— Model yılı</span></div>
                  <div><span className="font-mono bg-gray-100 px-1 rounded">musteri_telefon</span> <span className="text-on-surface-variant">— Müşteri telefonu (zorunlu)</span></div>
                </>
              )}
            </div>
          </div>

          {/* Dosya yükleme */}
          <label
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline/40 rounded-2xl p-10 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
          >
            <Upload className="h-10 w-10 text-outline group-hover:text-primary transition-colors" />
            <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface">
              CSV dosyasını seçin veya buraya sürükleyin
            </span>
            <span className="text-xs text-outline">.csv formatı desteklenmektedir</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-error-container/30 border border-error/20 rounded-xl text-sm text-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-on-surface">
              {previewRows.length} satır hazır — önizleme (ilk 10)
            </p>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface">
              <X className="h-3.5 w-3.5" /> Farklı dosya seç
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline/20">
            <table className="w-full text-xs">
              <thead className="bg-surface-container-low">
                <tr>
                  {tab === "musteri" ? (
                    ["Ad", "Soyad", "Telefon", "E-posta", "Firma", "Tip"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-on-surface-variant">{h}</th>
                    ))
                  ) : (
                    ["Plaka", "Marka", "Model", "Yıl", "Müşteri Tel."].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-on-surface-variant">{h}</th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    {tab === "musteri" ? (
                      <>
                        <td className="px-3 py-2">{(row as CustomerImportRow).ad}</td>
                        <td className="px-3 py-2">{(row as CustomerImportRow).soyad}</td>
                        <td className="px-3 py-2 font-mono">{(row as CustomerImportRow).telefon}</td>
                        <td className="px-3 py-2">{(row as CustomerImportRow).eposta}</td>
                        <td className="px-3 py-2">{(row as CustomerImportRow).firma_adi}</td>
                        <td className="px-3 py-2">{(row as CustomerImportRow).tip ?? "BİREYSEL"}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-mono font-bold">{(row as VehicleImportRow).plaka}</td>
                        <td className="px-3 py-2">{(row as VehicleImportRow).marka}</td>
                        <td className="px-3 py-2">{(row as VehicleImportRow).model}</td>
                        <td className="px-3 py-2">{(row as VehicleImportRow).yil}</td>
                        <td className="px-3 py-2 font-mono">{(row as VehicleImportRow).musteri_telefon}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 10 && (
              <p className="px-3 py-2 text-xs text-on-surface-variant bg-surface-container-low border-t border-outline/10">
                ve {previewRows.length - 10} satır daha…
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "İçe aktarılıyor…" : `${previewRows.length} kaydı aktar`}
            </button>
            <button onClick={reset} className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant border border-outline/30 rounded-xl hover:bg-surface-container-low transition-colors">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && importResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-900 text-sm">Aktarım tamamlandı</p>
              <p className="text-xs text-green-700 mt-0.5">
                {importResult.total} kayıt işlendi: {importResult.created} oluşturuldu, {importResult.skipped} atlandı.
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-900 mb-2">Uyarılar ({importResult.errors.length})</p>
              <ul className="space-y-1">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Yeni Aktarım Başlat
          </button>
        </div>
      )}
    </div>
  );
}
