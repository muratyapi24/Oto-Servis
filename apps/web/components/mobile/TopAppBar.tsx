"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopAppBarProps {
  title?: string;
  userName?: string;
  userImageUrl?: string;
  onMenuClick?: () => void;
  showMenuIcon?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = "MS OTO SERVİS",
  userImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBDf-BN2alHhjqPNv9qWElQqv2-PLHa5AvgW4aLloXoRSQLS36Jwn6eLEwEL61GVFEcTTjdAXip1HPcBhfM4NGaFY-99sz5d2zJisG2-GekwMTYMFiYYXKcQZvZAaKdkTFG43mt4a4wZBymg6KzW1CcCbtJZYA52ry_CffNVxMXm5E-U-CeeSck8zsoivL7nP7hFZHXXwcQVWXqM-8mf8ybdWb5bJoNsCIsg6aLsdorPDZqXp97hAyikaxlcJmmIEGjbCPM33W0m2YY",
  showMenuIcon = false,
  onMenuClick,
}) => {
  const pathname = usePathname();

  if (pathname.endsWith("/login")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#eff4ff] dark:bg-slate-900 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        {showMenuIcon ? (
          <button
            onClick={onMenuClick}
            className="text-blue-900 border-none bg-transparent dark:text-blue-100 hover:bg-blue-100/50 transition-colors p-2 rounded-lg"
          >
            <span className="material-symbols-outlined shrink-0" data-icon="menu_open">
              menu_open
            </span>
          </button>
        ) : (
          <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container-highest">
            <img
              alt="Owner Profile"
              className="w-full h-full object-cover"
              src={userImageUrl}
            />
          </div>
        )}
        {showMenuIcon && (
          <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100 font-['Inter'] tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {!showMenuIcon && (
        <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100 font-['Inter'] tracking-tight">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="p-2 border-none shrink-0 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200">
          <span
            className="material-symbols-outlined text-blue-800 dark:text-blue-400 block"
            data-icon="notifications"
          >
            notifications
          </span>
        </button>
      </div>
    </header>
  );
};
