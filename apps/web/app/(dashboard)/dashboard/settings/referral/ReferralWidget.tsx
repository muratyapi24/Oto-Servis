"use client";

import { useState } from "react";
import { Copy, Check, Gift, Users, Calendar } from "lucide-react";

interface ReferralWidgetProps {
  referralCode: string;
  referralUrl: string;
  referredCount: number;
  creditedMonths: number;
  pendingCount: number;
}

export function ReferralWidget({
  referralCode,
  referralUrl,
  referredCount,
  creditedMonths,
  pendingCount,
}: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <header className="h-12 bg-white flex shrink-0 items-center gap-3 px-6 border-b border-outline/20">
        <Gift className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-bold tracking-tight uppercase text-on-surface">Referral Programı</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Program açıklaması */}
        <div className="bg-gradient-to-br from-primary/10 to-blue-50 border border-primary/20 rounded-2xl p-6">
          <h3 className="font-black text-on-surface text-lg mb-2">Bir müşteri getir, 1 ay ücretsiz kazan!</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Referral linkinizi paylaşın. Bir arkadaşınız veya tanıdığınız bu link üzerinden kayıt olur
            ve ücretli aboneliğe geçerse, sizin aboneliğinize otomatik olarak <strong>1 ay ücretsiz</strong> eklenir.
            Sınırsız kazanım — her referans için ayrı kredi!
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Users className="h-5 w-5 text-blue-600" />, label: "Davet Edilen", value: referredCount, sub: "kişi" },
            { icon: <Calendar className="h-5 w-5 text-emerald-600" />, label: "Kazanılan Kredi", value: creditedMonths, sub: "ay" },
            { icon: <Gift className="h-5 w-5 text-violet-600" />, label: "Bekleyen Kredi", value: pendingCount, sub: "ay" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-outline/20 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-2xl font-black text-on-surface">{stat.value}</p>
              <p className="text-xs text-on-surface-variant">{stat.sub}</p>
              <p className="text-xs font-semibold text-on-surface-variant mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral kodu */}
        <div className="bg-white border border-outline/20 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-on-surface">Referral Kodunuz</p>
          <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 border border-outline/20">
            <code className="flex-1 font-mono text-base font-bold text-primary tracking-wide">{referralCode}</code>
          </div>

          <p className="text-sm font-bold text-on-surface">Davet Linkiniz</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 border border-outline/20 overflow-hidden">
              <p className="text-xs text-on-surface-variant truncate font-mono">{referralUrl}</p>
            </div>
            <button
              onClick={copyUrl}
              className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {copied ? <><Check className="h-4 w-4" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Kopyala</>}
            </button>
          </div>
        </div>

        {/* Nasıl çalışır */}
        <div className="bg-white border border-outline/20 rounded-2xl p-5">
          <p className="text-sm font-bold text-on-surface mb-4">Nasıl çalışır?</p>
          <ol className="space-y-3">
            {[
              "Referral linkinizi bir oto servis sahibine gönderin.",
              "O kişi linke tıklayarak kayıt olur.",
              "Kayıtlı kişi ücretli bir plana geçtiğinde...",
              "Aboneliğinize otomatik olarak 1 ay ücretsiz eklenir!",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <span className="shrink-0 w-6 h-6 bg-primary/10 text-primary text-xs font-black rounded-full flex items-center justify-center">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Paylaş */}
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Oto servis yönetim yazılımı kullanıyorum, çok işime yarıyor. Sana özel link: ${referralUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
          >
            WhatsApp ile Paylaş
          </a>
          <a
            href={`mailto:?subject=Oto Servis Yönetim Yazılımı&body=${encodeURIComponent(`Merhaba,\n\nOto servis yönetim yazılımı kullanıyorum. Sana özel link:\n${referralUrl}\n\nİyi çalışmalar!`)}`}
            className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            E-posta ile Paylaş
          </a>
        </div>
      </div>
    </div>
  );
}
