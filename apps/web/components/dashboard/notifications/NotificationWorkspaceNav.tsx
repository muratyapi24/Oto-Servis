"use client";

import type { ComponentType } from "react";
import { Bell, FileText, Send } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { NOTIFICATION_WORKSPACE_TABS, type NotificationWorkspaceTab } from "@/lib/notification-workspace";

const ICONS: Record<NotificationWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  bell: Bell,
  send: Send,
  template: FileText,
};

export default function NotificationWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={NOTIFICATION_WORKSPACE_TABS}
      icons={ICONS}
      tone="amber"
      columns={3}
      exactRootHrefs={["/dashboard/notifications"]}
    />
  );
}
