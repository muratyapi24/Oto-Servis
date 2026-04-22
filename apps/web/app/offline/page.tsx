"use client";

export default function OfflinePage() {
  // Locale cookie'den oku
  const locale = typeof document !== "undefined"
    ? document.cookie.match(/locale=([^;]+)/)?.[1] ?? "tr"
    : "tr";

  const messages = {
    tr: {
      title: "İnternet Bağlantısı Yok",
      message: "Bağlantınız kesildi. Lütfen internet bağlantınızı kontrol edin.",
      retry: "Yeniden Dene",
    },
    en: {
      title: "No Internet Connection",
      message: "Your connection was lost. Please check your internet connection.",
      retry: "Try Again",
    },
  };

  const t = messages[locale as keyof typeof messages] ?? messages.tr;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.title}</h1>
        <p className="text-gray-600 mb-6">{t.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
}
