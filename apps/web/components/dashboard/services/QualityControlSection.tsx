"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, AlertCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { updateQualityCheck } from "@/lib/actions/quality-check.actions";

interface QualityControlSectionProps {
  serviceOrderId: string;
  status: string;
  qualityCheckNotes: string | null;
  qualityCheckedAt: string | null;
  qualityCheckedBy: string | null;
}

export default function QualityControlSection({
  serviceOrderId,
  status,
  qualityCheckNotes: initialNotes,
  qualityCheckedAt,
  qualityCheckedBy,
}: QualityControlSectionProps) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState(initialNotes);

  const isCompleted = status === "COMPLETED";

  async function handleSave() {
    if (!notes.trim()) {
      setError("Kalite notu zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateQualityCheck(serviceOrderId, { qualityCheckNotes: notes });
      if (res.error) {
        setError(res.error);
      } else {
        setSavedNotes(notes);
        setSuccess("Kalite kontrol notu kaydedildi.");
        setEditing(false);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4" /> Kalite Kontrol
      </h3>

      {success && (
        <div className="mb-3 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {savedNotes ? (
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
            {savedNotes}
          </div>
          {(qualityCheckedAt || qualityCheckedBy) && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {qualityCheckedBy && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Kontrol Eden:</span>
                  {qualityCheckedBy}
                </span>
              )}
              {qualityCheckedAt && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Tarih:</span>
                  {dayjs(qualityCheckedAt).locale("tr").format("DD MMM YYYY HH:mm")}
                </span>
              )}
            </div>
          )}
          {isCompleted && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Notu Düzenle
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mb-3">Kalite kontrolü henüz yapılmadı.</p>
      )}

      {isCompleted && (editing || !savedNotes) && (
        <div className="mt-3 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Kalite kontrol notlarını girin..."
            className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(false); setNotes(savedNotes ?? ""); setError(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
              >
                İptal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
