export type SettingsWorkspaceTab = {
  id: "profile" | "locations" | "notifications" | "eInvoice" | "parasut" | "billing" | "referral";
  label: string;
  href: string;
  icon: "building" | "map" | "bell" | "invoice" | "sync" | "card" | "gift";
};

export const SETTINGS_WORKSPACE_TABS: SettingsWorkspaceTab[] = [
  { id: "profile", label: "Firma", href: "/dashboard/settings", icon: "building" },
  { id: "locations", label: "Şubeler", href: "/dashboard/settings/locations", icon: "map" },
  { id: "notifications", label: "Bildirim", href: "/dashboard/settings/notifications", icon: "bell" },
  { id: "eInvoice", label: "e-Fatura", href: "/dashboard/settings/e-invoice", icon: "invoice" },
  { id: "parasut", label: "Paraşüt", href: "/dashboard/settings/parasut", icon: "sync" },
  { id: "billing", label: "Abonelik", href: "/dashboard/settings/billing", icon: "card" },
  { id: "referral", label: "Referral", href: "/dashboard/settings/referral", icon: "gift" },
];
