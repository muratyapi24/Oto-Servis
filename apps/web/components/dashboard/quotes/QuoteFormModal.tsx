"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createQuote, addQuoteItem } from "@/lib/actions/quote.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  parts: any[];
  categories: any[];
}

const inputCls = "w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500";

export default function QuoteFormModal({ isOpen, onClose, customers, parts, categories }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"header" | "items">("header");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Header fields
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  // Item fields
  const [items, setItems] = useState<any[]>([]);
  const [itemType, setItemType] = useState<"PART" | "LABOR" | "OTHER">("LABOR");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemPartId, setItemPartId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");
  const [itemTax, setItemTax] = useState("20");
  const [itemDiscount, setItemDiscount] = useState("0");

  const filteredParts = parts.filter(p => !itemCategoryId || p.categoryId === itemCategoryId);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerVehicles = selectedCustomer?.vehicles ?? [];

  function calcLine(qty: number, price: number, tax: number, disc: number) {
    const sub = qty * price - disc;
    const taxAmt = sub * tax / 100;
    return { subTotal: sub, taxAmount: taxAmt, totalPrice: sub + taxAmt };
  }

  async function handleCreateHeader(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId) { setError("Müşteri seçin"); return; }
    setSubmitting(true);
    const res = await createQuote({ customerId, vehicleId: vehicleId || undefined, validUntil: validUntil || undefined, notes: notes || undefined });
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    setQuoteId(res.quoteId!);
    setStep("items");
  }

  async function handleAddItem() {
    if (!quoteId) return;
    setError(null);
    const qty = parseFloat(itemQty);
    const price = parseFloat(itemPrice);
    if (!itemName || !qty || !price) { setError("İsim, miktar ve fiyat zorunludur"); return; }
    setSubmitting(true);
    const res = await addQuoteItem({
      quoteId, itemType, name: itemName,
      partId: itemPartId || undefined,
      quantity: qty, unitPrice: price,
      taxRate: parseFloat(itemTax) || 20,
      discount: parseFloat(itemDiscount) || 0,
    });
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    const calc = calcLine(qty, price, parseFloat(itemTax) || 20, parseFloat(itemDiscount) || 0);
    setItems(prev => [...prev, { name: itemName, itemType, qty, price, ...calc }]);
    setItemName(""); setItemPrice(""); setItemQty("1"); setItemPartId(""); setItemCategoryId(""); setItemDiscount("0");
  }

  function handleFinish() {
    router.push(`/dashboard/quotes/${quoteId}`);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">{step === "header" ? "Yeni Teklif" : "Teklif Kalemleri"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

          {step === "header" && (
            <form onSubmit={handleCreateHeader} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
                <select value={customerId} onChange={e => { setCustomerId(e.target.value); setVehicleId(""); }} className={inputCls} required>
                  <option value="">Müşteri seçin...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.type === "CORPORATE" ? c.companyName : `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              {customerVehicles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Araç</label>
                  <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className={inputCls}>
                    <option value="">Araç seçin (opsiyonel)</option>
                    {customerVehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Tarihi</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Teklif notları..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">İptal</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-70">
                  {submitting ? "Oluşturuluyor..." : "Devam Et →"}
                </button>
              </div>
            </form>
          )}

          {step === "items" && (
            <div className="space-y-5">
              {/* Kalem ekleme formu */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" /> Kalem Ekle
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tür</label>
                    <select value={itemType} onChange={e => {
                      setItemType(e.target.value as any);
                      setItemPartId("");
                      setItemCategoryId("");
                      setItemName("");
                      setItemPrice("");
                    }} className={inputCls}>
                      <option value="LABOR">İşçilik</option>
                      <option value="PART">Yedek Parça</option>
                      <option value="OTHER">Diğer</option>
                    </select>
                  </div>

                  {itemType === "PART" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Kategori (Opsiyonel)</label>
                        <select 
                          value={itemCategoryId} 
                          onChange={e => {
                            setItemCategoryId(e.target.value);
                            setItemPartId("");
                          }} 
                          className={inputCls}
                        >
                          <option value="">Tüm Kategoriler</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Stoktan Parça Seçimi *</label>
                        <select 
                          value={itemPartId} 
                          onChange={e => {
                            const val = e.target.value;
                            setItemPartId(val);
                            const p = parts.find(x => x.id === val);
                            if (p) {
                              setItemName(p.name);
                              setItemPrice(p.sellingPrice?.toString() || "0");
                              setItemTax(p.taxRate?.toString() || "20");
                            }
                          }} 
                          className={inputCls}
                        >
                          <option value="">-- Parça Seçiniz --</option>
                          {filteredParts.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} (Satış: ₺{p.sellingPrice})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kalem / İşlem Adı *</label>
                    <input 
                      value={itemName} 
                      onChange={e => setItemName(e.target.value)} 
                      className={inputCls} 
                      placeholder={itemType === "PART" ? "Parça adı (Otomatik dolar)" : "Kalem adı"} 
                      disabled={itemType === "PART" && !!itemPartId} // Eğer parça seçiliyse ismi değiştirmesin
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Miktar *</label>
                    <input type="number" step="0.01" min="0.01" value={itemQty} onChange={e => setItemQty(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Birim Fiyat (₺) *</label>
                    <input type="number" step="0.01" min="0" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">KDV %</label>
                    <input type="number" min="0" max="100" value={itemTax} onChange={e => setItemTax(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">İndirim (₺)</label>
                    <input type="number" min="0" step="0.01" value={itemDiscount} onChange={e => setItemDiscount(e.target.value)} className={inputCls} />
                  </div>
                </div>
                {itemQty && itemPrice && (
                  <div className="text-xs text-gray-500 bg-white rounded-lg p-2 border border-gray-200">
                    {(() => { const c = calcLine(parseFloat(itemQty)||0, parseFloat(itemPrice)||0, parseFloat(itemTax)||20, parseFloat(itemDiscount)||0); return `Satır Toplamı: ₺${c.totalPrice.toFixed(2)} (KDV: ₺${c.taxAmount.toFixed(2)})`; })()}
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={handleAddItem} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-70 shadow-sm transition-colors">
                    <Plus className="w-4 h-4" /> Kalem Ekle
                  </button>
                </div>
              </div>

              {/* Eklenen kalemler */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-700">Eklenen Kalemler ({items.length})</h3>
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm">
                      <div>
                        <span className="font-bold text-gray-800">{item.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{item.qty} × ₺{item.price}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-800">₺{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Toplam</span>
                    <span className="font-mono">₺{items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Kapat</button>
                <button type="button" onClick={handleFinish} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4" /> Teklifi Tamamla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
