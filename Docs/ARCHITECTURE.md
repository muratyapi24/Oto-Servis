# BST Otoservis — Teknik Mimari

> Son Güncelleme: Nisan 2026 | Versiyon: 3.0

---

## 1. Proje Genel Bakış

**BST Otoservis**, Türkiye'deki oto servis işletmelerine yönelik çok kiracılı (multi-tenant) SaaS platformudur.

| Özellik | Değer |
|---------|-------|
| **Mimari** | Multi-tenant SaaS, tek kod tabanı |
| **Platform** | Web (Next.js) + Mobil Web (/m/*) + Native Mobil (Expo) |
| **Hedef Pazar** | Türkiye oto servis işletmeleri (80.000+ potansiyel) |
| **Abonelik** | Standart / Pro / Kurumsal (Stripe entegrasyonu) |
| **Uyumluluk** | KVKK, IYS, e-Fatura |

---

## 2. Monorepo Yapısı

```
bst-otoservis/          # Turborepo monorepo
├── apps/
│   ├── web/            # Ana Next.js 15 uygulaması
│   └── mobile/         # React Native (Expo) uygulaması
└── packages/
    ├── database/       # Prisma şeması + seed scriptleri
    └── ui/             # Paylaşılan UI bileşenleri
```

### apps/web Route Yapısı

| Route Grubu | Path | Açıklama |
|-------------|------|----------|
| Landing | `/`, `/pricing`, `/features`, `/about` | Pazarlama sayfaları (statik HTML) |
| Auth | `/login`, `/register`, `/superadmin-login` | NextAuth.js akışları |
| Dashboard | `/(dashboard)/dashboard/*` | Firma yönetim paneli (12 modül) |
| Super Admin | `/(super-admin)/*` | Platform yönetim paneli |
| Müşteri Mobil | `/m/musteri/*` | Mobil web müşteri portalı |
| Usta Mobil | `/m/firma/*` | Mobil web personel portalı |
| Onay | `/onay` | Müşteri servis onay linki |

---

## 3. Teknoloji Stack

### Core

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | Next.js (App Router) | 15.3 |
| Dil | TypeScript | 5.9 |
| UI | Tailwind CSS | 4.0 |
| ORM | Prisma | 5.11+ |
| Veritabanı | PostgreSQL | 16+ |
| Auth | NextAuth.js (beta) | 5.0 |
| Monorepo | Turborepo | - |
| Paket Yöneticisi | pnpm | 9+ |

### Third-Party Servisler

| Servis | Sağlayıcı | Kullanım Alanı |
|--------|-----------|----------------|
| E-posta | Resend | Bildirimler, onay e-postaları |
| SMS / WhatsApp | Twilio | Servis bildirimleri, OTP |
| Ödeme | Stripe | Abonelik tahsilatı (webhook lifecycle) |
| Dosya Depolama | AWS S3 / Cloudflare R2 | Fotoğraf, doküman |
| Önbellek | Upstash Redis | Rate limiting, session, cache |
| Hata İzleme | Sentry | Frontend + backend hata takibi |
| Arama | Meilisearch | Full-text araç/müşteri arama |
| Arka Plan İşler | Inngest | Job queue, zamanlanmış görevler |
| Muhasebe | Paraşüt | e-Fatura entegrasyonu |
| Animasyon | Framer Motion | UI animasyonları |
| Form | React Hook Form + Zod | Form yönetimi ve doğrulama |

### Diğer Kütüphaneler

- **PDF**: jsPDF + html2canvas
- **Export**: papaparse (CSV), xlsx (Excel)
- **i18n**: next-intl 4.9 (Türkçe / İngilizce)
- **QR/Barkod**: qrcode, @zxing/library
- **Push Notification**: web-push 3.6.7 (PWA)
- **Tarih**: dayjs + date-fns (tr locale)

---

## 4. Kimlik Doğrulama & Yetkilendirme

### Auth Sağlayıcıları (NextAuth.js 5)

| Provider | Kullanıcı Tipi | Giriş Yöntemi |
|----------|---------------|---------------|
| `Credentials` | Firma personeli + Super Admin | E-posta + şifre (bcrypt) |
| `CustomerProvider` | Mobil müşteriler | Plaka + telefon numarası |

- **2FA**: TOTP tabanlı (otplib), backup code desteği
- **Strateji**: JWT + PrismaAdapter

### Roller (RBAC)

| Rol | Kapsam |
|-----|--------|
| `SUPER_ADMIN` | Platform geneli — tüm tenantlar, sistem logları, sağlık |
| `TENANT_ADMIN` | Firma içi tam yetki |
| `RECEPTIONIST` | Servis emirleri, müşteriler, randevular |
| `ACCOUNTANT` | Stok, finans, fatura |
| `MECHANIC` | Kendine atanan iş emirleri, mobil panel |

### Sayfa Erişim Matrisi

| Modül | Admin | Usta | Resepsiyon | Muhasebe |
|-------|:-----:|:----:|:----------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Servis Emirleri | ✅ | ✅ | ✅ | ❌ |
| Teklifler / Randevular | ✅ | ❌ | ✅ | ❌ |
| Müşteriler / Araçlar | ✅ | ✅ | ✅ | ❌ |
| Personel Yönetimi | ✅ | ❌ | ❌ | ❌ |
| Stok & Envanter | ✅ | ✅ | ❌ | ✅ |
| Finans & Ödemeler | ✅ | ❌ | ❌ | ✅ |
| Ayarlar & Analitik | ✅ | ❌ | ❌ | ❌ |

---

## 5. Multi-Tenant Mimari

- Her oto servis firması bağımsız bir **Tenant** kaydıdır.
- Tüm veri modelleri `tenantId` alanı ile izole edilir (Row-Level Isolation).
- Middleware, her istekte JWT'den `tenantId` okur ve abonelik durumunu kontrol eder.
- Askıya alınan / silinen tenantlar `/dashboard/subscription-blocked` sayfasına yönlendirilir.

```
Tenant (Firma)
  └── User (Personel)
  └── Customer / Vehicle
  └── ServiceOrder → ServiceItem
  └── Invoice / Payment
  └── Appointment / Quote
  └── Part / StockMovement
  └── Mechanic / WorkLog
```

---

## 6. Veritabanı Şeması (27 Tablo)

| Kategori | Tablolar |
|----------|---------|
| Multi-tenancy | `Tenant` |
| Abonelik | `SubscriptionPlan`, `Subscription`, `PlanFeature` |
| Auth | `User`, `Account`, `Session`, `VerificationToken` |
| CRM | `Customer`, `Vehicle` |
| Personel | `Mechanic`, `CommissionRule`, `WorkLog` |
| Stok | `PartCategory`, `Part`, `StockMovement`, `Supplier`, `PurchaseOrder`, `StockCount` |
| Servis | `ServiceOrder`, `ServiceItem`, `InspectionForm`, `ServiceRating` |
| Finans | `Invoice`, `InvoiceItem`, `InvoiceSequence`, `Payment`, `CheckPayment` |
| Teklif | `Quote`, `QuoteItem` |
| Randevu | `Appointment` |
| Bildirim | `Notification`, `NotificationTemplate`, `NotificationProvider`, `BulkNotificationCampaign` |
| Sadakat | `LoyaltyTransaction` |
| Doküman | `Document` |
| Uyumluluk | `KvkkConsent`, `DataSubjectRequest` |
| Sistem | `SystemSetting`, `SystemNotification`, `AuditLog`, `AccountingIntegration` |

---

## 7. API Katmanı

### Server Actions (Next.js — type-safe)

| Dosya | Kapsam |
|-------|--------|
| `service.actions.ts` | İş emri CRUD, durum güncelleme, müşteri onay |
| `dashboard.actions.ts` | KPI metrikleri, gelir hesaplama |
| `finance.actions.ts` | Fatura, ödeme, kasa işlemleri |
| `vehicle.actions.ts` | Araç CRUD, bakım planı |
| `mechanic.actions.ts` | Usta yönetimi, performans raporu |
| `quote.actions.ts` | Teklif sistemi |
| `analytics.actions.ts` | İstatistikler |
| `inventory.actions.ts` | Stok yönetimi |
| `superadmin.actions.ts` | Platform yönetimi (tenant CRUD, audit) |
| `mobile.actions.ts` | Usta mobil API |
| `musteri.actions.ts` | Müşteri mobil API |
| `appointment.actions.ts` | Randevu yönetimi |
| `approval.actions.ts` | Müşteri onay token akışı |

### API Routes

| Endpoint | Açıklama |
|----------|----------|
| `/api/auth/*` | NextAuth.js (2FA setup/verify dahil) |
| `/api/stripe/*` | Checkout + webhook (abonelik yaşam döngüsü) |
| `/api/upload` | S3 dosya yükleme |
| `/api/approval` | Müşteri onay sayfası token doğrulama |
| `/api/inngest` | Arka plan job kuyruğu |
| `/api/events` | Server-Sent Events (real-time güncellemeler) |
| `/api/push` | Web Push bildirim kayıt/gönderim |
| `/api/docs` | Swagger UI |
| `/api/public/health` | Sağlık kontrolü |

---

## 8. PWA & Mobil

- **manifest.json**: `public/manifest.json` — Ana ekrana ekleme desteği
- **Service Worker**: `public/sw.js` — Offline fallback
- **Mobil Web Portalleri**: `/m/musteri/*` ve `/m/firma/*` responsive, dokunmatik optimize
- **Native Mobil**: `apps/mobile/` (Expo / React Native) — API'leri tüketir

---

## 9. Ortam Değişkenleri (Zorunlu)

```env
# Veritabanı
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# E-posta & SMS
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Dosya Depolama
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Önbellek & Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Hata İzleme
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Arama
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=

# Arka Plan İşler
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Muhasebe
PARASUT_CLIENT_ID=
PARASUT_CLIENT_SECRET=

# KVKK / IYS
IYS_API_KEY=
IYS_BRAND_CODE=
```

---

## 10. Altyapı & Dağıtım

```
Kullanıcı (Web / Mobil)
    │
    ▼
Cloudflare (CDN, DDoS, WAF, SSL)
    │
    ▼
Vercel / Hetzner (Next.js)
    │
    ├── PostgreSQL (Neon / Supabase / self-hosted)
    ├── Upstash Redis (serverless)
    ├── AWS S3 / Cloudflare R2 (dosyalar)
    ├── Resend (e-posta)
    ├── Twilio (SMS/WhatsApp)
    └── Sentry (izleme)
```

### Önerilen Hosting

| Ortam | Platform | Maliyet |
|-------|---------|---------|
| Geliştirme | Lokal (Docker Compose) | Ücretsiz |
| Staging | Vercel Preview + Neon Free | Ücretsiz |
| Production (başlangıç) | Hetzner VPS + Neon | ~50€/ay |
| Production (ölçekli) | Vercel Pro + Neon / Supabase | ~150$/ay |

> **KVKK Notu:** Üretim verileri Türkiye veya AB (Almanya) sunucularında tutulmalıdır.

---

## 11. Güvenlik

- **Şifreleme**: bcrypt (kullanıcı şifreleri)
- **Rate Limiting**: Upstash Redis ile IP bazlı (middleware)
- **RBAC**: JWT claim tabanlı, her server action'da doğrulama
- **Tenant İzolasyonu**: Her sorgu `tenantId` filtresi içerir
- **2FA**: TOTP (otplib), backup code desteği
- **Audit Log**: `AuditLog` tablosu ile tüm kritik işlemler kayıt altında
- **KVKK**: `KvkkConsent` + `DataSubjectRequest` tabloları, veri silme/export API
- **SSL**: Let's Encrypt / Cloudflare (production zorunlu)

---

## 12. Test

```
apps/web/__tests__/
├── finance.test.ts        # Fatura ve ödeme hesaplamaları
├── quote.test.ts          # Teklif tutarı ve iskonto
├── appointment.test.ts    # Çakışma kontrolü
├── notification.test.ts   # Bildirim gönderim mantığı
├── approval.test.ts       # Token doğrulama akışı
├── commission.test.ts     # Usta komisyon hesaplama
└── storage.test.ts        # S3 upload/delete fonksiyonları
```

Çalıştırmak için:
```bash
pnpm test           # Tüm testler
pnpm test:watch     # Watch mode
```
