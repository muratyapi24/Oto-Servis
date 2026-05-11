"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentType } from "react";
import { Bell, Building2, CreditCard, FileText, Gift, MapPin, RefreshCw } from "lucide-react";
import { canAccess } from "@/lib/permissions";
import { SETTINGS_WORKSPACE_TABS, type SettingsWorkspaceTab } from "@/lib/settings-workspace";

const ICONS: Record<SettingsWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  building: Building2,
  map: MapPin,
  bell: Bell,
  invoice: FileText,
  sync: RefreshCw,
  card: CreditCard,
  gift: Gift,
};

function isActiveTab(pathname: string | null, href: string) {
  if (href === "/dashboard/settings") {
    return pathname === href;
  }

  return pathname === href || pathname?.startsWith(`${href}/`);
}

export default function SettingsWorkspaceNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const visibleTabs = role
    ? SETTINGS_WORKSPACE_TABS.filter((tab) => canAccess(role, tab.href))
    : SETTINGS_WORKSPACE_TABS;

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {visibleTabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const isActive = isActiveTab(pathname, tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-black transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
