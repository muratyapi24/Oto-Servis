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
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  DASHBOARD_LIST,
  DASHBOARD_SURFACES,
} from "@/lib/dashboard-ui-standards";

const SEGMENT_LABELS: Record<string, string> = {
  ALL: "Tüm Müşteriler",
  OVERDUE_INVOICE: "Vadesi Geçmiş Fatura",
  VEHICLE_BRAND: "Araç Markası",
  INACTIVE: "Pasif Müşteriler",
  ACTIVE: "Aktif Müşteriler",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Taslak", color: "text-on-surface-variant" },
  RUNNING: { label: "Çalışıyor", color: "text-primary" },
  COMPLETED: { label: "Tamamlandı", color: "text-tertiary" },
  FAILED: { label: "Başarısız", color: "text-error" },
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
          className={DASHBOARD_ACTIONS.primaryButton}
        >
          <Plus className="w-4 h-4" />
          Yeni Kampanya
        </button>
      </div>

      {/* Kampanya Formu */}
      {showForm && (
        <div className={`${DASHBOARD_SURFACES.panel} p-6 space-y-4`}>
          <h3 className="font-black text-on-surface">Yeni Toplu Bildirim Kampanyası</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={DASHBOARD_FORMS.label}>Kampanya Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Kampanya adı..."
                className={DASHBOARD_FORMS.control}
              />
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Kanal</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as BulkCampaignInput["channel"] })}
                className={DASHBOARD_FORMS.select}
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Hedef Segment</label>
              <select
                value={formData.segmentType}
                onChange={(e) => setFormData({ ...formData, segmentType: e.target.value as BulkCampaignInput["segmentType"] })}
                className={DASHBOARD_FORMS.select}
              >
                {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {previewCount !== null && (
              <div className={`${DASHBOARD_SURFACES.mutedPanel} flex items-center gap-2 px-4 py-3`}>
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-on-surface">{previewCount} müşteri etkilenecek</span>
              </div>
            )}
          </div>
          <div>
            <label className={DASHBOARD_FORMS.label}>Mesaj İçeriği</label>
            <textarea
              value={formData.messageBody}
              onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
              rows={4}
              placeholder="{{musteriAdi}} değişkenini kullanabilirsiniz..."
              className={`${DASHBOARD_FORMS.control} resize-none`}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handlePreview}
              className={DASHBOARD_ACTIONS.secondaryButton}
            >
              <Users className="w-4 h-4" />
              Önizle
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={DASHBOARD_ACTIONS.secondaryButton}
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.name || !formData.messageBody}
              className={DASHBOARD_ACTIONS.primaryButton}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Kampanya Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Kampanya Listesi */}
      {campaigns.length === 0 ? (
        <div className={`${DASHBOARD_SURFACES.panel} p-16 text-center`}>
          <Send className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-black text-on-surface mb-2">Henüz kampanya yok</h3>
          <p className="text-on-surface-variant text-sm">İlk toplu bildirim kampanyanızı oluşturun.</p>
        </div>
      ) : (
        <div className={DASHBOARD_LIST.shell}>
          <table className="w-full text-sm">
            <thead className={DASHBOARD_LIST.headRow}>
              <tr>
                <th className={DASHBOARD_LIST.headerCell}>Kampanya</th>
                <th className={DASHBOARD_LIST.headerCell}>Kanal</th>
                <th className={DASHBOARD_LIST.headerCell}>Segment</th>
                <th className="px-6 py-4 text-center">Gönderilen</th>
                <th className={DASHBOARD_LIST.headerCell}>Durum</th>
                <th className={DASHBOARD_LIST.headerCellRight}>İşlem</th>
              </tr>
            </thead>
            <tbody className={DASHBOARD_LIST.body}>
              {campaigns.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status] || { label: "Bilinmiyor", color: "text-on-surface-variant" };
                return (
                  <tr key={c.id} className={DASHBOARD_LIST.row}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{c.name}</div>
                      <div className="text-xs text-on-surface-variant/70">{dayjs(c.createdAt).format("DD MMM YYYY")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={DASHBOARD_LIST.badge}>{c.channel}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{SEGMENT_LABELS[c.segmentType] ?? c.segmentType}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-on-surface">{c.sentCount}</span>
                      <span className="text-on-surface-variant/70">/{c.totalCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black ${statusCfg.color}`}>{statusCfg.label}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "DRAFT" && (
                        <button
                          onClick={() => handleStart(c.id)}
                          disabled={startingId === c.id}
                          className="flex items-center gap-1.5 bg-tertiary-fixed/30 hover:bg-tertiary-fixed/40 text-on-tertiary-fixed-variant border border-tertiary-fixed-dim/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ml-auto"
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
