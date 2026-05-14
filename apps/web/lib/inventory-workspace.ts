export type InventoryWorkspaceTab = {
  id: "stock" | "purchases" | "orders" | "transfers" | "counts" | "reports" | "suppliers";
  label: string;
  description: string;
  href: string;
  icon: "stock" | "purchase" | "order" | "transfer" | "count" | "report" | "supplier";
};

export const INVENTORY_WORKSPACE_TABS: InventoryWorkspaceTab[] = [
  {
    id: "stock",
    label: "Stok",
    description: "Parça kartları ve kritik stok",
    href: "/dashboard/inventory",
    icon: "stock",
  },
  {
    id: "purchases",
    label: "Alımlar",
    description: "Fatura ve irsaliye kayıtları",
    href: "/dashboard/inventory/purchases",
    icon: "purchase",
  },
  {
    id: "orders",
    label: "Siparişler",
    description: "Satın alma siparişleri",
    href: "/dashboard/inventory/purchase-orders",
    icon: "order",
  },
  {
    id: "transfers",
    label: "Transferler",
    description: "Lokasyonlar arası hareket",
    href: "/dashboard/inventory/transfers",
    icon: "transfer",
  },
  {
    id: "counts",
    label: "Sayımlar",
    description: "Envanter sayım oturumları",
    href: "/dashboard/inventory/stock-counts",
    icon: "count",
  },
  {
    id: "reports",
    label: "Raporlar",
    description: "Stok değeri ve hareket analizi",
    href: "/dashboard/inventory/reports",
    icon: "report",
  },
  {
    id: "suppliers",
    label: "Tedarikçiler",
    description: "Firma ve cari takibi",
    href: "/dashboard/suppliers",
    icon: "supplier",
  },
];
