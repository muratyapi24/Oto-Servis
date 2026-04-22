# Görevler: WhatsApp ve Gelişmiş Bildirim Sistemi

## Faz 1: Veritabanı Şeması ve Temel Altyapı

- [x] 1.1 Prisma şema güncellemesi: `NotificationType` enum'una `WHATSAPP` değeri ekle
- [x] 1.2 Prisma şema güncellemesi: `NotificationStatus` enum'una `SKIPPED`, `DELIVERED`, `READ` değerleri ekle
- [x] 1.3 Prisma şema güncellemesi: `Notification` modeline `notificationTemplateId`, `reminderType`, `appointmentId`, `bulkCampaignId` alanları ekle
- [x] 1.4 Prisma şema güncellemesi: `NotificationTemplate` modelini oluştur (tenantId, type, channel, name, body, variables, templateName, languageCode, isActive, isDefault, deletedAt)
- [x] 1.5 Prisma şema güncellemesi: `CustomerNotificationPreference` modelini oluştur (tenantId, customerId, smsEnabled, whatsappEnabled, emailEnabled, preferredChannel)
- [x] 1.6 Prisma şema güncellemesi: `BulkNotificationCampaign` modelini oluştur (tenantId, name, channel, messageBody, segmentType, segmentParams, totalCount, sentCount, failedCount, skippedCount, status, startedAt, completedAt)
- [x] 1.7 Prisma şema güncellemesi: `Tenant` modeline `notificationTemplates`, `customerNotificationPreferences`, `bulkNotificationCampaigns` ilişkileri ekle
- [x] 1.8 Prisma şema güncellemesi: `Customer` modeline `notificationPreference` ilişkisi ekle
- [x] 1.9 Prisma migration oluştur ve uygula
- [x] 1.10 Zod validasyon şemaları oluştur: `lib/validations/notification.ts` (sendWhatsAppSchema, notificationTemplateSchema, customerPreferenceSchema, bulkCampaignSchema)

## Faz 2: WhatsApp Servis Katmanı

- [x] 2.1 `lib/notifications/whatsapp.ts` oluştur: `SendWhatsAppOptions` ve `WhatsAppResult` arayüzleri, `sendWhatsApp()` ana fonksiyonu
- [x] 2.2 `lib/notifications/whatsapp.ts`: `normalizePhone()` yardımcı fonksiyonu — `0XXXXXXXXXX` ve `+90XXXXXXXXXX` ve 10 haneli formatları `+90XXXXXXXXXX`'e dönüştür
- [x] 2.3 `lib/notifications/whatsapp.ts`: Twilio WhatsApp sağlayıcı desteği — `whatsapp:+90XXXXXXXXXX` formatı, serbest metin gönderimi
- [x] 2.4 `lib/notifications/whatsapp.ts`: Meta Cloud API sağlayıcı desteği — Graph API v18.0, HSM şablon adı + parametre listesi ile gönderim
- [x] 2.5 `lib/notifications/whatsapp.ts`: Sağlayıcı seçim mantığı — `NotificationProvider` tablosundan `type: "WHATSAPP"`, `isActive: true` kaydı sorgula; yoksa simülasyon modu
- [x] 2.6 `lib/notifications/whatsapp.ts`: `Notification` tablosuna PENDING kayıt oluştur, gönderim sonrası SENT/FAILED güncelle; hata detayını `metadata` alanına yaz
- [x] 2.7 `lib/notifications/whatsapp.ts`: API anahtarı şifre çözme — `NotificationProvider.settings` içindeki şifreli alanları AES-256-GCM ile çöz
- [x] 2.8 `lib/notifications/dispatch.ts` güncelle: `dispatchWhatsApp()` fonksiyonu ekle — Inngest event `notification/whatsapp.send` tetikle; Inngest yoksa direkt gönder
- [x] 2.9 Inngest job oluştur: `lib/inngest/functions/send-whatsapp.ts` — `notification/whatsapp.send` event'ini dinle, 3 retry, `sendWhatsApp()` çağır
- [x] 2.10 Webhook API route oluştur: `app/api/webhooks/whatsapp/route.ts` — Meta Cloud API `X-Hub-Signature-256` imza doğrulaması, `delivered`/`read`/`failed` durum güncellemeleri, `Notification` kaydını güncelle
- [x] 2.11 Birim testleri: `apps/web/__tests__/notifications/whatsapp.test.ts` — normalizePhone, sağlayıcı seçimi, simülasyon modu
- [x] 2.12 Property-based testler: `apps/web/__tests__/notifications/whatsapp.property.test.ts` — Property 1 (telefon normalizasyonu), Property 2 (gönderim kaydı), Property 3 (webhook güncelleme)

## Faz 3: Şablon Motoru

- [x] 3.1 `lib/notifications/template-engine.ts` oluştur: `parseTemplate()` — `{{değişken}}` regex ile değişken tespiti, `ParsedTemplate` döndür
- [x] 3.2 `lib/notifications/template-engine.ts`: `renderTemplate()` — değişken ikamesi, eksik değişkenler için `[değişken_adı]` formatı, uyarı log
- [x] 3.3 `lib/notifications/template-engine.ts`: `resolveTemplate()` — DB'den tenant şablonu sorgula; bulunamazsa `lib/notifications/templates.ts` varsayılanına dön
- [x] 3.4 `lib/notifications/template-engine.ts`: `validateTemplateVariables()` — zorunlu değişkenlerin varlığını kontrol et, eksik listesi döndür
- [x] 3.5 `lib/actions/template.actions.ts` oluştur: `createNotificationTemplate`, `updateNotificationTemplate`, `deleteNotificationTemplate` (soft-delete), `getNotificationTemplates`, `getNotificationTemplateById`
- [x] 3.6 `lib/actions/template.actions.ts`: `previewTemplate()` — örnek verilerle şablon render et, önizleme metni döndür
- [x] 3.7 `lib/actions/template.actions.ts`: Şablon kaydetme sırasında `parseTemplate()` çağır, `variables` alanını otomatik güncelle
- [x] 3.8 Birim testleri: `apps/web/__tests__/notifications/template-engine.test.ts` — parseTemplate, renderTemplate, validateTemplateVariables
- [x] 3.9 Property-based testler: `apps/web/__tests__/notifications/template-engine.property.test.ts` — Property 6 (değişken tespiti), Property 7 (render idempotansı), Property 8 (eksik değişken), Property 9 (fallback)

## Faz 4: Bildirim Yöneticisi ve Kanal Yönlendirme

- [x] 4.1 `lib/notifications/notification-manager.ts` oluştur: `NotificationRequest` ve `NotificationResult` arayüzleri
- [x] 4.2 `lib/notifications/notification-manager.ts`: `resolveChannel()` — `CustomerNotificationPreference` sorgula; tercih edilen kanal için aktif sağlayıcı yoksa WhatsApp → SMS → Email fallback; tüm kanallar kapalıysa `null` döndür
- [x] 4.3 `lib/notifications/notification-manager.ts`: `sendNotification()` — kanal çözümle, şablon render et, ilgili dispatch fonksiyonunu çağır; kanal `null` ise `status: "SKIPPED"` ile `Notification` kaydı oluştur
- [x] 4.4 `lib/actions/preference.actions.ts` oluştur: `getCustomerNotificationPreference`, `updateCustomerNotificationPreference` — WhatsApp etkinleştirmede telefon numarası doğrulaması
- [x] 4.5 Birim testleri: `apps/web/__tests__/notifications/notification-manager.test.ts` — kanal seçimi, fallback, SKIPPED durumu
- [x] 4.6 Property-based testler: `apps/web/__tests__/notifications/notification-manager.property.test.ts` — Property 4 (kanal fallback sırası), Property 10 (toplu bildirim tercih filtresi)

## Faz 5: Randevu Hatırlatma Otomasyonu

- [x] 5.1 Inngest job oluştur: `lib/inngest/functions/appointment-reminder.ts` — saatlik cron (`0 * * * *`), önümüzdeki 25 saat içindeki `CONFIRMED` randevuları sorgula
- [x] 5.2 `appointment-reminder.ts`: 24 saat hatırlatma mantığı — `Notification` tablosunda `reminderType: "24H"` kaydı yoksa gönder
- [x] 5.3 `appointment-reminder.ts`: 2 saat hatırlatma mantığı — `Notification` tablosunda `reminderType: "2H"` kaydı yoksa gönder
- [x] 5.4 `appointment-reminder.ts`: Tenant WhatsApp sağlayıcısı varsa `dispatchWhatsApp()`, yoksa `dispatchSms()` kullan
- [x] 5.5 `appointment-reminder.ts`: Mesaj içeriğinde randevu tarihi, saati, servis adresi ve araç plakasını dahil et
- [x] 5.6 `appointment-reminder.ts`: Tüm denemeler başarısız olursa Resend ile tenant admin'e e-posta gönder
- [x] 5.7 Randevu iptal akışı: `lib/actions/appointment.actions.ts` güncelle — iptal edildiğinde `reminderType` ile eşleşen bekleyen `Notification` kayıtlarını `SKIPPED` olarak işaretle
- [x] 5.8 Entegrasyon testleri: `apps/web/__tests__/notifications/appointment-reminder.test.ts` — Property 5 (idempotans), 24H/2H pencere mantığı, iptal akışı

## Faz 6: Toplu Bildirim Gönderimi

- [x] 6.1 `lib/actions/bulk-notification.actions.ts` oluştur: `createBulkCampaign`, `getBulkCampaigns`, `getBulkCampaignById`
- [x] 6.2 `lib/actions/bulk-notification.actions.ts`: `previewBulkCampaign()` — segment kriterlerine göre etkilenecek müşteri sayısını hesapla (ALL, OVERDUE_INVOICE, VEHICLE_BRAND, INACTIVE, ACTIVE segmentleri)
- [x] 6.3 `lib/actions/bulk-notification.actions.ts`: `startBulkCampaign()` — `BulkNotificationCampaign` kaydı oluştur, Inngest `bulk/notification.start` event'i tetikle; yalnızca `TENANT_ADMIN` rolüne izin ver
- [x] 6.4 Inngest job oluştur: `lib/inngest/functions/bulk-notification.ts` — `bulk/notification.start` event'ini dinle, müşteri listesini çek, `CustomerNotificationPreference` filtrele
- [x] 6.5 `bulk-notification.ts`: Upstash Redis sliding window ile dakikada 60 mesaj hız sınırı uygula
- [x] 6.6 `bulk-notification.ts`: Her müşteri için `notification/whatsapp.send` veya `notification/sms.send` event'i tetikle; `bulkCampaignId` ile ilişkilendir
- [x] 6.7 `bulk-notification.ts`: Kampanya tamamlandığında `BulkNotificationCampaign` istatistiklerini güncelle (sentCount, failedCount, skippedCount), Resend ile özet rapor e-postası gönder
- [x] 6.8 `bulk-notification.ts`: `{{musteriAdi}}` ve `{{aracPlaka}}` kişiselleştirme değişkenlerini her müşteri için ayrı ayrı render et
- [x] 6.9 Entegrasyon testleri: `apps/web/__tests__/notifications/bulk-notification.test.ts` — segment filtreleme, rate limit, tercih filtresi

## Faz 7: Bildirim Sağlayıcı Yapılandırması

- [x] 7.1 `lib/actions/notification-provider.actions.ts` oluştur: `getNotificationProviders`, `createNotificationProvider`, `updateNotificationProvider`, `toggleNotificationProvider`
- [x] 7.2 `lib/actions/notification-provider.actions.ts`: `testNotificationProvider()` — test mesajı gönder; başarılıysa kaydet, başarısızsa hata detayını döndür
- [x] 7.3 `lib/actions/notification-provider.actions.ts`: Sağlayıcı kaydetmeden önce `settings` içindeki hassas alanları (apiKey, authToken, accessToken, password) AES-256-GCM ile şifrele
- [x] 7.4 `lib/actions/notification-provider.actions.ts`: Görüntüleme için hassas alanların yalnızca son 4 karakterini döndür
- [x] 7.5 Birim testleri: `apps/web/__tests__/notifications/provider.test.ts` — şifreleme/çözme, test mesajı akışı

## Faz 8: Kullanıcı Arayüzü — Dashboard

- [x] 8.1 Bildirim geçmişi listesi sayfası: `app/(dashboard)/dashboard/notifications/page.tsx` — tarih, kanal, durum, müşteri adı filtreleri; sayfalama (50 kayıt/sayfa); CSV dışa aktarma
- [x] 8.2 Bildirim detay görünümü: `components/dashboard/notifications/NotificationDetailModal.tsx` — mesaj içeriği, alıcı, gönderim zamanı, sağlayıcı yanıtı, retry sayısı; FAILED durumunda yeniden gönder butonu
- [x] 8.3 Bildirim özet kartı: `components/dashboard/notifications/NotificationSummaryCard.tsx` — son 7 günün başarı oranı (SENT / toplam); dashboard ana sayfasına ekle
- [x] 8.4 Şablon yönetim sayfası: `app/(dashboard)/dashboard/notifications/templates/page.tsx` — şablon listesi, oluşturma/düzenleme/silme; SMS için karakter sayacı (160 karakter uyarısı)
- [x] 8.5 Şablon form bileşeni: `components/dashboard/notifications/TemplateForm.tsx` — kanal seçimi, değişken yardımcısı, WhatsApp için HSM alanları (templateName, languageCode), önizleme
- [x] 8.6 Toplu bildirim sayfası: `app/(dashboard)/dashboard/notifications/bulk/page.tsx` — kampanya oluşturma formu, segment seçici, müşteri sayısı önizlemesi, kampanya geçmişi listesi
- [x] 8.7 Sağlayıcı yapılandırma sayfası: `app/(dashboard)/dashboard/settings/notifications/page.tsx` — SMS/WhatsApp/Email sağlayıcıları ayrı bölümler; dinamik form alanları (Twilio: accountSid/authToken/fromNumber, Meta: phoneNumberId/accessToken/wabaId); test mesajı butonu
- [x] 8.8 Tenant varsayılan kanal önceliği ayarı: `app/(dashboard)/dashboard/notifications/preferences/page.tsx` — varsayılan kanal sırası yapılandırması

## Faz 9: Kullanıcı Arayüzü — Müşteri Portalı ve Mobil

- [x] 9.1 Müşteri bildirim tercihleri sayfası: `app/m/musteri/bildirim-tercihleri/page.tsx` — SMS/WhatsApp/Email kanalları ayrı toggle; WhatsApp etkinleştirmede telefon numarası doğrulaması; yalnızca kimliği doğrulanmış müşterilere göster
- [x] 9.2 Müşteri bildirim geçmişi sayfası: `app/m/musteri/bildirimler/page.tsx` — son 30 günün bildirimleri; kanal ikonu, tarih, mesaj özeti; tenant izolasyonu
- [x] 9.3 Mobil uygulama bildirim tercihleri: `apps/mobile/app/(musteri)/bildirimler.tsx` güncelle — kanal toggle'ları, tercih kaydetme API entegrasyonu
- [x] 9.4 API route oluştur: `app/api/m/notification-preferences/route.ts` — GET/PUT; kimlik doğrulama zorunlu; 2 saniye içinde DB güncelleme

## Faz 10: Son Kontroller

- [x] 10.1 Tüm property-based testlerin çalıştığını doğrula (`pnpm --filter web test --run`)
- [x] 10.2 TypeScript tip kontrolü (`pnpm check-types`)
- [x] 10.3 ESLint kontrolü (`pnpm --filter web lint`)
- [x] 10.4 Prisma migration'larının temiz olduğunu doğrula
- [x] 10.5 Ortam değişkenleri dokümantasyonu: `TWILIO_WHATSAPP_NUMBER`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_WABA_ID`, `META_WHATSAPP_WEBHOOK_SECRET`, `NOTIFICATION_ENCRYPTION_KEY`
- [x] 10.6 Inngest fonksiyon kaydını doğrula: `send-whatsapp`, `appointment-reminder`, `bulk-notification` fonksiyonlarının `inngest/index.ts`'e eklendiğini kontrol et
