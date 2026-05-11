---
name: bst-otoservis-saas
description: >
  Comprehensive guide for developing, maintaining, and extending the BST Otoservis multi-tenant SaaS platform.
  This skill should be used when creating new modules, modifying existing features, adding server actions,
  working with the Prisma schema, implementing RBAC/tenant isolation, managing subscriptions, building
  dashboard components, extending the Super Admin panel, developing mobile web/native portals,
  integrating third-party services (SMS, e-Invoice, payment), writing tests, or debugging any part
  of the BST Otoservis codebase. It covers architecture, design patterns, coding conventions,
  database schema, API patterns, and field-tested best practices applicable to any multi-tenant
  B2B SaaS project built with Next.js + Prisma + PostgreSQL.
---

# BST Otoservis SaaS — Comprehensive Development Guide

This skill provides the authoritative reference for developing, maintaining, and extending the
BST Otoservis multi-tenant SaaS platform — a cloud-based auto service management system
targeting Turkey's 80,000+ independent auto repair shops.

## 1. Architecture Overview

### Monorepo Structure (Turborepo + pnpm)

```
bst-otoservis/
├── apps/
│   ├── web/            # Next.js 15 (App Router) — main web application
│   └── mobile/         # Expo (React Native) — native mobile app (beta)
├── packages/
│   ├── database/       # Prisma schema + seed scripts + client export
│   ├── ui/             # Shared UI components (cross-app)
│   ├── eslint-config/  # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configs
├── turbo.json          # Turborepo pipeline configuration
├── pnpm-workspace.yaml # Workspace definition
└── package.json        # Root scripts: dev, build, lint, check-types
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4.0 |
| ORM | Prisma | 5.11+ |
| Database | PostgreSQL | 16+ |
| Auth | NextAuth.js (beta) | 5.0 |
| Monorepo | Turborepo | 2.8+ |
| Package Manager | pnpm | 9+ |
| Error Tracking | Sentry | Latest |
| Background Jobs | Inngest | Latest |
| Search | Meilisearch | Latest |
| Cache/Rate Limit | Upstash Redis | Serverless |
| Email | Resend | Latest |
| SMS/WhatsApp | Twilio | Latest |
| Payments | Stripe | Latest |
| File Storage | AWS S3 / Cloudflare R2 | Latest |
| Form Validation | React Hook Form + Zod | Latest |
| i18n | next-intl | 4.9 |
| PDF | jsPDF + html2canvas | Latest |
| Export | papaparse (CSV), xlsx (Excel) | Latest |
| Animations | Framer Motion | Latest |
| Push | web-push (PWA) | 3.6.7 |
| Accounting | Paraşüt API | Latest |

### Route Architecture

| Route Group | Path Pattern | Purpose |
|-------------|-------------|---------|
| Landing | `/`, `/pricing`, `/features` | Marketing/SEO pages |
| Auth | `/login`, `/register`, `/superadmin-login` | Authentication flows |
| Dashboard | `/(dashboard)/dashboard/*` | Tenant management panel (18 modules) |
| Super Admin | `/(super-admin)/super-admin/*` | Platform management (34 modules) |
| Mobile Web — Customer | `/m/musteri/*` | Customer portal (mobile-optimized) |
| Mobile Web — Staff | `/m/firma/*` | Staff/mechanic portal (mobile-optimized) |
| Customer Approval | `/onay/[token]` | Service approval link |
| Service Tracking | `/servis-takip` | Public service tracking |
| Legal | `/terms`, `/privacy`, `/kvkk`, `/cookies`, `/dpa`, `/refund`, `/sla` | Legal compliance |

---

## 2. Core Design Patterns

### 2.1 Server Action Pattern

All data mutations use Next.js Server Actions with a standardized pattern. Reference
`references/server-action-patterns.md` for complete examples.

**Standard server action structure:**

```typescript
"use server";

import { guardTenant, guardTenantRole } from "@/lib/guards";
import { prisma } from "@repo/database";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { someSchema } from "@/lib/validations/module-name";

export async function createSomething(data: CreateInput) {
  try {
    // 1. Auth + Tenant guard (ALWAYS first)
    const g = await guardTenant(); // or guardTenantRole(["TENANT_ADMIN"])
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // 2. Zod validation
    const validated = someSchema.parse(data);

    // 3. Business logic + Prisma mutation (always include tenantId)
    const result = await prisma.model.create({
      data: { tenantId, ...validated },
    });

    // 4. Cache invalidation + path revalidation
    revalidatePath("/dashboard/module");

    // 5. Return success
    return { success: "Kayıt oluşturuldu", id: result.id };
  } catch (error) {
    // 6. Error handling with Sentry
    Sentry.captureException(error);
    console.error("Operation failed:", error);
    return { error: "İşlem sırasında hata oluştu." };
  }
}
```

**Critical rules for server actions:**
- ALWAYS call `guardTenant()` or `guardTenantRole()` as the first operation
- ALWAYS include `tenantId` in WHERE clauses and CREATE data
- ALWAYS use Zod schema validation before any mutation
- ALWAYS serialize Prisma `Decimal` fields to `Number()` before returning to client
- ALWAYS wrap in try/catch with `Sentry.captureException(error)`
- Use `$transaction` for multi-step mutations (e.g., stock + order + invoice)
- Use `revalidatePath()` to bust Next.js cache after mutations
- Return `{ success: string }` or `{ error: string }` — never throw from actions

### 2.2 Guard System (RBAC + Tenant Isolation)

Two guard variants exist in `lib/guards.ts`:

| Guard | Behavior | Use Case |
|-------|----------|----------|
| `guardTenant()` | Returns `{ session, tenantId }` or `{ error }` | Any tenant-scoped action |
| `guardTenantRole(roles)` | Same + role check | Role-restricted actions |
| `requireSession()` | Throws if no session | Non-tenant scoped actions |
| `requireTenant()` | Throws if no tenant | When throwing is acceptable |
| `requireRole(roles)` | Throws if wrong role | When throwing is acceptable |
| `requireSuperAdmin()` | Throws if not SA | Super admin actions |
| `requireFeature(feat)` | Throws if feature disabled | Feature-gated actions |
| `requireLimit(key)` | Throws if limit exceeded | Limit-gated actions |
| `assertTenantIsolation()` | Throws on cross-tenant | Record-level isolation check |
| `require2FAVerified()` | Throws if 2FA incomplete | Critical operations |

**Return-based guards (`guard*`)** — Preferred in actions. Check with `if ("error" in g)`.
**Throw-based guards (`require*`)** — Use in API routes or when centralized error handling exists.

### 2.3 Subscription Guard System

Located in `lib/subscription-guard.ts`. Enforces plan-based limits and feature gating.

**Limits** (checked via `checkLimit(tenantId, key)`):
`maxUsers`, `maxMechanics`, `maxVehicles`, `maxCustomers`, `maxLocations`,
`maxSmsPerMonth`, `maxWhatsappPerMonth`, `maxStorageMB`

**Features** (checked via `checkFeature(tenantId, key)`):
`eInvoice`, `whatsapp`, `bulkNotifications`, `advancedReporting`,
`multiLocation`, `parasutIntegration`, `apiAccess`, `prioritySupport`

To add new limits/features: update the `PlanLimits`/`PlanFeatures` interfaces,
add counting logic to `countCurrentUsage()`, and update the seed plans.

### 2.4 Validation Pattern (Zod)

All validations live in `lib/validations/*.ts`. Each module has its own file.

```typescript
// lib/validations/module-name.ts
import * as z from "zod";

export const createSomethingSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  phone: z.string().optional(),
  // Turkish locale error messages
});

export type CreateSomethingInput = z.infer<typeof createSomethingSchema>;
```

**Existing validation files:** `appointments`, `auth`, `customers`, `finance`,
`inventory`, `invoice`, `maintenance-plan`, `mechanics`, `notification`,
`payment`, `purchase-order`, `quotes`, `services`, `stock-count`,
`stock-transfer`, `suppliers`, `tenant`, `vehicles`.

### 2.5 Prisma Decimal Serialization

Prisma returns `Decimal` objects that are **not** JSON-serializable for Next.js client components.
ALWAYS convert before returning:

```typescript
const serialized = {
  ...record,
  amount: Number(record.amount.toString()),
  balance: Number(record.balance.toString()),
};
```

### 2.6 Real-Time Communication

- **SSE (Server-Sent Events):** `lib/sse.ts` — Use `publishSSEEvent()` for real-time dashboard updates
- **Push Notifications:** `lib/push.ts` — Use `sendPushToTenant()` for web push (PWA)
- **Custom hook:** `components/dashboard/use-sse.ts` — Client-side SSE consumption

### 2.7 Cache Strategy

`lib/cache.ts` provides `CacheKeys` namespace and `invalidateCache()` function.
Use `invalidateCache(CacheKeys.dashboardKpi(tenantId))` after mutations affecting KPIs.

---

## 3. Database Schema Guide

The Prisma schema (`packages/database/prisma/schema.prisma`) defines 40+ models.
For the complete schema reference with all fields and relationships, see
`references/database-schema.md`.

### Key Schema Categories

| Category | Models |
|----------|--------|
| Multi-tenancy | `Tenant` |
| Subscription | `SubscriptionPlan`, `Subscription`, `PlanFeature` |
| Auth | `User`, `Account`, `Session`, `VerificationToken` |
| CRM | `Customer`, `Vehicle` |
| Personnel | `Mechanic`, `CommissionRule`, `WorkLog` |
| Inventory | `PartCategory`, `Part`, `StockMovement`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `StockCount`, `StockCountItem`, `StockTransfer`, `StockTransferItem` |
| Service | `ServiceOrder`, `ServiceItem`, `InspectionForm`, `ServiceRating` |
| Finance | `Invoice`, `InvoiceItem`, `InvoiceSequence`, `Payment`, `CheckPayment`, `PaymentAttempt`, `ParasutSyncLog` |
| Quote | `Quote`, `QuoteItem` |
| Appointment | `Appointment` |
| Notification | `Notification`, `NotificationTemplate`, `NotificationProvider`, `BulkNotificationCampaign`, `CustomerNotificationPreference`, `PushSubscription` |
| Loyalty | `LoyaltyTransaction` |
| Document | `Document` |
| Messaging | `Message` |
| Maintenance | `MaintenancePlan` |
| Location | `Location` |
| Compliance | `KvkkConsent`, `DataSubjectRequest` |
| System | `SystemSetting`, `SystemNotification`, `AuditLog`, `AccountingIntegration` |

### Schema Conventions

- Every tenant-scoped model **must** have `tenantId String` + `@@index([tenantId])`
- Use `deletedAt DateTime?` for soft delete (never hard-delete user data)
- Use `@db.Decimal(15,2)` for monetary fields
- Use `@db.VarChar(N)` for bounded string fields
- Use `@db.Text` for unbounded text (notes, descriptions)
- Enums are defined at schema level: `ServiceOrderStatus`, `InvoiceStatus`, etc.
- Relations use `onDelete: Cascade` for child records, `Restrict` for referenced records

### Adding a New Model

1. Add model to `packages/database/prisma/schema.prisma`
2. Add relation to `Tenant` model (mandatory for tenant-scoped data)
3. Run `pnpm --filter database db:generate` then `pnpm --filter database db:push`
4. Create validation schema in `apps/web/lib/validations/`
5. Create server actions in `apps/web/lib/actions/`
6. Create UI components in `apps/web/components/dashboard/`
7. Create page in `apps/web/app/(dashboard)/dashboard/`
8. Add to sidebar navigation and RBAC permission matrix
9. Write tests in `apps/web/__tests__/`

---

## 4. Module Development Guide

### 4.1 Dashboard Module Structure

Each dashboard module follows a consistent structure:

```
app/(dashboard)/dashboard/module-name/
├── page.tsx              # Server Component — data fetching + guard
├── [id]/
│   └── page.tsx          # Detail/edit page
└── ModuleClient.tsx      # (sometimes in components/ instead)

components/dashboard/module-name/
├── ModuleBoardClient.tsx  # Main client component (Kanban/Table/List)
├── ModuleDialog.tsx       # Create/Edit dialog
├── ModuleCard.tsx         # Card component for list items
└── ModuleFilters.tsx      # Filter/search toolbar
```

**Page component pattern (Server Component):**

```tsx
// app/(dashboard)/dashboard/module-name/page.tsx
import { getSomeDashboard } from "@/lib/actions/module.actions";
import ModuleBoardClient from "@/components/dashboard/module-name/ModuleBoardClient";

export default async function ModulePage() {
  const data = await getSomeDashboard();
  if ("error" in data) return <div>Error: {data.error}</div>;
  return <ModuleBoardClient initialData={data} />;
}
```

### 4.2 Existing Dashboard Modules

| Module | Path | Actions File | Key Features |
|--------|------|-------------|--------------|
| Overview | `/dashboard` | `dashboard.actions.ts` | KPI cards, charts, recent activity |
| Services | `/dashboard/services` | `service.actions.ts` | Kanban board, lifecycle management |
| Customers | `/dashboard/customers` | `customer.actions.ts` | CRUD, balance tracking, blacklist |
| Vehicles | `/dashboard/vehicles` | `vehicle.actions.ts` | CRUD, maintenance plans, service history |
| Appointments | `/dashboard/appointments` | `appointment.actions.ts` | Visual calendar, drag-drop, status |
| Quotes | `/dashboard/quotes` | `quote.actions.ts` | Create/convert to service order |
| Mechanics | `/dashboard/mechanics` | `mechanic.actions.ts` | Staff management, performance |
| Staff | `/dashboard/staff` | `auth.actions.ts` | User CRUD, role assignment |
| Inventory | `/dashboard/inventory` | `inventory.actions.ts` | Parts, categories, stock movements |
| Suppliers | `/dashboard/suppliers` | `supplier.actions.ts` | Supplier CRUD |
| Finances | `/dashboard/finances` | `finance.actions.ts` | Revenue, expenses, balance |
| Finance/Invoices | `/dashboard/finance/invoices` | `invoice.actions.ts` | Invoice CRUD, PDF, e-Invoice |
| Finance/Payments | `/dashboard/finance/payments` | `payment.actions.ts` | Cash, card, check, bank transfer |
| Analytics | `/dashboard/analytics` | `analytics.actions.ts` | Mechanic analytics, revenue charts |
| Notifications | `/dashboard/notifications` | `notifications.actions.ts` | SMS, WhatsApp, email, push |
| Locations | `/dashboard/locations` | `location.actions.ts` | Multi-branch management |
| Settings | `/dashboard/settings` | `tenant.actions.ts` | Firm settings, theme, preferences |
| CRM | `/dashboard/crm` | `crm.actions.ts` | Customer relationship tools |
| Onboarding | `/dashboard/onboarding` | `onboarding.actions.ts` | First-time setup wizard |

### 4.3 Super Admin Modules

The Super Admin panel at `/(super-admin)/super-admin/` has 34 sub-modules including:
`tenants`, `users`, `subscriptions`, `plans`, `payments`, `support`, `audit`,
`logs`, `security`, `backup-recovery`, `database-health`, `analytics`,
`reports`, `settings`, `notifications`, `automation`, `kms`, `infrastructure`,
`deployments`, `cloud-costs`, `capacity`, `developer`, `api-integrations`,
`mobile-management`, `nps`, `coupons`, `roles`, `strategic-insights`,
`saas-overview`, `tenant-performance`, `payment-operations`, `command-center`,
`addons`, `archive`.

Super Admin actions are centralized in `superadmin.actions.ts` (74KB, the largest action file).

### 4.4 Mobile Web Portals

**Customer Portal (`/m/musteri/*`):**
- Login via plate + phone number
- Vehicle tracking, service history
- Appointment creation
- Document viewing
- Messaging with service staff

**Staff Portal (`/m/firma/*`):**
- Dashboard, service queue, vehicles
- Analytics, personnel management
- Finance, stock management
- Settings

Components are in `components/mobile/` and follow a touch-optimized responsive design.

---

## 5. Authentication & Authorization

### NextAuth.js 5 Configuration

- **Location:** `apps/web/auth.ts` + `apps/web/auth.config.ts`
- **Strategy:** JWT + PrismaAdapter
- **Providers:**
  - `Credentials` — Email + password (bcrypt) for staff + super admin
  - `CustomerProvider` — Plate + phone for mobile customers
- **2FA:** TOTP via `otplib`, backup codes stored in `User.twoFactorBackupCodes`

### RBAC Role Matrix

| Role | Dashboard | Services | Quotes | Appointments | Customers | Vehicles | Staff | Mechanics | Inventory | Suppliers | Finances | Analytics | Notifications | Settings |
|------|:---------:|:--------:|:------:|:------------:|:---------:|:--------:|:-----:|:---------:|:---------:|:---------:|:--------:|:---------:|:-------------:|:--------:|
| TENANT_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RECEPTIONIST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| MECHANIC | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ACCOUNTANT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| SUPER_ADMIN | All | All | All | All | All | All | All | All | All | All | All | All | All | All |

Permissions are defined in `lib/permissions.ts` via `ROLE_ACCESS_MATRIX`.
Navigation filtering uses `canAccess(role, href)` and `filterNavItems(role, items)`.

### Middleware

`apps/web/middleware.ts` handles:
1. Rate limiting (API + login routes) via Upstash Redis
2. Sentry tenant tagging
3. Subscription status enforcement (redirect to `/dashboard/subscription-blocked`)
4. Locale detection from `Accept-Language` header

---

## 6. Notification System

Multi-channel notification with templates and provider management.

| Channel | Implementation | Provider |
|---------|---------------|----------|
| SMS | `lib/notifications/sms.ts` | Twilio |
| WhatsApp | `lib/notifications/whatsapp.ts` | Twilio |
| Email | `lib/notifications/email.ts` | Resend |
| Push | `lib/push.ts` | Web Push (PWA) |
| In-App | `Notification` model | Prisma |

Templates are in `lib/notifications/templates.ts` with Turkish locale support.
Notification providers are tenant-configurable via `NotificationProvider` model.

---

## 7. Background Jobs (Inngest)

Located in `lib/inngest/`. Client setup in `lib/inngest/client.ts`.
Functions are in `lib/inngest/functions/`.

**Endpoint:** `/api/inngest` route exposes the Inngest serve handler.

To add a new background job:
1. Create function file in `lib/inngest/functions/`
2. Register in the Inngest serve handler at `app/api/inngest/route.ts`
3. Trigger via `inngest.send()` from server actions

---

## 8. Third-Party Integrations

### Payment Flow (Stripe)
- Checkout: `/api/stripe/checkout`
- Webhook: `/api/stripe/webhook` — handles subscription lifecycle
- Client: `lib/stripe.ts`

### Accounting (Paraşüt)
- Client: `lib/parasut.ts` + `lib/parasut/`
- Actions: `parasut.actions.ts`
- Sync logs: `ParasutSyncLog` model

### e-Invoice (GIB)
- Module: `lib/e-invoice/`
- Actions: `e-invoice.actions.ts`
- Status tracked in `Invoice.eInvoiceStatus`

### File Storage (S3)
- Upload: `lib/storage.ts` → `/api/upload`
- Used for: vehicle photos, documents, logos

---

## 9. Testing

### Test Structure

```
apps/web/__tests__/
├── service-lifecycle.test.ts   # End-to-end service order flow
├── stock-integrity.test.ts     # Stock movement consistency
├── rbac.test.ts                # Role-based access control
├── finance.test.ts             # Invoice calculations
├── commission.test.ts          # Mechanic commission logic
├── appointments.test.ts        # Appointment conflict detection
├── quotes.test.ts              # Quote pricing
├── approval.test.ts            # Token-based approval flow
├── notifications.test.ts       # Notification dispatch
├── storage.test.ts             # S3 upload/delete
├── push.test.ts                # Web push
├── search.test.ts              # Meilisearch integration
├── rate-limit.test.ts          # Rate limiting
├── cache.test.ts               # Cache invalidation
├── totp.test.ts                # 2FA TOTP
├── sse.test.ts                 # Server-Sent Events
├── health.test.ts              # Health endpoint
├── pwa.test.ts                 # PWA manifest
├── sentry.test.ts              # Error tracking
├── jobs.test.ts                # Background jobs
├── location.test.ts            # Multi-location
├── api/                        # API route tests
├── e-invoice/                  # e-Invoice tests
├── invoice/                    # Invoice tests
├── notifications/              # Notification channel tests
├── parasut/                    # Paraşüt sync tests
├── payment/                    # Payment tests
└── properties/                 # Property-based tests
```

### Running Tests

```bash
pnpm --filter web exec jest --runInBand      # All tests
pnpm --filter web exec jest path/to/test     # Single test
pnpm --filter web exec jest --watch          # Watch mode
```

### Test Configuration

Jest config at `apps/web/jest.config.js`. Key considerations:
- ESM dependencies (`otplib`, `meilisearch`) need `transformIgnorePatterns` or mocks
- Mocks directory: `apps/web/__mocks__/`
- Use `@repo/database` mock for Prisma client

---

## 10. Development Commands

```bash
# Development
pnpm dev                                    # Start all apps (turbo)
pnpm --filter web dev                       # Start web only
pnpm --filter mobile dev                    # Start mobile (Expo)

# Database
pnpm --filter database db:generate          # Generate Prisma client
pnpm --filter database db:push              # Push schema to DB
pnpm --filter database db:seed:plans        # Seed subscription plans
pnpm --filter database db:seed:demo         # Seed demo tenant
pnpm --filter database exec prisma studio   # Open Prisma Studio

# Quality
pnpm --filter web check-types              # TypeScript check
pnpm --filter web lint                     # ESLint
pnpm --filter web exec jest --runInBand    # Tests
pnpm build                                 # Production build (turbo)

# Formatting
pnpm format                                # Prettier
```

---

## 11. Environment Variables

See `references/environment-variables.md` for the complete list.
Key groups: Database, Auth, Stripe, Email/SMS, Storage, Cache, Error Tracking,
Search, Background Jobs, Accounting, KVKK/IYS.

---

## 12. Deployment

### Recommended Stack
- **Web:** Vercel (or Hetzner VPS)
- **Database:** Neon / Supabase / self-hosted PostgreSQL
- **Cache:** Upstash Redis (serverless)
- **Files:** AWS S3 or Cloudflare R2
- **DNS/CDN:** Cloudflare

### Health Check
```
GET /api/health  →  { status: "ok", timestamp: "..." }
```

### KVKK Note
Production data must reside in Turkey or EU (Germany) data centers.

---

## 13. Common Patterns for New Features

### Adding a New Dashboard Module

Reference `references/new-module-checklist.md` for the step-by-step checklist.

### Adding a New Server Action

Reference `references/server-action-patterns.md` for templates.

### Adding a New Mobile Web Page

Reference `references/mobile-web-patterns.md` for conventions.

### Adding a New Super Admin Module

1. Create page in `app/(super-admin)/super-admin/module-name/`
2. Add actions to `superadmin.actions.ts` (or create dedicated file for large modules)
3. Use `requireSuperAdmin()` guard
4. Add navigation entry in super admin sidebar

---

## 14. Business Domain Reference

### Service Order Lifecycle

```
PENDING → IN_PROGRESS → WAITING_APPROVAL → COMPLETED
                ↓              ↓                ↓
            CANCELLED      CANCELLED        CANCELLED
```

- **PENDING → IN_PROGRESS:** Mechanic starts work
- **IN_PROGRESS → WAITING_APPROVAL:** Items added, approval token generated, SMS/email sent
- **WAITING_APPROVAL → COMPLETED:** Customer approves → auto-invoice + customer balance update
- **COMPLETED → CANCELLED:** Invoice cancelled, stock returned, customer balance reversed
- **Any → CANCELLED:** Service cancelled (stock may or may not be returned based on state)

### Financial Flow

1. Service items are added (PART items auto-decrement stock)
2. On COMPLETED: Invoice auto-created, customer balance incremented
3. Payments recorded: CASH, CREDIT_CARD, BANK_TRANSFER, CHECK, IYZICO, PAYTR
4. Check payments tracked separately via `CheckPayment` model
5. Invoice PDF generation via `lib/invoice-pdf.ts`

### Subscription Plans

| Plan | Slug | Users | Vehicles | Features |
|------|------|-------|----------|----------|
| Başlangıç | `starter` | 1 | 50 | Basic |
| Profesyonel | `professional` | 5 | Unlimited | WhatsApp, e-Invoice, advanced reports |
| Kurumsal | `enterprise` | 15 | Unlimited | Multi-location, API, priority support |

Plans seeded via `packages/database/prisma/seed-plans.ts`.

---

## 15. Coding Conventions

- **Language:** TypeScript strict mode
- **Error messages:** Turkish locale for user-facing, English for logs/comments
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Files:** kebab-case for filenames (e.g., `service.actions.ts`)
- **Imports:** `@/` alias for `apps/web/`, `@repo/database` for Prisma client
- **Comments:** Section separators use `// -----` banners
- **Soft delete:** Use `deletedAt` field, filter with `deletedAt: null`
- **Decimal fields:** Always serialize to `Number()` before returning to client
- **Guard pattern:** Always use return-based guards in actions, throw-based in API routes
