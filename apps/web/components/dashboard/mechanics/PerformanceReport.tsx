"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, Wrench, DollarSign, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createCommissionRule } from "@/lib/actions/mechanic.actions";

interface PerformanceData {
  period: string;
  completedCount: number;
  totalLaborAmount: number;
  avgDurationHours: number;
}

interface CommissionRule {
  id: string;
  ruleType: "PERCENTAGE" | "FIXED";
  value: number;
  minAmount: number | null;
  maxAmount: number | null;
  mechanic?: { firstName: string; lastName: string } | null;
}

interface Props {
  mechanicId: string;
  current: PerformanceData;
  previous: PerformanceData;
  commissionRules: CommissionRule[];
  commissionAmount: number;
}

const inputCls = "w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500";

export default function PerformanceReport({ mechanicId, current, previous, commissionRules, commissionAmount }: Props) {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleType, setRuleType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [ruleValue, setRuleValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const countDiff = current.completedCount - previous.completedCount;
  const laborDiff = current.totalLaborAmount - previous.totalLaborAmount;
  const durationDiff = current.avgDurationHours - previous.avgDurationHours;

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null); setFormSuccess(null);
    const val = parseFloat(ruleValue);
    if (!val || val <= 0) { setFormError("Geçerli bir değer girin"); return; }
    setSubmitting(true);
    const res = await createCommissionRule({
      mechanicId,
      ruleType,
      value: val,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
    setSubmitting(false);
    if (res.error) { setFormError(res.error); }
    else { setFormSuccess(res.success ?? "Kural oluşturuldu"); setShowRuleForm(false); setRuleValue(""); }
  }

  return (
    <div className="space-y-6">
      {/* Dönemsel Karşılaştırma */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Aylık Performans Karşılaştırması</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Tamamlanan İş */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tamamlanan İş</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-gray-900">{current.completedCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-gray-400">{previous.completedCount}</p>
                <p className="text-xs text-gray-400">Geçen ay</p>
              </div>
            </div>
            {countDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${countDiff > 0 ? "text-green-600" : "text-red-500"}`}>
                {countDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {countDiff > 0 ? "+" : ""}{countDiff} iş
              </div>
            )}
          </div>

          {/* İşçilik Tutarı */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">İşçilik Tutarı</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-gray-900">₺{current.totalLaborAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400 mt-0.5">Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-gray-400">₺{previous.totalLaborAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-gray-400">Geçen ay</p>
              </div>
            </div>
            {laborDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${laborDiff > 0 ? "text-green-600" : "text-red-500"}`}>
                {laborDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {laborDiff > 0 ? "+" : ""}₺{Math.abs(laborDiff).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              </div>
            )}
          </div>

          {/* Ort. Süre */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ort. Tamamlama Süresi</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-gray-900">{current.avgDurationHours}s</p>
                <p className="text-xs text-gray-400 mt-0.5">Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-gray-400">{previous.avgDurationHours}s</p>
                <p className="text-xs text-gray-400">Geçen ay</p>
              </div>
            </div>
            {durationDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${durationDiff < 0 ? "text-green-600" : "text-orange-500"}`}>
                {durationDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {durationDiff > 0 ? "+" : ""}{durationDiff.toFixed(1)} saat
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Komisyon */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Komisyon</h3>
          <button onClick={() => setShowRuleForm(!showRuleForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Kural Ekle
          </button>
        </div>

        {/* Bu ayki komisyon önizlemesi */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Bu Ay Tahmini Komisyon</p>
          <p className="text-3xl font-bold text-blue-900">₺{commissionAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Mevcut Kurallar */}
        {commissionRules.length > 0 && (
          <div className="space-y-2 mb-4">
            {commissionRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-bold text-gray-800">
                    {rule.ruleType === "PERCENTAGE" ? `%${rule.value}` : `₺${rule.value} sabit`}
                  </span>
                  {rule.minAmount && <span className="text-gray-400 ml-2 text-xs">Min: ₺{rule.minAmount}</span>}
                  {rule.maxAmount && <span className="text-gray-400 ml-1 text-xs">Max: ₺{rule.maxAmount}</span>}
                </div>
                <span className="text-xs text-gray-400">{rule.mechanic ? "Kişiye özel" : "Genel kural"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Kural Ekleme Formu */}
        {showRuleForm && (
          <form onSubmit={handleCreateRule} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
            {formError && <div className="flex items-center gap-2 text-red-600 text-xs"><AlertCircle className="w-3.5 h-3.5" />{formError}</div>}
            {formSuccess && <div className="flex items-center gap-2 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{formSuccess}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kural Tipi</label>
                <select value={ruleType} onChange={e => setRuleType(e.target.value as any)} className={inputCls}>
                  <option value="PERCENTAGE">Yüzde (%)</option>
                  <option value="FIXED">Sabit Tutar (₺)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Değer *</label>
                <input type="number" step="0.01" min="0" value={ruleValue} onChange={e => setRuleValue(e.target.value)} className={inputCls} placeholder={ruleType === "PERCENTAGE" ? "Örn: 10" : "Örn: 500"} />
              </div>
              {ruleType === "PERCENTAGE" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min Tutar (₺)</label>
                    <input type="number" step="0.01" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Tutar (₺)</label>
                    <input type="number" step="0.01" min="0" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRuleForm(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">İptal</button>
              <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-70">
                {submitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
