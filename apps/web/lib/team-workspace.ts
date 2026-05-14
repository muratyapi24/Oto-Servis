export type TeamWorkspaceTab = {
  id: "directory" | "performance";
  label: string;
  description: string;
  href: string;
  icon: "team" | "performance";
};

export const TEAM_WORKSPACE_TABS: TeamWorkspaceTab[] = [
  {
    id: "directory",
    label: "Kadro",
    description: "Usta profilleri, vardiyalar ve yetkinlikler",
    href: "/dashboard/mechanics",
    icon: "team",
  },
  {
    id: "performance",
    label: "Performans",
    description: "İş emri, verimlilik ve hakediş raporları",
    href: "/dashboard/analytics/mechanics",
    icon: "performance",
  },
];
