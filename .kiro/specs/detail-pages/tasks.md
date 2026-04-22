# Implementation Plan: Detail Pages

## Overview

Her varlık (müşteri, araç, usta, fatura, randevu) için `/dashboard/{entity}/[id]` rotasında Server Component tabanlı detay sayfaları oluşturulur. Önce server action'lar eklenir, ardından her sayfa için `page.tsx` + `*DetailClient.tsx` çifti implemente edilir.

## Tasks

- [x] 1. Server Action'ları Ekle: `getCustomerById`
  - [x] 1.1 `customer.actions.ts` dosyasına `getCustomerById` action'ını ekle
    - `vehicles`, `serviceOrders` (desc), `payments` (son 10, desc) ve `_count.invoices` include edilmeli
    - `tenantId` filtresi ve `deletedAt` kontrolü uygulanmalı
    - Decimal alanlar (`balance`) number'a serialize edilmeli
    - _Requirements: 7.1, 7.6, 1.1, 1.4_
  - [ ]* 1.2 `customer.actions.test.ts` dosyasına property testleri yaz
    - **Property 1: Tenant izolasyonu ve soft-delete koruması**
    - **Validates: Requirements 1.1, 1.2, 1.4, 7.6**
    - **Property 2: Müşteri detay verisi bütünlüğü**
    - **Validates: Requirements 2.1, 2.2, 2.5**
    - **Property 3: Servis geçmişi tarih sıralaması**
    - **Validates: Requirements 2.3, 3.3, 4.3**

- [x] 2. Server Action'ları Ekle: `getVehicleById`
  - [x] 2.1 `vehicle.actions.ts` dosyasına `getVehicleById` action'ını ekle
    - `customer` (temel alanlar) ve `serviceOrders` (desc) include edilmeli
    - `_count.serviceOrders` eklenmeli
    - `tenantId` filtresi ve `deletedAt` kontrolü uygulanmalı
    - _Requirements: 7.2, 7.6, 1.1, 1.4_
  - [ ]* 2.2 `vehicle.actions.test.ts` dosyasına property testleri yaz
    - **Property 4: Araç detay verisi bütünlüğü**
    - **Validates: Requirements 3.1, 3.2**
    - **Property 5: Araç servis özeti tutarlılığı**
    - **Validates: Requirements 3.6**

- [x] 3. Server Action'ları Ekle: `getMechanicById`, `getInvoiceById`, `getAppointmentById`
  - [x] 3.1 `mechanic.actions.ts` dosyasına `getMechanicById` action'ını ekle
    - `activeOrders` (PENDING | IN_PROGRESS) ve `completedOrders` (COMPLETED, desc) ayrı include edilmeli
    - `tenantId` filtresi ve `deletedAt` kontrolü uygulanmalı
    - `hourlyRate` Decimal → number serialize edilmeli
    - _Requirements: 7.3, 7.6, 1.1, 1.4_
  - [x] 3.2 `finance.actions.ts` dosyasına `getInvoiceById` action'ını ekle
    - `customer`, `serviceOrder` ve `payments` (desc) include edilmeli
    - `tenantId` filtresi ve `deletedAt` kontrolü uygulanmalı
    - Decimal alanlar number'a serialize edilmeli
    - _Requirements: 7.4, 7.6, 1.1, 1.4_
  - [x] 3.3 `appointment.actions.ts` dosyasına `getAppointmentById` action'ını ekle
    - `customer` (temel alanlar) ve `vehicle` (nullable) include edilmeli
    - `tenantId` filtresi ve `deletedAt` kontrolü uygulanmalı
    - _Requirements: 7.5, 7.6, 1.1, 1.4_
  - [ ]* 3.4 `mechanic.actions.test.ts` dosyasına property testleri yaz
    - **Property 6: Usta aktif/tamamlanan iş ayrımı**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  - [ ]* 3.5 `finance.actions.test.ts` dosyasına property testleri yaz
    - **Property 7: Fatura finansal tutar invariantı**
    - **Validates: Requirements 5.2**
    - **Property 8: Fatura ödeme geçmişi sıralaması ve ServiceOrder ilişkisi**
    - **Validates: Requirements 5.3, 5.4**
  - [ ]* 3.6 `appointment.actions.test.ts` dosyasına property testleri yaz
    - **Property 9: Randevu detay verisi bütünlüğü**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - **Property 10: COMPLETED randevu → ServiceOrder oluşturulur**
    - **Validates: Requirements 6.5**

- [ ] 4. Checkpoint — Action katmanı tamamlandı
  - Tüm testler geçmeli, action imzaları design.md ile uyumlu olmalı. Sorular varsa kullanıcıya sor.

- [x] 5. Müşteri Detay Sayfası
  - [x] 5.1 `app/(dashboard)/dashboard/customers/[id]/page.tsx` Server Component oluştur
    - `getCustomerById(id)` çağır; `null` dönerse `notFound()` çağır
    - `PageShell` ile sar; `actions` slotuna geri butonu ekle
    - `CustomerDetailClient` bileşenine serialize edilmiş veriyi prop olarak geç
    - _Requirements: 2.1, 7.7, 1.2, 8.1_
  - [x] 5.2 `app/(dashboard)/dashboard/customers/[id]/CustomerDetailClient.tsx` Client Component oluştur
    - Müşteri bilgi kartı (ad/firma, telefon, e-posta, adres, vergi bilgileri, notlar)
    - Finansal özet kartları (bakiye, açık fatura sayısı)
    - Araç listesi — her satır `/dashboard/vehicles/[id]` linkli
    - Servis geçmişi tablosu (desc) — her satır `/dashboard/services/[id]` linkli
    - Son 10 ödeme listesi
    - `updateCustomer` action'ını kullanan düzenleme formu (modal veya inline)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 8.2, 8.4_
  - [ ]* 5.3 Navigasyon link doğruluğu için property testi yaz
    - **Property 11: Navigasyon link doğruluğu**
    - **Validates: Requirements 2.7, 2.8, 8.2, 8.4**

- [x] 6. Araç Detay Sayfası
  - [x] 6.1 `app/(dashboard)/dashboard/vehicles/[id]/page.tsx` Server Component oluştur
    - `getVehicleById(id)` çağır; `null` dönerse `notFound()` çağır
    - `PageShell` ile sar; geri butonu ekle
    - `VehicleDetailClient` bileşenine veriyi prop olarak geç
    - _Requirements: 3.1, 7.7, 1.2, 8.1_
  - [x] 6.2 `app/(dashboard)/dashboard/vehicles/[id]/VehicleDetailClient.tsx` Client Component oluştur
    - Teknik bilgi kartları (plaka, marka, model, yıl, şasi no, motor no, renk, yakıt tipi, vites, km, sigorta)
    - Servis özeti (toplam servis sayısı, toplam tutar)
    - Müşteri bilgisi — `/dashboard/customers/[id]` linkli
    - Servis geçmişi tablosu (desc) — her satır `/dashboard/services/[id]` linkli
    - `updateVehicle` action'ını kullanan düzenleme formu
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.3, 8.4_

- [x] 7. Usta Detay Sayfası
  - [x] 7.1 `app/(dashboard)/dashboard/mechanics/[id]/page.tsx` Server Component oluştur
    - `getMechanicById(id)` çağır; `null` dönerse `notFound()` çağır
    - `PageShell` ile sar; geri butonu ekle
    - `MechanicDetailClient` bileşenine veriyi prop olarak geç
    - _Requirements: 4.1, 7.7, 1.2, 8.1_
  - [x] 7.2 `app/(dashboard)/dashboard/mechanics/[id]/MechanicDetailClient.tsx` Client Component oluştur
    - Usta bilgi kartı (ad, soyad, telefon, e-posta, uzmanlıklar, deneyim, saatlik ücret, aktiflik)
    - Özet kartlar (aktif iş sayısı, tamamlanan iş sayısı)
    - Aktif işler listesi (PENDING | IN_PROGRESS) — her satır `/dashboard/services/[id]` linkli
    - Tamamlanan işler tablosu (desc) — her satır `/dashboard/services/[id]` linkli
    - `updateMechanic` action'ını kullanan düzenleme formu
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4_

- [ ] 8. Checkpoint — İlk 3 detay sayfası tamamlandı
  - Tüm testler geçmeli, sayfalar `notFound()` davranışını doğru uygulamalı. Sorular varsa kullanıcıya sor.

- [x] 9. Fatura Detay Sayfası
  - [x] 9.1 `app/(dashboard)/dashboard/finances/invoices/[id]/page.tsx` Server Component oluştur
    - `getInvoiceById(id)` çağır; `null` dönerse `notFound()` çağır
    - `PageShell` ile sar; geri butonu ekle
    - `InvoiceDetailClient` bileşenine veriyi prop olarak geç
    - _Requirements: 5.1, 7.7, 1.2, 8.1_
  - [x] 9.2 `app/(dashboard)/dashboard/finances/invoices/[id]/InvoiceDetailClient.tsx` Client Component oluştur
    - Fatura başlık bilgileri (fatura no, tür, durum, müşteri, tarihler)
    - Finansal özet (ara toplam, indirim, KDV, genel toplam, ödenen, kalan)
    - ServiceOrder referans satırı — `/dashboard/services/[id]` linkli (varsa)
    - Ödeme geçmişi tablosu (desc)
    - `recordPayment` action'ını kullanan ödeme formu; `PAID` veya `CANCELLED` durumunda `disabled`
    - "Yazdır" butonu (`window.print()`) ve `@media print` CSS stilleri
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 8.4, 8.5_

- [x] 10. Randevu Detay Sayfası
  - [x] 10.1 `app/(dashboard)/dashboard/appointments/[id]/page.tsx` Server Component oluştur
    - `getAppointmentById(id)` çağır; `null` dönerse `notFound()` çağır
    - `PageShell` ile sar; geri butonu ekle
    - `AppointmentDetailClient` bileşenine veriyi prop olarak geç
    - _Requirements: 6.1, 7.7, 1.2, 8.1_
  - [x] 10.2 `app/(dashboard)/dashboard/appointments/[id]/AppointmentDetailClient.tsx` Client Component oluştur
    - Randevu bilgi kartı (tarih, saat, tür, durum, notlar)
    - Müşteri bilgisi — `/dashboard/customers/[id]` linkli
    - Araç bilgisi (atanmışsa) — `/dashboard/vehicles/[id]` linkli
    - `updateAppointmentStatus` action'ını kullanan durum güncelleme kontrolleri
    - COMPLETED sonrası oluşan ServiceOrder'a `/dashboard/services/[id]` linki
    - Araç atanmamışken COMPLETED denenirse hata mesajı göster
    - `updateAppointment` action'ını kullanan düzenleme formu
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.2, 8.3, 8.4_

- [x] 11. Liste Sayfalarına Detay Linki Ekle
  - [x] 11.1 `customers/page.tsx` içindeki müşteri satırlarına `/dashboard/customers/[id]` linki ekle
    - _Requirements: 8.2_
  - [x] 11.2 `vehicles/page.tsx` içindeki araç satırlarına `/dashboard/vehicles/[id]` linki ekle
    - _Requirements: 8.3_
  - [x] 11.3 `mechanics/page.tsx` içindeki usta satırlarına `/dashboard/mechanics/[id]` linki ekle
    - _Requirements: 8.4_
  - [x] 11.4 `finances` sayfasındaki fatura satırlarına `/dashboard/finances/invoices/[id]` linki ekle
    - _Requirements: 8.5_
  - [x] 11.5 `appointments/page.tsx` içindeki randevu satırlarına `/dashboard/appointments/[id]` linki ekle
    - _Requirements: 8.2_

- [x] 12. Final Checkpoint — Tüm detay sayfaları tamamlandı
  - Tüm testler geçmeli, navigasyon linkleri doğru çalışmalı, tenant izolasyonu korunmalı. Sorular varsa kullanıcıya sor.

## Notes

- `*` ile işaretli görevler isteğe bağlıdır; MVP için atlanabilir
- Property testleri `fast-check` kütüphanesi ile yazılır (`npm install --save-dev fast-check`)
- Her test dosyası `// Feature: detail-pages, Property {N}: {property_text}` tag formatını kullanır
- Tüm `getById` action'ları mevcut `*.actions.ts` dosyalarına eklenir; yeni dosya açılmaz
- Client Component'ler kendi `[id]/` klasörlerine yerleştirilir
