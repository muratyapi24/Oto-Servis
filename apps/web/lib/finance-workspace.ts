export type FinanceWorkspaceTab = {
  id: "overview" | "invoices" | "payments" | "checks" | "reports";
  label: string;
  description: string;
  href: string;
  icon: "wallet" | "receipt" | "card" | "check" | "chart";
};

export const FINANCE_WORKSPACE_TABS: FinanceWorkspaceTab[] = [
  {
    id: "overview",
    label: "Özet",
    description: "Kasa, cari ve tahsilat özeti",
    href: "/dashboard/finances",
    icon: "wallet",
  },
  {
    id: "invoices",
    label: "Faturalar",
    description: "Satış ve alış faturaları",
    href: "/dashboard/finances/invoices",
    icon: "receipt",
  },
  {
    id: "payments",
    label: "Tahsilatlar",
    description: "Ödeme ve kasa hareketleri",
    href: "/dashboard/finances/payments",
    icon: "card",
  },
  {
    id: "checks",
    label: "Çek/Senet",
    description: "Vadeli evrak takibi",
    href: "/dashboard/finances/payments/checks",
    icon: "check",
  },
  {
    id: "reports",
    label: "Raporlar",
    description: "Gelir-gider analizi",
    href: "/dashboard/finances/reports",
    icon: "chart",
  },
];
