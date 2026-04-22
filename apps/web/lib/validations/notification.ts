import { z } from "zod";

// ---------------------------------------------------------------------------
// WhatsApp gönderim şeması
// ---------------------------------------------------------------------------

export const sendWhatsAppSchema = z.object({
  to: z.string().min(1, "Alıcı numarası zorunludur"),
  body: z.string().min(1, "Mesaj içeriği zorunludur").max(4096),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  templateName: z.string().max(255).optional(),
  templateParams: z.array(z.string()).optional(),
  languageCode: z.string().max(10).default("tr"),
});
export type SendWhatsAppInput = z.infer<typeof sendWhatsAppSchema>;

// ---------------------------------------------------------------------------
// Bildirim şablonu şeması
// ---------------------------------------------------------------------------

export const notificationTemplateSchema = z.object({
  type: z.enum(["SERVICE_STATUS", "APPROVAL", "APPOINTMENT", "QUOTE", "REMINDER", "BULK"]),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  name: z.string().min(1).max(255),
  body: z.string().min(1).max(4096),
  templateName: z.string().max(255).optional(),
  languageCode: z.string().max(10).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});
export type NotificationTemplateInput = z.infer<typeof notificationTemplateSchema>;

// ---------------------------------------------------------------------------
// Müşteri bildirim tercihi şeması
// ---------------------------------------------------------------------------

export const customerPreferenceSchema = z.object({
  smsEnabled: z.boolean().default(true),
  whatsappEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(true),
  preferredChannel: z.enum(["SMS", "WHATSAPP", "EMAIL"]).default("SMS"),
});
export type CustomerPreferenceInput = z.infer<typeof customerPreferenceSchema>;

// ---------------------------------------------------------------------------
// Toplu bildirim kampanyası şeması
// ---------------------------------------------------------------------------

export const bulkCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  channel: z.enum(["SMS", "WHATSAPP"]),
  messageBody: z.string().min(1).max(4096),
  segmentType: z.enum(["ALL", "OVERDUE_INVOICE", "VEHICLE_BRAND", "INACTIVE", "ACTIVE"]),
  segmentParams: z.record(z.unknown()).optional(),
});
export type BulkCampaignInput = z.infer<typeof bulkCampaignSchema>;
