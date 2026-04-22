# BST Otoservis — Geliştirici Kurulum Rehberi

> Son Güncelleme: Nisan 2026

---

## Gereksinimler

- Node.js 18+
- pnpm 9+
- PostgreSQL 16+
- (Opsiyonel) Docker

---

## 1. İlk Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# .env dosyasını oluştur
cp apps/web/.env.example apps/web/.env.local
# DATABASE_URL ve diğer zorunlu değişkenleri doldur
```

---

## 2. Veritabanı Kurulumu

```bash
cd packages/database

# Migration uygula
pnpm db:push         # Hızlı (dev) — migration geçmişi olmadan
# veya
pnpm db:migrate      # Migration geçmişi ile (production benzeri)

# Prisma client oluştur
pnpm db:generate
```

---

## 3. Seed Verilerini Yükle

**SIRALAMA ÖNEMLİ — aşağıdaki sırayı takip edin:**

```bash
# packages/database dizinindeyken:

# Adım 1: Ana seed (2 firma + tüm test verileri, ~154 kayıt)
pnpm db:seed

# Adım 2: Super admin kullanıcısı (ayrıca çalıştırılmalı)
pnpm exec tsx add-superadmin.ts
```

**Seed Sonrası Beklenen Kayıt Sayıları:**

| Tablo | Sayı |
|-------|------|
| SubscriptionPlan | 3 |
| Tenant | 2 |
| User | 7 (1 superadmin + 6 tenant) |
| Customer | 10 |
| Vehicle | 20 |
| Part | 50 |
| ServiceOrder | 10 |
| Appointment | 10 |
| Invoice | 2 |
| **Toplam** | **~154** |

---

## 4. Geliştirme Sunucusunu Başlat

```bash
# Proje kökünde
pnpm dev
```

Uygulama: `http://localhost:3000`

---

## 5. Diğer Seed Scriptleri (Opsiyonel)

```bash
# Sadece abonelik paketlerini güncelle/oluştur (idempotent)
pnpm exec tsx prisma/seed-plans.ts

# Mobil test verileri
pnpm exec tsx prisma/seed-mobile.ts
```

---

## 6. Sık Kullanılan Database Komutları

```bash
# Prisma Studio (görsel DB editörü)
pnpm exec prisma studio

# Şema değişikliği sonrası client yenile
pnpm db:generate

# Yeni migration oluştur
pnpm exec prisma migrate dev --name "migration_adi"

# Veritabanını sıfırla ve yeniden seed et
pnpm db:push --force-reset && pnpm db:seed && pnpm exec tsx add-superadmin.ts
```

---

## 7. Sorun Giderme

### Giriş yapılamıyor

```bash
# Seed'i yeniden çalıştır
cd packages/database
pnpm db:seed
pnpm exec tsx add-superadmin.ts
```

### "Database does not exist" hatası

```bash
cd packages/database
pnpm db:push
pnpm db:generate
pnpm db:seed
pnpm exec tsx add-superadmin.ts
```

### Migration hatası

```bash
# Geliştirme ortamında tam sıfırlama
cd packages/database
pnpm exec prisma db push --force-reset
pnpm db:generate
pnpm db:seed
pnpm exec tsx add-superadmin.ts
```

### Bağlantı hatası

`.env.local` dosyasında `DATABASE_URL` değerini kontrol et:
```
DATABASE_URL="postgresql://user:password@localhost:5432/bstotoservis"
```

### Node.js tip hatası

```bash
npm install --save-dev @types/node
```

### Cache / bağımlılık sorunu

```bash
rm -rf .turbo node_modules
pnpm install
```

---

## 8. Seed Idempotency

| Script | Davranış |
|--------|---------|
| `seed.ts` | Tenant verilerini **siler ve yeniden oluşturur** (idempotent değil) |
| `add-superadmin.ts` | Varsa atlar, yoksa oluşturur (idempotent) |
| `seed-plans.ts` | Upsert kullanır (idempotent) |
| `seed-mobile.ts` | Yeni veri ekler (çakışma olabilir) |
