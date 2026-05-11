# BST Otoservis — SaaS Oto Servis Yönetim Platformu

> Türkiye'nin oto servislerine özel bulut tabanlı yönetim yazılımı.
> Randevu, iş emri, stok, fatura, tahsilat ve müşteri bilgilendirme tek platformda.

---

## Özellikler

| Modül | Kapsam |
|-------|--------|
| **İş Emri** | Dijital kabul, parça/işçilik takibi, müşteri onay linki, QR takip |
| **Müşteri & Araç** | Detaylı araç profili, servis geçmişi, bakım planı, fotoğraf |
| **Stok** | Parça yönetimi, stok hareketleri, kritik stok uyarısı, transfer |
| **Finans** | Fatura, tahsilat, cari hesap, çek/senet, Paraşüt entegrasyonu |
| **Randevu** | Görsel takvim, sürükle-bırak, SMS/WhatsApp hatırlatıcı |
| **Bildirim** | SMS, WhatsApp, e-posta, push — tek kanaldan |
| **Müşteri Portali** | Araç takibi, servis geçmişi, bakım planı görüntüleme |
| **Usta Portali** | Mobil web ve native Expo uygulaması |
| **Super Admin** | Multi-tenant yönetim, abonelik, audit log |
| **Uyum** | KVKK, IYS, e-Fatura/GIB, Türkiye'ye özgü |

---

## Teknoloji

```
apps/
  web/        Next.js 15 (App Router) + Tailwind
  mobile/     Expo (React Native) — beta
packages/
  database/   Prisma + PostgreSQL (multi-tenant schema)
  ui/         Shared component library
```

**Stack:** Next.js 15 · Prisma · PostgreSQL · NextAuth v5 · Inngest · Sentry · jsPDF · XLSX

---

## Kurulum

### Gereksinimler

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
pnpm install

# .env.local dosyasını oluştur
cp apps/web/.env.example apps/web/.env.local

# Prisma generate + migrate
pnpm --filter database db:generate
pnpm --filter database db:push

# Abonelik planlarını yükle (zorunlu)
pnpm --filter database db:seed:plans

# Demo tenant oluştur (opsiyonel)
pnpm --filter database db:seed:demo

# Geliştirme sunucusu
pnpm dev
```

---

## Ortam Değişkenleri

`apps/web/.env.local` örnek:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bstoto"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-in-production"
ADMIN_EMAIL="admin@example.com"

# Demo
DEMO_TENANT_SLUG="demo-oto"
DEMO_EMAIL="demo@bstoto.com"
DEMO_PASSWORD="Demo1234!"

# SMS/WhatsApp/E-posta/Depolama/Ödeme anahtarları için
# apps/web/.env.example dosyasına bakın
```

---

## Geliştirme

```bash
pnpm --filter web exec jest --runInBand    # Testler
pnpm --filter web check-types              # TypeScript
pnpm --filter web lint                     # Lint
pnpm --filter database exec prisma studio  # Veritabanı arayüzü
```

CI: TypeCheck ✅ | 53 test suite ✅ | 443 test ✅ | Lint 654/660 ✅

---

## Demo

Demo tenant (`DEMO_TENANT_SLUG=demo-oto`) her gece 03:00 UTC'de sıfırlanır.

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | demo@bstoto.com | Demo1234! |
| Resepsiyon | resepsiyon.demo-oto@demo.com | Demo1234! |
| Usta | usta.kadir.demo-oto@demo.com | Demo1234! |

---

## Fiyatlandırma

| Paket | Aylık | Yıllık |
|-------|------:|-------:|
| Başlangıç | ₺799 + KDV | ₺7.990 + KDV |
| Profesyonel | ₺1.499 + KDV | ₺14.990 + KDV |
| Kurumsal | ₺2.999 + KDV | ₺29.990 + KDV |

---

## Production Deployment

### Vercel + Supabase / Railway (Önerilen)

```bash
# 1. Veritabanı migrate
DATABASE_URL="postgresql://..." pnpm --filter database db:push

# 2. Abonelik planlarını seed et (ilk kurulumda bir kez)
pnpm --filter database db:seed:plans

# 3. Vercel'e deploy
vercel --prod
```

### Zorunlu Production Env Değişkenleri

```env
DATABASE_URL              # PostgreSQL bağlantı URL
NEXTAUTH_SECRET           # Güçlü rastgele string (openssl rand -base64 32)
NEXTAUTH_URL              # https://yourdomain.com
ADMIN_EMAIL               # Super admin bildirimleri için
SENTRY_DSN                # Hata izleme (opsiyonel ama önerilir)
UPSTASH_REDIS_REST_URL    # OTP ve rate-limit için
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY            # E-posta bildirimleri için
```

### Sağlık Kontrolü

```
GET /api/health  →  { status: "ok", timestamp: "..." }
```

---

## Mimari

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 App Router (apps/web)                       │
│  ├── app/                 Sayfa ve API Route'ları        │
│  ├── lib/actions/         Server Actions (RBAC guard)    │
│  ├── lib/guards.ts        guardTenant / guardTenantRole  │
│  └── lib/inngest/         Arka plan iş yönetimi          │
├─────────────────────────────────────────────────────────┤
│  Expo React Native (apps/mobile)   — Beta               │
│  ├── app/(firma)/         Usta/yönetici portali          │
│  └── app/(musteri)/       Müşteri portali                │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL + Prisma (packages/database)                 │
│  Multi-tenant: her kayıt tenantId ile izole              │
└─────────────────────────────────────────────────────────┘
```

---

## Güvenlik

- **Tenant izolasyonu:** Her Prisma sorgusuna `tenantId` filtresi zorunlu
- **RBAC:** `guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"])` server action'larda
- **Rate limiting:** Upstash Redis tabanlı, IP ve endpoint başına
- **2FA:** TOTP (Google Authenticator uyumlu) yönetici hesapları için
- **KVKK:** Kayıt sırasında IP + user-agent + timestamp konsolide log

---

© 2026 BST Teknoloji — Özel yazılım, tüm hakları saklıdır.
# Oto-Servis
