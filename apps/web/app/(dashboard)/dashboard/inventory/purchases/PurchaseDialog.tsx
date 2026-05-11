"use client";

import { useState, useEffect } from "react";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import { getParts, getPartCategories } from "@/lib/actions/inventory.actions";
import { createPurchaseInvoice } from "@/lib/actions/stock.actions";
import {
  X,
  Plus,
  ShoppingCart,
  Trash2,
  Calculator,
  Calendar,
  Hash,
  User,
  AlertCircle,
  PlusCircle,
  Search,
  PackagePlus,
  Package
} from "lucide-react";
import dayjs from "dayjs";

interface PurchaseDialogProps {
  trigger?: React.ReactNode;
}

interface LineItem {
  mode: "existing" | "new";
  // Mevcut parça
  partId: string;
  // Yeni parça
  categoryId: string;
  partNumber: string;
  name: string;
  brand: string;
  unit: string;
  sellingPrice: number;
  location: string;
  minStockLevel: number;
  // Ortak
  quantity: number;
  purchasePrice: number;
  taxRate: number;
}

const emptyLine = (): LineItem => ({
  mode: "existing",
  partId: "",
  categoryId: "",
  partNumber: "",
  name: "",
  brand: "",
  unit: "adet",
  sellingPrice: 0,
  location: "",
  minStockLevel: 5,
  quantity: 1,
  purchasePrice: 0,
  taxRate: 20,
});

export function PurchaseDialog({ trigger }: PurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  async function loadData() {
    const [sData, pData, cData] = await Promise.all([
      getSuppliers(),
      getParts(),
      getPartCategories(),
    ]);
    if (sData.suppliers) setSuppliers(sData.suppliers);
    if (pData.parts) setParts(pData.parts);
    if (cData.categories) setCategories(cData.categories);
  }

  const addItem = () => setItems([...items, emptyLine()]);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    // Mevcut parça seçildiğinde fiyat/vergi bilgisini getir
    if (field === "partId" && value) {
      const part = parts.find((p) => p.id === value);
      if (part) {
        const currentItem = newItems[index];
        if (currentItem) {
          currentItem.purchasePrice = Number(part.purchasePrice);
          currentItem.taxRate = Number(part.taxRate);
          currentItem.name = part.name;
        }
      }
    }

    // Mod değiştiğinde alanları sıfırla
    if (field === "mode") {
      const fresh = emptyLine();
      fresh.mode = value;
      newItems[index] = fresh;
    }

    setItems(newItems);
  };

  const totals = (() => {
    let subTotal = 0, taxTotal = 0;
    items.forEach((item) => {
      const lineSub = item.quantity * item.purchasePrice;
      const lineTax = (lineSub * item.taxRate) / 100;
      subTotal += lineSub;
      taxTotal += lineTax;
    });
    return { subTotal, taxTotal, total: subTotal + taxTotal };
  })();

  async function handleSubmit() {
    if (!supplierId || !invoiceNumber) {
      setError("Tedarikçi ve fatura numarası zorunludur.");
      return;
    }

    // Satır doğrulaması
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      if (item.mode === "existing" && !item.partId) {
        setError(`Satır ${i + 1}: Lütfen bir parça seçin.`);
        return;
      }
      if (item.mode === "new") {
        if (!item.categoryId || !item.partNumber || !item.name) {
          setError(`Satır ${i + 1}: Yeni parça için kategori, barkod ve ad zorunludur.`);
          return;
        }

        // Mükerrer kontrolü (Sistemde var mı?)
        const existsInDb = parts.find(p => 
          (p.partNumber && p.partNumber.toLowerCase() === item.partNumber.toLowerCase()) || 
          (p.name && p.name.toLowerCase() === item.name.toLowerCase())
        );
        if (existsInDb) {
          setError(`Satır ${i + 1}: "${item.partNumber}" barkodlu veya "${item.name}" isimli bir parça sistemde zaten kayıtlı. Lütfen mevcut parçalar arasından seçin.`);
          return;
        }

        // Mükerrer kontrolü (Fatura formunda başka bir satırda var mı?)
        const duplicateInForm = items.findIndex((other, otherIdx) => 
          otherIdx !== i && 
          other && 
          other.mode === "new" && 
          ((other.partNumber && other.partNumber.toLowerCase() === item.partNumber.toLowerCase()) || 
           (other.name && other.name.toLowerCase() === item.name.toLowerCase()))
        );
        if (duplicateInForm !== -1) {
          setError(`Satır ${i + 1} ile Satır ${duplicateInForm + 1} aynı barkod veya isme sahip olamaz.`);
          return;
        }
      }
      if (item.quantity <= 0) {
        setError(`Satır ${i + 1}: Miktar sıfırdan büyük olmalıdır.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplierId,
        invoiceNumber,
        issueDate: new Date(issueDate),
        notes,
        items: items.map((item) => {
          if (item.mode === "new") {
            return {
              isNew: true as const,
              categoryId: item.categoryId,
              partNumber: item.partNumber,
              name: item.name,
              brand: item.brand || undefined,
              unit: item.unit,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              taxRate: item.taxRate,
              quantity: item.quantity,
              location: item.location || undefined,
              minStockLevel: item.minStockLevel,
            };
          }
          return {
            isNew: false as const,
            partId: item.partId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            taxRate: item.taxRate,
          };
        }),
      };

      const res = await createPurchaseInvoice(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setSupplierId("");
        setInvoiceNumber("");
        setItems([emptyLine()]);
        setNotes("");
      }
    } catch (err) {
      setError("İşlem sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  const newItemCount = items.filter((i) => i.mode === "new").length;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Stok Girişi Yap</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Yeni Stok Alım Faturası
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Fatura Üst Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Tedarikçi *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none appearance-none"
                  >
                    <option value="">Tedarikçi Seçiniz...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" /> Fatura / İrsaliye No *
                  </label>
                  <input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Örn: ABC20260001"
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Fatura Tarihi
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Kalem Listesi */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                    Alınan Parçalar / Ürünler
                    {newItemCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {newItemCount} YENİ KART
                      </span>
                    )}
                  </h3>
                  <button onClick={addItem} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    <PlusCircle className="w-4 h-4" /> Satır Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className={`border rounded-xl p-4 ${item.mode === "new" ? "border-amber-200 bg-amber-50/30" : "border-gray-100 bg-white"}`}>
                      {/* Satır Başlığı: Mod Seçimi */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, "mode", "existing")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              item.mode === "existing"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" /> Mevcut Parça
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(idx, "mode", "new")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              item.mode === "new"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <PackagePlus className="w-3.5 h-3.5" /> Yeni Stok Kartı
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                          <button onClick={() => removeItem(idx)} className="p-1.5 text-red-300 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {item.mode === "existing" ? (
                        /* ── MEVCUT PARÇA MODU ── */
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Parça *</label>
                            <select
                              value={item.partId}
                              onChange={(e) => updateItem(idx, "partId", e.target.value)}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                            >
                              <option value="">Parça Seç...</option>
                              {parts.map((p) => (
                                <option key={p.id} value={p.id}>{p.partNumber} — {p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Miktar</label>
                            <input type="number" min="1" value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-center" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Birim Fiyat (₺)</label>
                            <input type="number" step="0.01" value={item.purchasePrice}
                              onChange={(e) => updateItem(idx, "purchasePrice", Number(e.target.value))}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-right font-mono" />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">KDV</label>
                            <select value={item.taxRate}
                              onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-center appearance-none">
                              <option value={0}>%0</option>
                              <option value={1}>%1</option>
                              <option value={10}>%10</option>
                              <option value={20}>%20</option>
                            </select>
                          </div>
                          <div className="col-span-2 flex items-end">
                            <div className="w-full p-2.5 bg-gray-100 rounded-lg text-sm text-right font-bold text-gray-700 font-mono">
                              ₺{(item.quantity * item.purchasePrice * (1 + item.taxRate / 100)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── YENİ PARÇA MODU ── */
                        <div className="space-y-3">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                              <label className="block text-[11px] font-bold text-amber-600 mb-1">Kategori *</label>
                              <select value={item.categoryId}
                                onChange={(e) => updateItem(idx, "categoryId", e.target.value)}
                                className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-sm outline-none">
                                <option value="">Kategori Seç...</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-3">
                              <label className="block text-[11px] font-bold text-amber-600 mb-1">Barkod / OEM No *</label>
                              <input value={item.partNumber}
                                onChange={(e) => updateItem(idx, "partNumber", e.target.value)}
                                className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-sm outline-none uppercase"
                                placeholder="90915-YZZD2" />
                            </div>
                            <div className="col-span-4">
                              <label className="block text-[11px] font-bold text-amber-600 mb-1">Ürün Adı *</label>
                              <input value={item.name}
                                onChange={(e) => updateItem(idx, "name", e.target.value)}
                                className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-sm outline-none"
                                placeholder="Yağ Filtresi" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">Marka</label>
                              <input value={item.brand}
                                onChange={(e) => updateItem(idx, "brand", e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                                placeholder="Bosch" />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">Miktar *</label>
                              <input type="number" min="1" value={item.quantity}
                                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-center font-bold" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">Alış Fiyatı (₺)</label>
                              <input type="number" step="0.01" value={item.purchasePrice}
                                onChange={(e) => updateItem(idx, "purchasePrice", Number(e.target.value))}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-right font-mono" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] font-bold text-blue-600 mb-1">Satış Fiyatı (₺)</label>
                              <input type="number" step="0.01" value={item.sellingPrice}
                                onChange={(e) => updateItem(idx, "sellingPrice", Number(e.target.value))}
                                className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm outline-none text-right font-mono font-bold text-blue-900" />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">KDV</label>
                              <select value={item.taxRate}
                                onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-center appearance-none">
                                <option value={0}>%0</option>
                                <option value={1}>%1</option>
                                <option value={10}>%10</option>
                                <option value={20}>%20</option>
                              </select>
                            </div>
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">Birim</label>
                              <select value={item.unit}
                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-center appearance-none">
                                <option value="adet">Adet</option>
                                <option value="litre">Lt</option>
                                <option value="kutu">Kutu</option>
                                <option value="set">Set</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1">Raf Konum</label>
                              <input value={item.location}
                                onChange={(e) => updateItem(idx, "location", e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none uppercase"
                                placeholder="A-10-R3" />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <div className="w-full p-2.5 bg-amber-100 rounded-lg text-sm text-right font-bold text-amber-800 font-mono">
                                ₺{(item.quantity * item.purchasePrice * (1 + item.taxRate / 100)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt Bilgi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Açıklama / Notlar</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-xl text-sm transition-all outline-none resize-none"
                    placeholder="Fatura ile ilgili ek bilgiler..."
                  />
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Ara Toplam</span>
                    <span>₺{totals.subTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Hesaplanan KDV</span>
                    <span>₺{totals.taxTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800">GENEL TOPLAM</span>
                    <span className="text-xl font-mono font-bold text-primary">₺{totals.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {newItemCount > 0 && (
                    <div className="pt-2 border-t border-gray-200 text-xs text-amber-600 font-medium">
                      ⚡ Bu fatura kaydedildiğinde {newItemCount} yeni stok kartı otomatik oluşturulacak.
                    </div>
                  )}
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-3 mt-10">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">
                  İptal
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-10 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md disabled:opacity-50 text-sm flex items-center gap-2">
                  {submitting ? "İşleniyor..." : <><ShoppingCart className="w-4 h-4" /> Stok Girişini Tamamla</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
