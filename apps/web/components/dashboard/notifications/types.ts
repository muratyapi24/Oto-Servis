import type { BulkCampaignInput, NotificationTemplateInput } from "@/lib/validations/notification";

export type NotificationCustomerSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
} | null;

export type NotificationListItem = {
  id: string;
  createdAt: string | Date;
  customer: NotificationCustomerSummary;
  recipient: string;
  channel: string;
  status: string;
  body: string | null;
};

export type BulkCampaignListItem = BulkCampaignInput & {
  id: string;
  status: string;
  createdAt: string | Date;
  sentCount: number;
  totalCount: number;
};

export type NotificationTemplateListItem = NotificationTemplateInput & {
  id: string;
};

export type NotificationProviderListItem = {
  id: string;
  type: string;
  provider: string;
  isActive: boolean;
  settings: Record<string, unknown>;
};

export function getNotificationCustomerName(customer: NotificationCustomerSummary) {
  if (!customer) return "—";
  return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";
}
