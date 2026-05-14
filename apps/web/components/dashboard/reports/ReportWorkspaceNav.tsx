"use client";

import type { ComponentType } from "react";
import { BarChart3, PackageSearch, WalletCards } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { REPORT_WORKSPACE_TABS, type ReportWorkspaceTab } from "@/lib/report-workspace";

const ICONS: Record<ReportWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  overview: BarChart3,
  finance: WalletCards,
  inventory: PackageSearch,
};

export default function ReportWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={REPORT_WORKSPACE_TABS}
      icons={ICONS}
      tone="emerald"
      columns={3}
    />
  );
}
