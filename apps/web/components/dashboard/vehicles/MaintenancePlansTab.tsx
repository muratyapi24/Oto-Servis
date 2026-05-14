"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Plus, Trash2, Loader2, Wrench } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  getMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  deleteMaintenancePlan,
} from "@/lib/actions/maintenance-plan.actions";

interface Plan {
  id: string;
  title: string;
  dueDate: string | null;
  dueMileage: number | null;
  isCompleted: boolean;
  isOverdue: boolean;
  createdAt: string;
}

interface MaintenancePlansTabProps {
  vehicleId: string;
}

export default function MaintenancePlansTab({ vehicleId }: MaintenancePlansTabProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueMileage, setFormDueMileage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    const res = await getMaintenancePlans(vehicleId);
    if ("error" in res) {
      setError(res.error ?? "Yüklenemedi.");
    } else {
      setPlans(res.plans as Plan[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlans();
  }, [vehicleId]);

  async function handleCreate() {
    if (!formTitle.trim()) {
      setFormError("Başlık zorunludur.");
      return;
    }
    setFormSaving(true);
    setFormError(null);
    const res = await createMaintenancePlan({
      vehicleId,
      title: formTitle,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
      dueMileage: formDueMileage ? parseInt(formDueMileage) : null,
    });
    if ("error" in res && res.error) {
      setFormError(res.error);
    } else {
      setFormTitle("");
      setFormDueDate("");
      setFormDueMileage("");
      setShowForm(false);
      await loadPlans();
    }
    setFormSaving(false);
  }

  async function handleToggleComplete(plan: Plan) {
    await updateMaintenancePlan(plan.id, { isCompleted: !plan.isCompleted });
    await loadPlans();
  }

  async function handleDelete(planId: string) {
    setDeletingId(planId);
    await deleteMaintenancePlan(planId);
    await loadPlans();
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg p-4 text-sm">
        <AlertCircle className="w-4 h-4" /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Başlık + Yeni Plan Butonu */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-400" />
          Bakım Planları
          <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {plans.length}
          </span>
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Yeni Plan
        </button>
      </div>

      {/* Yeni Plan Formu */}
      {showForm && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Yeni Bakım Planı</h4>
          {formError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Yağ değişimi, Fren kontrolü..."
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kilometre</label>
              <input
                type="number"
                value={formDueMileage}
                onChange={(e) => setFormDueMileage(e.target.value)}
                placeholder="50000"
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={formSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {formSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {formSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Plan Listesi */}
      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          Henüz bakım planı oluşturulmamış.
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                plan.isCompleted
                  ? "bg-green-50 border-green-200"
                  : plan.isOverdue
                  ? "bg-red-50 border-red-200"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Tamamlandı toggle */}
              <button
                onClick={() => handleToggleComplete(plan)}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  plan.isCompleted
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-green-400"
                }`}
              >
                {plan.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${plan.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {plan.title}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {plan.dueDate && (
                    <span className={plan.isOverdue && !plan.isCompleted ? "text-red-600 font-medium" : ""}>
                      📅 {dayjs(plan.dueDate).locale("tr").format("DD MMM YYYY")}
                      {plan.isOverdue && !plan.isCompleted && " — Gecikmiş"}
                    </span>
                  )}
                  {plan.dueMileage && (
                    <span>🔧 {plan.dueMileage.toLocaleString("tr-TR")} km</span>
                  )}
                </div>
              </div>

              {/* Sil */}
              <button
                onClick={() => handleDelete(plan.id)}
                disabled={deletingId === plan.id}
                className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
