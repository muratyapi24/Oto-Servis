"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentType } from "react";
import { CreditCard, FileCheck2, LineChart, Receipt, WalletCards } from "lucide-react";
import { FINANCE_WORKSPACE_TABS, type FinanceWorkspaceTab } from "@/lib/finance-workspace";
import { canAccess } from "@/lib/permissions";

const ICONS: Record<FinanceWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  wallet: WalletCards,
  receipt: Receipt,
  card: CreditCard,
  check: FileCheck2,
  chart: LineChart,
};

function isActiveTab(pathname: string | null, href: string) {
  if (href === "/dashboard/finances") {
    return pathname === href;
  }

  return pathname === href || pathname?.startsWith(`${href}/`);
}

export default function FinanceWorkspaceNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const visibleTabs = role
    ? FINANCE_WORKSPACE_TABS.filter((tab) => canAccess(role, tab.href))
    : FINANCE_WORKSPACE_TABS;

  return (
    <nav className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-5">
      {visibleTabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const isActive = isActiveTab(pathname, tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-20 items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
              isActive
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
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
