import Link from "next/link";
import {
  DASHBOARD_CHROME,
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
          {actions && <div className={DASHBOARD_CHROME.pageActions}>{actions}</div>}
        </section>

        {/* Page Content */}
        {children}
      </div>

      {/* Footer — Dashboard ile aynı */}
      {showFooter && (
        <footer className={DASHBOARD_CHROME.pageFooter}>
          <div className={DASHBOARD_CHROME.pageFooterInner}>
            <div className={DASHBOARD_CHROME.pageFooterBrandBlock}>
              <p className={DASHBOARD_CHROME.pageFooterBrand}>MS OTO SERVİS</p>
              <p className={DASHBOARD_CHROME.pageFooterMeta}>© 2026 MS OTO SERVİS. All rights reserved.</p>
            </div>
            <div className={DASHBOARD_CHROME.pageFooterLinks}>
              <Link href="#" className={DASHBOARD_CHROME.pageFooterLink}>Privacy Policy</Link>
              <Link href="#" className={DASHBOARD_CHROME.pageFooterLink}>Terms of Service</Link>
              <Link href="#" className={DASHBOARD_CHROME.pageFooterLink}>Contact Support</Link>
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
    <div className={DASHBOARD_CHROME.pageErrorShell}>
      <span
        className="material-symbols-outlined text-5xl text-error mb-4 opacity-50"
      >
        error
      </span>
      <h2 className="text-xl font-bold text-on-surface">Veri Yükleme Hatası</h2>
      <p className={DASHBOARD_CHROME.pageErrorMessage}>{message}</p>
    </div>
  );
}
