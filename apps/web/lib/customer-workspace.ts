export type CustomerWorkspaceTab = {
  id: "customers" | "vehicles" | "maintenance" | "import";
  label: string;
  description: string;
  href: string;
  icon: "customers" | "vehicles" | "maintenance" | "import";
};

export const CUSTOMER_WORKSPACE_TABS: CustomerWorkspaceTab[] = [
  {
    id: "customers",
    label: "Müşteriler",
    description: "Bireysel ve kurumsal portföy",
    href: "/dashboard/customers",
    icon: "customers",
  },
  {
    id: "vehicles",
    label: "Araçlar",
    description: "Plaka, filo ve bakım geçmişi",
    href: "/dashboard/vehicles",
    icon: "vehicles",
  },
  {
    id: "maintenance",
    label: "Bakım Takibi",
    description: "Yaklaşan servis hatırlatmaları",
    href: "/dashboard/customers/maintenance",
    icon: "maintenance",
  },
  {
    id: "import",
    label: "İçe Aktarım",
    description: "CSV ve Excel toplu kayıt",
    href: "/dashboard/customers/import",
    icon: "import",
  },
];
