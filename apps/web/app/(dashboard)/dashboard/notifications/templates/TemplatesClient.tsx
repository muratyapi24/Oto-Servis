"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Loader2, FileText } from "lucide-react";
import {
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  previewTemplate,
} from "@/lib/actions/template.actions";
import type { NotificationTemplateInput } from "@/lib/validations/notification";
import type { NotificationTemplateListItem } from "@/components/dashboard/notifications/types";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_FORMS,
  DASHBOARD_LIST,
  DASHBOARD_SURFACES,
} from "@/lib/dashboard-ui-standards";

const TYPE_LABELS: Record<string, string> = {
  SERVICE_STATUS: "Servis Durumu",
  APPROVAL: "Onay Talebi",
  APPOINTMENT: "Randevu",
  QUOTE: "Teklif",
  REMINDER: "Hatırlatma",
  BULK: "Toplu Bildirim",
};

const CHANNEL_LABELS: Record<string, string> = {
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-posta",
};

export default function TemplatesClient({ templates }: { templates: NotificationTemplateListItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateListItem | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<NotificationTemplateInput>({
    type: "SERVICE_STATUS",
    channel: "SMS",
    name: "",
    body: "",
    templateName: "",
    languageCode: "tr",
    isActive: true,
    isDefault: false,
  });

  const charCount = formData.body.length;
  const isSmsWarning = formData.channel === "SMS" && charCount > 160;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        await updateNotificationTemplate(editingTemplate.id, formData);
      } else {
        await createNotificationTemplate(formData);
      }
      setShowForm(false);
      setEditingTemplate(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: NotificationTemplateListItem) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      channel: template.channel,
      name: template.name,
      body: template.body,
      templateName: template.templateName ?? "",
      languageCode: template.languageCode ?? "tr",
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    setDeletingId(templateId);
    try {
      await deleteNotificationTemplate(templateId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (templateId: string) => {
    const result = await previewTemplate(templateId);
    if (result.success && result.data) {
      setPreviewText(result.data.preview);
    }
  };

  return (
    <div className="space-y-6">
      {/* Yeni Şablon Butonu */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({ type: "SERVICE_STATUS", channel: "SMS", name: "", body: "", templateName: "", languageCode: "tr", isActive: true, isDefault: false });
            setShowForm(true);
          }}
          className={DASHBOARD_ACTIONS.primaryButton}
        >
          <Plus className="w-4 h-4" />
          Yeni Şablon
        </button>
      </div>

      {/* Şablon Formu */}
      {showForm && (
        <div className={`${DASHBOARD_SURFACES.panel} p-6 space-y-4`}>
          <h3 className="font-black text-on-surface">
            {editingTemplate ? "Şablonu Düzenle" : "Yeni Şablon"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={DASHBOARD_FORMS.label}>Tür</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationTemplateInput["type"] })}
                className={DASHBOARD_FORMS.select}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Kanal</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as NotificationTemplateInput["channel"] })}
                className={DASHBOARD_FORMS.select}
              >
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={DASHBOARD_FORMS.label}>Şablon Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Şablon adı..."
                className={DASHBOARD_FORMS.control}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={DASHBOARD_FORMS.label}>Mesaj İçeriği</label>
              <span className={`text-xs font-bold ${isSmsWarning ? "text-error" : "text-on-surface-variant/70"}`}>
                {charCount} karakter{isSmsWarning && " ⚠️ 160 karakter aşıldı"}
              </span>
            </div>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={4}
              placeholder="{{musteriAdi}}, {{aracPlaka}}, {{isEmriNo}}, {{durum}}, {{tutar}}, {{randevuTarihi}}, {{randevuSaati}}, {{onayUrl}}"
              className={`${DASHBOARD_FORMS.control} resize-none`}
            />
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Değişkenler: {"{{musteriAdi}}"}, {"{{aracPlaka}}"}, {"{{isEmriNo}}"}, {"{{durum}}"}, {"{{tutar}}"}, {"{{randevuTarihi}}"}, {"{{randevuSaati}}"}, {"{{onayUrl}}"}
            </p>
          </div>
          {formData.channel === "WHATSAPP" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={DASHBOARD_FORMS.label}>HSM Şablon Adı (Meta)</label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  placeholder="meta_template_name"
                  className={DASHBOARD_FORMS.control}
                />
              </div>
              <div>
                <label className={DASHBOARD_FORMS.label}>Dil Kodu</label>
                <input
                  type="text"
                  value={formData.languageCode}
                  onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                  placeholder="tr"
                  className={DASHBOARD_FORMS.control}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setEditingTemplate(null); }}
              className={DASHBOARD_ACTIONS.secondaryButton}
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.body}
              className={DASHBOARD_ACTIONS.primaryButton}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingTemplate ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* Önizleme */}
      {previewText && (
        <div className={`${DASHBOARD_SURFACES.mutedPanel} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Önizleme</span>
            <button onClick={() => setPreviewText(null)} className="text-on-surface-variant hover:text-primary text-xs">Kapat</button>
          </div>
          <p className="text-sm text-on-surface">{previewText}</p>
        </div>
      )}

      {/* Şablon Listesi */}
      {templates.length === 0 ? (
        <div className={`${DASHBOARD_SURFACES.panel} p-16 text-center`}>
          <FileText className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-black text-on-surface mb-2">Henüz şablon yok</h3>
          <p className="text-on-surface-variant text-sm">İlk bildirim şablonunuzu oluşturun.</p>
        </div>
      ) : (
        <div className={DASHBOARD_LIST.shell}>
          <table className="w-full text-sm">
            <thead className={DASHBOARD_LIST.headRow}>
              <tr>
                <th className={DASHBOARD_LIST.headerCell}>Şablon Adı</th>
                <th className={DASHBOARD_LIST.headerCell}>Tür</th>
                <th className={DASHBOARD_LIST.headerCell}>Kanal</th>
                <th className={DASHBOARD_LIST.headerCell}>Durum</th>
                <th className={DASHBOARD_LIST.headerCellRight}>İşlem</th>
              </tr>
            </thead>
            <tbody className={DASHBOARD_LIST.body}>
              {templates.map((t) => (
                <tr key={t.id} className={DASHBOARD_LIST.row}>
                  <td className="px-6 py-4 font-bold text-on-surface">{t.name}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="px-6 py-4">
                    <span className={DASHBOARD_LIST.badge}>
                      {CHANNEL_LABELS[t.channel] ?? t.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${t.isActive ? "text-tertiary" : "text-on-surface-variant/70"}`}>
                      {t.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(t.id)}
                        className={DASHBOARD_ACTIONS.iconButton}
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(t)}
                        className={DASHBOARD_ACTIONS.iconButtonPrimary}
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className={`${DASHBOARD_ACTIONS.iconButtonDanger} disabled:opacity-50`}
                        title="Sil"
                      >
                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
