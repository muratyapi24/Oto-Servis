"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const DAYS = [
  { key: "MON", label: "Pzt" },
  { key: "TUE", label: "Sal" },
  { key: "WED", label: "Çar" },
  { key: "THU", label: "Per" },
  { key: "FRI", label: "Cum" },
  { key: "SAT", label: "Cmt" },
  { key: "SUN", label: "Paz" },
];

interface Mechanic {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  shiftStart: string | null;
  shiftEnd: string | null;
  workDays: string[];
  dailyTarget: number | null;
}

interface ShiftCalendarViewProps {
  mechanics: Mechanic[];
}

export default function ShiftCalendarView({ mechanics }: ShiftCalendarViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    shiftStart: string;
    shiftEnd: string;
    workDays: string[];
    dailyTarget: string;
  }>({ shiftStart: "", shiftEnd: "", workDays: [], dailyTarget: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  function startEdit(m: Mechanic) {
    setEditingId(m.id);
    setEditData({
      shiftStart: m.shiftStart ?? "",
      shiftEnd: m.shiftEnd ?? "",
      workDays: m.workDays ?? [],
      dailyTarget: m.dailyTarget ? String(m.dailyTarget) : "",
    });
    setSaveError(null);
    setSaveSuccess(null);
  }

  async function handleSave(mechanicId: string) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/dashboard/mechanics/${mechanicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftStart: editData.shiftStart || null,
          shiftEnd: editData.shiftEnd || null,
          workDays: editData.workDays,
          dailyTarget: editData.dailyTarget ? parseInt(editData.dailyTarget) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveError(data.error || "Güncelleme başarısız.");
      } else {
        setSaveSuccess("Vardiya güncellendi.");
        setEditingId(null);
      }
    } catch {
      setSaveError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: string) {
    setEditData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  }

  const activeMechanics = mechanics.filter((m) => m.isActive);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-outline-variant/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">calendar_month</span>
        <h3 className="font-bold text-on-surface">Vardiya Takvimi</h3>
        <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {activeMechanics.length} Aktif Usta
        </span>
      </div>

      {saveSuccess && (
        <div className="mx-6 mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {saveSuccess}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="px-6 py-3 text-left">Usta</th>
              <th className="px-4 py-3 text-center">Vardiya</th>
              {DAYS.map((d) => (
                <th key={d.key} className="px-3 py-3 text-center">{d.label}</th>
              ))}
              <th className="px-4 py-3 text-center">Hedef</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {activeMechanics.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                  Aktif usta bulunmuyor.
                </td>
              </tr>
            ) : (
              activeMechanics.map((m) => {
                const isEditing = editingId === m.id;
                return (
                  <tr key={m.id} className={`hover:bg-surface-container/30 transition-colors ${isEditing ? "bg-blue-50/50" : ""}`}>
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/mechanics/${m.id}`}
                        className="font-semibold text-on-surface hover:text-primary transition-colors"
                      >
                        {m.firstName} {m.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-on-surface-variant">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <input
                            type="time"
                            value={editData.shiftStart}
                            onChange={(e) => setEditData((p) => ({ ...p, shiftStart: e.target.value }))}
                            className="w-20 p-1 border border-gray-300 rounded text-xs"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            value={editData.shiftEnd}
                            onChange={(e) => setEditData((p) => ({ ...p, shiftEnd: e.target.value }))}
                            className="w-20 p-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      ) : (
                        m.shiftStart && m.shiftEnd
                          ? `${m.shiftStart} – ${m.shiftEnd}`
                          : <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {DAYS.map((d) => {
                      const active = isEditing
                        ? editData.workDays.includes(d.key)
                        : (m.workDays ?? []).includes(d.key);
                      return (
                        <td key={d.key} className="px-3 py-3 text-center">
                          {isEditing ? (
                            <button
                              onClick={() => toggleDay(d.key)}
                              className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                                active
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                            >
                              {d.label}
                            </button>
                          ) : (
                            <span
                              className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                active ? "bg-primary/10 text-primary" : "text-gray-200"
                              }`}
                            >
                              {active ? "✓" : "·"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.dailyTarget}
                          onChange={(e) => setEditData((p) => ({ ...p, dailyTarget: e.target.value }))}
                          placeholder="—"
                          className="w-14 p-1 border border-gray-300 rounded text-xs text-center"
                        />
                      ) : (
                        m.dailyTarget ? (
                          <span className="font-bold text-on-surface">{m.dailyTarget}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          {saveError && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {saveError}
                            </span>
                          )}
                          <button
                            onClick={() => handleSave(m.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-60"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 dark:bg-gray-800/50"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Düzenle
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
