/**
 * MockPageGuard — Super admin sayfalarında mock veri varsa production'da uyarı gösterir.
 *
 * ENABLE_SUPER_ADMIN_PREVIEW=true env ile override edilebilir.
 * Kullanım: sayfanın en üstüne <MockPageGuard> ekle ve gerçek içeriği içine al.
 */

import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

function isPreviewEnabled(): boolean {
  return process.env.ENABLE_SUPER_ADMIN_PREVIEW === "true";
}

interface MockPageGuardProps {
  /** Sayfanın başlığı — Coming Soon ekranında gösterilir */
  title: string;
  /** Kısa açıklama — ne zaman gerçek veri bağlanacağı */
  description?: string;
  children: React.ReactNode;
}

export function MockPageGuard({ title, description, children }: MockPageGuardProps) {
  if (process.env.NODE_ENV === "production" && !isPreviewEnabled()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <Construction className="h-10 w-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {description ?? "Bu bölüm üretim ortamında henüz gerçek veriye bağlanmadı. Yakında aktif edilecektir."}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Önizleme için <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 dark:text-gray-200">ENABLE_SUPER_ADMIN_PREVIEW=true</code> ayarını kullanın.
          </p>
        </div>
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Panele Dön
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * MockDataBadge — Geliştirme ortamında mock veri içerdiğini belirten küçük rozet.
 * Sayfanın üstüne eklenebilir; production'da gizlenir.
 */
export function MockDataBadge({ label = "Demo Verisi" }: { label?: string }) {
  if (process.env.NODE_ENV === "production" && !isPreviewEnabled()) return null;
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
      {label} — Gerçek veriye bağlanmayı bekliyor
    </div>
  );
}
