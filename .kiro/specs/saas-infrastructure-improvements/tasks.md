# Görevler — SaaS Altyapı İyileştirmeleri

## FAZ 1 — Acil (Canlıya Çıkmadan Önce)

### 1. Sentry Entegrasyonu

- [x] 1.1 `@sentry/nextjs` paketini kur (`pnpm add @sentry/nextjs`)
- [x] 1.2 `apps/web/sentry.client.config.ts` oluştur (browser init, DSN, tracesSampleRate: 0.1)
- [x] 1.3 `apps/web/sentry.server.config.ts` oluştur (Node.js init)
- [x] 1.4 `apps/web/sentry.edge.config.ts` oluştur (Edge runtime init)
- [x] 1.5 `apps/web/instrumentation.ts` oluştur (Next.js instrumentation hook)
- [x] 1.6 `apps/web/next.config.js`'i `withSentryConfig()` ile sar
- [x] 1.7 `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` değişkenlerini `.env.local`'e ekle (boş değerle)
- [x] 1.8 Kritik Server Action'lara (`service.actions.ts`, `finance.actions.ts`) Sentry hata yakalama ekle
- [x] 1.9 Authenticated middleware'de `Sentry.setTag("tenantId", ...)` ekle
- [x] 1.10 `__tests__/sentry.test.ts` — P1.1 ve P1.2 property testlerini yaz

### 2. Rate Limiting

- [x] 2.1 `@upstash/redis` paketini kur (`pnpm add @upstash/redis`)
- [x] 2.2 `apps/web/lib/rate-limit.ts` oluştur (sliding window algoritması, in-memory fallback)
- [x] 2.3 `apps/web/middleware.ts`'i güncelle — rate limit kontrolü ekle
- [x] 2.4 Limit gruplarını tanımla: auth (10/60s), upload (5/60s), approval (3/300s), general (100/60s)
- [x] 2.5 429 yanıtı için `X-RateLimit-Remaining` ve `Retry-After` header'larını ekle
- [x] 2.6 `NODE_ENV === "development"` kontrolü ile geliştirme ortamında atla
- [x] 2.7 `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` değişkenlerini `.env.local`'e ekle
- [x] 2.8 `__tests__/rate-limit.test.ts` — P2.1, P2.2, P2.3 property testlerini yaz

### 3. PWA Desteği

- [x] 3.1 `apps/web/public/manifest.json` oluştur (name, short_name, icons, theme_color, display: standalone)
- [x] 3.2 192x192 ve 512x512 PNG ikonları `apps/web/public/icons/` altına ekle
- [x] 3.3 `apps/web/app/layout.tsx`'e manifest link ve apple-touch-icon meta tag'lerini ekle
- [x] 3.4 `apps/web/public/sw.js` oluştur (cache-first statik, network-first API, offline fallback)
- [x] 3.5 `apps/web/app/layout.tsx`'e Service Worker kayıt script'i ekle
- [x] 3.6 `apps/web/app/offline/page.tsx` oluştur (offline fallback sayfası)
- [x] 3.7 `__tests__/pwa.test.ts` — P3.1 ve P3.2 property testlerini yaz

### 4. Health Check Endpoint

- [x] 4.1 `apps/web/app/api/health/route.ts` oluştur
- [x] 4.2 `prisma.$queryRaw\`SELECT 1\`` ile DB bağlantısını kontrol et
- [x] 4.3 Başarılı: `{ status: "ok", db: "connected", version: "...", timestamp: "..." }` + 200
- [x] 4.4 DB hatası: `{ status: "error", db: "disconnected" }` + 503
- [x] 4.5 3000ms timeout ekle
- [x] 4.6 `__tests__/health.test.ts` — P4.1 ve P4.2 property testlerini yaz

---

## FAZ 2 — Kısa Vadeli (İlk 3 Ay)

### 5. Redis Önbellekleme

- [x] 5.1 `apps/web/lib/cache.ts` oluştur (`getCached<T>()` ve `invalidateCache()` fonksiyonları)
- [x] 5.2 Redis bağlantısı yoksa DB fallback mekanizması ekle (hata fırlatma)
- [x] 5.3 `dashboard.actions.ts`'deki KPI sorgularını cache'e al (TTL: 300s)
- [ ] 5.4 `inventory.actions.ts`'deki parça listesini cache'e al (TTL: 600s)
- [x] 5.5 `customer.actions.ts`'deki müşteri listesini cache'e al (TTL: 120s)
- [x] 5.6 Servis emri güncellemede `dashboard:kpi:{tenantId}` cache'ini temizle
- [x] 5.7 Parça güncellemede `inventory:parts:{tenantId}:*` cache'ini temizle
- [x] 5.8 `__tests__/cache.test.ts` — P5.1, P5.2, P5.3 property testlerini yaz

### 6. Server-Sent Events (Real-time)

- [x] 6.1 `apps/web/app/api/events/[tenantId]/route.ts` oluştur (SSE endpoint)
- [x] 6.2 `Content-Type: text/event-stream` ve `Connection: keep-alive` header'larını ayarla
- [x] 6.3 Tenant doğrulaması: session tenantId ile URL tenantId eşleşmeli, yoksa 403
- [x] 6.4 `SERVICE_ORDER_UPDATED`, `APPOINTMENT_CREATED`, `APPROVAL_RESPONDED` event tiplerini tanımla
- [x] 6.5 `service.actions.ts`'deki durum güncellemelerine SSE yayını ekle
- [x] 6.6 `apps/web/lib/sse.ts` — event yayın yardımcı fonksiyonu oluştur
- [x] 6.7 Dashboard'a SSE client bağlantısı ekle (EventSource + otomatik reconnect)
- [x] 6.8 `__tests__/sse.test.ts` — P6.1 tenant izolasyon testini yaz

### 7. Web Push Bildirimleri

- [x] 7.1 `web-push` paketini kur (`pnpm add web-push && pnpm add -D @types/web-push`)
- [x] 7.2 VAPID key çifti oluştur ve `.env.local`'e ekle
- [x] 7.3 `packages/database/prisma/schema.prisma`'ya `PushSubscription` modeli ekle
- [x] 7.4 `prisma migrate dev` çalıştır
- [x] 7.5 `apps/web/lib/push.ts` oluştur (gönderim fonksiyonları)
- [x] 7.6 `apps/web/app/api/push/subscribe/route.ts` oluştur
- [x] 7.7 `apps/web/app/api/push/unsubscribe/route.ts` oluştur
- [ ] 7.8 Dashboard ayarlar sayfasına bildirim izni isteme UI'ı ekle
- [x] 7.9 `service.actions.ts`'deki durum güncellemelerine push bildirim gönderimi ekle
- [x] 7.10 `__tests__/push.test.ts` — P7.1 ve P7.2 property testlerini yaz

### 8. Background Job Sistemi (Inngest)

- [x] 8.1 `inngest` paketini kur (`pnpm add inngest`)
- [x] 8.2 `apps/web/lib/inngest/client.ts` oluştur (Inngest client init)
- [x] 8.3 `apps/web/lib/inngest/functions/send-email.ts` oluştur (retry: 3, exponential backoff)
- [x] 8.4 `apps/web/lib/inngest/functions/send-sms.ts` oluştur (retry: 3)
- [x] 8.5 `apps/web/lib/inngest/functions/maintenance-reminder.ts` oluştur (cron: "0 9 * * *")
- [x] 8.6 `apps/web/app/api/inngest/route.ts` oluştur (webhook handler)
- [x] 8.7 `email.ts` ve `sms.ts` bildirim fonksiyonlarını Inngest event'lerine taşı
- [x] 8.8 `INNGEST_EVENT_KEY` ve `INNGEST_SIGNING_KEY` değişkenlerini `.env.local`'e ekle
- [x] 8.9 `__tests__/jobs.test.ts` — P8.1 ve P8.2 property testlerini yaz

### 9. 2FA (TOTP)

- [x] 9.1 `otplib` paketini kur (`pnpm add otplib`)
- [x] 9.2 `packages/database/prisma/schema.prisma`'ya `twoFactorSecret` ve `twoFactorBackupCodes` alanlarını ekle
- [x] 9.3 `prisma migrate dev` çalıştır
- [x] 9.4 `apps/web/lib/totp.ts` oluştur (generateSecret, generateQRCode, verifyToken, generateBackupCodes)
- [x] 9.5 `apps/web/app/api/auth/2fa/setup/route.ts` oluştur (secret + QR kod üretimi)
- [x] 9.6 `apps/web/app/api/auth/2fa/verify/route.ts` oluştur (TOTP doğrulama)
- [x] 9.7 `apps/web/app/api/auth/2fa/disable/route.ts` oluştur (şifre doğrulamalı devre dışı bırakma)
- [x] 9.8 Login akışına 2FA adımı ekle (`auth.ts` güncelle)
- [x] 9.9 Dashboard ayarlar sayfasına 2FA yönetim UI'ı ekle (QR kod gösterimi, backup codes)
- [x] 9.10 `__tests__/totp.test.ts` — P9.1, P9.2, P9.3 property testlerini yaz

---

## FAZ 3 — Uzun Vadeli (6-12 Ay)

### 10. Çoklu Lokasyon / Şube Desteği

- [x] 10.1 `packages/database/prisma/schema.prisma`'ya `Location` modeli ekle
- [x] 10.2 `ServiceOrder`, `Appointment`, `Part`, `User` modellerine opsiyonel `locationId` alanı ekle
- [x] 10.3 `prisma migrate dev` çalıştır
- [x] 10.4 `apps/web/lib/actions/location.actions.ts` oluştur (CRUD)
- [x] 10.5 Dashboard'a lokasyon yönetim sayfası ekle (`/dashboard/locations`)
- [x] 10.6 Dashboard header'ına lokasyon seçici ekle
- [x] 10.7 Tüm listeleme sorgularına `locationId` filtresi ekle
- [x] 10.8 Konsolide rapor sayfası oluştur (tüm lokasyonlar toplamı)
- [x] 10.9 `__tests__/location.test.ts` — P10.1 ve P10.2 property testlerini yaz

### 11. Native Mobil Uygulama (React Native / Expo)

- [x] 11.1 `apps/mobile` altında Expo projesi oluştur (`npx create-expo-app`)
- [x] 11.2 `pnpm-workspace.yaml`'a `apps/mobile` ekle
- [x] 11.3 Mevcut Server Actions'ları `/api/mobile/*` REST endpoint'lerine dönüştür
- [x] 11.4 Müşteri ekranlarını native'e taşı (panel, takip, geçmiş, profil, randevu)
- [x] 11.5 Firma/usta ekranlarını native'e taşı (panel, kuyruk, araçlar, personel)
- [x] 11.6 Firebase Cloud Messaging entegrasyonu (push notification)
- [x] 11.7 Biometric authentication (expo-local-authentication)
- [x] 11.8 Kamera entegrasyonu (expo-camera — servis fotoğrafı)
- [x] 11.9 Offline mod (WatermelonDB veya AsyncStorage + sync)
- [x] 11.10 EAS Build yapılandırması (App Store + Google Play)

### 12. Muhasebe Entegrasyonu (Parasut)

- [ ] 12.1 Parasut API client'ı oluştur (`apps/web/lib/parasut.ts`)
- [ ] 12.2 `packages/database/prisma/schema.prisma`'ya `AccountingIntegration` modeli ekle
- [ ] 12.3 Fatura oluşturma action'ına Parasut senkronizasyonu ekle
- [ ] 12.4 Ödeme kaydetme action'ına Parasut eşleştirmesi ekle
- [ ] 12.5 Dashboard ayarlar sayfasına Parasut bağlantı UI'ı ekle
- [ ] 12.6 Senkronizasyon hata bildirimi (e-posta + in-app)
- [ ] 12.7 Manuel senkronizasyon tetikleyici endpoint oluştur

### 13. Full-text Arama (Meilisearch)

- [x] 13.1 `meilisearch` paketini kur (`pnpm add meilisearch`)
- [x] 13.2 `apps/web/lib/search.ts` oluştur (Meilisearch client + index yönetimi)
- [x] 13.3 `customers`, `vehicles`, `service_orders`, `parts` index'lerini oluştur
- [x] 13.4 Türkçe karakter normalizasyonu için index ayarlarını yapılandır
- [x] 13.5 Prisma middleware ile create/update/delete'de index senkronizasyonu ekle
- [x] 13.6 `apps/web/app/api/search/route.ts` oluştur (tenant izolasyonlu arama endpoint'i)
- [x] 13.7 Dashboard'a global arama bileşeni ekle
- [x] 13.8 `MEILISEARCH_HOST` ve `MEILISEARCH_API_KEY` değişkenlerini `.env.local`'e ekle
- [x] 13.9 `__tests__/search.test.ts` — P13.1 ve P13.2 property testlerini yaz

### 14. API Dokümantasyonu

- [x] 14.1 `swagger-ui-react` ve `swagger-jsdoc` paketlerini kur
- [x] 14.2 `apps/web/app/api/docs/route.ts` oluştur (OpenAPI spec endpoint)
- [x] 14.3 `apps/web/app/api/docs/ui/page.tsx` oluştur (Swagger UI sayfası)
- [x] 14.4 Tüm public API route'larına JSDoc OpenAPI annotation'ları ekle
- [x] 14.5 Authentication (Bearer token) dokümantasyona dahil et

### 15. i18n (Çok Dil Desteği)

- [x] 15.1 `next-intl` paketini kur (`pnpm add next-intl`)
- [x] 15.2 `apps/web/messages/tr.json` ve `apps/web/messages/en.json` oluştur
- [x] 15.3 `apps/web/i18n.ts` yapılandırma dosyasını oluştur
- [ ] 15.4 `apps/web/middleware.ts`'e locale detection ekle
- [x] 15.5 Tüm hardcoded Türkçe metinleri çeviri anahtarlarına taşı
- [x] 15.6 Dashboard header'ına dil seçici ekle
- [x] 15.7 Tarih ve para birimi formatlarını locale'e göre ayarla

---

## Görev Özeti

| Faz | Görev Sayısı | Tahmini Süre |
|-----|-------------|--------------|
| Faz 1 — Acil | 4 ana görev, ~30 alt görev | 1-2 gün |
| Faz 2 — Kısa Vadeli | 5 ana görev, ~45 alt görev | 2-3 hafta |
| Faz 3 — Uzun Vadeli | 6 ana görev, ~55 alt görev | 2-4 ay |
| **Toplam** | **15 ana görev, ~130 alt görev** | **~5 ay** |
