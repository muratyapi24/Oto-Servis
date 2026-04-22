import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MS Oto Servis | Modern Oto Servis Yönetim Platformu",
    template: "%s | MS Oto Servis",
  },
  description:
    "Oto servis işletmenizi dijitalleştirin. Müşteri yönetimi, servis takibi, stok kontrolü, faturalama ve daha fazlası tek platformda. 14 gün ücretsiz deneyin.",
  keywords: [
    "oto servis",
    "servis yönetimi",
    "araç bakım",
    "oto servis yazılımı",
    "servis takip",
    "stok yönetimi",
    "müşteri yönetimi",
    "SaaS",
  ],
  authors: [{ name: "MS Oto Servis" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://bstotoservis.com",
    siteName: "MS Oto Servis",
    title: "MS Oto Servis | Modern Oto Servis Yönetim Platformu",
    description:
      "Oto servis işletmenizi dijitalleştirin. Tek platformda tüm operasyonlarınızı yönetin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MS Oto Servis",
    description:
      "Modern, bulut tabanlı oto servis yönetim platformu.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BST Servis",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
