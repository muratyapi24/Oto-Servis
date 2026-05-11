"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentType } from "react";
import { Bell, FileText, Send, Settings } from "lucide-react";
import { canAccess } from "@/lib/permissions";
import { NOTIFICATION_WORKSPACE_TABS, type NotificationWorkspaceTab } from "@/lib/notification-workspace";

const ICONS: Record<NotificationWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  bell: Bell,
  send: Send,
  template: FileText,
  settings: Settings,
};

function isActiveTab(pathname: string | null, href: string) {
  if (href === "/dashboard/notifications") {
    return pathname === href;
  }

  return pathname === href || pathname?.startsWith(`${href}/`);
}

export default function NotificationWorkspaceNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const visibleTabs = role
    ? NOTIFICATION_WORKSPACE_TABS.filter((tab) => canAccess(role, tab.href))
    : NOTIFICATION_WORKSPACE_TABS;

  return (
    <nav className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-4">
      {visibleTabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const isActive = isActiveTab(pathname, tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-20 items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
              isActive
                ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5">{tab.label}</span>
              <span className="mt-1 block text-xs font-medium leading-4 text-slate-500">{tab.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
