# Database Schema Reference — BST Otoservis

> Full Prisma schema: `packages/database/prisma/schema.prisma` (1719 lines, 60KB)
> To view specific models, use: `grep -n "model ModelName" packages/database/prisma/schema.prisma`

## Schema Organization

The schema is organized into numbered phases ("Faz") reflecting the original development roadmap.

## Enums

| Enum | Values | Used By |
|------|--------|---------|
| `TenantStatus` | ACTIVE, SUSPENDED, DELETED | Tenant |
| `SubscriptionStatus` | TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED | Subscription |
| `UserRole` | SUPER_ADMIN, TENANT_ADMIN, MECHANIC, RECEPTIONIST, ACCOUNTANT | User |
| `CustomerType` | INDIVIDUAL, CORPORATE | Customer |
| `ServiceOrderStatus` | PENDING, IN_PROGRESS, WAITING_APPROVAL, COMPLETED, CANCELLED | ServiceOrder |
| `ServiceItemType` | PART, LABOR, OTHER | ServiceItem |
| `InvoiceType` | SALES, PURCHASE | Invoice |
| `InvoiceStatus` | DRAFT, SENT, PAID, CANCELLED | Invoice |
| `PaymentMethod` | CASH, CREDIT_CARD, BANK_TRANSFER, IYZICO, PAYTR, CHECK, PROMISSORY_NOTE | Payment |
| `PaymentType` | INCOMING, OUTGOING | Payment |
| `AppointmentStatus` | PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW | Appointment |
| `StockMovementType` | IN, OUT, ADJUSTMENT, TRANSFER | StockMovement |
| `PurchaseOrderStatus` | DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED | PurchaseOrder |
| `NotificationType` | SMS, EMAIL, WHATSAPP, PUSH, IN_APP | Notification |
| `NotificationStatus` | PENDING, SENT, FAILED, DELIVERED, READ | Notification |
| `CheckStatus` | PENDING, DEPOSITED, CASHED, RETURNED, CANCELLED | CheckPayment |
| `EInvoiceStatus` | DRAFT, PENDING, SENT, ACCEPTED, REJECTED, CANCELLED | Invoice |
| `EInvoiceDocType` | E_INVOICE, E_ARCHIVE | Invoice |
| `QuoteStatus` | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED | Quote |
| `InvoiceItemType` | PART, LABOR, SERVICE, OTHER | InvoiceItem |

## Key Models and Their Fields

### Tenant (Multi-Tenancy Root)

```
id, name, slug, taxNumber, taxOffice, email, phone, address, city,
state, zipCode, country, logoUrl, slogan, website, status, subscriptionId,
settings (JSON), createdAt, updatedAt, deletedAt
```

**Relations (owns):** users, customers, vehicles, mechanics, partCategories,
parts, serviceOrders, serviceItems, invoices, payments, appointments,
suppliers, stockMovements, quotes, notifications, loyaltyTransactions,
documents, inspectionForms, commissionRules, workLogs, notificationProviders,
systemNotifications, auditLogs, pushSubscriptions, locations, messages,
maintenancePlans, serviceRatings, accountingIntegration, purchaseOrders,
stockCounts, stockTransfers, invoiceItems, checkPayments, paymentAttempts,
parasutSyncLogs, invoiceSequences, notificationTemplates,
customerNotificationPreferences, bulkNotificationCampaigns,
kvkkConsents, dataSubjectRequests

### User (Authentication)

```
id, name, email (unique), emailVerified, image, password (bcrypt),
role (UserRole), tenantId, isActive, hasTwoFactor, twoFactorSecret,
twoFactorBackupCodes[], lastLoginAt, createdAt, updatedAt
```

### Customer (CRM)

```
id, tenantId, type (CustomerType), firstName, lastName, companyName,
contactPerson, email, phone, secondaryPhone, taxOffice, taxNumber,
address, city, district, notes, balance (Decimal), isBlacklisted,
rewardPoints, membershipTier, profileImageUrl, createdAt, updatedAt, deletedAt
```

**Indexes:** tenantId, phone

### Vehicle

```
id, tenantId, customerId, plate, brand, model, year, chassisNo,
engineNo, color, engineType, transmission, fuelType, mileage,
driverName, driverPhone, insuranceCompany, policyNumber,
registrationDate, notes, imageUrl, nextMaintenanceMileage,
nextMaintenanceDate, createdAt, updatedAt, deletedAt
```

**Unique:** (plate, tenantId)
**Indexes:** tenantId, customerId, plate

### ServiceOrder

```
id, tenantId, orderNumber (autoincrement), status, serviceBay,
completionPercentage, isUrgent, customerId, vehicleId,
receptionDate, promisedDeliveryDate, actualDeliveryDate,
complaintDescription, inspectionNotes, internalNotes,
assignedMechanicId, locationId, approvalToken (unique),
approvalTokenExpiry, estimatedCost, subTotal, discountAmount,
taxAmount, totalAmount, qualityCheckNotes, qualityCheckedAt,
qualityCheckedBy, createdAt, updatedAt, deletedAt
```

**Indexes:** tenantId, customerId, vehicleId, status, receptionDate

### ServiceItem

```
id, tenantId, serviceOrderId, itemType (PART|LABOR|OTHER),
name, description, partId, mechanicId, quantity, unitPrice,
taxRate, discount, subTotal, taxAmount, totalPrice,
createdAt, updatedAt
```

### Invoice

```
id, tenantId, invoiceNumber, type (SALES|PURCHASE), status,
customerId, supplierId, serviceOrderId, issueDate, dueDate,
subTotal, discountAmount, taxAmount, totalAmount, paidAmount,
notes, externalId, pdfUrl, eInvoiceStatus, eInvoiceUUID,
eInvoiceETTN, eInvoiceXmlUrl, eInvoiceErrorMessage,
eInvoiceType, eInvoiceSentAt, createdAt, updatedAt, deletedAt
```

### Payment

```
id, tenantId, customerId, supplierId, invoiceId,
serviceOrderId, amount, paymentMethod, paymentType (INCOMING|OUTGOING),
paymentDate, notes, providerPaymentId, createdAt
```

### Appointment

```
id, tenantId, customerId, vehicleId, appointmentDate,
appointmentTime, type, status, notes, estimatedCostMin,
estimatedCostMax, locationId, createdAt, updatedAt, deletedAt
```

### Part (Inventory)

```
id, tenantId, categoryId, partNumber, name, description,
brand, unit, purchasePrice, sellingPrice, taxRate,
minStockLevel, currentStock, location, supplierName,
isActive, locationId, supplierId, createdAt, updatedAt, deletedAt
```

**Unique:** (partNumber, tenantId)

### Mechanic

```
id, tenantId, userId, firstName, lastName, phone, email,
specialties[], experienceYears, hourlyRate, isActive,
avatarUrl, shiftStart, shiftEnd, workDays[], dailyTarget,
createdAt, updatedAt, deletedAt
```

## Schema Modification Checklist

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter database db:generate`
3. Run `pnpm --filter database db:push` (dev) or create migration (prod)
4. Update seed scripts if needed
5. Update TypeScript types in actions/components
6. Update Zod validation schemas

## Grep Patterns for Quick Navigation

```bash
# Find a specific model
grep -n "model ModelName" packages/database/prisma/schema.prisma

# Find all enums
grep -n "^enum " packages/database/prisma/schema.prisma

# Find all indexes
grep -n "@@index" packages/database/prisma/schema.prisma

# Find all unique constraints
grep -n "@@unique" packages/database/prisma/schema.prisma

# Find all relations to Tenant
grep -n "tenantId" packages/database/prisma/schema.prisma
```
