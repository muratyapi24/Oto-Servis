# Third-Party Integrations — BST Otoservis

## 1. Stripe (Subscription Payments)

**Files:** `lib/stripe.ts`, `app/api/stripe/checkout/`, `app/api/stripe/webhook/`
**Actions:** `subscription.actions.ts`

### Checkout Flow
1. User selects plan → `createCheckoutSession()` → Stripe Checkout
2. Payment success → redirect to dashboard
3. Webhook receives `checkout.session.completed` → create/update Subscription

### Webhook Events Handled
- `checkout.session.completed` — New subscription
- `invoice.payment_succeeded` — Renewal
- `invoice.payment_failed` — Mark PAST_DUE
- `customer.subscription.deleted` — Mark CANCELLED

### Best Practices
- Webhook idempotency: check event ID before processing
- Use `stripeSubscriptionId` for linking
- Period dates from Stripe, not manual calculation

---

## 2. Resend (Email)

**File:** `lib/notifications/email.ts`

### Usage
```typescript
import { sendEmail } from "@/lib/notifications/email";
await sendEmail({
  to: "user@example.com",
  subject: "Servis Durumu",
  html: templateHtml,
  tenantId: "...",
  customerId: "...",
});
```

---

## 3. Twilio (SMS/WhatsApp)

**Files:** `lib/notifications/sms.ts`, `lib/notifications/whatsapp.ts`

### SMS
```typescript
import { sendSms } from "@/lib/notifications/sms";
await sendSms({
  to: "+905551234567",
  body: "Servisiniz tamamlandı.",
  tenantId: "...",
  customerId: "...",
});
```

### WhatsApp
Feature-gated: requires `whatsapp` feature in subscription plan.

---

## 4. AWS S3 / Cloudflare R2 (File Storage)

**File:** `lib/storage.ts`
**API:** `app/api/upload/route.ts`

### Upload Flow
1. Client calls upload API with file
2. Server generates signed URL or uploads directly
3. Returns public URL stored in database

### Used For
- Vehicle photos (`Vehicle.imageUrl`)
- Documents (`Document` model)
- Tenant logos (`Tenant.logoUrl`)
- Invoice PDFs (`Invoice.pdfUrl`)

---

## 5. Upstash Redis (Cache/Rate Limit)

**File:** `lib/rate-limit.ts`, `lib/cache.ts`

### Rate Limiting
Applied in middleware for API and login routes.
IP-based with configurable windows.

### Caching
`CacheKeys` namespace for typed cache keys.
`invalidateCache()` for targeted invalidation.

---

## 6. Sentry (Error Tracking)

**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
**Instrumentation:** `instrumentation.ts`

### Usage in Actions
```typescript
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

Middleware tags errors with `tenantId` for filtering.

---

## 7. Meilisearch (Full-Text Search)

**Files:** `lib/search.ts`, `lib/search-sync.ts`

### Indexed Models
- Customers (name, phone, email)
- Vehicles (plate, brand, model)

### Sync
`search-sync.ts` handles index updates on CRUD operations.

---

## 8. Inngest (Background Jobs)

**Files:** `lib/inngest/client.ts`, `lib/inngest/functions/`
**API:** `app/api/inngest/route.ts`

### Existing Functions
Located in `lib/inngest/functions/`:
- `overdue-invoice-reminder.ts` — Send reminders for overdue invoices

---

## 9. Paraşüt (Turkish Accounting)

**Files:** `lib/parasut.ts`, `lib/parasut/`, `parasut.actions.ts`

### Features
- Invoice sync to Paraşüt
- Customer/supplier sync
- Payment recording
- Sync logs via `ParasutSyncLog` model

### Feature Gate
Requires `parasutIntegration` feature in subscription plan.

---

## 10. Web Push (PWA)

**File:** `lib/push.ts`
**API:** `app/api/push/route.ts`

### Usage
```typescript
import { sendPushToTenant } from "@/lib/push";
await sendPushToTenant(tenantId, {
  title: "Yeni İş Emri",
  body: "Yeni bir iş emri oluşturuldu.",
  url: "/dashboard/services",
});
```

Subscriptions stored in `PushSubscription` model.

---

## 11. e-Invoice (GIB — Turkey Tax Authority)

**Files:** `lib/e-invoice/`, `e-invoice.actions.ts`

### Flow
1. Invoice created in system
2. Generate GIB-compliant XML (UBL-TR format)
3. Send via Paraşüt or direct GIB API
4. Track status: DRAFT → PENDING → SENT → ACCEPTED/REJECTED

### Feature Gate
Requires `eInvoice` feature in subscription plan.
