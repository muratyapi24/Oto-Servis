"use client";

import type { ComponentType } from "react";
import { Bell, Building2, CreditCard, FileText, Gift, MapPin, RefreshCw } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
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

export default function SettingsWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={SETTINGS_WORKSPACE_TABS}
      icons={ICONS}
      tone="blue"
      variant="compact"
      exactRootHrefs={["/dashboard/settings"]}
    />
  );
}
