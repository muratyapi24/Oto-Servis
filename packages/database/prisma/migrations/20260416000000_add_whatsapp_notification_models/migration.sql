-- Migration: add_whatsapp_notification_models
-- Adds WhatsApp notification system models

-- AlterEnum: NotificationType - add WHATSAPP
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'WHATSAPP';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum: NotificationStatus - add SKIPPED, DELIVERED, READ
DO $$ BEGIN
  ALTER TYPE "NotificationStatus" ADD VALUE 'SKIPPED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationStatus" ADD VALUE 'DELIVERED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationStatus" ADD VALUE 'READ';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Notification - add new columns
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "notificationTemplateId" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "reminderType" VARCHAR(50);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "appointmentId" VARCHAR(255);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "bulkCampaignId" TEXT;

-- CreateTable: NotificationTemplate
CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "templateName" VARCHAR(255),
    "languageCode" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomerNotificationPreference
CREATE TABLE IF NOT EXISTS "CustomerNotificationPreference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredChannel" VARCHAR(20) NOT NULL DEFAULT 'SMS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BulkNotificationCampaign
CREATE TABLE IF NOT EXISTS "BulkNotificationCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "messageBody" TEXT NOT NULL,
    "segmentType" VARCHAR(50) NOT NULL,
    "segmentParams" JSONB DEFAULT '{}',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkNotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: NotificationTemplate
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_tenantId_type_channel_key" ON "NotificationTemplate"("tenantId", "type", "channel");
CREATE INDEX IF NOT EXISTS "NotificationTemplate_tenantId_idx" ON "NotificationTemplate"("tenantId");
CREATE INDEX IF NOT EXISTS "NotificationTemplate_type_idx" ON "NotificationTemplate"("type");

-- CreateIndex: CustomerNotificationPreference
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerNotificationPreference_customerId_key" ON "CustomerNotificationPreference"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerNotificationPreference_tenantId_customerId_key" ON "CustomerNotificationPreference"("tenantId", "customerId");
CREATE INDEX IF NOT EXISTS "CustomerNotificationPreference_tenantId_idx" ON "CustomerNotificationPreference"("tenantId");
CREATE INDEX IF NOT EXISTS "CustomerNotificationPreference_customerId_idx" ON "CustomerNotificationPreference"("customerId");

-- CreateIndex: BulkNotificationCampaign
CREATE INDEX IF NOT EXISTS "BulkNotificationCampaign_tenantId_idx" ON "BulkNotificationCampaign"("tenantId");
CREATE INDEX IF NOT EXISTS "BulkNotificationCampaign_status_idx" ON "BulkNotificationCampaign"("status");

-- AddForeignKey: NotificationTemplate
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CustomerNotificationPreference
ALTER TABLE "CustomerNotificationPreference" ADD CONSTRAINT "CustomerNotificationPreference_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerNotificationPreference" ADD CONSTRAINT "CustomerNotificationPreference_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: BulkNotificationCampaign
ALTER TABLE "BulkNotificationCampaign" ADD CONSTRAINT "BulkNotificationCampaign_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification new relations
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_notificationTemplateId_fkey"
    FOREIGN KEY ("notificationTemplateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bulkCampaignId_fkey"
    FOREIGN KEY ("bulkCampaignId") REFERENCES "BulkNotificationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
