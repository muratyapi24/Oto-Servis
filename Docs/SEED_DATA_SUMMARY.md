# Seed Veri Referansı

> Son Güncelleme: Nisan 2026 | Versiyon: 3.0
>
> Seed komutları için: [../../Docs/SETUP.md](../SETUP.md)
> Giriş bilgileri için: [../../Docs/Giris_Bilgileri.md](../Giris_Bilgileri.md)

---

## Oluşturulan Veriler

### Abonelik Paketleri (3 adet)

| Plan | Aylık | Yıllık | Deneme |
|------|-------|--------|--------|
| Standart | ₺2.500 | ₺25.000 | 14 gün |
| Profesyonel | ₺8.200 | ₺82.000 | 14 gün |
| Kurumsal | ₺20.000 | ₺200.000 | 30 gün |

---

### Firmalar (2 Tenant)

| Alan | Firma A — MS Oto Servis A.Ş. | Firma B — Garaj Motors |
|------|------------------------------|------------------------|
| Slug | `bst-oto` | `garaj-motors` |
| Admin e-posta | `admin@bstoto.com` | `admin@garajmotors.com` |
| Şehir | İstanbul (Maslak) | İstanbul (Bostancı) |
| Durum | ACTIVE | ACTIVE |

Her firma için oluşturulan veri kategorileri (en az 3'er kayıt):

| Kategori | Detay |
|----------|-------|
| Kullanıcı | 1 TENANT_ADMIN + 1 RECEPTIONIST + 1 ACCOUNTANT |
| Şube (Location) | 3 adet — parça/stok/servisle ilişkili |
| Tedarikçi | 3 adet |
| Parça Kategorisi + Parça | 3 kategori, 3 parça |
| Usta (Mechanic) | 3 adet + `CommissionRule` bağlı |
| Müşteri | 3 adet (bireysel & kurumsal) + `CustomerNotificationPreference` + `LoyaltyTransaction` |
| Araç | 3 adet + `MaintenancePlan` bağlı |
| İş Emri | 3 adet (PENDING / IN_PROGRESS / COMPLETED) |
| Teklif (Quote) | 3 adet (DRAFT & SENT) |
| Satın Alma Siparişi | 3 adet (DRAFT & SENT) — tedarikçi ilişkili |
| Fatura + Ödeme | 1 fatura + 1 ödeme (COMPLETED iş emri için) |
| Stok Sayımı (StockCount) | 3 adet (DRAFT & COMPLETED) |
| Stok Transferi | 3 adet (şubeler arası) |
| Stok Hareketi | 3 adet |
| Doküman | 3 adet — iş emrine bağlı |
| Muayene Formu (InspectionForm) | 3 adet — JSON formatlı ekspertiz (fren, motor, vb.) |
| İş Günlüğü (WorkLog) | 3 adet — süre bazlı, komisyon hesaplı |
| Mesaj | 3 adet — Usta ↔ Müşteri iletişimi |
| Bildirim Şablonu | 3 adet (SMS & WhatsApp) |
| Bildirim Kaydı | 3 adet |
| Servis Değerlendirmesi | 3 adet (1–5 yıldız) |

**Toplam:** ~125+ kayıt (2 firma × ~62 kayıt + 3 plan + 1 superadmin)

---

### Süper Admin

| Alan | Değer |
|------|-------|
| E-posta | `superadmin@bstservis.com` |
| Şifre | `123456` |
| 2FA | Aktif |
| Koruması | `seed.ts` çalışınca SUPER_ADMIN rolü **silinmez** |

---

## Test Senaryoları

Seed verisi bu akışları uçtan uca test etmeye hazır:

**1. Stok Yönetimi Döngüsü**
```
Stok Sayımı → Eksik Tespit → Şubeler Arası Transfer → Tedarikçiden PO
```

**2. CRM & Bildirim Döngüsü**
```
Bildirim Şablonu → Müşteri Mesajı → SMS/WhatsApp Gönderimi → Sadakat Puanı
```

**3. Servis Akışı (tam döngü)**
```
Randevu → Teklif (Quote) → İş Emri → WorkLog → Muayene Formu →
Fatura → Ödeme → Servis Değerlendirmesi → Doküman Arşivi
```

**4. Komisyon Hesaplama**
```
WorkLog (çalışma süresi) → CommissionRule (yüzde) → Usta performans raporu
```

---

## Teknik Notlar

**Silme hiyerarşisi (Bottom-Up):** `seed.ts` tablo ilişkilerini (foreign key) bozmaması için bağımlı kayıtları önce siler. Örnek sıra: Bildirimler → Satın Alma → Stok → WorkLog → Servis Kalemleri → İş Emirleri → Ustalar → Firmalar.

**Idempotency:**
- `seed.ts` — idempotent değil (siler + yeniden oluşturur)
- `add-superadmin.ts` — idempotent (varsa atlar)
- `seed-plans.ts` — idempotent (upsert)

**Özelleştirme:** `packages/database/prisma/seed.ts` dosyasını düzenleyerek veriler genişletilebilir.
