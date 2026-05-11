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
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Şablon
        </button>
      </div>

      {/* Şablon Formu */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-slate-900">
            {editingTemplate ? "Şablonu Düzenle" : "Yeni Şablon"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Tür</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationTemplateInput["type"] })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Kanal</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as NotificationTemplateInput["channel"] })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Şablon Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Şablon adı..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Mesaj İçeriği</label>
              <span className={`text-xs font-bold ${isSmsWarning ? "text-red-500" : "text-slate-400"}`}>
                {charCount} karakter{isSmsWarning && " ⚠️ 160 karakter aşıldı"}
              </span>
            </div>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={4}
              placeholder="{{musteriAdi}}, {{aracPlaka}}, {{isEmriNo}}, {{durum}}, {{tutar}}, {{randevuTarihi}}, {{randevuSaati}}, {{onayUrl}}"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Değişkenler: {"{{musteriAdi}}"}, {"{{aracPlaka}}"}, {"{{isEmriNo}}"}, {"{{durum}}"}, {"{{tutar}}"}, {"{{randevuTarihi}}"}, {"{{randevuSaati}}"}, {"{{onayUrl}}"}
            </p>
          </div>
          {formData.channel === "WHATSAPP" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">HSM Şablon Adı (Meta)</label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  placeholder="meta_template_name"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Dil Kodu</label>
                <input
                  type="text"
                  value={formData.languageCode}
                  onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                  placeholder="tr"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setEditingTemplate(null); }}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.body}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingTemplate ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* Önizleme */}
      {previewText && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Önizleme</span>
            <button onClick={() => setPreviewText(null)} className="text-blue-400 hover:text-blue-600 text-xs">Kapat</button>
          </div>
          <p className="text-sm text-blue-800">{previewText}</p>
        </div>
      )}

      {/* Şablon Listesi */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-black text-slate-700 mb-2">Henüz şablon yok</h3>
          <p className="text-slate-400 text-sm">İlk bildirim şablonunuzu oluşturun.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left">Şablon Adı</th>
                <th className="px-6 py-4 text-left">Tür</th>
                <th className="px-6 py-4 text-left">Kanal</th>
                <th className="px-6 py-4 text-left">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                  <td className="px-6 py-4 text-slate-600">{TYPE_LABELS[t.type] ?? t.type}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {CHANNEL_LABELS[t.channel] ?? t.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${t.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {t.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
