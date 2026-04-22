# Platform Giriş Bilgileri

Bu doküman, test ve geliştirme süreçlerinde kullanılabilecek, veritabanına varsayılan olarak tanımlanmış (seed işlemiyle eklenen) tüm panel ve platform giriş linkleri ile örnek şifreleri içermektedir.

**⚠️ ÖNEMLİ NOT:** Seed işlemini çalıştırmadan önce aşağıdaki komutları sırasıyla çalıştırın:

```bash
# 1. Ana seed işlemini çalıştır (paket dizininde)
cd packages/database
pnpm db:seed

# 2. Süper admin kullanıcısını ekle (aynı dizinde)
pnpm exec tsx add-superadmin.ts
```

Bu komutlar veritabanını sıfırlar ve süper admin dahil tüm test verilerini oluşturur.

---

## 📋 İÇİNDEKİLER

1. [Süper Admin Paneli](#süper-admin-paneli)
2. [Firma Panelleri](#firma-panelleri)
3. [Mobil Uygulamalar](#mobil-uygulamalar)
4. [Test Müşteri ve Araç Bilgileri](#test-müşteri-ve-araç-bilgileri)
5. [Test Personel Bilgileri](#test-personel-bilgileri)
6. [Login Credentials - İngilizce](#login-credentials---english-summary)

---

## 📱 MOBİL UYGULAMALAR (Hızlı Erişim)

## 🛡️ Sayfa Erişim Yetkileri (RBAC)

Sistemde rollere göre sayfa erişimleri sınırlandırılmıştır. Aşağıdaki tablo hangi rolün hangi sayfalara erişebileceğini göstermektedir.

| Sayfa / Modül | Admin | Usta | Resepsiyon | Muhasebe |
| :--- | :---: | :---: | :---: | :---: |
| **Panel / Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Servis Emirleri (Kuyruk)** | ✅ | ✅ | ✅ | ❌ |
| **Teklifler / Randevular** | ✅ | ❌ | ✅ | ❌ |
| **Müşteriler / Araçlar** | ✅ | ✅ | ✅ | ❌ |
| **Personel Yönetimi** | ✅ | ❌ | ❌ | ❌ |
| **Stok & Envanter** | ✅ | ✅ | ❌ | ✅ |
| **Finans & Ödemeler** | ✅ | ❌ | ❌ | ✅ |
| **Ayarlar & Analitik** | ✅ | ❌ | ❌ | ❌ |

> [!NOTE]
> **Super Admin:** Tüm sistem genelinde (tüm firmalar, loglar ve sistem sağlığı) tam yetkiye sahiptir.
> **Müşteri:** Sadece `/m/musteri/*` altındaki kendi araçlarını ve randevularını görebilir.

---


### Müşteri Mobil Girişi
| Özellik | Değer |
|---------|-------|
| **Link** | `/m/musteri/login` |
| **Giriş Tipi** | Telefon + Plaka |
| **Şifre** | Yok (OTP ile) |
| **Örnek** | Tel: `05009998871` + Plaka: `34 A 10` |

### Usta/Personel Mobil Girişi
| Özellik | Değer |
|---------|-------|
| **Link** | `/m/firma/login` |
| **Giriş Tipi** | Telefon / Sicil No |
| **Şifre** | `123456` |
| **Örnek** | Tel: `05550001101` + Şifre: `123456` |

---

## 🔐 Süper Admin Paneli

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/superadmin-login` |
| **E-Posta** | `superadmin@bstservis.com` |
| **Şifre** | `123456` |
| **Açıklama** | Tüm sistemi yöneten kurucu hesabı. Analitik, firma onay süreçleri, sistem ayarları vb. modülleri görür. |

### Süper Admin Özellikleri:
- ✅ Tenant (Firma) yönetimi
- ✅ Abonelik ve ödeme takibi
- ✅ Sistem geneli analitikler
- ✅ Audit log görüntüleme
- ✅ Güvenlik ayarları
- ✅ Platform geneli raporlar

---

## 🏢 Firma Panelleri

### 1. MS Oto Servis A.Ş. (Firma A)

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/login` |
| **Admin E-Posta** | `admin@bstoto.com` |
| **Şifre** | `123456` |
| **Yetki** | TENANT_ADMIN (Tam yetkili) |

#### Ek Kullanıcılar - MS Oto:
| İsim | E-Posta | Şifre | Yetki |
|------|---------|-------|-------|
| Ayşe Yılmaz | `ayse@bstoto.com` | `123456` | STAFF (Servis Danışmanı) |
| Mehmet Demir | `mehmet@bstoto.com` | `123456` | STAFF (Muhasebe) |

**Firma Özellikleri:**
- 📊 3 Tedarikçi
- 📦 3 Kategori, 3 Parça
- 🔧 3 Usta
- 👥 3 Müşteri
- 🚗 3 Araç
- 📝 3 İş Emri (farklı durumlarda)
- 💰 1 Fatura (COMPLETED iş emri için)
- 📅 3 Randevu
- 📊 3 Stok Hareketi

---

### 2. Garaj Motors (Firma B)

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/login` |
| **Admin E-Posta** | `admin@garajmotors.com` |
| **Şifre** | `123456` |
| **Yetki** | TENANT_ADMIN (Tam yetkili) |

#### Ek Kullanıcılar - Garaj Motors:
| İsim | E-Posta | Şifre | Yetki |
|------|---------|-------|-------|
| Fatma Şahin | `fatma@garajmotors.com` | `123456` | STAFF |
| Ali Veli | `ali@garajmotors.com` | `123456` | STAFF |

**Firma Özellikleri:**
- 📊 3 Tedarikçi
- 📦 3 Kategori, 3 Parça
- 🔧 3 Usta
- 👥 3 Müşteri
- 🚗 3 Araç
- 📝 3 İş Emri (farklı durumlarda)
- 💰 1 Fatura (COMPLETED iş emri için)
- 📅 3 Randevu
- 📊 3 Stok Hareketi

---

## 📱 Mobil Uygulamalar

### Müşteri Mobil Portalı

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/m/musteri/login` |
| **Giriş Yöntemi** | Telefon + Plaka |
| **Şifre** | Yok (SMS/OTP ile giriş) |

#### Örnek Müşteri Girişleri - MS Oto:

| Müşteri | Telefon | Plaka | Araç Bilgisi |
|---------|---------|-------|-------------|
| Ahmet Yılmaz | `05009998871` | `34 A 10` | VW Golf 2019 |
| ABC Lojistik A.Ş. | `05009998872` | `34 A 20` | Ford Focus 2020 |
| Ayşe Kara | `05009998873` | `34 A 30` | Renault Clio 2021 |

#### Örnek Müşteri Girişleri - Garaj Motors:

| Müşteri | Telefon | Plaka | Araç Bilgisi |
|---------|---------|-------|-------------|
| Ankara Nakliyat A.Ş. | `05001112231` | `34 B 10` | Mercedes C180 2021 |
| Veli Boz | `05001112232` | `34 B 20` | BMW 320i 2022 |
| Hızlı Kargo Ltd. | `05001112233` | `34 B 30` | Audi A4 2023 |

---

### Firma Mobil Portalı

| Alan | Değer |
|------|-------|
| **Giriş Linki** | `/m/firma/login` |
| **Giriş Yöntemi** | Telefon veya Sicil No |
| **Şifre** | Atanan Personele Göre (Varsayılan: `123456`) |

#### Örnek Usta Girişleri - MS Oto:

| Usta | Telefon | E-Posta | Uzmanlık Alanları |
|------|---------|---------|-------------------|
| Usta A-1 Soyad | `05550001101` | `usta1@firmaa.com` | Motor, Mekanik |
| Usta A-2 Soyad | `05550001102` | `usta2@firmaa.com` | Elektrik, Elektronik |
| Usta A-3 Soyad | `05550001103` | `usta3@firmaa.com` | Kaporta, Boya |

#### Örnek Usta Girişleri - Garaj Motors:

| Usta | Telefon | E-Posta | Uzmanlık Alanları |
|------|---------|---------|-------------------|
| Usta B-1 Demir | `05550002201` | `usta1@firmab.com` | Motor, Revizyon |
| Usta B-2 Demir | `05550002202` | `usta2@firmab.com` | Elektrik, Sensör |
| Usta B-3 Demir | `05550002203` | `usta3@firmab.com` | Kaporta, Boya |

---

## 🧪 Test Müşteri ve Araç Bilgileri (Detaylı)

### MS Oto Servis - Müşteri Detayları

#### 1. Ahmet Yılmaz (Bireysel)
- **Telefon:** 05009998871
- **E-Posta:** musteri1@firmaa.com
- **Puan:** 1000 Reward Point
- **Araç:** 34 A 10 - VW Golf 2019 (Dizel, Otomatik) - 60.000 km

#### 2. ABC Lojistik A.Ş. (Kurumsal)
- **Telefon:** 05009998872
- **E-Posta:** musteri2@firmaa.com
- **Vergi No:** VN200002
- **Puan:** 2000 Reward Points
- **Araç:** 34 A 20 - Ford Focus 2020 (Benzin, Manuel) - 70.000 km

#### 3. Ayşe Kara (Bireysel)
- **Telefon:** 05009998873
- **E-Posta:** musteri3@firmaa.com
- **Puan:** 3000 Reward Points
- **Araç:** 34 A 30 - Renault Clio 2021 (Hibrit, Otomatik) - 80.000 km

---

### Garaj Motors - Müşteri Detayları

#### 1. Ankara Nakliyat A.Ş. (Kurumsal)
- **Telefon:** 05001112231
- **E-Posta:** musteri1@firmab.com
- **Vergi No:** VN300001
- **Puan:** 1500 Reward Points
- **Araç:** 34 B 10 - Mercedes C180 2021 (Dizel, Otomatik) - 35.000 km

#### 2. Veli Boz (Bireysel)
- **Telefon:** 05001112232
- **E-Posta:** musteri2@firmab.com
- **Puan:** 3000 Reward Points
- **Araç:** 34 B 20 - BMW 320i 2022 (Benzin, Manuel) - 40.000 km

#### 3. Hızlı Kargo Ltd. (Kurumsal)
- **Telefon:** 05001112233
- **E-Posta:** musteri3@firmab.com
- **Vergi No:** VN300003
- **Puan:** 4500 Reward Points
- **Araç:** 34 B 30 - Audi A4 2023 (Hibrit, Otomatik) - 45.000 km

---

## 🔧 Test Personel Bilgileri (Detaylı)

### MS Oto Servis - Personel

| # | İsim | E-Posta | Telefon | Saatlik Ücret | Uzmanlık |
|---|------|---------|---------|---------------|----------|
| 1 | Usta A-1 Soyad | usta1@firmaa.com | 05550001101 | ₺170 | Motor, Mekanik |
| 2 | Usta A-2 Soyad | usta2@firmaa.com | 05550001102 | ₺190 | Elektrik, Elektronik |
| 3 | Usta A-3 Soyad | usta3@firmaa.com | 05550001103 | ₺210 | Kaporta, Boya |

### Garaj Motors - Personel

| # | İsim | E-Posta | Telefon | Saatlik Ücret | Uzmanlık |
|---|------|---------|---------|---------------|----------|
| 1 | Usta B-1 Demir | usta1@firmab.com | 05550002201 | ₺205 | Motor, Revizyon |
| 2 | Usta B-2 Demir | usta2@firmab.com | 05550002202 | ₺230 | Elektrik, Sensör |
| 3 | Usta B-3 Demir | usta3@firmab.com | 05550002203 | ₺255 | Kaporta, Boya |

---

## 💳 Abonelik Paketleri

Sistemde 3 farklı abonelik paketi bulunmaktadır:

### 1. Standart Plan
- **Fiyat:** ₺2.500/ay veya ₺25.000/yıl
- **Deneme Süresi:** 14 gün
- **Kullanıcı Limiti:** 3 kullanıcı
- **Araç Limiti:** 500 araç
- **Özellikler:** Temel modüller

### 2. Profesyonel (PRO) Plan
- **Fiyat:** ₺8.200/ay veya ₺82.000/yıl
- **Deneme Süresi:** 14 gün
- **Kullanıcı Limiti:** 15 kullanıcı
- **Araç Limiti:** 5.000 araç
- **Özellikler:** Temel + Mobil uygulama + Gelişmiş analitikler

### 3. Kurumsal (ENT) Plan
- **Fiyat:** ₺20.000/ay veya ₺200.000/yıl
- **Deneme Süresi:** 30 gün
- **Kullanıcı Limiti:** Sınırsız
- **Araç Limiti:** Sınırsız
- **Özellikler:** Tüm özellikler + White label çözümler

---

## 🔐 Güvenlik Notları

> **ÖNEMLİ:** 
> - Sistemdeki tüm şifreler bcrypt ile şifrelenerek veritabanında saklanmaktadır.
> - Varsayılan şifre: `123456` (tüm kullanıcılar için)
> - Gerçek üretim ortamında güçlü şifre politikası uygulanmalıdır.
> - Two-factor authentication (2FA) süper admin için zorunludur.
>
> **Seed Komutları:**
> ```bash
> npx tsx packages/database/prisma/seed.ts
> npx tsx packages/database/add-superadmin.ts
> ```

---

## 📊 Veri Özeti

Toplamda seed işlemi ile oluşturulan veriler:

| Veri Tipi | MS Oto | Garaj Motors | Toplam |
|-----------|---------|--------------|--------|
| **Kullanıcı** | 3 | 3 | 6 |
| **Tedarikçi** | 3 | 3 | 6 |
| **Parça Kategorisi** | 3 | 3 | 6 |
| **Parça** | 3 | 3 | 6 |
| **Usta** | 3 | 3 | 6 |
| **Müşteri** | 3 | 3 | 6 |
| **Araç** | 3 | 3 | 6 |
| **İş Emri** | 3 | 3 | 6 |
| **Servis Kalemi** | 3 | 3 | 6 |
| **Fatura** | 1 | 1 | 2 |
| **Ödeme** | 1 | 1 | 2 |
| **Randevu** | 3 | 3 | 6 |
| **Stok Hareketi** | 3 | 3 | 6 |

**TOPLAM KAYIT:** ~70 kayıt

---

**Son Güncelleme:** Nisan 2026 | **Versiyon:** 3.2
