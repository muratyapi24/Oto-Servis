# Görevler — Web-Mobile Senkronizasyonu

## Faz 1: Dashboard — Yeni DB Alanları Entegrasyonu

- [x] 1.1 `/dashboard/vehicles/[id]` sayfasına `Vehicle.imageUrl` fotoğraf kartı ekle (16:9 görüntü, placeholder, S3 yükleme butonu)
- [x] 1.2 `lib/actions/vehicle.actions.ts`'e `updateVehicleImage` Server Action ekle
- [x] 1.3 `/dashboard/mechanics/[id]` sayfasına `avatarUrl`, `shiftStart`, `shiftEnd`, `workDays`, `dailyTarget` alanlarını ekle
- [x] 1.4 `lib/validations/mechanic.ts`'e `shiftUpdateSchema` Zod şeması ekle (HH:MM regex doğrulaması)
- [x] 1.5 Usta düzenleme formuna vardiya alanlarını ekle ve `PATCH /api/dashboard/mechanics/[id]` ile kaydet
- [x] 1.6 `/dashboard/services/[id]` sayfasına `QualityControlSection` bileşeni ekle (`qualityCheckNotes`, `qualityCheckedAt`, `qualityCheckedBy`)
- [x] 1.7 `lib/actions/quality-check.actions.ts` Server Action oluştur (`updateQualityCheck` — `qualityCheckedBy` oturum kullanıcısından, `qualityCheckedAt` otomatik)
- [x] 1.8 `/dashboard/services/[id]` sayfasına `ServiceRatingSection` bileşeni ekle (yıldız gösterimi, yorum, tarih — salt okunur)
- [x] 1.9 `/dashboard/analytics` sayfasına "Müşteri Memnuniyeti" bölümü ekle (ortalama puan, puan dağılımı 1-5, son 30 gün)
- [x] 1.10 `/dashboard/vehicles/[id]` sayfasına "Bakım Planları" sekmesi ekle (`MaintenancePlansTab` bileşeni — liste, yeni plan formu, gecikmiş plan kırmızı vurgu)
- [x] 1.11 `lib/actions/maintenance-plan.actions.ts` Server Action oluştur (`createMaintenancePlan`, `updateMaintenancePlan`, `deleteMaintenancePlan`)
- [x] 1.12 `lib/validations/maintenance-plan.ts` Zod şeması oluştur (`createMaintenancePlanSchema`, `updateMaintenancePlanSchema`)
- [x] 1.13 `/dashboard/staff` sayfasına "Vardiya Takvimi" sekmesi ekle (`ShiftCalendarView` — tablo: satır=usta, sütun=gün, inline düzenleme)
- [x] 1.14 `/dashboard/inventory` sayfasına "Stok Hareketleri" sekmesi ekle (`StockMovementsTab` — IN/OUT/ADJUST renk kodlaması, parça adı arama, tarih aralığı filtresi)

## Faz 2: Yeni Dashboard API Endpoint'leri

- [x] 2.1 `GET /api/dashboard/ratings` — Sayfalandırılmış `ServiceRating` listesi (tenantId izolasyonu)
- [x] 2.2 `GET /api/dashboard/ratings/stats` — Ortalama puan, toplam sayı, 1-5 dağılımı (son 30 gün)
- [x] 2.3 `DELETE /api/dashboard/ratings/[id]` — Yalnızca `TENANT_ADMIN` rolü
- [x] 2.4 `GET /api/dashboard/maintenance-plans?vehicleId={id}` — Araç bazlı bakım planları (`isOverdue` computed alanı dahil)
- [x] 2.5 `POST /api/dashboard/maintenance-plans` — Zod doğrulaması + yeni kayıt
- [x] 2.6 `PATCH /api/dashboard/maintenance-plans/[id]` — `isCompleted`, `dueDate`, `dueMileage`, `title` güncelleme
- [x] 2.7 `DELETE /api/dashboard/maintenance-plans/[id]` — 204 No Content

## Faz 3: Web Firma Portalı — Servis İşlemleri Ekranları

- [x] 3.1 `/m/firma/servis-detay/[id]/page.tsx` — Araç hero, müşteri/usta bilgisi, ilerleme çubuğu, "İşi Kapat" ve "Parça Talep Et" butonları (`GET /api/mobile/firma/servis/[id]`)
- [x] 3.2 `/m/firma/is-kapat/[id]/page.tsx` — Servis özeti, `qualityCheckNotes` textarea (zorunlu), "İşi Kapat ve Tamamla" butonu (`PATCH /api/mobile/firma/servis/[id]/kapat`)
- [x] 3.3 `/m/firma/onay/page.tsx` — `WAITING_APPROVAL` listesi, onayla/reddet butonları, red gerekçesi modal (`GET /api/mobile/firma/onay`, `POST /api/mobile/firma/onay/[id]`)
- [x] 3.4 `/m/firma/barkod/page.tsx` — Tarayıcı kamera API (`navigator.mediaDevices.getUserMedia`), barkod okuma, parça arama sonucu, kamera izni reddedilince manuel giriş alanı

## Faz 4: Web Firma Portalı — Stok & Depo Ekranları

- [x] 4.1 `/m/firma/depolar/page.tsx` — Depo listesi (isim, lokasyon, kalem sayısı) (`GET /api/mobile/firma/depolar`)
- [x] 4.2 `/m/firma/depo/[id]/page.tsx` — Depo stok detayı (parça adı, mevcut/minimum stok, uyarı vurgusu) (`GET /api/mobile/firma/depolar/[id]`)
- [x] 4.3 `/m/firma/parca-talep/page.tsx` — Depo seçimi, parça seçimi, miktar formu, yetersiz stok uyarısı (`POST /api/mobile/firma/stok/talep`)
- [x] 4.4 `/m/firma/stok-guncelle/[id]/page.tsx` — Parça adı, mevcut stok, hareket tipi seçimi (IN/OUT/ADJUST), miktar formu (`POST /api/mobile/firma/stok/[id]/guncelle`)
- [x] 4.5 `/m/firma/stok-hareketler/page.tsx` — Sayfalandırılmış stok hareketleri, IN/OUT/ADJUST renk kodlaması, infinite scroll (`GET /api/mobile/firma/stok/hareketler`)

## Faz 5: Web Firma Portalı — Personel & Vardiya Ekranları

- [x] 5.1 `/m/firma/personel/[id]/page.tsx` — Usta profil (avatar/baş harf, uzmanlıklar, iletişim), aktif servis emirleri, vardiya saatleri, günlük hedef ilerleme çubuğu (`GET /api/mobile/firma/personel/[id]`)
- [x] 5.2 `/m/firma/personel-performans/page.tsx` — Tüm ustaların performans kartları (tamamlanan iş, ort. süre, ort. puan), dönem filtresi (Bu Hafta/Bu Ay)
- [x] 5.3 `/m/firma/vardiya/page.tsx` — Haftalık vardiya çizelgesi tablosu (satır=usta, sütun=gün), `shiftStart`/`shiftEnd`/`workDays` gösterimi, "Vardiya tanımlanmamış" fallback

## Faz 6: Web Firma Portalı — Finans & Raporlar Ekranları

- [x] 6.1 `/m/firma/gelir-raporu/page.tsx` — Aylık gelir toplamı, kategoriye göre dağılım (İşçilik/Parça/Diğer), ay seçici, PDF indirme (jsPDF) (`GET /api/mobile/firma/finans/gelir-raporu`)
- [x] 6.2 `/m/firma/servis-raporu/page.tsx` — Toplam servis sayısı, ort. tamamlama süresi, ort. müşteri puanı, statüs dağılımı, dönem filtresi
- [x] 6.3 `/m/firma/raporlar/page.tsx` — Rapor türleri listesi (Gelir/Servis/Stok), ilgili sayfalara yönlendirme, PDF indirme butonları
- [x] 6.4 `/m/firma/tahsilat-ekle/page.tsx` — Müşteri seçimi, tutar, ödeme yöntemi (CASH/CREDIT_CARD/BANK_TRANSFER), not alanı, sıfır/negatif tutar validasyonu (`POST /api/mobile/firma/finans/tahsilat`)
- [x] 6.5 `/m/firma/tahsilatlar/page.tsx` — Sayfalandırılmış tahsilat listesi (müşteri adı, tutar, yöntem, tarih), "Yeni Tahsilat" butonu (`GET /api/mobile/firma/finans/tahsilatlar`)
- [x] 6.6 `/m/firma/tahsilat/[id]/page.tsx` — Tahsilat detayı (müşteri, tutar, yöntem, tarih, servis emri), PDF makbuz indirme (`GET /api/mobile/firma/finans/tahsilat/[id]`)
- [x] 6.7 `/m/firma/fatura/[id]/page.tsx` — Fatura detayı (numara, müşteri, kalem listesi, KDV, toplam, ödeme durumu rozeti), PDF indirme (`GET /api/mobile/firma/finans/fatura/[id]`)

## Faz 7: Web Firma Portalı — Yardımcı Ekranlar

- [x] 7.1 `/m/firma/bildirimler/page.tsx` — Bildirim listesi (başlık, mesaj, tarih, okundu/okunmadı), tekil okundu işaretleme, "Tümünü Okundu İşaretle" butonu (`GET /api/mobile/firma/bildirimler`, `PATCH /api/mobile/firma/bildirimler/[id]/oku`)
- [x] 7.2 `/m/firma/mesajlar/page.tsx` — Konuşma listesi, mesaj geçmişi, mesaj gönderme alanı, SSE ile gerçek zamanlı güncelleme (`GET/POST /api/mobile/firma/mesajlar`)
- [x] 7.3 `/m/firma/hizmetler/page.tsx` — Hizmet kataloğu (isim, fiyat, tahmini süre), boş durum mesajı (`GET /api/mobile/firma/hizmetler`)
- [x] 7.4 `/m/firma/destek/page.tsx` — SSS accordion listesi, destek talebi formu (konu + açıklama), "Talebiniz alındı" onay mesajı (`POST /api/mobile/firma/destek`)

## Faz 8: Web Firma Portalı — Yeni API Endpoint'leri

- [x] 8.1 `GET /api/mobile/firma/finans/gelir-raporu?month=YYYY-MM` — Aylık gelir + kategoriye göre dağılım (İşçilik/Parça/Diğer)
- [x] 8.2 `GET /api/mobile/firma/finans/tahsilatlar?page&limit` — Sayfalandırılmış `Payment` listesi (`paymentType: INCOMING`)
- [x] 8.3 `POST /api/mobile/firma/finans/tahsilat` — Zod doğrulaması + yeni `Payment` kaydı (`createTahsilatSchema`)
- [x] 8.4 `GET /api/mobile/firma/finans/tahsilat/[id]` — Tahsilat detayı + müşteri bilgisi
- [x] 8.5 `GET /api/mobile/firma/finans/fatura/[id]` — Fatura detayı + kalem listesi
- [x] 8.6 `GET /api/mobile/firma/bildirimler` — Kullanıcıya ait `Notification` listesi
- [x] 8.7 `PATCH /api/mobile/firma/bildirimler/[id]/oku` — Bildirimi okundu işaretle
- [x] 8.8 `GET /api/mobile/firma/hizmetler` — Tenant'a ait aktif hizmet listesi (`PartCategory` veya `Part` tabanlı)
- [x] 8.9 `POST /api/mobile/firma/destek` — Destek talebi kaydı + 201 Created
- [x] 8.10 `GET /api/mobile/firma/mesajlar` — Aktif konuşma listesi (`Message` modeli)
- [x] 8.11 `POST /api/mobile/firma/mesajlar` — Yeni mesaj kaydı + SSE ile alıcıya bildirim
- [x] 8.12 `GET /api/mobile/firma/finans/servis-raporu?period=week|month` — Servis operasyon metrikleri

## Faz 9: Web Müşteri Portalı — Yeni Ekranlar

- [x] 9.1 `/m/musteri/servis/[id]/page.tsx` — Araç bilgisi, servis türü, usta, durum zaman çizelgesi, belgeler bölümü, `ServiceRating` formu (tamamlanmış + değerlendirilmemiş ise) (`GET /api/mobile/musteri/servis/[id]`, `POST /api/mobile/musteri/servis/[id]/rating`)
- [x] 9.2 `/m/musteri/odeme/page.tsx` — Ödenmemiş fatura detayı, ödeme yöntemi seçimi, "Öde" butonu, başarısızlık durumunda form sıfırlanmaz (`POST /api/musteri/odeme`)
- [x] 9.3 `/m/musteri/odeme-taksit/page.tsx` — Taksit seçenekleri (2/3/6/12), aylık tutar hesabı, onay sonrası taksit özeti (`POST /api/musteri/odeme-taksit`)
- [x] 9.4 `/m/musteri/makbuz/[id]/page.tsx` — Makbuz detayı (tutar, tarih, yöntem, servis emri), PDF indirme, 404 fallback (`GET /api/musteri/makbuz/[id]`)
- [x] 9.5 `/m/musteri/kartlar/page.tsx` — Kayıtlı kart listesi (son 4 hane, tip, son kullanma), Stripe Elements ile kart ekleme, silme onay dialogu (`GET /api/musteri/kartlar`, `DELETE /api/musteri/kartlar/[id]`)
- [x] 9.6 `/m/musteri/odemeler/page.tsx` — Sayfalandırılmış ödeme geçmişi (tutar, yöntem, tarih, servis emri), makbuz sayfasına yönlendirme (`GET /api/musteri/odemeler`)
- [x] 9.7 `/m/musteri/onboarding/page.tsx` — 4 özellik tanıtım slaydı (Servis Takibi, Randevu, Ödeme, Belgeler), "Başla" butonu localStorage'a tamamlandı kaydeder, tekrar göstermez
- [x] 9.8 `/m/musteri/bildirimler/page.tsx` — Bildirim listesi (başlık, mesaj, tarih, okundu/okunmadı), tekil ve toplu okundu işaretleme (`GET /api/musteri/bildirimler`, `PATCH /api/musteri/bildirimler/[id]/oku`)

## Faz 10: Web Müşteri Portalı — Yeni API Endpoint'leri

- [x] 10.1 `GET /api/musteri/odemeler?page&limit` — Müşteriye ait `Payment` listesi (sahiplik doğrulaması)
- [x] 10.2 `GET /api/musteri/makbuz/[id]` — Makbuz detayı (müşteri sahipliği kontrolü)
- [x] 10.3 `GET /api/musteri/kartlar` — Stripe'tan kayıtlı `PaymentMethod` listesi
- [x] 10.4 `DELETE /api/musteri/kartlar/[id]` — Stripe'tan kart silme
- [x] 10.5 `GET /api/musteri/bildirimler` — Müşteriye ait `Notification` listesi
- [x] 10.6 `PATCH /api/musteri/bildirimler/[id]/oku` — Bildirimi okundu işaretle
- [x] 10.7 `POST /api/musteri/odeme` — Ödeme işlemi (Stripe veya doğrudan `Payment` kaydı)
- [x] 10.8 `POST /api/musteri/odeme-taksit` — Taksit planı oluşturma

## Faz 11: Property-Based Testler

- [x] 11.1 `apps/web/__tests__/properties/shift-validation.property.test.ts` — P1: `formatShiftTime` her zaman "HH:MM – HH:MM" pattern'i döndürür (fast-check, 100+ iterasyon)
- [x] 11.2 `apps/web/__tests__/properties/shift-validation.property.test.ts` — P2: `shiftUpdateSchema` HH:MM formatına uymayan her string'i reddeder
- [x] 11.3 `apps/web/__tests__/properties/rating-stats.property.test.ts` — P3: `calculateRatingAverage` her zaman [1, 5] aralığında sonuç döndürür
- [x] 11.4 `apps/web/__tests__/properties/rating-stats.property.test.ts` — P4: Puan dağılımı kategorilerinin toplamı toplam kayıt sayısına eşittir
- [x] 11.5 `apps/web/__tests__/properties/maintenance-plan.property.test.ts` — P5: `isOverdue` geçmiş tarih + `isCompleted: false` için her zaman `true` döndürür
- [x] 11.6 `apps/web/__tests__/properties/maintenance-plan.property.test.ts` — P6: `createMaintenancePlanSchema` geçersiz giriş verilerini reddeder

## Faz 12: Entegrasyon Testleri

- [x] 12.1 `apps/web/__tests__/api/dashboard/ratings.test.ts` — `GET /api/dashboard/ratings` sayfalandırma + tenantId izolasyonu
- [x] 12.2 `apps/web/__tests__/api/dashboard/ratings.test.ts` — `DELETE /api/dashboard/ratings/[id]` TENANT_ADMIN rol kontrolü
- [x] 12.3 `apps/web/__tests__/api/dashboard/maintenance-plans.test.ts` — `POST` Zod doğrulaması + `GET` vehicleId filtresi
- [x] 12.4 `apps/web/__tests__/api/mobile/firma-finans.test.ts` — `POST /api/mobile/firma/finans/tahsilat` Payment kaydı + sıfır tutar reddi
- [x] 12.5 `apps/web/__tests__/api/mobile/firma-finans.test.ts` — `GET /api/mobile/firma/finans/tahsilatlar` sayfalandırma
- [x] 12.6 `apps/web/__tests__/api/musteri/odemeler.test.ts` — `GET /api/musteri/odemeler` müşteri sahipliği doğrulaması
