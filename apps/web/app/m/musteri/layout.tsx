"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function MusteriMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();

  // Custom auth escape route check
  const isLoginPage = pathname.endsWith("/m/musteri/login");

  if (isLoginPage) return <>{children}</>;

  // Alt sayfa mı kontrol et (mesajlar, belgeler, servis detay vb.)
  const isSubPage = pathname.includes("/m/musteri/mesajlar") ||
    pathname.includes("/m/musteri/belgeler") ||
    pathname.includes("/m/musteri/arac-ekle") ||
    pathname.match(/\/m\/musteri\/takip\/.+/);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32 antialiased selection:bg-secondary-container selection:text-white">
      {/* TopAppBar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center w-full px-6 h-14 sticky top-0 z-50 border-b border-outline-variant/5">
        <div className="flex items-center gap-3">
          {isSubPage ? (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_back</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-sm">
              <span className="text-white text-sm font-extrabold">BST</span>
            </div>
          )}
          <span className="text-[15px] font-bold tracking-tight text-on-surface">
            {isSubPage ? getSubPageTitle(pathname) : "MS OTO SERVİS"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors duration-200 active:scale-90">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">notifications</span>
          </button>
          <button
            onClick={() => router.push('/api/auth/signout?callbackUrl=/m/musteri/login')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-error-container/40 hover:bg-error-container transition-colors duration-200 active:scale-90"
          >
            <span className="material-symbols-outlined text-error text-[16px]">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {children}

      {/* Contextual FAB (Panel: 'Yeni Araç Ekle') */}
      {pathname === "/m/musteri/panel" && (
        <Link href="/m/musteri/arac-ekle" className="fixed right-5 bottom-24 w-13 h-13 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/30 active:scale-90 transition-transform z-40">
          <span className="material-symbols-outlined text-2xl">add</span>
        </Link>
      )}

      {/* BottomNavBar - 5 Tab */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-2.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl z-50 rounded-t-[1.5rem] shadow-[0_-2px_20px_rgba(0,0,0,0.04)] border-t border-outline-variant/8">
        <NavButton
          href="/m/musteri/panel"
          icon="home"
          label="Ana Sayfa"
          active={pathname === "/m/musteri/panel"}
        />
        <NavButton
          href="/m/musteri/takip"
          icon="build"
          label="Servis"
          active={pathname.startsWith("/m/musteri/takip")}
        />
        <NavButton
          href="/m/musteri/gecmis"
          icon="history"
          label="Geçmiş"
          active={pathname === "/m/musteri/gecmis"}
        />
        <NavButton
          href="/m/musteri/mesajlar"
          icon="chat"
          label="Mesajlar"
          active={pathname === "/m/musteri/mesajlar"}
        />
        <NavButton
          href="/m/musteri/profil"
          icon="account_circle"
          label="Profil"
          active={pathname === "/m/musteri/profil"}
        />
      </nav>
    </div>
  );
}

function getSubPageTitle(pathname: string): string {
  if (pathname.includes("/mesajlar")) return "Mesajlar";
  if (pathname.includes("/belgeler")) return "Belgelerim";
  if (pathname.includes("/arac-ekle")) return "Yeni Araç";
  if (pathname.match(/\/takip\/.+/)) return "Servis Detayı";
  return "MS OTO SERVİS";
}

function NavButton({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  if (active) {
    return (
      <Link href={href} className="flex flex-col items-center justify-center text-primary bg-primary-fixed/50 rounded-xl px-3 py-1.5 transition-all duration-300 ease-out active:scale-90 min-w-[56px]">
        <span className="material-symbols-outlined text-xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="text-[9px] font-bold">{label}</span>
      </Link>
    );
  }

  return (
    <Link href={href} className="flex flex-col items-center justify-center text-on-surface-variant/60 px-3 py-1.5 hover:text-primary transition-all duration-300 ease-out active:scale-90 min-w-[56px]">
      <span className="material-symbols-outlined text-xl mb-0.5">{icon}</span>
      <span className="text-[9px] font-bold">{label}</span>
    </Link>
  );
}
