export type ServiceWorkspaceTab = {
  id: "orders" | "appointments" | "quotes";
  label: string;
  description: string;
  href: string;
  icon: "wrench" | "calendar" | "quote";
};

export const SERVICE_WORKSPACE_TABS: ServiceWorkspaceTab[] = [
  {
    id: "orders",
    label: "İş Emirleri",
    description: "Servis kabul ve atölye takibi",
    href: "/dashboard/services",
    icon: "wrench",
  },
  {
    id: "appointments",
    label: "Randevular",
    description: "Planlama ve hatırlatmalar",
    href: "/dashboard/appointments",
    icon: "calendar",
  },
  {
    id: "quotes",
    label: "Teklifler",
    description: "Fiyatlandırma ve onay akışı",
    href: "/dashboard/quotes",
    icon: "quote",
  },
];
