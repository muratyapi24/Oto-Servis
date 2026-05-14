"use client";

import type { ComponentType } from "react";
import { CalendarDays, ClipboardList, Wrench } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { SERVICE_WORKSPACE_TABS, type ServiceWorkspaceTab } from "@/lib/service-workspace";

const ICONS: Record<ServiceWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  calendar: CalendarDays,
  quote: ClipboardList,
};

export default function ServiceWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={SERVICE_WORKSPACE_TABS}
      icons={ICONS}
      tone="blue"
      columns={3}
    />
  );
}
