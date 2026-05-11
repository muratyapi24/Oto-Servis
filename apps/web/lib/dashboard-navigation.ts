export type DashboardNavItem = {
  name: string;
  href: string;
  icon: string;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

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
      { name: "Servis Emirleri", href: "/dashboard/services", icon: "build" },
      { name: "Randevular", href: "/dashboard/appointments", icon: "calendar_month" },
      { name: "Teklifler", href: "/dashboard/quotes", icon: "request_quote" },
    ],
  },
  {
    id: "relations",
    label: "Müşteri & Araç",
    items: [
      { name: "Müşteriler", href: "/dashboard/customers", icon: "people" },
      { name: "Araçlar", href: "/dashboard/vehicles", icon: "directions_car" },
    ],
  },
  {
    id: "inventory",
    label: "Stok & Tedarik",
    items: [
      { name: "Stok & Envanter", href: "/dashboard/inventory", icon: "inventory_2" },
      { name: "Tedarikçiler", href: "/dashboard/suppliers", icon: "local_shipping" },
    ],
  },
  {
    id: "finance",
    label: "Finans",
    items: [{ name: "Kasa & Cari", href: "/dashboard/finances", icon: "payments" }],
  },
  {
    id: "team",
    label: "Ekip",
    items: [{ name: "Personel", href: "/dashboard/mechanics", icon: "group" }],
  },
  {
    id: "communication",
    label: "İletişim",
    items: [{ name: "Bildirimler", href: "/dashboard/notifications", icon: "notifications" }],
  },
  {
    id: "management",
    label: "Yönetim",
    items: [
      { name: "Raporlar", href: "/dashboard/analytics", icon: "insights" },
      { name: "Ayarlar", href: "/dashboard/settings", icon: "settings" },
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
