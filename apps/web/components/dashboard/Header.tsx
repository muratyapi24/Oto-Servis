"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlobalSearch } from "./global-search";
import { DASHBOARD_QUICK_LINKS } from "@/lib/dashboard-navigation";
import { DASHBOARD_CHROME } from "@/lib/dashboard-ui-standards";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/*
  Üst menü çubuğu — Türkçe başlıklar & işlevsel kısayollar.
  GlobalSearch bileşeni entegre edildi (Ctrl+K ile de açılır).
*/

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || "AB";
  };

  const userRole = session?.user?.role;
  const roleLabel: Record<string, string> = {
    SERVICE_MANAGER: "Servis Müdürü",
    TECHNICIAN: "Teknisyen",
    FRONT_DESK: "Resepsiyon",
    ADMIN: "Yönetici",
    TENANT_ADMIN: "Yönetici",
    MECHANIC: "Usta",
    RECEPTIONIST: "Resepsiyon",
    ACCOUNTANT: "Muhasebe",
  };
  const currentRoleLabel = userRole ? roleLabel[userRole] : undefined;

  return (
    <header className={DASHBOARD_CHROME.headerShell}>
      <div className="flex items-center space-x-8">
        {/* Global Arama */}
        <GlobalSearch />

        {/* Hızlı Kısayollar */}
        <div className="hidden xl:flex items-center space-x-6">
          {DASHBOARD_QUICK_LINKS.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${DASHBOARD_CHROME.headerQuickLink} ${
                  isActive
                    ? DASHBOARD_CHROME.headerQuickLinkActive
                    : DASHBOARD_CHROME.headerQuickLinkIdle
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* İşlem Butonları */}
        <div className="flex items-center space-x-2 mr-4 border-r border-outline-variant/20 pr-4">
          <ThemeToggle />
          <Link href="/dashboard/notifications" className={`${DASHBOARD_CHROME.headerIconLink} relative`} title="Bildirimler">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface-container-lowest"></span>
          </Link>
          <Link href="/dashboard/settings" className={DASHBOARD_CHROME.headerIconLink} title="Ayarlar">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
        {/* Profil */}
        <div className="flex items-center">
          <div className={DASHBOARD_CHROME.headerAvatar}>
            {getInitials(session?.user?.name || "Admin")}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-on-surface leading-none">{session?.user?.name || "Ahmet Bey"}</p>
            <p className={DASHBOARD_CHROME.headerMeta}>{currentRoleLabel || "Servis Müdürü"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
