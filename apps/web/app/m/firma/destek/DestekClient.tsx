"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Servis emri nasıl oluşturulur?",
    a: "Dashboard üzerinden 'Servisler' menüsüne giderek 'Yeni Servis Emri' butonuna tıklayın. Müşteri ve araç seçtikten sonra şikayeti girin ve kaydedin.",
  },
  {
    q: "Müşteri onayı nasıl gönderilir?",
    a: "Servis emri detay sayfasında 'Onay Bekliyor' statüsüne geçirdiğinizde sistem otomatik olarak müşteriye SMS ve e-posta gönderir.",
  },
  {
    q: "Stok uyarıları nasıl çalışır?",
    a: "Her parça için minimum stok seviyesi tanımlayabilirsiniz. Stok bu seviyenin altına düştüğünde dashboard'da kritik uyarı görünür.",
  },
  {
    q: "Fatura nasıl oluşturulur?",
    a: "Servis emri tamamlandığında 'Fatura Oluştur' butonuna tıklayın. Sistem otomatik olarak servis kalemlerinden fatura oluşturur.",
  },
  {
    q: "Usta performans raporu nerede?",
    a: "Dashboard'da 'Personel' menüsünden 'Performans' sekmesine gidin. Tamamlanan iş sayısı, ortalama süre ve müşteri puanlarını görebilirsiniz.",
  },
  {
    q: "Abonelik planımı nasıl değiştirebilirim?",
    a: "Dashboard'da 'Ayarlar > Abonelik' menüsünden mevcut planınızı görüntüleyebilir ve yükseltme yapabilirsiniz.",
  },
];

export default function DestekClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Konu ve açıklama zorunludur.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mobile/firma/destek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Talep gönderilemedi.");
      } else {
        setSuccess(true);
        setSubject("");
        setDescription("");
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Destek Merkezi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sık sorulan sorular ve destek talebi</p>
      </div>

      {/* SSS */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          Sık Sorulan Sorular
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 pr-4">{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Destek Talebi Formu */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          Destek Talebi Oluştur
        </h2>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-green-50 rounded-2xl border border-green-200">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
            <p className="text-base font-bold text-green-800">Talebiniz Alındı</p>
            <p className="text-sm text-green-600">
              En kısa sürede destek ekibimiz size dönüş yapacaktır.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-green-700 underline hover:no-underline"
            >
              Yeni talep oluştur
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <label className="text-sm font-bold text-gray-700">Konu *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Destek talebinizin konusu..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <label className="text-sm font-bold text-gray-700">Açıklama *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Sorununuzu veya talebinizi detaylı olarak açıklayın..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] resize-none outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Destek Talebi Gönder
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
