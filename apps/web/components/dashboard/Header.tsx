"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlobalSearch } from "./global-search";
import { DASHBOARD_QUICK_LINKS } from "@/lib/dashboard-navigation";

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
    <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center ambient-shadow border-b border-outline-variant/5">
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
                className={`text-sm transition-colors pb-1 ${
                  isActive
                    ? "text-blue-700 font-semibold border-b-2 border-blue-700"
                    : "text-slate-500 font-medium hover:text-blue-600"
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
          <Link href="/dashboard/notifications" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative" title="Bildirimler">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
          </Link>
          <Link href="/dashboard/settings" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Ayarlar">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
        {/* Profil */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm mr-3 ring-2 ring-blue-50">
            {getInitials(session?.user?.name || "Admin")}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-on-surface leading-none">{session?.user?.name || "Ahmet Bey"}</p>
            <p className="text-[11px] text-slate-500 font-medium">{currentRoleLabel || "Servis Müdürü"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
