# Tasarım — SaaS Altyapı İyileştirmeleri

## Genel Mimari

Mevcut stack: Next.js 15 App Router + TypeScript + PostgreSQL/Prisma + Turborepo monorepo

Bu tasarım mevcut stack'i bozmadan katman katman iyileştirme yapar. Her faz bağımsız deploy edilebilir.

---

## FAZ 1 — Acil İyileştirmeler

### 1.1 Sentry Entegrasyonu

**Paket:** `@sentry/nextjs`

**Dosya Yapısı:**
```
apps/web/
  sentry.client.config.ts   # Browser tarafı init
  sentry.server.config.ts   # Node.js tarafı init
  sentry.edge.config.ts     # Edge runtime init
  instrumentation.ts        # Next.js instrumentation hook
```

**Yapılandırma Yaklaşımı:**
- `Sentry.init()` her config dosyasında DSN ile başlatılır
- `withSentryConfig()` next.config.js'e sarılır (source map upload)
- Server Action'larda `Sentry.captureException()` try/catch bloklarına eklenir
- Tenant context: `Sentry.setTag("tenantId", ...)` her authenticated request'te set edilir
- Performance tracing: `tracesSampleRate: 0.1` (production'da %10 örnekleme)

**Ortam Değişkenleri:**
```
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=   # Source map upload için
```

---

### 1.2 Rate Limiting

**Yaklaşım:** Next.js Middleware + Upstash Redis (veya in-memory Map geliştirme için)

**Dosya:** `apps/web/middleware.ts` (mevcut dosya genişletilecek)

**Algoritma:** Sliding Window Counter

```
Her istek için:
  key = "rate_limit:{ip}:{endpoint_group}"
  count = INCR key
  if count == 1: EXPIRE key {window_seconds}
  if count > limit: return 429
```

**Limit Grupları:**
| Grup | Endpoint Pattern | Limit | Pencere |
|------|-----------------|-------|---------|
| auth | `/api/auth/*`, `/login` | 10 istek | 60 sn |
| upload | `/api/upload` | 5 istek | 60 sn |
| approval | `/api/approval/*` | 3 istek | 300 sn |
| general | diğer `/api/*` | 100 istek | 60 sn |

**Geliştirme Ortamı:** `NODE_ENV === "development"` ise rate limiting atlanır.

**Ortam Değişkenleri:**
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

### 1.3 PWA Desteği

**Dosya Yapısı:**
```
apps/web/public/
  manifest.json
  icons/
    icon-192x192.png
    icon-512x512.png
    apple-touch-icon.png
  sw.js                    # Service Worker (build sonrası generate)
apps/web/app/
  offline/page.tsx         # Offline fallback sayfası
```

**manifest.json İçeriği:**
```json
{
  "name": "MS Oto Servis",
  "short_name": "BST Servis",
  "description": "Oto servis yönetim platformu",
  "start_url": "/dashboard",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [...]
}
```

**Service Worker Stratejisi:**
- Cache-first: statik assets (JS, CSS, images)
- Network-first: API istekleri
- Offline fallback: `/offline` sayfası

**Next.js Entegrasyonu:** `next.config.js`'e `<link rel="manifest">` ve meta tag'ler root `layout.tsx`'e eklenir.

---

### 1.4 Health Check Endpoint

**Dosya:** `apps/web/app/api/health/route.ts`

```typescript
// GET /api/health
// Response: { status, db, version, timestamp }
// DB check: prisma.$queryRaw`SELECT 1`
// Timeout: 3000ms
```

---

## FAZ 2 — Kısa Vadeli İyileştirmeler

### 2.1 Redis Önbellekleme

**Paket:** `@upstash/redis` (serverless uyumlu)

**Dosya:** `apps/web/lib/cache.ts`

**Cache Katmanı Tasarımı:**
```typescript
// Wrapper fonksiyonlar
async function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T>
async function invalidateCache(pattern: string): Promise<void>
```

**Cache Key Şeması:**
```
dashboard:kpi:{tenantId}          TTL: 300s
inventory:parts:{tenantId}:{page} TTL: 600s
customers:list:{tenantId}:{page}  TTL: 120s
analytics:{tenantId}:{period}     TTL: 3600s
```

**Invalidation Stratejisi:**
- Servis emri güncelleme → `dashboard:kpi:{tenantId}` sil
- Parça güncelleme → `inventory:parts:{tenantId}:*` sil
- Müşteri güncelleme → `customers:list:{tenantId}:*` sil

**Fallback:** Redis bağlantısı yoksa `fetcher()` direkt çağrılır, hata fırlatılmaz.

---

### 2.2 Server-Sent Events (Real-time)

**Dosya:** `apps/web/app/api/events/[tenantId]/route.ts`

**Akış:**
```
Client → GET /api/events/{tenantId}
Server → Content-Type: text/event-stream
         Connection: keep-alive

Event Format:
  data: {"type":"SERVICE_ORDER_UPDATED","payload":{...}}\n\n
```

**Event Tipleri:**
```typescript
type SSEEvent =
  | { type: "SERVICE_ORDER_UPDATED"; payload: { id: string; status: string } }
  | { type: "APPOINTMENT_CREATED"; payload: { id: string; date: string } }
  | { type: "APPROVAL_RESPONDED"; payload: { orderId: string; approved: boolean } }
```

**Tenant İzolasyonu:** URL'deki `tenantId` session'daki `tenantId` ile doğrulanır. Eşleşmezse `403` döner.

**Yayın Mekanizması:** Redis Pub/Sub (Upstash) veya in-memory EventEmitter (tek instance için)

---

### 2.3 Web Push Bildirimleri

**Paket:** `web-push`

**Dosya Yapısı:**
```
apps/web/
  lib/push.ts                          # VAPID + gönderim fonksiyonları
  app/api/push/subscribe/route.ts      # Subscription kayıt
  app/api/push/unsubscribe/route.ts    # Subscription silme
```

**Prisma Şema Eklentisi:**
```prisma
model PushSubscription {
  id           String   @id @default(uuid())
  tenantId     String
  userId       String
  endpoint     String   @db.Text
  p256dh       String   @db.Text
  auth         String   @db.Text
  createdAt    DateTime @default(now())
  @@index([tenantId])
  @@index([userId])
}
```

**Ortam Değişkenleri:**
```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@bstoto.com
```

---

### 2.4 Background Job Sistemi (Inngest)

**Paket:** `inngest`

**Dosya Yapısı:**
```
apps/web/
  lib/inngest/
    client.ts          # Inngest client init
    functions/
      send-email.ts    # E-posta gönderim job'ı
      send-sms.ts      # SMS gönderim job'ı
      maintenance-reminder.ts  # Bakım hatırlatma
  app/api/inngest/route.ts     # Inngest webhook handler
```

**Job Tanımları:**
```typescript
// send-email job
inngest.createFunction(
  { id: "send-email", retries: 3 },
  { event: "notification/email.send" },
  async ({ event }) => { /* Resend ile gönder */ }
)

// maintenance-reminder (cron)
inngest.createFunction(
  { id: "maintenance-reminder" },
  { cron: "0 9 * * *" },  // Her gün 09:00
  async () => { /* nextMaintenanceDate yaklaşan araçları bul, bildirim gönder */ }
)
```

---

### 2.5 2FA (TOTP)

**Paket:** `otplib`

**Dosya Yapısı:**
```
apps/web/
  lib/totp.ts                              # TOTP yardımcı fonksiyonlar
  app/(dashboard)/dashboard/settings/
    two-factor/page.tsx                    # 2FA kurulum sayfası
  app/api/auth/2fa/
    setup/route.ts                         # QR kod + secret üretimi
    verify/route.ts                        # TOTP doğrulama
    disable/route.ts                       # 2FA devre dışı bırakma
```

**Prisma Şema Eklentisi:**
```prisma
// User modeline eklenecek alanlar:
twoFactorSecret   String?  @db.VarChar(255)
twoFactorBackupCodes String[] // Yedek kodlar (hash'lenmiş)
```

**Login Akışı:**
```
1. Kullanıcı email+şifre girer → credentials doğrulanır
2. hasTwoFactor === true ise → TOTP ekranına yönlendir
3. TOTP kodu girilir → otplib.totp.verify() ile doğrula
4. Başarılıysa session oluştur
```

---

## FAZ 3 — Uzun Vadeli

### 3.1 Çoklu Lokasyon

**Prisma Şema Eklentisi:**
```prisma
model Location {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String   @db.VarChar(255)
  address     String?  @db.Text
  phone       String?  @db.VarChar(50)
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)

  users         User[]         // Bu lokasyona atanmış kullanıcılar
  serviceOrders ServiceOrder[]
  appointments  Appointment[]
  parts         Part[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}
```

**Etkilenen Modeller:** `ServiceOrder`, `Appointment`, `Part`, `User` — hepsine `locationId` alanı eklenir.

---

### 3.2 Native Mobil Uygulama

**Yapı:**
```
apps/
  mobile/                    # Yeni Expo projesi
    app/
      (auth)/
      (customer)/            # /m/musteri/* karşılığı
      (firm)/                # /m/firma/* karşılığı
    components/
    lib/
      api.ts                 # Mevcut Server Actions'ı REST endpoint'e çeviren client
    package.json
```

**API Stratejisi:** Mevcut Server Actions'lar `/api/mobile/*` REST endpoint'lerine dönüştürülür. Mobil uygulama bu endpoint'leri tüketir.

---

### 3.3 Full-text Arama (Meilisearch)

**Paket:** `meilisearch`

**Dosya:** `apps/web/lib/search.ts`

**Index'ler:**
- `customers` — firstName, lastName, companyName, phone, plate
- `vehicles` — plate, brand, model, chassisNo
- `service_orders` — complaintDescription, orderNumber
- `parts` — name, partNumber, description

**Senkronizasyon:** Prisma middleware ile her create/update/delete'de Meilisearch index güncellenir.

**Ortam Değişkenleri:**
```
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
```

---

## Ortam Değişkenleri Tam Listesi

Mevcut `.env.local`'e eklenecekler:

```bash
# Sentry
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Redis / Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Meilisearch (Faz 3)
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
```

---

## Bağımlılık Değişiklikleri

### Eklenecek Paketler

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8",
    "@upstash/redis": "^1",
    "inngest": "^3",
    "otplib": "^12",
    "web-push": "^3",
    "meilisearch": "^0.40"
  }
}
```

### Geliştirme Bağımlılıkları

```json
{
  "devDependencies": {
    "@types/web-push": "^3"
  }
}
```
