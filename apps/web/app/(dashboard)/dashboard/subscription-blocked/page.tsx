import Link from "next/link";

export const metadata = {
  title: "Abonelik Kısıtlaması | OtoServis",
};

export default async function SubscriptionBlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason || "expired";

  const reasonConfig: Record<string, { title: string; description: string; icon: string; color: string }> = {
    suspended: {
      title: "Hesabınız Askıya Alındı",
      description:
        "Hesabınız yönetici tarafından askıya alınmıştır. Lütfen destek ekibimizle iletişime geçin veya ödeme durumunuzu kontrol edin.",
      icon: "block",
      color: "bg-red-500",
    },
    deleted: {
      title: "Hesap Kapatıldı",
      description:
        "Hesabınız kapatılmıştır. Yeniden aktifleştirmek için destek ekibimizle iletişime geçin.",
      icon: "delete_forever",
      color: "bg-red-700",
    },
    expired: {
      title: "Aboneliğinizin Süresi Doldu",
      description:
        "Abonelik süreniz sona ermiştir. Sistemi kullanmaya devam etmek için lütfen paketinizi yenileyin.",
      icon: "schedule",
      color: "bg-amber-500",
    },
    cancelled: {
      title: "Aboneliğiniz İptal Edildi",
      description:
        "Aboneliğiniz iptal edilmiştir. Yeniden aktifleştirmek için bir paket seçin.",
      icon: "cancel",
      color: "bg-slate-500",
    },
  };

  const defaultConfig = { title: "Aboneliğinizin Süresi Doldu", description: "Abonelik süreniz sona ermiştir.", icon: "schedule", color: "bg-amber-500" };
  const config = reasonConfig[reason] ?? defaultConfig;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-lg w-full">
        {/* Ana Kart */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Üst Renkli Bant */}
          <div className={`${config.color} px-8 py-10 text-white text-center`}>
            <span
              className="material-symbols-outlined text-6xl mb-4 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {config.icon}
            </span>
            <h1 className="text-2xl font-black">{config.title}</h1>
          </div>

          {/* İçerik */}
          <div className="px-8 py-8">
            <p className="text-slate-600 text-sm leading-relaxed mb-8 text-center">
              {config.description}
            </p>

            {/* Aksiyonlar */}
            <div className="flex flex-col gap-3">
              {/* Paket Yükselt — sadece expired/cancelled için */}
              {(reason === "expired" || reason === "cancelled") && (
                <Link
                  href="/dashboard/settings/billing"
                  className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">upgrade</span>
                  Paket Yükselt / Yenile
                </Link>
              )}

              {/* Ayarlar — suspended ve deleted için settings'e izin ver */}
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Firma Ayarlarına Git
              </Link>

              {/* Destek */}
              <a
                href="mailto:destek@otoservis.com"
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                Destek Ekibiyle İletişim
              </a>

              {/* Çıkış */}
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-medium mt-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Farklı Hesapla Giriş Yap
              </Link>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Yardıma mı ihtiyacınız var? Bize{" "}
          <a href="mailto:destek@otoservis.com" className="underline">destek@otoservis.com</a>{" "}
          adresinden ulaşın.
        </p>
      </div>
    </div>
  );
}
