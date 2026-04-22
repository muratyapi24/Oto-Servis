# BST Otoservis — Döküman Dizini

> Türkiye oto servis sektörüne yönelik çok kiracılı SaaS platformu.

---

## Dökümanlar

| Dosya | İçerik |
|-------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Teknik mimari, stack, auth, DB şeması, API, deploy |
| [SETUP.md](./SETUP.md) | Geliştirici kurulum, seed komutları, sorun giderme |
| [Giris_Bilgileri.md](./Giris_Bilgileri.md) | Test giriş bilgileri, RBAC tablosu, seed verileri |
| [OtoServis_SaaS_Dagitim_Rehberi.md](./OtoServis_SaaS_Dagitim_Rehberi.md) | SaaS iş modeli, fiyatlandırma, GTM stratejisi |

---

## Hızlı Başlangıç

```bash
# 1. Bağımlılıkları yükle
pnpm install

# 2. Veritabanı kur ve seed et
cd packages/database
pnpm db:push && pnpm db:generate
pnpm db:seed
pnpm exec tsx add-superadmin.ts

# 3. Geliştirme sunucusu
cd ../..
pnpm dev
```

## Hızlı Giriş Bilgileri

| Panel | URL | E-posta | Şifre |
|-------|-----|---------|-------|
| Super Admin | `/superadmin-login` | `superadmin@bstservis.com` | `123456` |
| Firma A | `/login` | `admin@bstoto.com` | `123456` |
| Firma B | `/login` | `admin@garajmotors.com` | `123456` |
| Mobil Müşteri | `/m/musteri/login` | Tel + Plaka | OTP |
| Mobil Usta | `/m/firma/login` | `05550001101` | `123456` |

> Detaylar: [Giris_Bilgileri.md](./Giris_Bilgileri.md)
