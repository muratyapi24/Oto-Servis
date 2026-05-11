# BST Otoservis — Geliştirici Kurulum Rehberi

> Son Güncelleme: Mayıs 2026

---

## Gereksinimler

- Node.js 18+
- pnpm 9+
- PostgreSQL 16+

---

## 1. İlk Kurulum

```bash
pnpm install

# .env dosyasını oluştur
cp apps/web/.env.example apps/web/.env.local
# DATABASE_URL ve diğer zorunlu değişkenleri doldur
```

---

## 2. Veritabanı Kurulumu ve Seed

```bash
cd packages/database

# Şemayı veritabanına uygula
pnpm db:push

# Prisma client oluştur
pnpm db:generate

# Seed verilerini yükle (tüm test verileri + super admin dahil)
pnpm db:seed
```

> **Not:** Seed betiği super admin dahil tüm verileri tek seferde oluşturur. Ayrıca `add-superadmin.ts` çalıştırmaya gerek yoktur.

---

## 3. Geliştirme Sunucusu

```bash
# Proje kökünde
pnpm dev
```

Uygulama: `http://localhost:3000`

> Tüm giriş bilgileri için: [Docs/seed_data_design.md](./seed_data_design.md)

---

## 4. Sık Kullanılan Komutlar

```bash
cd packages/database

# Prisma Studio (görsel DB editörü)
pnpm exec prisma studio

# Şema değişikliği sonrası client yenile
pnpm db:generate

# Veritabanını sıfırla ve yeniden seed et
pnpm exec prisma db push --force-reset && pnpm db:generate && pnpm db:seed
```

---

## 5. Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Giriş yapılamıyor | `cd packages/database && pnpm db:seed` |
| "Database does not exist" | `pnpm db:push && pnpm db:generate && pnpm db:seed` |
| Migration hatası | `pnpm exec prisma db push --force-reset && pnpm db:generate && pnpm db:seed` |
| Bağlantı hatası | `.env.local` → `DATABASE_URL` kontrol et |
| Cache sorunu | `rm -rf .turbo node_modules && pnpm install` |
