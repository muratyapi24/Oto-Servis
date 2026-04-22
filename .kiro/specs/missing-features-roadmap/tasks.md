# Uygulama Planı: Eksik Özellikler Yol Haritası

## Genel Bakış

Bu plan, MS Oto Servis SaaS platformunun eksik özelliklerini öncelik sırasına göre gruplandırılmış görevler halinde uygular. Her grup bağımsız olarak uygulanabilir; ancak Grup 1 (Veritabanı Şeması) diğer tüm gruplar için temel oluşturur.

## Görevler

- [x] 1. Grup 1: Veritabanı Şeması (Tüm özellikler için temel)
  - [x] 1.1 ServiceOrder modeline approvalToken alanlarını ekle
    - `packages/database/prisma/schema.prisma` dosyasında `ServiceOrder` modeline `approvalToken String? @unique @db.VarChar(255)` ve `approvalTokenExpiry DateTime?` alanlarını ekle
    - `ServiceOrder` modeline `documents Document[]`, `inspectionForms InspectionForm[]`, `workLogs WorkLog[]`, `loyaltyTransactions LoyaltyTransaction[]` ilişkilerini ekle
    - _Gereksinimler: 3.2, 11.1_

  - [x] 1.2 Quote ve QuoteItem modellerini ekle
    - `QuoteStatus` enum'unu (DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED) şemaya ekle
    - `Quote` modelini tüm alanları ve ilişkileriyle ekle (tenantId, customerId, vehicleId, quoteNumber, status, validUntil, subTotal, discountAmount, taxAmount, totalAmount, notes, rejectionReason)
    - `QuoteItem` modelini ekle (quoteId, itemType, name, partId, quantity, unitPrice, taxRate, discount, subTotal, taxAmount, totalPrice)
    - `Tenant`, `Customer`, `Vehicle`, `Part` modellerine `quotes Quote[]` ilişkisini ekle
    - _Gereksinimler: 2.1, 11.1, 11.2_

  - [x] 1.3 Notification modelini ekle
    - `NotificationType` enum'unu (SMS/EMAIL/IN_APP) ve `NotificationStatus` enum'unu (PENDING/SENT/FAILED) ekle
    - `Notification` modelini ekle (tenantId, customerId, type, channel, recipient, subject, body, status, sentAt, metadata, retryCount)
    - `Tenant` ve `Customer` modellerine `notifications Notification[]` ilişkisini ekle
    - _Gereksinimler: 6.8, 11.3_

  - [x] 1.4 LoyaltyTransaction modelini ekle
    - `LoyaltyTransactionType` enum'unu (EARN/REDEEM) ekle
    - `LoyaltyTransaction` modelini ekle (tenantId, customerId, type, points, description, serviceOrderId)
    - `Tenant`, `Customer`, `ServiceOrder` modellerine ilişkileri ekle
    - _Gereksinimler: 11.4_

  - [x] 1.5 Document modelini ekle
    - `Document` modelini ekle (tenantId, serviceOrderId, vehicleId, fileName, fileUrl, fileKey, fileType, fileSize, uploadedBy)
    - `Tenant`, `ServiceOrder`, `Vehicle` modellerine `documents Document[]` ilişkisini ekle
    - _Gereksinimler: 7.7, 11.5_

  - [x] 1.6 InspectionForm modelini ekle
    - `InspectionForm` modelini ekle (tenantId, serviceOrderId, mechanicId, formData JSON, completedAt)
    - `Tenant`, `ServiceOrder`, `Mechanic` modellerine `inspectionForms InspectionForm[]` ilişkisini ekle
    - _Gereksinimler: 11.6_

  - [x] 1.7 CommissionRule ve WorkLog modellerini ekle
    - `CommissionRuleType` enum'unu (PERCENTAGE/FIXED) ekle
    - `CommissionRule` modelini ekle (tenantId, mechanicId, ruleType, value, minAmount, maxAmount, isActive)
    - `WorkLog` modelini ekle (tenantId, mechanicId, serviceOrderId, startTime, endTime, durationMinutes, notes)
    - `Tenant` ve `Mechanic` modellerine ilgili ilişkileri ekle
    - _Gereksinimler: 8.1, 8.2, 11.7, 11.8_

  - [x] 1.8 Prisma migration oluştur ve uygula
    - `packages/database` dizininde `npx prisma migrate dev --name add_missing_features` komutunu çalıştır
    - Migration dosyasının tüm yeni modelleri ve index'leri içerdiğini doğrula
    - `npx prisma generate` ile Prisma Client'ı yenile
    - _Gereksinimler: 11.9, 11.10_

  - [x] 1.9 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 2. Grup 2: Fatura Detay Sayfası (Kritik — 404 düzeltme)
  - [x] 2.1 finance.actions.ts'e getInvoiceById ve addPaymentToInvoice ekle
    - `apps/web/lib/actions/finance.actions.ts` dosyasına `getInvoiceById(id: string)` fonksiyonunu ekle; fatura bulunamazsa `{ error }` döndür
    - `addPaymentToInvoice(data: { invoiceId, amount, paymentMethod, paymentDate, notes? })` fonksiyonunu ekle
    - Ödeme kaydedildiğinde `Invoice.paidAmount` güncelle; `paidAmount >= totalAmount` ise `status: "PAID"` yap
    - `revalidatePath("/dashboard/finances")` çağır
    - _Gereksinimler: 1.5, 1.6, 1.7_

  - [ ]* 2.2 Özellik testi: Ödeme ekleme round-trip
    - **Özellik 1: Ödeme Ekleme Round-Trip**
    - **Doğrular: Gereksinim 1.5, 1.6**
    - `apps/web/__tests__/finance.test.ts` dosyasını oluştur; `fc.float({ min: 0.01 })` ile rastgele tutar üret, `addPaymentToInvoice` sonrası `paidAmount` artışını ve `PAID` durumunu doğrula

  - [x] 2.3 InvoiceDetailClient.tsx bileşenini oluştur
    - `apps/web/app/(dashboard)/dashboard/finances/invoices/[id]/InvoiceDetailClient.tsx` dosyasını oluştur
    - Fatura başlığı (numara, durum badge, tarih), müşteri bilgi kartı, servis emri linki, ödeme geçmişi listesi bölümlerini ekle
    - Ödeme kaydetme formu (tutar, yöntem: Nakit/Kredi Kartı/Havale, tarih) ekle; `addPaymentToInvoice` action'ını çağır
    - PDF yazdırma butonu ekle (`window.print()`)
    - _Gereksinimler: 1.1, 1.2, 1.3, 1.4, 1.8_

  - [x] 2.4 finances/invoices/[id]/page.tsx sayfasını oluştur
    - `apps/web/app/(dashboard)/dashboard/finances/invoices/[id]/page.tsx` dosyasını oluştur
    - `getInvoiceById(params.id)` çağır; hata varsa `redirect("/dashboard/finances")` yap
    - `InvoiceDetailClient` bileşenini render et
    - _Gereksinimler: 1.1, 1.7_

  - [x] 2.5 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 3. Grup 3: Teklif/Keşif Sistemi
  - [x] 3.1 lib/validations/quotes.ts Zod şemasını oluştur
    - `apps/web/lib/validations/quotes.ts` dosyasını oluştur
    - `createQuoteSchema` (customerId, vehicleId?, validUntil?, notes?), `addQuoteItemSchema` (quoteId, itemType, name, partId?, quantity, unitPrice, taxRate, discount?), `updateQuoteStatusSchema` (quoteId, status, rejectionReason?) şemalarını tanımla
    - _Gereksinimler: 2.1, 2.3_

  - [x] 3.2 lib/actions/quote.actions.ts server actions oluştur
    - `apps/web/lib/actions/quote.actions.ts` dosyasını oluştur
    - `getQuotes()`, `getQuoteById(id)`, `createQuote(data)`, `addQuoteItem(data)`, `updateQuoteStatus(data)`, `convertQuoteToServiceOrder(quoteId)` fonksiyonlarını uygula
    - `getQuoteById` içinde `validUntil < now()` kontrolü yap; geçmişse `status: EXPIRED` döndür
    - `convertQuoteToServiceOrder` içinde teklif kalemlerini `ServiceItem` olarak kopyala, teklif durumunu `ACCEPTED` yap
    - Her fonksiyonda `tenantId` izolasyonu ve `revalidatePath` uygula
    - _Gereksinimler: 2.2, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.3 Özellik testi: Teklif kalemi hesaplama doğruluğu
    - **Özellik 2: Teklif Kalemi Hesaplama Doğruluğu**
    - **Doğrular: Gereksinim 2.4**
    - `apps/web/__tests__/quotes.test.ts` dosyasını oluştur; `fc.float` ile qty, unitPrice, taxRate, discount üret; `subTotal = (qty × unitPrice) − discount`, `taxAmount = subTotal × taxRate / 100`, `totalPrice = subTotal + taxAmount` formüllerini doğrula

  - [ ]* 3.4 Özellik testi: Teklif kabul → servis emri dönüşümü
    - **Özellik 3: Teklif Kabul → Servis Emri Dönüşümü**
    - **Doğrular: Gereksinim 2.6**
    - `apps/web/__tests__/quotes.test.ts` dosyasına ekle; `fc.array(fc.record(...))` ile kalem listesi üret; `convertQuoteToServiceOrder` sonrası servis emri kalemlerinin teklif kalemleriyle eşleştiğini ve teklif durumunun `ACCEPTED` olduğunu doğrula

  - [ ]* 3.5 Özellik testi: Süresi geçmiş teklif invariant'ı
    - **Özellik 4: Süresi Geçmiş Teklif Invariant'ı**
    - **Doğrular: Gereksinim 2.8**
    - `apps/web/__tests__/quotes.test.ts` dosyasına ekle; `fc.date({ max: new Date() })` ile geçmiş tarih üret; `getQuoteById` sonucu `EXPIRED` döndürmeli

  - [x] 3.6 QuoteFormModal.tsx bileşenini oluştur
    - `apps/web/components/dashboard/quotes/QuoteFormModal.tsx` dosyasını oluştur
    - Müşteri seçimi, araç seçimi, geçerlilik tarihi, notlar alanlarını içeren form ekle
    - Kalem ekleme bölümü: itemType, name, partId?, quantity, unitPrice, taxRate, discount; satır toplamını otomatik hesapla
    - `createQuote` ve `addQuoteItem` action'larını çağır
    - _Gereksinimler: 2.3, 2.4_

  - [x] 3.7 QuoteBoardClient.tsx bileşenini oluştur
    - `apps/web/components/dashboard/quotes/QuoteBoardClient.tsx` dosyasını oluştur
    - Teklif listesini durum, müşteri adı, araç plakası, tutar, tarih sütunlarıyla göster
    - Durum filtreleme, yeni teklif butonu (QuoteFormModal açar), teklif detay linki ekle
    - `updateQuoteStatus` action'ını çağıran durum güncelleme butonları ekle
    - _Gereksinimler: 2.2, 2.5, 2.7_

  - [x] 3.8 quotes/page.tsx ve quotes/[id]/page.tsx sayfalarını oluştur
    - `apps/web/app/(dashboard)/dashboard/quotes/page.tsx` dosyasını oluştur; `getQuotes()` çağır, `QuoteBoardClient` render et
    - `apps/web/app/(dashboard)/dashboard/quotes/[id]/page.tsx` dosyasını oluştur; `getQuoteById(params.id)` çağır, teklif detaylarını ve `convertQuoteToServiceOrder` butonunu göster
    - _Gereksinimler: 2.2, 2.6, 2.9_

  - [x] 3.9 Sidebar.tsx'e "Teklifler" menü öğesi ekle
    - `apps/web/components/dashboard/Sidebar.tsx` dosyasında `menuItems` dizisine `{ name: "Teklifler", href: "/dashboard/quotes", icon: "request_quote" }` öğesini "Servis Emirleri"nden sonra ekle
    - _Gereksinimler: 2.2_

  - [x] 3.10 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 4. Grup 4: Müşteri Onay Akışı
  - [x] 4.1 lib/actions/approval.actions.ts oluştur
    - `apps/web/lib/actions/approval.actions.ts` dosyasını oluştur
    - `generateApprovalToken(serviceOrderId)`: `crypto.randomBytes(32).toString("hex")` ile token üret, 48 saatlik expiry ayarla, `ServiceOrder.approvalToken` ve `approvalTokenExpiry` güncelle
    - `validateApprovalToken(token)`: token'ı bul, süresi dolmuşsa `{ error }` döndür, servis emri detaylarını döndür
    - `approveServiceOrder(token)`: durumu `IN_PROGRESS` yap, `AuditLog` kaydı oluştur
    - `rejectServiceOrder(token, reason)`: durumu `CANCELLED` yap, red nedenini kaydet, `AuditLog` kaydı oluştur
    - _Gereksinimler: 3.2, 3.4, 3.5, 3.7, 3.8_

  - [ ]* 4.2 Özellik testi: Onay token benzersizliği
    - **Özellik 5: Onay Token Benzersizliği**
    - **Doğrular: Gereksinim 3.2**
    - `apps/web/__tests__/approval.test.ts` dosyasını oluştur; `fc.uuid()` ile farklı servis emri ID'leri üret; üretilen token'ların birbirinden farklı olduğunu ve aynı servis emri için yeniden üretilen token'ın öncekinden farklı olduğunu doğrula

  - [x] 4.3 app/api/approval/[token]/route.ts API route oluştur
    - `apps/web/app/api/approval/[token]/route.ts` dosyasını oluştur
    - `GET`: `validateApprovalToken(token)` çağır; geçersizse HTTP 400 döndür
    - `POST`: body'den `{ action: "APPROVE" | "REJECT", reason? }` al; `approveServiceOrder` veya `rejectServiceOrder` çağır
    - _Gereksinimler: 3.3, 3.4, 3.5, 3.7_

  - [x] 4.4 app/onay/[token]/page.tsx public onay sayfasını oluştur
    - `apps/web/app/onay/[token]/page.tsx` dosyasını oluştur
    - `validateApprovalToken(params.token)` çağır; geçersizse hata mesajı göster
    - Servis emri detaylarını (araç, işlemler, tahmini maliyet) mobil uyumlu şekilde göster
    - "Onayla" ve "Reddet" butonları ekle; red için neden girişi alanı ekle
    - _Gereksinimler: 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.5 Servis emri durum güncelleme akışına token üretme entegre et
    - `apps/web/lib/actions/service.actions.ts` (veya ilgili action dosyası) içinde servis emri `WAITING_APPROVAL` durumuna alındığında `generateApprovalToken` çağır
    - _Gereksinimler: 3.1, 3.2_

  - [x] 4.6 Mobil müşteri paneline "Onay Bekliyor" uyarısı ekle
    - `apps/web/app/m/musteri/panel/page.tsx` dosyasında aktif `WAITING_APPROVAL` servis emirlerini sorgula
    - Varsa belirgin uyarı kartı ve onay linkine yönlendiren buton göster
    - _Gereksinimler: 3.6_

  - [x] 4.7 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 5. Grup 5: Mobil Müşteri Randevu Sayfası
  - [x] 5.1 app/m/musteri/randevu/page.tsx sayfasını oluştur
    - `apps/web/app/m/musteri/randevu/page.tsx` dosyasını oluştur
    - Mobil session cookie'den müşteri kimliğini al
    - Üst bölüm: `getAppointments()` ile geçmiş ve gelecek randevuları tarih sırasıyla listele
    - Alt bölüm: araç seçimi, tarih seçimi, saat seçimi, servis türü alanlarını içeren yeni randevu formu
    - Müşterinin kayıtlı aracı yoksa yönlendirme mesajı göster
    - `createAppointment` action'ını çağır; başarıda onay mesajı göster
    - _Gereksinimler: 4.1, 4.2, 4.3, 4.5, 4.8_

  - [ ]* 5.2 Özellik testi: Randevu oluşturma round-trip
    - **Özellik 6: Randevu Oluşturma Round-Trip**
    - **Doğrular: Gereksinim 4.3**
    - `apps/web/__tests__/appointments.test.ts` dosyasını oluştur; `fc.record(...)` ile geçerli randevu verisi üret; oluşturulan randevunun `PENDING` durumunda olduğunu ve tarih/saat bilgilerinin korunduğunu doğrula

  - [ ]* 5.3 Özellik testi: Randevu listesi tarih sıralaması
    - **Özellik 7: Randevu Listesi Tarih Sıralaması**
    - **Doğrular: Gereksinim 4.5**
    - `apps/web/__tests__/appointments.test.ts` dosyasına ekle; `fc.array(fc.record(...))` ile randevu listesi üret; döndürülen kayıtların `appointmentDate` ve `appointmentTime` alanlarına göre artan sırada olduğunu doğrula

  - [x] 5.4 panel/page.tsx ve gecmis/page.tsx navigasyon butonlarını aktif et
    - `apps/web/app/m/musteri/panel/page.tsx` dosyasında "Servis Randevusu" butonunu `<Link href="/m/musteri/randevu">` ile güncelle
    - `apps/web/app/m/musteri/gecmis/page.tsx` dosyasında "Randevu Talebi Oluştur" butonunu `<Link href="/m/musteri/randevu">` ile güncelle
    - _Gereksinimler: 4.6, 4.7_

  - [x] 5.5 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 6. Grup 6: Mobil Firma Personel Sayfası
  - [x] 6.1 mobile.actions.ts'e getFirmaPersonelData fonksiyonu ekle
    - `apps/web/lib/actions/mobile.actions.ts` dosyasına `getFirmaPersonelData(tenantId)` fonksiyonunu ekle
    - `prisma.mechanic.findMany()` ile usta listesini çek; her usta için `prisma.serviceOrder.count()` ile aktif iş emri sayısını hesapla
    - Özet metrikleri döndür: toplam aktif usta, toplam açık iş emri, ortalama doluluk oranı
    - _Gereksinimler: 5.1, 5.2, 5.6_

  - [x] 6.2 app/m/firma/personel/page.tsx sayfasını oluştur
    - `apps/web/app/m/firma/personel/page.tsx` dosyasını oluştur
    - `getFirmaPersonelData()` çağır
    - Özet kartlar: toplam aktif usta, açık iş emri, ortalama doluluk oranı
    - Durum filtresi: Müsait / Meşgul / İzinli
    - Usta kartları: fotoğraf, isim, uzmanlık, aktif iş sayısı, durum badge
    - `firma_mobil_personel_kadrosu.html` tasarımındaki görsel düzeni ve renk şemasını kullan
    - _Gereksinimler: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 6.3 Mobil firma navigasyonuna "Personel" sekmesi ekle
    - `apps/web/app/m/firma` layout veya navigasyon bileşenine "Personel" sekmesini `/m/firma/personel` linki ile ekle
    - _Gereksinimler: 5.1_

- [x] 7. Grup 7: SMS/E-posta Bildirim Altyapısı
  - [x] 7.1 lib/notifications/sms.ts Twilio entegrasyonunu oluştur
    - `apps/web/lib/notifications/sms.ts` dosyasını oluştur
    - `sendSms({ to, body, tenantId })` fonksiyonunu uygula; Twilio SDK kullan
    - Gönderim sonucunu `Notification` tablosuna kaydet (başarılı veya başarısız)
    - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` ortam değişkenlerini kullan
    - _Gereksinimler: 6.1, 6.8_

  - [x] 7.2 lib/notifications/email.ts Resend entegrasyonunu oluştur
    - `apps/web/lib/notifications/email.ts` dosyasını oluştur
    - `sendEmail({ to, subject, html, tenantId })` fonksiyonunu uygula; Resend SDK kullan
    - Gönderim sonucunu `Notification` tablosuna kaydet
    - `RESEND_API_KEY` ortam değişkenini kullan
    - _Gereksinimler: 6.2, 6.8_

  - [ ]* 7.3 Özellik testi: Bildirim log invariant'ı
    - **Özellik 8: Bildirim Log Invariant'ı**
    - **Doğrular: Gereksinim 6.3, 6.8**
    - `apps/web/__tests__/notifications.test.ts` dosyasını oluştur; `fc.oneof(fc.constant("SMS"), fc.constant("EMAIL"))` ile tip üret; gönderim sonucundan bağımsız olarak `Notification` tablosunda kayıt oluşturulduğunu doğrula

  - [ ]* 7.4 Özellik testi: Bildirim yeniden deneme sayacı
    - **Özellik 9: Bildirim Yeniden Deneme Sayacı**
    - **Doğrular: Gereksinim 6.9**
    - `apps/web/__tests__/notifications.test.ts` dosyasına ekle; `fc.integer({ min: 1, max: 3 })` ile deneme sayısı üret; her başarısız denemede `retryCount` artışını ve `retryCount >= 3` olduğunda durmasını doğrula

  - [x] 7.5 lib/notifications/templates.ts şablon sistemini oluştur
    - `apps/web/lib/notifications/templates.ts` dosyasını oluştur
    - `getServiceStatusTemplate`, `getApprovalRequestTemplate`, `getAppointmentConfirmTemplate`, `getQuoteSentTemplate` fonksiyonlarını uygula
    - Her fonksiyon `{ sms: string; emailHtml: string }` döndürmeli
    - _Gereksinimler: 6.7_

  - [x] 7.6 Servis emri durum değişikliğine bildirim entegre et
    - Servis emri durum güncelleme action'ında `getServiceStatusTemplate` kullanarak `sendSms` ve `sendEmail` çağır
    - `WAITING_APPROVAL` durumuna geçişte `getApprovalRequestTemplate` ile onay linki içeren bildirim gönder
    - _Gereksinimler: 6.3, 3.1_

  - [x] 7.7 Randevu oluşturma bildirimlerini entegre et
    - `createAppointment` action'ında `getAppointmentConfirmTemplate` kullanarak müşteriye onay bildirimi gönder
    - Firmaya yeni randevu bildirimi gönder
    - _Gereksinimler: 6.4, 4.4_

  - [x] 7.8 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 8. Grup 8: Dosya Yükleme Altyapısı
  - [x] 8.1 lib/storage.ts AWS S3/R2 entegrasyonunu oluştur
    - `apps/web/lib/storage.ts` dosyasını oluştur
    - `uploadFile(file: Buffer, key: string, contentType: string)`, `deleteFile(key: string)`, `getPublicUrl(key: string)` fonksiyonlarını uygula
    - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` ortam değişkenlerini kullan
    - _Gereksinimler: 7.1, 7.4_

  - [ ]* 8.2 Özellik testi: Dosya boyutu validasyonu
    - **Özellik 10: Dosya Boyutu Validasyonu**
    - **Doğrular: Gereksinim 7.3**
    - `apps/web/__tests__/storage.test.ts` dosyasını oluştur; `fc.integer({ min: 10_485_761 })` ile 10MB üzeri boyut üret; sistem dosyayı reddetmeli ve `Document` tablosuna kayıt oluşturmamalı

  - [ ]* 8.3 Özellik testi: Dosya yükleme round-trip
    - **Özellik 11: Dosya Yükleme Round-Trip**
    - **Doğrular: Gereksinim 7.4**
    - `apps/web/__tests__/storage.test.ts` dosyasına ekle; `fc.record(...)` ile dosya metadata üret; yükleme sonrası `Document` tablosundaki `fileUrl`, `fileName`, `fileSize`, `fileType` alanlarının orijinal verilerle eşleştiğini doğrula

  - [x] 8.4 app/api/upload/route.ts API route oluştur
    - `apps/web/app/api/upload/route.ts` dosyasını oluştur
    - `POST /api/upload`: FormData'dan `file`, `serviceOrderId?`, `vehicleId?` al
    - Dosya türü (JPEG/PNG/WebP) ve boyut (max 10MB) validasyonu yap; geçersizse hata döndür
    - `uploadFile` ile bulut depolamaya yükle, `Document` modeline kaydet
    - `{ documentId, fileUrl }` döndür
    - _Gereksinimler: 7.3, 7.4, 7.7, 7.8_

  - [x] 8.5 Servis emri detay sayfasına fotoğraf yükleme bileşeni ekle
    - Servis emri detay sayfasına sürükle-bırak veya dosya seçici arayüzü ekle
    - Yüklenen görselleri galeri görünümünde göster
    - Silme işleminde `deleteFile` ve veritabanı kaydını temizle
    - Mobil cihazda kamera ile doğrudan çekim seçeneği ekle (`accept="image/*" capture="environment"`)
    - _Gereksinimler: 7.2, 7.5, 7.6, 7.9_

  - [x] 8.6 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 9. Grup 9: Usta Performans Raporu Geliştirmesi
  - [x] 9.1 mechanic.actions.ts'e performans fonksiyonlarını ekle
    - `apps/web/lib/actions/mechanic.actions.ts` dosyasına `getMechanicPerformance(mechanicId, period: "current" | "previous")` fonksiyonunu ekle; ortalama tamamlama süresi, tamamlanan iş sayısı, toplam işçilik tutarını döndür
    - `getCommissionRules(mechanicId?)` fonksiyonunu ekle
    - `createCommissionRule(data)` fonksiyonunu ekle
    - `calculateCommission(mechanicId, month)` fonksiyonunu ekle; PERCENTAGE için `toplam × value / 100` (minAmount/maxAmount sınırları içinde), FIXED için `value` hesapla
    - _Gereksinimler: 8.3, 8.4, 8.5_

  - [ ]* 9.2 Özellik testi: Komisyon hesaplama doğruluğu
    - **Özellik 12: Komisyon Hesaplama Doğruluğu**
    - **Doğrular: Gereksinim 8.5**
    - `apps/web/__tests__/commission.test.ts` dosyasını oluştur; `fc.float` ve `fc.oneof(fc.constant("PERCENTAGE"), fc.constant("FIXED"))` ile kural tipi ve tutar üret; PERCENTAGE için `toplam × value / 100` ve FIXED için `value` formüllerini doğrula

  - [x] 9.3 PerformanceReport.tsx bileşenini oluştur
    - `apps/web/components/dashboard/mechanics/PerformanceReport.tsx` dosyasını oluştur
    - Mevcut ay ve önceki ay performans metriklerini yan yana karşılaştırmalı göster
    - Komisyon kuralları listesi ve yeni kural ekleme formu ekle
    - Dönemsel komisyon tutarı önizlemesi göster
    - _Gereksinimler: 8.3, 8.4, 8.5, 8.6_

  - [x] 9.4 Mekanik detay sayfasına performans raporu sekmesi ekle
    - Mekanik detay sayfasına "Performans" sekmesi ekle
    - `getMechanicPerformance` çağır, `PerformanceReport` bileşenini render et
    - _Gereksinimler: 8.3, 8.4, 8.7_

- [x] 10. Grup 10: Stripe Ödeme Entegrasyonu
  - [x] 10.1 lib/stripe.ts Stripe SDK kurulumunu yap
    - `apps/web/lib/stripe.ts` dosyasını oluştur
    - `import Stripe from "stripe"; export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-20" });`
    - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` ortam değişkenlerini `.env` dosyasına ekle
    - _Gereksinimler: 9.1_

  - [x] 10.2 app/api/stripe/checkout/route.ts oluştur
    - `apps/web/app/api/stripe/checkout/route.ts` dosyasını oluştur
    - `POST /api/stripe/checkout`: body'den `{ planId, billingCycle: "monthly" | "yearly" }` al
    - Stripe Checkout oturumu oluştur, `{ url }` döndür
    - _Gereksinimler: 9.2_

  - [x] 10.3 app/api/stripe/webhook/route.ts webhook handler oluştur
    - `apps/web/app/api/stripe/webhook/route.ts` dosyasını oluştur
    - Stripe imza doğrulaması yap; geçersizse HTTP 400 döndür ve güvenlik log kaydı oluştur
    - `checkout.session.completed` → `ACTIVE`, `invoice.payment_succeeded` → dönem güncelle, `invoice.payment_failed` → `PAST_DUE`, `customer.subscription.deleted` → `CANCELLED` işle
    - _Gereksinimler: 9.3, 9.4, 9.5, 9.7, 9.8_

  - [x] 10.4 Firma ayarlar sayfasına abonelik yönetimi bölümü ekle
    - Firma ayarlar sayfasına abonelik geçmişi ve fatura belgelerini listeleyen bölüm ekle
    - Abonelik iptal butonu ekle (`cancelAtPeriodEnd` güncelle)
    - _Gereksinimler: 9.6, 9.7_

  - [x] 10.5 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 11. Grup 11: Super Admin Eksik Sayfalar
  - [x] 11.1 superadmin.actions.ts'e gerekli fonksiyonları ekle
    - `apps/web/lib/actions/superadmin.actions.ts` dosyasına `getCommandCenterData()`, `getStrategicInsights()`, `getTenantPerformanceMatrix()`, `getPaymentOperations()` fonksiyonlarını ekle
    - Her fonksiyonda `SUPER_ADMIN` rol kontrolü yap
    - _Gereksinimler: 10.1, 10.2, 10.3, 10.4, 10.7_

  - [x] 11.2 super-admin/command-center/page.tsx oluştur
    - `apps/web/app/(super-admin)/super-admin/command-center/page.tsx` dosyasını oluştur
    - `getCommandCenterData()` çağır; aktif tenant sayısı, anlık API istek sayısı, sistem kaynak kullanımı, son 24 saatteki kritik hatalar, süresi dolan abonelik uyarılarını göster
    - `Command Center.html` tasarım şablonunu referans al
    - _Gereksinimler: 10.1, 10.6_

  - [x] 11.3 super-admin/strategic-insights/page.tsx oluştur
    - `apps/web/app/(super-admin)/super-admin/strategic-insights/page.tsx` dosyasını oluştur
    - `getStrategicInsights()` çağır; aylık büyüme oranları, churn analizi, gelir projeksiyonları, en aktif tenant'ları görsel grafiklerle göster
    - `Strategic Insights Hub.html` tasarım şablonunu referans al
    - _Gereksinimler: 10.2_

  - [x] 11.4 super-admin/tenant-performance/page.tsx oluştur
    - `apps/web/app/(super-admin)/super-admin/tenant-performance/page.tsx` dosyasını oluştur
    - `getTenantPerformanceMatrix()` çağır; servis emri sayısı, gelir, aktif kullanıcı, abonelik durumuna göre sıralanabilir matris tablosu göster
    - `Tenant Performance Matrix.html` tasarım şablonunu referans al
    - _Gereksinimler: 10.3_

  - [x] 11.5 super-admin/payment-operations/page.tsx oluştur
    - `apps/web/app/(super-admin)/super-admin/payment-operations/page.tsx` dosyasını oluştur
    - `getPaymentOperations()` çağır; tüm abonelik ödemeleri, başarısız ödeme girişimleri, iade taleplerini listele
    - `Payment Operations Panel.html` tasarım şablonunu referans al
    - _Gereksinimler: 10.4_

  - [x] 11.6 Super admin sidebar'a yeni sayfaları ekle
    - `apps/web/components/super-admin/Sidebar.tsx` dosyasına Command Center, Strategic Insights, Tenant Performance, Payment Operations menü öğelerini ekle
    - _Gereksinimler: 10.5, 10.7_

  - [x] 11.7 Checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

- [x] 12. Grup 12: Property-Based Testler
  - [x] 12.1 fast-check bağımlılığını ekle
    - `apps/web` dizininde `npm install --save-dev fast-check` komutunu çalıştır
    - `apps/web/__tests__/` dizinini oluştur
    - Test runner konfigürasyonunu (Jest veya Vitest) `fast-check` ile uyumlu hale getir
    - _Gereksinimler: Tüm doğruluk özellikleri_

  - [x] 12.2 Eksik özellik testlerini tamamla ve doğrula
    - Grup 2–9 içinde `*` ile işaretlenmiş tüm özellik test görevlerinin (2.2, 3.3, 3.4, 3.5, 4.2, 5.2, 5.3, 7.3, 7.4, 8.2, 8.3, 9.2) oluşturulduğunu doğrula
    - Her test dosyasının başına `// Feature: missing-features-roadmap, Property {N}: {özellik_metni}` etiketini ekle
    - Her özellik testi minimum 100 iterasyon çalıştıracak şekilde konfigüre et (`fc.assert(fc.property(...), { numRuns: 100 })`)
    - _Gereksinimler: Tüm doğruluk özellikleri_

  - [x] 12.3 Final checkpoint — Tüm testler geçmeli, sorularınız varsa sorun.

## Notlar

- `*` ile işaretlenmiş alt görevler isteğe bağlıdır; hızlı MVP için atlanabilir
- Her görev ilgili gereksinimlere referans verir
- Checkpoint görevleri artımlı doğrulama sağlar
- Özellik testleri evrensel doğruluk özelliklerini, birim testleri belirli örnekleri ve hata durumlarını doğrular
- Grup 1 (Veritabanı Şeması) diğer tüm gruplar için ön koşuldur
