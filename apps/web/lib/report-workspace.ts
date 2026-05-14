export type ReportWorkspaceTab = {
  id: "overview" | "finance" | "inventory";
  label: string;
  description: string;
  href: string;
  icon: "overview" | "finance" | "inventory";
};

export const REPORT_WORKSPACE_TABS: ReportWorkspaceTab[] = [
  {
    id: "overview",
    label: "Yönetim Özeti",
    description: "Gelir, servis, müşteri ve operasyon görünümü",
    href: "/dashboard/analytics",
    icon: "overview",
  },
  {
    id: "finance",
    label: "Finans Raporları",
    description: "Gelir, gider ve kârlılık trendleri",
    href: "/dashboard/finances/reports",
    icon: "finance",
  },
  {
    id: "inventory",
    label: "Stok Raporları",
    description: "Stok değeri, hareket ve kritik seviye analizi",
    href: "/dashboard/inventory/reports",
    icon: "inventory",
  },
];
