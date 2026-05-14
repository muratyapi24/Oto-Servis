import { CUSTOMER_WORKSPACE_TABS } from "./customer-workspace";
import { FINANCE_WORKSPACE_TABS } from "./finance-workspace";
import { INVENTORY_WORKSPACE_TABS } from "./inventory-workspace";
import { NOTIFICATION_WORKSPACE_TABS } from "./notification-workspace";
import { REPORT_WORKSPACE_TABS } from "./report-workspace";
import { SERVICE_WORKSPACE_TABS } from "./service-workspace";
import { SETTINGS_WORKSPACE_TABS } from "./settings-workspace";
import { TEAM_WORKSPACE_TABS } from "./team-workspace";

export type DashboardNavItem = {
  name: string;
  href: string;
  icon: string;
  relatedHrefs?: string[];
  exactHref?: boolean;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

function relatedWorkspaceHrefs(tabs: { href: string }[]): string[] {
  return tabs.slice(1).map((tab) => tab.href);
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "overview",
    label: "",
    items: [{ name: "Genel Bakış", href: "/dashboard", icon: "dashboard" }],
  },
  {
    id: "operations",
    label: "Operasyon",
    items: [
      {
        name: "Servis Operasyonu",
        href: "/dashboard/services",
        icon: "build",
        relatedHrefs: relatedWorkspaceHrefs(SERVICE_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "relations",
    label: "Müşteri & Araç",
    items: [
      {
        name: "Müşteri & Araç",
        href: "/dashboard/customers",
        icon: "people",
        relatedHrefs: relatedWorkspaceHrefs(CUSTOMER_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "inventory",
    label: "Stok & Tedarik",
    items: [
      {
        name: "Stok & Tedarik",
        href: "/dashboard/inventory",
        icon: "inventory_2",
        relatedHrefs: relatedWorkspaceHrefs(INVENTORY_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "finance",
    label: "Finans",
    items: [
      {
        name: "Kasa & Cari",
        href: "/dashboard/finances",
        icon: "payments",
        relatedHrefs: relatedWorkspaceHrefs(FINANCE_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "team",
    label: "Ekip",
    items: [
      {
        name: "Personel",
        href: "/dashboard/mechanics",
        icon: "group",
        relatedHrefs: relatedWorkspaceHrefs(TEAM_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "communication",
    label: "İletişim",
    items: [
      {
        name: "Bildirimler",
        href: "/dashboard/notifications",
        icon: "notifications",
        relatedHrefs: relatedWorkspaceHrefs(NOTIFICATION_WORKSPACE_TABS),
      },
    ],
  },
  {
    id: "management",
    label: "Yönetim",
    items: [
      {
        name: "Raporlar",
        href: "/dashboard/analytics",
        icon: "insights",
        relatedHrefs: relatedWorkspaceHrefs(REPORT_WORKSPACE_TABS),
        exactHref: true,
      },
      {
        name: "Ayarlar",
        href: "/dashboard/settings",
        icon: "settings",
        relatedHrefs: [
          ...relatedWorkspaceHrefs(SETTINGS_WORKSPACE_TABS),
          "/dashboard/locations",
        ],
      },
    ],
  },
];

export const DASHBOARD_QUICK_LINKS: DashboardNavItem[] = [
  { name: "Gösterge Paneli", href: "/dashboard", icon: "dashboard" },
  { name: "Servis", href: "/dashboard/services", icon: "build" },
  { name: "Müşteriler", href: "/dashboard/customers", icon: "people" },
  { name: "Finans", href: "/dashboard/finances", icon: "payments" },
];

export const MOBILE_WEB_NAV_ITEMS: DashboardNavItem[] = [
  { name: "Dashboard", href: "/m/firma/panel", icon: "dashboard" },
  { name: "Kuyruk", href: "/m/firma/kuyruk", icon: "garage" },
  { name: "Araçlar", href: "/m/firma/araclar", icon: "directions_car" },
  { name: "Stok", href: "/m/firma/stok", icon: "inventory_2" },
  { name: "Finans", href: "/m/firma/finans", icon: "payments" },
  { name: "Ayarlar", href: "/m/firma/ayarlar", icon: "settings" },
];

export function flattenDashboardNavGroups(groups: DashboardNavGroup[]): DashboardNavItem[] {
  return groups.flatMap((group) => group.items);
}

export function getDashboardNavItemHrefs(item: DashboardNavItem): string[] {
  return Array.from(new Set([item.href, ...(item.relatedHrefs ?? [])]));
}

export function isDashboardNavItemActive(
  item: DashboardNavItem,
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;

  return getDashboardNavItemHrefs(item).some((href) => {
    if (href === "/dashboard") return pathname === href;
    if (item.exactHref && href === item.href) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}
