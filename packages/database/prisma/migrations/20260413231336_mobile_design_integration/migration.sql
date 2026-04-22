-- Task 1.1: Add imageUrl to Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Task 1.2: Add mobile fields to Mechanic
ALTER TABLE "Mechanic" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Mechanic" ADD COLUMN IF NOT EXISTS "shiftStart" VARCHAR(5);
ALTER TABLE "Mechanic" ADD COLUMN IF NOT EXISTS "shiftEnd" VARCHAR(5);
ALTER TABLE "Mechanic" ADD COLUMN IF NOT EXISTS "workDays" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Mechanic" ADD COLUMN IF NOT EXISTS "dailyTarget" INTEGER;

-- Task 1.3: Add quality check fields to ServiceOrder
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "qualityCheckNotes" TEXT;
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "qualityCheckedAt" TIMESTAMP(3);
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "qualityCheckedBy" VARCHAR(255);

-- Task 1.4: Create MaintenancePlan model
CREATE TABLE IF NOT EXISTS "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- Task 1.5: Create ServiceRating model
CREATE TABLE IF NOT EXISTS "ServiceRating" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRating_pkey" PRIMARY KEY ("id")
);

-- Task 1.6: Add indexes for new models
CREATE INDEX IF NOT EXISTS "MaintenancePlan_tenantId_idx" ON "MaintenancePlan"("tenantId");
CREATE INDEX IF NOT EXISTS "MaintenancePlan_vehicleId_idx" ON "MaintenancePlan"("vehicleId");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceRating_serviceOrderId_key" ON "ServiceRating"("serviceOrderId");
CREATE INDEX IF NOT EXISTS "ServiceRating_tenantId_idx" ON "ServiceRating"("tenantId");
CREATE INDEX IF NOT EXISTS "ServiceRating_customerId_idx" ON "ServiceRating"("customerId");

-- AddForeignKey for MaintenancePlan
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for ServiceRating
ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_serviceOrderId_fkey"
    FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
