# Gorevler: Fatura, Odeme ve Muhasebe Entegrasyonu

## Faz 1: Veritabani Semalari ve Temel Altyapi

- [x] 1.1 Prisma sema guncellemesi: InvoiceItem, CheckPayment, PaymentAttempt, ParasutSyncLog, InvoiceSequence modelleri ekle
- [x] 1.2 Prisma sema guncellemesi: Invoice modeline e-Fatura alanlari ekle (eInvoiceStatus, eInvoiceUUID, eInvoiceETTN, eInvoiceXmlUrl, eInvoiceErrorMessage, eInvoiceType, eInvoiceSentAt)
- [x] 1.3 Prisma sema guncellemesi: Payment modeline IYZICO, PAYTR, CHECK, PROMISSORY_NOTE enum degerleri ve providerPaymentId alani ekle
- [x] 1.4 Prisma sema guncellemesi: Tenant modeline yeni iliskiler ekle (invoiceItems, checkPayments, paymentAttempts, parasutSyncLogs, invoiceSequences)
- [x] 1.5 Prisma migration olustur ve uygula
- [x] 1.6 Zod validasyon semalari olustur: lib/validations/invoice.ts (invoiceItemSchema, createInvoiceSchema, updateInvoiceStatusSchema)
- [x] 1.7 Zod validasyon semalari olustur: lib/validations/payment.ts (createPaymentSchema, cek/senet detay validasyonu dahil)

## Faz 2: Kalem Bazli Fatura Detayi (InvoiceItem)

- [x] 2.1 lib/invoice-utils.ts olustur: calculateLineTotal, calculateInvoiceTotals, generateInvoiceNumber, formatTurkishDate, formatTurkishCurrency saf fonksiyonlari
- [x] 2.2 lib/actions/invoice.actions.ts: createInvoice (InvoiceItem'larla birlikte, $transaction icinde)
- [x] 2.3 lib/actions/invoice.actions.ts: updateInvoice (DRAFT durumu kontrolu)
- [x] 2.4 lib/actions/invoice.actions.ts: addInvoiceItem, updateInvoiceItem, deleteInvoiceItem (PAID kontrolu dahil)
- [x] 2.5 lib/actions/invoice.actions.ts: reorderInvoiceItems (sortOrder guncelleme)
- [x] 2.6 lib/actions/invoice.actions.ts: createInvoiceFromServiceOrder (ServiceItem -> InvoiceItem kopyalama)
- [x] 2.7 lib/actions/invoice.actions.ts: getInvoices, getInvoiceById (InvoiceItem'larla birlikte)
- [x] 2.8 lib/actions/invoice.actions.ts: updateInvoiceStatus (PAID/CANCELLED durumunda tutar degisikligi engeli, muhasebe denklik dogrulamasi)
- [x] 2.9 InvoiceSequence ile fatura numaralandirma: SELECT FOR UPDATE kilitleme, yil bazli sira, TASLAK-{timestamp} gecici numara
- [x] 2.10 AuditLog entegrasyonu: her fatura islemi (olusturma, guncelleme, iptal, odeme) icin log kaydi
- [x] 2.11 Birim testleri: apps/web/__tests__/invoice/invoice-utils.test.ts
- [x] 2.12 Ozellik bazli testler: apps/web/__tests__/invoice/invoice-utils.property.test.ts (fast-check, Ozellik 1-4, 10-12)

## Faz 3: Fatura PDF Uretimi

- [x] 3.1 lib/invoice-pdf.ts olustur: @react-pdf/renderer ile sunucu tarafi PDF sablonu (firma bilgileri, logo, kalem tablosu, toplamlar, Turkce format)
- [x] 3.2 Inngest job olustur: lib/inngest/functions/invoice-pdf-generator.ts (invoice/status-changed event, 30s timeout, S3 yukleme)
- [x] 3.3 S3 yukleme: invoices/{tenantId}/{invoiceNumber}.pdf yolu, private erisim
- [x] 3.4 lib/actions/invoice.actions.ts: getInvoicePdfUrl (pdfUrl varsa S3 presigned URL, yoksa job tetikle)
- [x] 3.5 API route olustur: app/api/invoices/[id]/pdf/route.ts (yetki kontrolu, presigned URL)
- [x] 3.6 Entegrasyon testleri: Mock S3 ile PDF olusturma ve yukleme akisi

## Faz 4: Turkiye Yerel Odeme Yontemleri

- [x] 4.1 lib/payment-providers/iyzico.ts olustur: odeme formu olusturma, HMAC-SHA256 webhook dogrulama
- [x] 4.2 lib/payment-providers/paytr.ts olustur: iframe token olusturma, MD5 hash dogrulama
- [x] 4.3 API route olustur: app/api/webhooks/iyzico/route.ts (imza dogrulama, Payment kaydi, Invoice guncelleme)
- [x] 4.4 API route olustur: app/api/webhooks/paytr/route.ts (hash dogrulama, odeme isleme)
- [x] 4.5 lib/actions/payment.actions.ts: initOnlinePayment (idempotency kontrolu, provider secimi)
- [x] 4.6 lib/actions/payment.actions.ts: createPayment (manuel odeme, cek/senet CheckPayment kaydi dahil)
- [x] 4.7 lib/actions/payment.actions.ts: updateCheckPaymentStatus (COLLECTED/BOUNCED, bakiye guncelleme)
- [x] 4.8 lib/actions/payment.actions.ts: getPayments, getUpcomingCheckPayments
- [x] 4.9 Inngest job olustur: lib/inngest/functions/check-payment-reminder.ts (gunluk cron, 3 gunluk vade uyarisi)
- [x] 4.10 Birim testleri: apps/web/__tests__/payment/webhook.test.ts (HMAC dogrulama, Ozellik 8)
- [x] 4.11 Ozellik bazli testler: Ozellik 7 (odeme sonrasi fatura durumu), Ozellik 9 (vade bildirim esigi)

## Faz 5: e-Fatura ve e-Arsiv Entegrasyonu

- [x] 5.1 lib/e-invoice/ubl-tr-generator.ts olustur: UBL-TR 2.1 XML uretimi (Invoice + InvoiceItem verilerinden)
- [x] 5.2 lib/e-invoice/integrator-client.ts olustur: GIB entegratoru API istemcisi (token yonetimi, fatura gonderme, durum sorgulama, iptal)
- [x] 5.3 lib/actions/e-invoice.actions.ts: sendEInvoice, sendEArchiveInvoice, checkEInvoiceEligibility, cancelEInvoice, queryEInvoiceStatus
- [x] 5.4 Inngest job olustur: lib/inngest/functions/e-invoice-status-poller.ts (saatlik cron, SENT faturalarin durum sorgulamasi)
- [x] 5.5 e-Fatura XML'ini S3'e kaydet: e-invoices/{tenantId}/{invoiceNumber}.xml (10 yil erisim icin lifecycle policy)
- [x] 5.6 e-Arsiv PDF e-posta gonderimi: Resend ile musteri e-posta adresine PDF eki
- [x] 5.7 AccountingIntegration.settings genisletmesi: e-Fatura entegratoru kimlik bilgileri (entegratorUrl, username, password, companyVkn)
- [x] 5.8 Entegrasyon testleri: Mock GIB API ile e-Fatura gonderme, red ve iptal senaryolari

## Faz 6: Parasut Otomatik Senkronizasyonu

- [x] 6.1 lib/parasut/client.ts olustur: OAuth2 token yonetimi (Redis cache, 60s onceden yenileme), Parasut API istemcisi
- [x] 6.2 lib/parasut/mapper.ts olustur: Invoice -> Parasut fatura, InvoiceItem -> Parasut satir, Customer -> Parasut musteri eslestirme
- [x] 6.3 Inngest job olustur: lib/inngest/functions/parasut-sync.ts (invoice/status-changed, payment/created, invoice/cancelled event'leri, exponential backoff, 3 retry)
- [x] 6.4 ParasutSyncLog kaydi: her senkronizasyon girisimi icin SUCCESS/FAILED logu
- [x] 6.5 lib/actions/parasut.actions.ts: syncInvoiceToParasut (manuel tetikleme), testParasutConnection, getParasutSyncLogs
- [x] 6.6 Musteri deduplication: vergi numarasiyla Parasut'ta arama, mevcut kayit kullanimi
- [x] 6.7 Entegrasyon testleri: Mock Parasut API ile senkronizasyon, retry ve log senaryolari
- [x] 6.8 Ozellik bazli testler: Ozellik 13 (retry sayisi), Ozellik 14 (kalem eslestirme)

## Faz 7: Kullanici Arayuzu

- [x] 7.1 Fatura listesi sayfasi: app/(dashboard)/dashboard/finance/invoices/page.tsx (filtreleme, durum badge, PDF indirme)
- [x] 7.2 Yeni fatura sayfasi: app/(dashboard)/dashboard/finance/invoices/new/page.tsx (InvoiceItem ekleme/duzenleme/siralama, canli toplam hesaplama)
- [x] 7.3 Fatura detay sayfasi: app/(dashboard)/dashboard/finance/invoices/[id]/page.tsx (kalem listesi, odeme gecmisi, e-Fatura durumu, Parasut sync logu)
- [x] 7.4 Odeme listesi sayfasi: app/(dashboard)/dashboard/finance/payments/page.tsx
- [x] 7.5 Manuel odeme kaydi sayfasi: app/(dashboard)/dashboard/finance/payments/new/page.tsx (cek/senet detay formu dahil)
- [x] 7.6 Cek/senet takip sayfasi: app/(dashboard)/dashboard/finance/payments/checks/page.tsx (vade takvimi, durum guncelleme)
- [x] 7.7 Muhasebe entegrasyon ayarlari: app/(dashboard)/dashboard/finance/accounting/page.tsx
- [x] 7.8 Parasut baglanti ve log sayfasi: app/(dashboard)/dashboard/finance/accounting/parasut/page.tsx
- [x] 7.9 e-Fatura ayarlari sayfasi: app/(dashboard)/dashboard/finance/accounting/e-invoice/page.tsx
- [x] 7.10 Mobil fatura detay sayfasi guncelleme: apps/mobile/app/(firma)/fatura/[id].tsx (InvoiceItem listesi, PDF indirme)

## Faz 8: Son Kontroller ve Dokumantasyon

- [x] 8.1 Tum ozellik bazli testlerin calistigini dogrula (pnpm --filter web test --run)
- [x] 8.2 TypeScript tip kontrolu (pnpm check-types)
- [x] 8.3 ESLint kontrolu (pnpm --filter web lint)
- [x] 8.4 Prisma migration'larinin temiz oldugunu dogrula
- [x] 8.5 Ortam degiskenleri dokumantasyonu: IYZICO_API_KEY, IYZICO_SECRET_KEY, PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, E_INVOICE_INTEGRATOR_URL, E_INVOICE_USERNAME, E_INVOICE_PASSWORD
