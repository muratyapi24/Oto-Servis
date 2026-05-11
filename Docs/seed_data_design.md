# BST Otoservis — Seed Data & Giriş Bilgileri

> Son Güncelleme: Mayıs 2026 | Versiyon: 4.0

Bu doküman `packages/database/prisma/seed.ts` dosyasının **tek kaynak belgesidir (single source of truth)**. Tüm giriş bilgileri, test verileri ve DB ilişkileri burada tanımlanmıştır.

---

## 🔐 Giriş Bilgileri (Tüm Paneller)

### Süper Admin

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/superadmin-login` |
| **E-Posta** | `superadmin@msotoservis.com` |
| **Şifre** | `SuperAdmin123!` |
| **Rol** | `SUPER_ADMIN` |
| **2FA** | Aktif |
| **tenantId** | `null` (platform geneli) |

> Super Admin tenant'a bağlı değildir. Tüm firmaları, abonelikleri, audit loglarını ve sistem sağlığını yönetir.

---

### Firma Web Paneli (Dashboard)

Giriş linki: `/login`

#### Tenant A — MS Oto Servis A.Ş.

| İsim | E-Posta | Şifre | Rol | Erişim |
|------|---------|-------|-----|--------|
| MS Admin | `admin@msotoservis.com` | `Admin123!` | `TENANT_ADMIN` | Tüm modüller |
| Resepsiyon MS | `resepsiyon@msotoservis.com` | `Resepsiyon123!` | `RECEPTIONIST` | Servis, müşteri, randevu |
| Muhasebe MS | `muhasebe@msotoservis.com` | `Muhasebe123!` | `ACCOUNTANT` | Stok, finans, fatura |
| Ahmet Yılmaz | `usta1@msotoservis.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |
| Mehmet Kaya | `usta2@msotoservis.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |
| Hüseyin Demir | `usta3@msotoservis.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |

#### Tenant B — Yıldız Garaj ve Oto Bakım Ltd. Şti.

| İsim | E-Posta | Şifre | Rol | Erişim |
|------|---------|-------|-----|--------|
| Yıldız Admin | `admin@yildizgaraj.com` | `Admin123!` | `TENANT_ADMIN` | Tüm modüller |
| Resepsiyon Yıldız | `resepsiyon@yildizgaraj.com` | `Resepsiyon123!` | `RECEPTIONIST` | Servis, müşteri, randevu |
| Muhasebe Yıldız | `muhasebe@yildizgaraj.com` | `Muhasebe123!` | `ACCOUNTANT` | Stok, finans, fatura |
| Kadir Şahin | `usta1@yildizgaraj.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |
| Emre Yıldız | `usta2@yildizgaraj.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |
| Burak Arslan | `usta3@yildizgaraj.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |
| Serhat Koç | `usta4@yildizgaraj.com` | `Usta123!` | `MECHANIC` | Kendi iş emirleri |

---

### Usta / Personel Mobil Paneli

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/m/firma/login` |
| **Giriş Yöntemi** | Telefon / E-posta + Şifre |

#### MS Oto — Usta Mobil Girişleri

| Usta | Telefon | E-Posta | Şifre | Uzmanlık |
|------|---------|---------|-------|----------|
| Ahmet Yılmaz | `05321112233` | `usta1@msotoservis.com` | `Usta123!` | Motor, Mekanik |
| Mehmet Kaya | `05332223344` | `usta2@msotoservis.com` | `Usta123!` | Elektrik, Elektronik |
| Hüseyin Demir | `05343334455` | `usta3@msotoservis.com` | `Usta123!` | Kaporta, Boya |

#### Yıldız Garaj — Usta Mobil Girişleri

| Usta | Telefon | E-Posta | Şifre | Uzmanlık |
|------|---------|---------|-------|----------|
| Kadir Şahin | `05321112244` | `usta1@yildizgaraj.com` | `Usta123!` | Motor, Şanzıman |
| Emre Yıldız | `05332223355` | `usta2@yildizgaraj.com` | `Usta123!` | Elektrik, Elektronik, Diagnostik |
| Burak Arslan | `05343334466` | `usta3@yildizgaraj.com` | `Usta123!` | Kaporta, Boya, Detaylı Temizlik |
| Serhat Koç | `05354445577` | `usta4@yildizgaraj.com` | `Usta123!` | Fren, Süspansiyon, Lastik |

---

### Müşteri Mobil Portalı

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/m/musteri/login` |
| **Giriş Yöntemi** | Telefon + Plaka (OTP/şifresiz) |

#### MS Oto — Müşteri Girişleri

| Müşteri | Tip | Telefon | Plaka | Araç |
|---------|-----|---------|-------|------|
| Fatma Şahin | Bireysel | `05321234567` | `34 FŞ 4521` | VW Golf 2019 |
| Ali Çelik | Bireysel | `05339876543` | `34 AÇ 7823` | Ford Focus 2020 |
| Zeynep Arslan | Bireysel | `05412223344` | `34 ZA 1190` | Renault Clio 2018 |
| Mustafa Öztürk | Bireysel | `05554445566` | `34 MÖ 3344` | Toyota Corolla 2021 |
| Kartal Lojistik A.Ş. | Kurumsal | `02163334455` | `34 KL 9900` | Fiat Egea 2022 |

#### Yıldız Garaj — Müşteri Girişleri

| Müşteri | Tip | Telefon | Plaka | Araç |
|---------|-----|---------|-------|------|
| Ahmet Kılıç | Bireysel | `05321234568` | `06 AK 7821` | Mercedes C 200 2021 |
| Selin Yıldırım | Bireysel | `05339876544` | `06 SY 3344` | BMW 320i 2020 |
| Ankara Holding A.Ş. | Kurumsal | `03121234567` | `06 AH 9900` | Audi A6 2022 |
| Başkent Lojistik Ltd. | Kurumsal | `03122345678` | `06 BL 1122` | Volvo XC60 2023 |
| Tolga Aydın | Bireysel | `05554445577` | `06 TA 5566` | Porsche Cayenne 2019 |

---

## 🛡️ RBAC — Sayfa Erişim Matrisi

| Modül | TENANT_ADMIN | MECHANIC | RECEPTIONIST | ACCOUNTANT |
|-------|:------------:|:--------:|:------------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Servis Emirleri | ✅ | ✅ | ✅ | ❌ |
| Teklifler / Randevular | ✅ | ❌ | ✅ | ❌ |
| Müşteriler / Araçlar | ✅ | ✅ | ✅ | ❌ |
| Personel Yönetimi | ✅ | ❌ | ❌ | ❌ |
| Stok & Envanter | ✅ | ✅ | ❌ | ✅ |
| Finans & Ödemeler | ✅ | ❌ | ❌ | ✅ |
| Ayarlar & Analitik | ✅ | ❌ | ❌ | ❌ |

> **SUPER_ADMIN**: Platform geneli tam yetki (tüm tenantlar, loglar, sistem sağlığı)
> **Müşteri**: Sadece `/m/musteri/*` altında kendi araçları ve randevuları

---

## 📊 Seed Betik Yapısı

```
main()
  ├── 0. Temizlik (deleteMany — ters bağımlılık sırası)
  ├── 1. SUPER_ADMIN upsert
  ├── 2. SubscriptionPlan (3 plan: starter, professional, enterprise)
  ├── 3. Tenant A — MS Oto Servis A.Ş.
  │   ├── Tenant + Subscription (Professional plan)
  │   ├── Lokasyonlar (Maslak, Levent)
  │   ├── Kullanıcılar (TENANT_ADMIN, RECEPTIONIST, ACCOUNTANT, 3× MECHANIC)
  │   ├── Mechanic profilleri + CommissionRule
  │   ├── Tedarikçiler (3) + PartCategory (5) + Part (10)
  │   ├── Müşteriler (5) + Vehicle (5) + NotificationPreference + LoyaltyTransaction
  │   ├── MaintenancePlan (5)
  │   ├── Quote (3: DRAFT, SENT, ACCEPTED) + QuoteItem
  │   ├── Appointment (4: PENDING, CONFIRMED, COMPLETED, CANCELLED)
  │   ├── ServiceOrder (5 durum) + ServiceItem + InspectionForm + WorkLog + Document
  │   ├── ServiceRating (COMPLETED için)
  │   ├── Invoice (PAID + DRAFT) + InvoiceItem + Payment
  │   ├── PurchaseOrder + StockCount + StockTransfer
  │   ├── NotificationTemplate (4 tip × 2 kanal) + Notification (5)
  │   └── AuditLog (3) + SystemNotification (2)
  └── 4. Tenant B — Yıldız Garaj (aynı yapı, farklı veriler, 4 usta)
  └── 5. Platform modelleri (Coupon, Addon, APIKey, KMSKey, BackupRecord, vb.)
```

---

## 💳 Abonelik Planları

| Alan | Başlangıç | Profesyonel | Kurumsal |
|------|-----------|-------------|----------|
| **slug** | `starter` | `professional` | `enterprise` |
| **Aylık** | ₺799 | ₺1.499 | ₺2.999 |
| **Yıllık** | ₺7.990 | ₺14.990 | ₺29.990 |
| **Deneme** | 14 gün | 14 gün | 30 gün |
| **Kullanıcı** | 1 | 5 | 15 |
| **Araç** | 50 | Sınırsız | Sınırsız |
| **Stok** | ❌ | ✅ | ✅ |
| **Müşteri Portalı** | ❌ | ✅ | ✅ |
| **API** | ❌ | ❌ | ✅ |
| **Çoklu Şube** | ❌ | ❌ | ✅ |

- Tenant A → Professional plan (ACTIVE)
- Tenant B → Enterprise plan (ACTIVE)

---

## 🏢 Tenant Detayları

### Tenant A — MS Oto Servis A.Ş.

| Alan | Değer |
|------|-------|
| Slug | `ms-oto-servis` |
| Vergi No | `1234567890` |
| Vergi Dairesi | Maslak Vergi Dairesi |
| Şehir | İstanbul |
| Lokasyonlar | Maslak Şubesi (default), Levent Şubesi |
| Abonelik | Professional (ACTIVE) |

### Tenant B — Yıldız Garaj ve Oto Bakım Ltd. Şti.

| Alan | Değer |
|------|-------|
| Slug | `yildiz-garaj` |
| Vergi No | `9876543210` |
| Vergi Dairesi | Çankaya Vergi Dairesi |
| Şehir | Ankara |
| Lokasyonlar | Ostim (default), Bağlıca, Sincan |
| Abonelik | Enterprise (ACTIVE) |

---

## 🔧 Servis Emirleri (Her Tenant İçin 5 Durum)

| # | Durum | Açıklama |
|---|-------|----------|
| 1 | `COMPLETED` | Tamamlandı, fatura kesildi, ödeme alındı |
| 2 | `IN_PROGRESS` | Devam ediyor, taslak fatura mevcut |
| 3 | `WAITING_APPROVAL` | Müşteri onayı bekleniyor |
| 4 | `PENDING` | Araç teslim alındı, işlem başlamadı |
| 5 | `CANCELLED` | Müşteri iptal etti |

Her servis emrinde: ServiceItem (PART + LABOR), InspectionForm, WorkLog, Document bulunur.

### Matematiksel Tutarlılık

```
ServiceItem:
  subTotal   = quantity × unitPrice - discount
  taxAmount  = subTotal × taxRate / 100
  totalPrice = subTotal + taxAmount

ServiceOrder:
  subTotal    = Σ serviceItem.subTotal
  taxAmount   = Σ serviceItem.taxAmount
  totalAmount = subTotal + taxAmount

Invoice:
  totalAmount = subTotal - discountAmount + taxAmount
  paidAmount  = totalAmount (PAID faturalar için)
```

---

## 📊 Toplam Kayıt Sayıları

| Tablo | MS Oto | Yıldız Garaj | Platform | Toplam |
|-------|--------|--------------|----------|--------|
| SubscriptionPlan | — | — | 3 | 3 |
| Tenant | 1 | 1 | — | 2 |
| User | 6 | 7 | 1 (SA) | 14 |
| Location | 2 | 3 | — | 5 |
| Mechanic | 3 | 4 | — | 7 |
| CommissionRule | 3 | 4 | — | 7 |
| Supplier | 3 | 3 | — | 6 |
| PartCategory | 5 | 5 | — | 10 |
| Part | 10 | 10 | — | 20 |
| Customer | 5 | 5 | — | 10 |
| Vehicle | 5 | 5 | — | 10 |
| CustomerNotifPref | 5 | 5 | — | 10 |
| LoyaltyTransaction | 5 | 5 | — | 10 |
| MaintenancePlan | 5 | 5 | — | 10 |
| Quote + QuoteItem | 3+6 | 3+6 | — | 18 |
| Appointment | 4 | 4 | — | 8 |
| ServiceOrder | 5 | 5 | — | 10 |
| ServiceItem | ~13 | ~10 | — | ~23 |
| InspectionForm | 5 | 5 | — | 10 |
| WorkLog | 5 | 5 | — | 10 |
| Document | 5 | 5 | — | 10 |
| ServiceRating | 1 | 1 | — | 2 |
| Invoice + InvoiceItem | 2+3 | 2+3 | — | 10 |
| Payment | 1 | 1 | — | 2 |
| PurchaseOrder | 1 | 1 | — | 2 |
| StockCount | 1 | 1 | — | 2 |
| StockTransfer | 1 | 1 | — | 2 |
| NotificationTemplate | 8 | 8 | — | 16 |
| Notification | 5 | 5 | — | 10 |
| AuditLog | 3 | 3 | — | 6 |
| SystemNotification | 2 | 2 | — | 4 |
| SupportTicket | 3 | 2 | — | 5 |
| NPSResponse | 5 | 5 | — | 10 |
| AutomationWorkflow | 3 | 2 | — | 5 |
| Coupon | — | — | 3 | 3 |
| Addon | — | — | 4 | 4 |
| APIKey | — | — | 3 | 3 |
| KMSKey | — | — | 4 | 4 |
| BackupRecord | — | — | 7 | 7 |
| CloudCostRecord | — | — | 6 | 6 |
| CapacitySnapshot | — | — | 7 | 7 |
| InfraNode | — | — | 7 | 7 |
| Deployment | — | — | 5 | 5 |
| ReportTemplate | — | — | 4 | 4 |
| **TOPLAM** | | | | **~340** |

---

## ⚙️ Seed Komutları

```bash
cd packages/database

# Tam sıfırlama ve seed (Geliştirme ortamı)
pnpm exec prisma db push --force-reset && pnpm db:generate && pnpm db:seed

# Sadece seed (şema değişikliği yoksa)
pnpm db:seed

# Abonelik planlarını güncelle (idempotent)
pnpm db:seed:plans
```

### Seed Idempotency

| Script | Davranış |
|--------|----------|
| `seed.ts` | Tüm verileri siler ve yeniden oluşturur. SUPER_ADMIN upsert ile korunur. |
| `seed-plans.ts` | Upsert kullanır (idempotent) |

---

## 🔒 Güvenlik Notları

- Tüm şifreler `bcryptjs` ile hash'lenir (salt rounds: 10)
- RBAC kontrolleri her server action'da JWT claim'den doğrulanır
- Tenant izolasyonu `tenantId` filtresi ile sağlanır
- **Üretim ortamında bu şifreleri kesinlikle kullanmayın!**
