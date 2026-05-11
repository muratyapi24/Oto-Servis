"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Plus, Play, Loader2, Users, Send } from "lucide-react";
import {
  createBulkCampaign,
  startBulkCampaign,
  previewBulkCampaign,
} from "@/lib/actions/bulk-notification.actions";
import type { BulkCampaignInput } from "@/lib/validations/notification";
import type { BulkCampaignListItem } from "@/components/dashboard/notifications/types";

const SEGMENT_LABELS: Record<string, string> = {
  ALL: "Tüm Müşteriler",
  OVERDUE_INVOICE: "Vadesi Geçmiş Fatura",
  VEHICLE_BRAND: "Araç Markası",
  INACTIVE: "Pasif Müşteriler",
  ACTIVE: "Aktif Müşteriler",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Taslak", color: "text-slate-500" },
  RUNNING: { label: "Çalışıyor", color: "text-blue-600" },
  COMPLETED: { label: "Tamamlandı", color: "text-emerald-600" },
  FAILED: { label: "Başarısız", color: "text-red-600" },
};

export default function BulkNotificationClient({ campaigns }: { campaigns: BulkCampaignListItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const [formData, setFormData] = useState<BulkCampaignInput>({
    name: "",
    channel: "SMS",
    messageBody: "",
    segmentType: "ALL",
    segmentParams: {} as Record<string, unknown>,
  });

  const handlePreview = async () => {
    const result = await previewBulkCampaign(formData.segmentType, formData.segmentParams);
    if (result.success && result.data) {
      setPreviewCount(result.data.count);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const result = await createBulkCampaign(formData);
      if (result.success) {
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (campaignId: string) => {
    if (!confirm("Kampanyayı başlatmak istediğinize emin misiniz?")) return;
    setStartingId(campaignId);
    try {
      await startBulkCampaign(campaignId);
      router.refresh();
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Kampanya
        </button>
      </div>

      {/* Kampanya Formu */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-slate-900">Yeni Toplu Bildirim Kampanyası</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Kampanya Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Kampanya adı..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Kanal</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as BulkCampaignInput["channel"] })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Hedef Segment</label>
              <select
                value={formData.segmentType}
                onChange={(e) => setFormData({ ...formData, segmentType: e.target.value as BulkCampaignInput["segmentType"] })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {previewCount !== null && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">{previewCount} müşteri etkilenecek</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Mesaj İçeriği</label>
            <textarea
              value={formData.messageBody}
              onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
              rows={4}
              placeholder="{{musteriAdi}} değişkenini kullanabilirsiniz..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              <Users className="w-4 h-4" />
              Önizle
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.name || !formData.messageBody}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Kampanya Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Kampanya Listesi */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <Send className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">Henüz kampanya yok</h3>
          <p className="text-slate-400 text-sm">İlk toplu bildirim kampanyanızı oluşturun.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left">Kampanya</th>
                <th className="px-6 py-4 text-left">Kanal</th>
                <th className="px-6 py-4 text-left">Segment</th>
                <th className="px-6 py-4 text-center">Gönderilen</th>
                <th className="px-6 py-4 text-left">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status] || { label: "Bilinmiyor", color: "text-slate-500" };
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{dayjs(c.createdAt).format("DD MMM YYYY")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{c.channel}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{SEGMENT_LABELS[c.segmentType] ?? c.segmentType}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-700">{c.sentCount}</span>
                      <span className="text-slate-400">/{c.totalCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black ${statusCfg.color}`}>{statusCfg.label}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "DRAFT" && (
                        <button
                          onClick={() => handleStart(c.id)}
                          disabled={startingId === c.id}
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ml-auto"
                        >
                          {startingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          Başlat
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
