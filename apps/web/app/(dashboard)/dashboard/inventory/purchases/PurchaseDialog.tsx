"use client";

import { useState, useEffect } from "react";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import { getParts } from "@/lib/actions/inventory.actions";
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
  Search
} from "lucide-react";
import dayjs from "dayjs";

interface PurchaseDialogProps {
  trigger?: React.ReactNode;
}

export function PurchaseDialog({ trigger }: PurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Veriler
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [items, setItems] = useState<any[]>([
    { partId: "", quantity: 1, purchasePrice: 0, taxRate: 20 }
  ]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    const [sData, pData] = await Promise.all([
      getSuppliers(),
      getParts()
    ]);
    if (sData.suppliers) setSuppliers(sData.suppliers);
    if (pData.parts) setParts(pData.parts);
  }

  const addItem = () => {
    setItems([...items, { partId: "", quantity: 1, purchasePrice: 0, taxRate: 20 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Eğer parça seçildiyse, mevcut alış fiyatını getir
    if (field === "partId") {
      const part = parts.find(p => p.id === value);
      if (part) {
        newItems[index].purchasePrice = Number(part.purchasePrice);
        newItems[index].taxRate = Number(part.taxRate);
      }
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let taxTotal = 0;

    items.forEach(item => {
      const lineSub = Number(item.quantity) * Number(item.purchasePrice);
      const lineTax = (lineSub * Number(item.taxRate)) / 100;
      subTotal += lineSub;
      taxTotal += lineTax;
    });

    return { subTotal, taxTotal, total: subTotal + taxTotal };
  };

  const totals = calculateTotals();

  async function handleSubmit() {
    if (!supplierId || !invoiceNumber || items.some(i => !i.partId)) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await createPurchaseInvoice({
        supplierId,
        invoiceNumber,
        issueDate: new Date(issueDate),
        items,
        notes
      });

      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        // Formu temizle
        setSupplierId("");
        setInvoiceNumber("");
        setItems([{ partId: "", quantity: 1, purchasePrice: 0, taxRate: 20 }]);
      }
    } catch (err) {
      setError("İşlem sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-sm font-bold text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          Stok Girişi Yap
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Yeni Stok Alım Faturası
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

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
                    {suppliers.map(s => (
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

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                    Alınan Parçalar / Ürünler
                  </h3>
                  <button
                    onClick={addItem}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-4 h-4" /> Satır Ekle
                  </button>
                </div>

                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-600">Parça / Ürün *</th>
                        <th className="px-4 py-3 font-bold text-gray-600 w-24">Miktar</th>
                        <th className="px-4 py-3 font-bold text-gray-600 w-32">Birim Fiyat (₺)</th>
                        <th className="px-4 py-3 font-bold text-gray-600 w-20">KDV</th>
                        <th className="px-4 py-3 font-bold text-gray-600 w-32 text-right">Toplam</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <select
                              value={item.partId}
                              onChange={(e) => updateItem(idx, "partId", e.target.value)}
                              className="w-full p-2 bg-transparent border border-gray-200 rounded-lg text-sm transition-all outline-none"
                            >
                              <option value="">Parça Seç...</option>
                              {parts.map(p => (
                                <option key={p.id} value={p.id}>{p.partNumber} - {p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                              className="w-full p-2 bg-transparent border border-gray-200 rounded-lg text-sm transition-all outline-none text-center"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.purchasePrice}
                              onChange={(e) => updateItem(idx, "purchasePrice", Number(e.target.value))}
                              className="w-full p-2 bg-transparent border border-gray-200 rounded-lg text-sm transition-all outline-none text-right font-mono"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.taxRate}
                              onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}
                              className="w-full p-2 bg-transparent border border-gray-200 rounded-lg text-sm transition-all outline-none appearance-none text-center"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-700 font-mono">
                            ₺{(item.quantity * item.purchasePrice * (1 + item.taxRate / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeItem(idx)}
                              className="p-1.5 text-red-300 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                    Açıklama / Notlar
                  </label>
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
                    <span>₺{totals.subTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Hesaplanan KDV (%20)</span>
                    <span>₺{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-800">GENEL TOPLAM</span>
                    <span className="text-xl font-mono font-bold text-primary">₺{totals.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-10 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md disabled:opacity-50 text-sm flex items-center gap-2"
                >
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
