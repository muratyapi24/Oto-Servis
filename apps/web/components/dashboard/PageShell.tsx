import Link from "next/link";
import {
  DASHBOARD_TYPOGRAPHY,
  dashboardPageContainerClass,
} from "@/lib/dashboard-ui-standards";

/**
 * PageShell — Dashboard modülleri için ortak sayfa kapsayıcısı.
 * Dashboard Overview tasarımındaki layout DNA'sını tüm sayfalara taşır.
 *
 * Kullanım:
 *   <PageShell title="Araçlar" subtitle="Araç filosu envanterinizi yönetin."
 *     sectionLabel="Filo Yönetimi" actions={<button>+ Ekle</button>}>
 *     {children}
 *   </PageShell>
 */

interface PageShellProps {
  /** Sayfa ana başlığı — H1 olarak render edilir */
  title: string;
  /** Başlık altı açıklama */
  subtitle?: string;
  /** Küçük üst etiket (ör: "Stok & Envanter", "Filo Yönetimi") */
  sectionLabel?: string;
  /** Sağ üst aksiyon butonları slotu */
  actions?: React.ReactNode;
  /** İçerik */
  children: React.ReactNode;
  /** Footer gösterilsin mi (varsayılan: true) */
  showFooter?: boolean;
  /** Ek className */
  className?: string;
}

export default function PageShell({
  title,
  subtitle,
  sectionLabel,
  actions,
  children,
  showFooter = true,
  className = "",
}: PageShellProps) {
  return (
    <>
      <div className={dashboardPageContainerClass(className)}>
        {/* Welcome / Section Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            {sectionLabel && (
              <h2 className={DASHBOARD_TYPOGRAPHY.sectionLabel}>
                {sectionLabel}
              </h2>
            )}
            <h1 className={DASHBOARD_TYPOGRAPHY.pageTitle}>
              {title}
            </h1>
            {subtitle && (
              <p className={DASHBOARD_TYPOGRAPHY.pageSubtitle}>{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex space-x-3 flex-shrink-0">{actions}</div>}
        </section>

        {/* Page Content */}
        {children}
      </div>

      {/* Footer — Dashboard ile aynı */}
      {showFooter && (
        <footer className="w-full mt-auto bg-white border-t border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-4 md:mb-0">
              <p className="text-sm font-bold text-slate-900 mb-1">MS OTO SERVİS</p>
              <p className="text-xs font-normal text-slate-500">© 2026 MS OTO SERVİS. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-xs font-normal text-slate-400 hover:text-blue-500 transition-opacity">Privacy Policy</Link>
              <Link href="#" className="text-xs font-normal text-slate-400 hover:text-blue-500 transition-opacity">Terms of Service</Link>
              <Link href="#" className="text-xs font-normal text-slate-400 hover:text-blue-500 transition-opacity">Contact Support</Link>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

/** Standart hata durumu bileşeni — tüm moüller için ortak */
export function PageError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
      <span
        className="material-symbols-outlined text-5xl text-error mb-4 opacity-50"
      >
        error
      </span>
      <h2 className="text-xl font-bold text-on-surface">Veri Yükleme Hatası</h2>
      <p className="text-slate-500 mt-2">{message}</p>
    </div>
  );
}
