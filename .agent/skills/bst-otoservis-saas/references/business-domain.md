# Business Domain Reference — BST Otoservis

## Target Market

Turkey's auto repair industry: 80,000+ independent/mid-scale auto repair shops.
Typical customer: 3-20 employee independent auto service center.

## Core Business Flows

### 1. Service Order Lifecycle

```
Customer arrives → Vehicle reception → Create Service Order (PENDING)
  → Assign mechanic → Add service items (parts + labor) → IN_PROGRESS
  → Generate approval token → Send SMS/Email → WAITING_APPROVAL
  → Customer approves → Auto-create invoice → Update balance → COMPLETED
  → Record payment (cash/card/transfer/check) → PAID
```

**Status transitions:**
- PENDING → IN_PROGRESS (mechanic starts work)
- IN_PROGRESS → WAITING_APPROVAL (items added, price ready)
- WAITING_APPROVAL → COMPLETED (customer approves)
- COMPLETED → CANCELLED (reversal: cancel invoice, return stock, reverse balance)
- Any → CANCELLED (cancellation at any stage)

### 2. Stock Management Flow

```
Supplier → Purchase Order → Receive → Stock IN
Service Order item → Stock OUT (auto on PART item add)
Service cancelled → Stock IN (auto return)
Manual adjustment → ADJUSTMENT movement
Branch transfer → TRANSFER movement
Stock count → Physical count → Reconciliation
```

### 3. Financial Flow

```
Service completed → Auto-invoice (SENT status)
  → Customer balance += invoice total
Payment received → Customer balance -= payment amount
  → Payment methods: CASH, CREDIT_CARD, BANK_TRANSFER, CHECK, IYZICO, PAYTR
Check payment → Track maturity date, deposit, cash status
Supplier invoice (PURCHASE type) → Expense tracking
```

### 4. Appointment Flow

```
Customer/Staff creates appointment
  → PENDING → CONFIRMED (staff confirms)
  → Reminder: SMS/WhatsApp 1 day + 2 hours before
  → COMPLETED (converted to service order) / NO_SHOW / CANCELLED
```

### 5. Quote Flow

```
Create quote with items → DRAFT → SENT to customer
  → Customer accepts → ACCEPTED → Convert to Service Order
  → Customer rejects → REJECTED
  → Time expires → EXPIRED
```

### 6. Customer Portal Flow

```
Customer logs in (plate + phone)
  → View vehicles → View service history → Track active service
  → Create appointment → View documents → Message staff
  → Rate service → View loyalty points
```

### 7. Subscription/Tenant Lifecycle

```
Register → Create Tenant → TRIAL (14 days)
  → Payment → ACTIVE → Monthly/Yearly renewal
  → Payment fails → PAST_DUE → Grace period → EXPIRED
  → Cancel → CANCELLED (data retained for export period)
  → Violation → SUSPENDED (by Super Admin)
```

## Turkey-Specific Features

| Feature | Implementation |
|---------|---------------|
| e-Fatura (e-Invoice) | GIB integration via Paraşüt API |
| KVKK (Data Protection) | Consent records, data subject requests |
| IYS (Communication Consent) | SMS/email consent tracking |
| KDV (VAT) | 20% default, configurable per item |
| Çek/Senet (Check/Promissory) | CheckPayment model with maturity tracking |
| Turkish phone format | +90 prefix, SMS via Netgsm/Twilio |
| Turkish locale | next-intl with tr/en support |
| Turkish currency | TRY (₺) with Decimal(15,2) precision |

## Subscription Plans

| Plan | Slug | Monthly | Yearly | Users | Vehicles | Key Features |
|------|------|---------|--------|-------|----------|-------------|
| Başlangıç | `starter` | ₺799 | ₺7.990 | 1 | 50 | Basic modules, email notification |
| Profesyonel | `professional` | ₺1.499 | ₺14.990 | 5 | Unlimited | WhatsApp, e-Invoice, advanced reports, customer portal |
| Kurumsal | `enterprise` | ₺2.999 | ₺29.990 | 15 | Unlimited | Multi-location, API access, priority support |

## User Roles

| Role | Turkish Name | Scope |
|------|-------------|-------|
| SUPER_ADMIN | Süper Yönetici | Platform-wide, all tenants |
| TENANT_ADMIN | Firma Yöneticisi | Full access within tenant |
| RECEPTIONIST | Resepsiyon | Services, customers, appointments |
| ACCOUNTANT | Muhasebeci | Inventory, finance, analytics |
| MECHANIC | Usta | Assigned services, vehicles, inventory |
| CUSTOMER | Müşteri | Own vehicles/services only (mobile portal) |
