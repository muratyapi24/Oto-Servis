"use client";

import type { ComponentType } from "react";
import { CreditCard, FileCheck2, LineChart, Receipt, WalletCards } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { FINANCE_WORKSPACE_TABS, type FinanceWorkspaceTab } from "@/lib/finance-workspace";

const ICONS: Record<FinanceWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  wallet: WalletCards,
  receipt: Receipt,
  card: CreditCard,
  check: FileCheck2,
  chart: LineChart,
};

export default function FinanceWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={FINANCE_WORKSPACE_TABS}
      icons={ICONS}
      tone="emerald"
      columns={5}
      exactRootHrefs={["/dashboard/finances"]}
    />
  );
}
