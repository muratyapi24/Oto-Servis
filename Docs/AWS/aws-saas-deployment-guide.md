# Next.js 15 SaaS — AWS Dağıtım ve Altyapı Rehberi

> **Güncel:** Nisan 2026 · Next.js 15.3 App Router · Turborepo + pnpm 9 Monorepo · Auth.js v5 · Prisma ORM

---

## 1. Proje Altyapısı ve Servis Haritası

Bst_Otoservis projesi **hibrit** bir altyapı kullanır: barındırma ve depolama için AWS, diğer yetenekler için sektörün en iyi serverless SaaS servislerini tercih eder.

### Monorepo Yapısı

```
bst-otoservis/                 ← pnpm workspace (pnpm@9.0.0)
├── apps/
│   └── web/                   ← Next.js 15.3 uygulaması (ana uygulama)
│       ├── app/               ← App Router (dashboard, super-admin, mobile, API)
│       ├── lib/               ← Server Actions, Inngest jobs, Prisma queries
│       ├── public/landing/    ← Statik pazarlama sayfaları (HTML)
│       └── middleware.ts      ← Rate limiting (Upstash) + Sentry tagging
├── packages/
│   ├── database/              ← @repo/database — Prisma şeması + seed + migrasyonlar
│   ├── ui/                    ← @repo/ui — Paylaşılan UI bileşenleri
│   ├── eslint-config/         ← Paylaşılan ESLint yapılandırması
│   └── typescript-config/     ← Paylaşılan TS ayarları
├── turbo.json                 ← Turborepo görev tanımları
└── pnpm-workspace.yaml        ← Workspace: apps/* + packages/*
```

### Servis Karşılaştırma Tablosu

| Proje Bileşeni | Servis | Projede Kullanılan Paket / Konum |
|---|---|---|
| Web Uygulaması | **AWS Amplify Hosting Gen 2** | `apps/web` — Next.js 15.3 (SSR + statik landing) |
| Veritabanı | **Amazon RDS (PostgreSQL 16)** | `packages/database` — Prisma ORM |
| Dosya Depolama | **Amazon S3** | `apps/web/lib/storage.ts` — `@aws-sdk/client-s3` |
| Kimlik Doğrulama | **Auth.js v5 (next-auth)** | `apps/web/auth.ts` — Credentials (e-posta + müşteri plaka/telefon) |
| Önbellekleme / Rate Limiting | **Upstash Redis** | `apps/web/lib/rate-limit.ts`, `apps/web/lib/cache.ts` — `@upstash/redis` |
| Arka Plan Görevleri | **Inngest** | `apps/web/lib/inngest/` — SMS, e-posta, bakım hatırlatıcısı |
| Tam Metin Arama | **Meilisearch** | `apps/web/lib/search.ts`, `search-sync.ts` |
| E-posta Gönderimi | **Resend** | `apps/web/lib/notifications/email.ts` |
| SMS Gönderimi | **Twilio** | `apps/web/lib/notifications/sms.ts` |
| Hata İzleme | **Sentry** | `@sentry/nextjs` — `next.config.js` sarmalı + instrumentation |
| Ödeme Altyapısı | **Stripe** | `apps/web/lib/stripe.ts`, `app/api/stripe/` |
| Push Bildirimler | **Web Push (VAPID)** | `apps/web/lib/push.ts` — `web-push` |
| Çoklu Dil | **next-intl** | `apps/web/i18n.ts` — TR / EN |

---

## 2. Dağıtım Seçeneği: AWS Amplify Hosting Gen 2

DevOps bağımlılığı olmadan `git push` ile canlıya almak için en modern yoldur.

**Avantajları:**
- Otomatik CI/CD pipeline, CloudFront CDN ve ücretsiz SSL
- Her PR için önizleme ortamları (Preview Deployments)
- Next.js 15 SSR, Middleware ve Server Actions tam desteği
- Turborepo / pnpm monorepo yapısını native destekler

**Ne zaman ECS/Fargate'e geçilmeli?**
- Docker container zorunluysa veya mikro servis mimarisine geçiliyorsa
- Tam altyapı kontrolü, özel network politikaları gerekiyorsa

---

## 3. Adım Adım Kurulum Yol Haritası

### Adım 1: AWS Hesap Güvenliği

1. [AWS hesabı oluşturun](https://aws.amazon.com).
2. Root hesaba **MFA** ekleyin — bu adımı asla atlamayın.
3. **IAM Identity Center** ile günlük yönetici kullanıcı açın (root ile çalışmayın).
4. Tüm kaynakları aynı bölgede oluşturun: **`eu-central-1` (Frankfurt)** — Türkiye'ye en yakın AWS Region.

---

### Adım 2: Amazon RDS (PostgreSQL) Kurulumu

1. AWS RDS → "Create database" → Engine: **PostgreSQL 16**.
2. **Başlangıç:** `db.t4g.micro` (~$15/ay) · **Üretim:** `db.t4g.small` + Multi-AZ.
3. VPC Security Group: Port `5432`'yi yalnızca Amplify/VPC CIDR'a açın.
4. Otomatik yedekleme: **7 gün retention** ile etkinleştirin.
5. Endpoint'i kaydedin:

```
postgresql://kullanici:sifre@<rds-endpoint>.rds.amazonaws.com:5432/oto_servis?schema=public
```

> **⚠️ Önemli:** Prisma şeması `packages/database/prisma/schema.prisma` içindedir. Üretim DB'sini aktarmak için: `cd packages/database && npx prisma migrate deploy`

---

### Adım 3: Amazon S3 Konfigürasyonu

1. `bst-otoservis-assets` adında bucket oluşturun (Region: `eu-central-1`).
2. **Block Public Access** etkinleştirin; dosyaları CloudFront OAC ile yayınlayın.
3. IAM'de yalnızca `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` izinli programatik kullanıcı oluşturun.
4. CORS yapılandırması:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://bstotoservis.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

5. CloudFront dağıtımı oluşturup S3'ü origin olarak bağlayın.

> **Not:** Proje şu an `storage.ts` içinde S3 URL'lerini doğrudan kullanıyor (`https://bucket.s3.region.amazonaws.com/key`). CloudFront geçişi için `getPublicUrl()` fonksiyonundaki URL formatı CloudFront domain'ine güncellenmelidir.

---

### Adım 4: Harici SaaS Servisleri Kurulumu

| Servis | Dashboard | Alınacak Değişkenler |
|---|---|---|
| **Upstash** | [console.upstash.com](https://console.upstash.com) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Inngest** | [app.inngest.com](https://app.inngest.com) | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| **Meilisearch** | [cloud.meilisearch.com](https://cloud.meilisearch.com) veya EC2 | `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY` |
| **Sentry** | [sentry.io](https://sentry.io) | `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |
| **Resend** | [resend.com](https://resend.com) | `RESEND_API_KEY` |
| **Twilio** | [twilio.com](https://www.twilio.com) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Stripe** | [dashboard.stripe.com](https://dashboard.stripe.com) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

---

### Adım 5: AWS Amplify Dağıtımı

1. GitHub/GitLab private deponuzu Amplify'a bağlayın, `main` branch seçin.
2. Proje kök dizinine `amplify.yml` dosyası oluşturun:

```yaml
version: 1
applications:
  - appRoot: apps/web
    frontend:
      phases:
        preBuild:
          commands:
            - npm i -g pnpm@9.0.0
            - pnpm install --frozen-lockfile
            - cd ../../packages/database && npx prisma generate
        build:
          commands:
            - pnpm run build
      artifacts:
        baseDirectory: .next
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
          - ../../packages/database/node_modules/.prisma/**/*
```

> **Kritik notlar:**
> - `prisma generate` adımı **zorunludur** — bu olmadan Prisma Client build sırasında bulunamaz.
> - `pnpm@9.0.0` belirtilmiştir çünkü `package.json` → `"packageManager": "pnpm@9.0.0"` ile sabitlenmiştir.
> - Sentry, `next.config.js`'i `withSentryConfig()` ile sarar; build sırasında `SENTRY_AUTH_TOKEN` ile source map yükler.

3. Amplify Console → **Environment variables** bölümüne tüm değişkenleri ekleyin (Bölüm 4'e bakın).
4. "Save and deploy" → Build loglarını takip edin.

---

### Adım 6: Domain ve SSL Sertifikası

1. **Route 53** ile alan adını yönetin veya mevcut domain'in NS kayıtlarını Route 53'e yönlendirin.
2. Amplify Console → "Domain management" → alan adınızı bağlayın.
3. ACM (AWS Certificate Manager) SSL sertifikası **ücretsiz ve otomatik** olarak atanır.
4. `www → apex` yönlendirmesi Amplify UI'dan tek tıkla yapılır.

---

### Adım 7: İzleme, Güvenlik ve Bütçe

**Sentry (Uygulama Katmanı):**
- Zaten `instrumentation.ts` + client/server/edge config'lerle entegre
- Middleware'de tenant tagging yapılıyor — çok kiracılı hata filtrelemesi mümkün
- Critial alert kuralları ayarlanmalı (Stripe webhook hataları, auth hataları)

**CloudWatch (Altyapı Katmanı):**
- RDS CPU > %80 → e-posta alarm
- RDS depolama < 20% → uyarı
- Amplify 5xx oranı > %1 → alarm

**AWS Budgets (Maliyet Kontrolü):**
- Aylık bütçe limiti belirleyin (örn. $150)
- %80 ve %100 eşiğinde e-posta uyarısı kurun

---

## 4. Ortam Değişkenleri (Tam Liste)

Amplify Console → **Environment variables** bölümüne eklenecek değişkenlerin tamamı. `NEXT_PUBLIC_` prefix'li olanlar istemciye açıktır; diğerleri yalnızca sunucuda kullanılır.

```env
# ──── Temel Ayarlar ────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://bstotoservis.com

# ──── Kimlik Doğrulama (Auth.js v5) ────
# Üretmek için: npx auth secret  veya  openssl rand -base64 32
AUTH_SECRET="<en-az-32-karakter-rastgele-deger>"

# ──── Veritabanı (Amazon RDS PostgreSQL) ────
DATABASE_URL="postgresql://kullanici:sifre@<rds-endpoint>.rds.amazonaws.com:5432/oto_servis?schema=public"

# ──── Dosya Depolama (Amazon S3) ────
AWS_ACCESS_KEY_ID="XXXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="bst-otoservis-assets"

# ──── Önbellekleme / Rate Limiting (Upstash Redis) ────
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxx"

# ──── Arka Plan Görevleri (Inngest) ────
INNGEST_EVENT_KEY="xxxxxx"
INNGEST_SIGNING_KEY="xxxxxx"

# ──── Arama Motoru (Meilisearch) ────
MEILISEARCH_HOST="https://meili.bstotoservis.com"
MEILISEARCH_API_KEY="xxxxxx"

# ──── Hata İzleme (Sentry) ────
SENTRY_DSN="https://xxxx@sentry.io/xxxx"
SENTRY_ORG="xxxx"
SENTRY_PROJECT="xxxx"
SENTRY_AUTH_TOKEN="xxxx"

# ──── Push Bildirimler (VAPID) ────
# Üretmek için: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="xxxx"
VAPID_PRIVATE_KEY="xxxx"
VAPID_SUBJECT="mailto:admin@bstoto.com"

# ──── E-Posta (Resend) ────
RESEND_API_KEY="re_xxxxxx"

# ──── SMS (Twilio) ────
TWILIO_ACCOUNT_SID="ACxxxx"
TWILIO_AUTH_TOKEN="xxxx"
TWILIO_PHONE_NUMBER="+90xxxxxxxxxx"

# ──── Ödemeler (Stripe) ────
STRIPE_SECRET_KEY="sk_live_xxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxx"
```

---

## 5. Tahmini Aylık Maliyet (Başlangıç)

| Servis | Tier / Plan | Tahmini Maliyet |
|---|---|---|
| AWS Amplify Hosting | Build dakikaları + CDN | $5 – $20 |
| Amazon RDS PostgreSQL | db.t4g.micro | ~$15 |
| Amazon S3 | 10 GB depolama | ~$1 – $3 |
| Route 53 | 1 hosted zone | ~$0.50 |
| CloudFront | 50 GB/ay transfer | ~$5 |
| Upstash Redis | Free / Pay-as-you-go | $0 – $10 |
| Inngest | Free (25K events/ay) | $0 |
| Meilisearch Cloud | Sandbox / Build | $0 – $30 |
| Sentry | Developer (Free) | $0 |
| Resend | Free (100 e-posta/gün) | $0 |
| Stripe | İşlem başına %2.9 + $0.30 | Kullanım bazlı |
| **Toplam (sabit)** | | **~$30 – $85/ay** |

> **Not:** Önceki tahmin ElastiCache ($12/ay) ve yoğun CloudFront ($85/ay) içeriyordu. Upstash + düşük trafikli CDN ile başlangıç maliyeti önemli ölçüde düşer.

---

## 6. Sık Yapılan Hatalar ve Çözümleri

| Hata | Çözüm |
|---|---|
| Amplify build'de `PrismaClient` bulunamıyor | `amplify.yml` preBuild'e `prisma generate` ekleyin |
| `pnpm` versiyonu uyumsuz | `amplify.yml`'de `pnpm@9.0.0` belirtin (`package.json` ile eşleştirin) |
| RDS herkese açık bırakıldı | Security Group'ta sadece VPC CIDR'a izin verin |
| `prisma db push` production'da kullanıldı | Her zaman `prisma migrate deploy` kullanın |
| S3 bucket doğrudan public yapıldı | CloudFront + OAC (Origin Access Control) kullanın |
| `SENTRY_AUTH_TOKEN` ayarlanmadı | Build sırasında source map yüklenemez — sessizce geçilir ama hata izleme kısıtlanır |
| Inngest webhook URL'i güncellenmedi | Amplify domain adından sonra `https://domain.com/api/inngest` olarak Inngest dashboard'a kaydedin |
| Bütçe alarmı kurulmadı | AWS Budgets ile ilk gün kurun — sürpriz faturalardan korunun |

---

## 7. Canlı Sonrası Kontrol Listesi

Deployment tamamlandıktan sonra sırasıyla doğrulayın:

- [ ] Ana sayfa (landing) yükleniyor: `https://bstotoservis.com`
- [ ] Login çalışıyor: `/login` (Admin, Personel, Müşteri)
- [ ] Dashboard erişimi: `/dashboard`
- [ ] Mobil portallar: `/m/musteri/`, `/m/personel/`
- [ ] Super Admin paneli: `/super-admin`
- [ ] Stripe webhook tetikleniyor: `POST /api/stripe/webhook`
- [ ] Inngest fonksiyonları çalışıyor: `GET /api/inngest` dashboard'dan kontrol
- [ ] S3 dosya yüklemesi test: Araç fotoğrafı ekle
- [ ] E-posta gönderimi: Resend dashboard'dan log kontrolü
- [ ] Sentry hata yakalama: Kasıtlı throw ile test
- [ ] Redis/rate limiting: Aynı IP'den hızlı isteklerle 429 yanıtı doğrulama

---

## 8. Ölçeklendirme Yol Haritası

Kullanıcı ve kiracı sayısı arttığında sırasıyla değerlendirin:

1. **RDS → Aurora Serverless v2** — Otomatik kapasite ölçekleme, sıfır yönetim
2. **Amplify → ECS Fargate** — Container tabanlı, tam kontrol, mikro servis geçişi
3. **Upstash → ElastiCache Cluster** — Yoğun trafik için VPC-içi düşük gecikme
4. **CloudFront + AWS WAF** — DDoS koruması, SQL injection / XSS engelleyici
5. **AWS Organizations** — Çoklu hesap: `dev` / `staging` / `prod` ayrımı
6. **Meilisearch → OpenSearch** — AWS managed arama, ölçeklenebilirlik
