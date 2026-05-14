"use client";

import type { ComponentType } from "react";
import { CalendarClock, Car, FileUp, Users } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { CUSTOMER_WORKSPACE_TABS, type CustomerWorkspaceTab } from "@/lib/customer-workspace";

const ICONS: Record<CustomerWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  customers: Users,
  vehicles: Car,
  maintenance: CalendarClock,
  import: FileUp,
};

function isActiveTab(pathname: string | null, href: string) {
  if (href === "/dashboard/customers") {
    if (pathname === href) return true;
    if (!pathname?.startsWith("/dashboard/customers/")) return false;
    return !["/dashboard/customers/maintenance", "/dashboard/customers/import"].some(
      (nestedHref) => pathname === nestedHref || pathname.startsWith(`${nestedHref}/`)
    );
  }

  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

export default function CustomerWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={CUSTOMER_WORKSPACE_TABS}
      icons={ICONS}
      tone="cyan"
      columns={4}
      isActiveTab={isActiveTab}
    />
  );
}
