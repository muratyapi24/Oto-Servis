-- Migration: add_kvkk_consent_tables
-- KVKK (Kişisel Verilerin Korunması Kanunu) uyumluluk tabloları

-- KvkkConsent: Açık rıza kayıtları
CREATE TABLE IF NOT EXISTS "KvkkConsent" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "customerId"  TEXT,
    "userId"      TEXT,
    "consentType" VARCHAR(50) NOT NULL,
    "ipAddress"   VARCHAR(50),
    "userAgent"   TEXT,
    "givenAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt"   TIMESTAMP(3),
    "version"     VARCHAR(10) NOT NULL DEFAULT '1.0',

    CONSTRAINT "KvkkConsent_pkey" PRIMARY KEY ("id")
);

-- DataSubjectRequest: Veri sahibi hakkı talepleri (KVKK Madde 11)
CREATE TABLE IF NOT EXISTS "DataSubjectRequest" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "customerId"  TEXT,
    "requestType" VARCHAR(50) NOT NULL,
    "status"      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "notes"       TEXT,
    "processedAt" TIMESTAMP(3),
    "processedBy" VARCHAR(255),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- Foreign key kısıtlamaları
ALTER TABLE "KvkkConsent"
    ADD CONSTRAINT "KvkkConsent_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KvkkConsent"
    ADD CONSTRAINT "KvkkConsent_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataSubjectRequest"
    ADD CONSTRAINT "DataSubjectRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DataSubjectRequest"
    ADD CONSTRAINT "DataSubjectRequest_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeksler
CREATE INDEX IF NOT EXISTS "KvkkConsent_tenantId_idx"    ON "KvkkConsent"("tenantId");
CREATE INDEX IF NOT EXISTS "KvkkConsent_customerId_idx"  ON "KvkkConsent"("customerId");
CREATE INDEX IF NOT EXISTS "KvkkConsent_consentType_idx" ON "KvkkConsent"("consentType");

CREATE INDEX IF NOT EXISTS "DataSubjectRequest_tenantId_idx" ON "DataSubjectRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_status_idx"   ON "DataSubjectRequest"("status");
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_customerId_idx" ON "DataSubjectRequest"("customerId");
