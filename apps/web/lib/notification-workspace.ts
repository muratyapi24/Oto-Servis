export type NotificationWorkspaceTab = {
  id: "history" | "bulk" | "templates";
  label: string;
  description: string;
  href: string;
  icon: "bell" | "send" | "template";
};

export const NOTIFICATION_WORKSPACE_TABS: NotificationWorkspaceTab[] = [
  {
    id: "history",
    label: "Geçmiş",
    description: "Gönderim kayıtları ve teslim durumları",
    href: "/dashboard/notifications",
    icon: "bell",
  },
  {
    id: "bulk",
    label: "Toplu Gönderim",
    description: "Segment bazlı kampanya yönetimi",
    href: "/dashboard/notifications/bulk",
    icon: "send",
  },
  {
    id: "templates",
    label: "Şablonlar",
    description: "SMS, WhatsApp ve e-posta içerikleri",
    href: "/dashboard/notifications/templates",
    icon: "template",
  },
];
