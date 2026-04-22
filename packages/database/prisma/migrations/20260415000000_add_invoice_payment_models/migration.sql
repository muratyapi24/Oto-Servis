-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('LABOR', 'PART', 'SERVICE');

-- CreateEnum
CREATE TYPE "CheckPaymentStatus" AS ENUM ('PENDING', 'COLLECTED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "ParasutSyncStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "EInvoiceStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EInvoiceDocType" AS ENUM ('E_INVOICE', 'E_ARCHIVE');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'IYZICO';
ALTER TYPE "PaymentMethod" ADD VALUE 'PAYTR';
ALTER TYPE "PaymentMethod" ADD VALUE 'CHECK';
ALTER TYPE "PaymentMethod" ADD VALUE 'PROMISSORY_NOTE';

-- AlterTable: Invoice - add new columns
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceStatus" "EInvoiceStatus";
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceUUID" VARCHAR(100);
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceETTN" VARCHAR(100);
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceXmlUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceErrorMessage" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceType" "EInvoiceDocType";
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceSentAt" TIMESTAMP(3);

-- AlterTable: Payment - add new columns
ALTER TABLE "Payment" ADD COLUMN "providerPaymentId" VARCHAR(255);

-- CreateTable: InvoiceItem
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "InvoiceItemType" NOT NULL DEFAULT 'SERVICE',
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "serviceItemId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CheckPayment
CREATE TABLE "CheckPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "checkNumber" VARCHAR(100) NOT NULL,
    "bankName" VARCHAR(255) NOT NULL,
    "dueDate" DATE NOT NULL,
    "drawerName" VARCHAR(255) NOT NULL,
    "status" "CheckPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "collectedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentAttempt
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "errorCode" VARCHAR(100),
    "errorMessage" TEXT,
    "rawResponse" JSONB DEFAULT '{}',
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ParasutSyncLog
CREATE TABLE "ParasutSyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "operation" VARCHAR(50) NOT NULL,
    "status" "ParasutSyncStatus" NOT NULL,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParasutSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InvoiceSequence
CREATE TABLE "InvoiceSequence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItem_tenantId_idx" ON "InvoiceItem"("tenantId");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX "InvoiceItem_type_idx" ON "InvoiceItem"("type");

CREATE UNIQUE INDEX "CheckPayment_paymentId_key" ON "CheckPayment"("paymentId");
CREATE INDEX "CheckPayment_tenantId_idx" ON "CheckPayment"("tenantId");
CREATE INDEX "CheckPayment_dueDate_idx" ON "CheckPayment"("dueDate");
CREATE INDEX "CheckPayment_status_idx" ON "CheckPayment"("status");

CREATE INDEX "PaymentAttempt_tenantId_idx" ON "PaymentAttempt"("tenantId");
CREATE INDEX "PaymentAttempt_invoiceId_idx" ON "PaymentAttempt"("invoiceId");
CREATE INDEX "PaymentAttempt_attemptedAt_idx" ON "PaymentAttempt"("attemptedAt");

CREATE INDEX "ParasutSyncLog_tenantId_idx" ON "ParasutSyncLog"("tenantId");
CREATE INDEX "ParasutSyncLog_invoiceId_idx" ON "ParasutSyncLog"("invoiceId");
CREATE INDEX "ParasutSyncLog_status_idx" ON "ParasutSyncLog"("status");
CREATE INDEX "ParasutSyncLog_attemptedAt_idx" ON "ParasutSyncLog"("attemptedAt");

CREATE UNIQUE INDEX "InvoiceSequence_tenantId_year_key" ON "InvoiceSequence"("tenantId", "year");
CREATE INDEX "InvoiceSequence_tenantId_idx" ON "InvoiceSequence"("tenantId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckPayment" ADD CONSTRAINT "CheckPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckPayment" ADD CONSTRAINT "CheckPayment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParasutSyncLog" ADD CONSTRAINT "ParasutSyncLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParasutSyncLog" ADD CONSTRAINT "ParasutSyncLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParasutSyncLog" ADD CONSTRAINT "ParasutSyncLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceSequence" ADD CONSTRAINT "InvoiceSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
