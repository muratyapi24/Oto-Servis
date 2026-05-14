"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, Wrench, DollarSign, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createCommissionRule } from "@/lib/actions/mechanic.actions";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_DETAIL,
  DASHBOARD_FORMS,
  dashboardStatusBadgeClass,
} from "@/lib/dashboard-ui-standards";

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

const inputCls = DASHBOARD_FORMS.control;
const labelCls = DASHBOARD_FORMS.label;

function trendClass(isPositive: boolean, positiveIsGood = true) {
  return isPositive === positiveIsGood ? "text-tertiary" : "text-error";
}

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
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Aylık Performans Karşılaştırması</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
          {/* Tamamlanan İş */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-on-surface-variant" />
              <span className={DASHBOARD_DETAIL.relatedLabel}>Tamamlanan İş</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-on-surface">{current.completedCount}</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-on-surface-variant">{previous.completedCount}</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Geçen ay</p>
              </div>
            </div>
            {countDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendClass(countDiff > 0)}`}>
                {countDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {countDiff > 0 ? "+" : ""}{countDiff} iş
              </div>
            )}
          </div>

          {/* İşçilik Tutarı */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-on-surface-variant" />
              <span className={DASHBOARD_DETAIL.relatedLabel}>İşçilik Tutarı</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-on-surface">₺{current.totalLaborAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-on-surface-variant">₺{previous.totalLaborAmount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Geçen ay</p>
              </div>
            </div>
            {laborDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendClass(laborDiff > 0)}`}>
                {laborDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {laborDiff > 0 ? "+" : ""}₺{Math.abs(laborDiff).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              </div>
            )}
          </div>

          {/* Ort. Süre */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-on-surface-variant" />
              <span className={DASHBOARD_DETAIL.relatedLabel}>Ort. Tamamlama Süresi</span>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-on-surface">{current.avgDurationHours}s</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Bu ay</p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg text-on-surface-variant">{previous.avgDurationHours}s</p>
                <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>Geçen ay</p>
              </div>
            </div>
            {durationDiff !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendClass(durationDiff < 0)}`}>
                {durationDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {durationDiff > 0 ? "+" : ""}{durationDiff.toFixed(1)} saat
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Komisyon */}
      <div className={DASHBOARD_DETAIL.infoCard}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Komisyon</h3>
          <button onClick={() => setShowRuleForm(!showRuleForm)} className={`${DASHBOARD_ACTIONS.iconButtonPrimary} gap-1.5 px-3 py-1.5 text-xs font-bold`}>
            <Plus className="w-3.5 h-3.5" /> Kural Ekle
          </button>
        </div>

        {/* Bu ayki komisyon önizlemesi */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Bu Ay Tahmini Komisyon</p>
          <p className="text-3xl font-bold text-on-surface">₺{commissionAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Mevcut Kurallar */}
        {commissionRules.length > 0 && (
          <div className="space-y-2 mb-4">
            {commissionRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm">
                <div>
                  <span className={DASHBOARD_DETAIL.infoValue}>
                    {rule.ruleType === "PERCENTAGE" ? `%${rule.value}` : `₺${rule.value} sabit`}
                  </span>
                  {rule.minAmount && <span className="text-on-surface-variant ml-2 text-xs">Min: ₺{rule.minAmount}</span>}
                  {rule.maxAmount && <span className="text-on-surface-variant ml-1 text-xs">Max: ₺{rule.maxAmount}</span>}
                </div>
                <span className={dashboardStatusBadgeClass(rule.mechanic ? "info" : "neutral", "text-xs px-2 py-0.5")}>{rule.mechanic ? "Kişiye özel" : "Genel kural"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Kural Ekleme Formu */}
        {showRuleForm && (
          <form onSubmit={handleCreateRule} className="border border-outline-variant/30 rounded-xl p-4 space-y-3 bg-surface-container-low">
            {formError && <div className="flex items-center gap-2 text-error text-xs"><AlertCircle className="w-3.5 h-3.5" />{formError}</div>}
            {formSuccess && <div className="flex items-center gap-2 text-tertiary text-xs"><CheckCircle2 className="w-3.5 h-3.5" />{formSuccess}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Kural Tipi</label>
                <select value={ruleType} onChange={e => setRuleType(e.target.value as "PERCENTAGE" | "FIXED")} className={DASHBOARD_FORMS.select}>
                  <option value="PERCENTAGE">Yüzde (%)</option>
                  <option value="FIXED">Sabit Tutar (₺)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Değer *</label>
                <input type="number" step="0.01" min="0" value={ruleValue} onChange={e => setRuleValue(e.target.value)} className={inputCls} placeholder={ruleType === "PERCENTAGE" ? "Örn: 10" : "Örn: 500"} />
              </div>
              {ruleType === "PERCENTAGE" && (
                <>
                  <div>
                    <label className={labelCls}>Min Tutar (₺)</label>
                    <input type="number" step="0.01" min="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                  <div>
                    <label className={labelCls}>Max Tutar (₺)</label>
                    <input type="number" step="0.01" min="0" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className={inputCls} placeholder="Opsiyonel" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRuleForm(false)} className={`${DASHBOARD_ACTIONS.secondaryButton} px-3 py-1.5 text-xs`}>İptal</button>
              <button type="submit" disabled={submitting} className={`${DASHBOARD_FORMS.primaryButton} px-4 py-1.5 text-xs`}>
                {submitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
