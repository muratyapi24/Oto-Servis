"use client";

import type { ComponentType } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  ClipboardList,
  FileDown,
  PackageSearch,
  ShoppingCart,
  Truck,
} from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { INVENTORY_WORKSPACE_TABS, type InventoryWorkspaceTab } from "@/lib/inventory-workspace";

const ICONS: Record<InventoryWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  stock: PackageSearch,
  purchase: FileDown,
  order: ShoppingCart,
  transfer: ArrowRightLeft,
  count: ClipboardList,
  report: BarChart3,
  supplier: Truck,
};

export default function InventoryWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={INVENTORY_WORKSPACE_TABS}
      icons={ICONS}
      tone="amber"
      columns={7}
      exactRootHrefs={["/dashboard/inventory"]}
    />
  );
}
