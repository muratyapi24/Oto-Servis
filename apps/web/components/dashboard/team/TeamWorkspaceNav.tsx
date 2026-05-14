"use client";

import type { ComponentType } from "react";
import { BarChart3, UsersRound } from "lucide-react";
import WorkspaceNav from "@/components/dashboard/WorkspaceNav";
import { TEAM_WORKSPACE_TABS, type TeamWorkspaceTab } from "@/lib/team-workspace";

const ICONS: Record<TeamWorkspaceTab["icon"], ComponentType<{ className?: string }>> = {
  team: UsersRound,
  performance: BarChart3,
};

export default function TeamWorkspaceNav() {
  return (
    <WorkspaceNav
      tabs={TEAM_WORKSPACE_TABS}
      icons={ICONS}
      tone="violet"
      columns={2}
    />
  );
}
