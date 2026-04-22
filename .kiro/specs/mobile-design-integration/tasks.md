# Tasks — Mobile Design Integration

## Phase 1: Veritabanı ve Altyapı

- [x] 1.1 Prisma schema'ya `Vehicle.imageUrl` alanını ekle
- [x] 1.2 Prisma schema'ya `Mechanic.avatarUrl`, `shiftStart`, `shiftEnd`, `workDays`, `dailyTarget` alanlarını ekle
- [x] 1.3 Prisma schema'ya `ServiceOrder.qualityCheckNotes`, `qualityCheckedAt`, `qualityCheckedBy` alanlarını ekle
- [x] 1.4 Prisma schema'ya `MaintenancePlan` modelini ekle (tenantId, vehicleId, title, dueDate, dueMileage, isCompleted)
- [x] 1.5 Prisma schema'ya `ServiceRating` modelini ekle (tenantId, serviceOrderId, customerId, rating, comment)
- [x] 1.6 `Tenant`, `Vehicle`, `ServiceOrder`, `Customer` modellerine `MaintenancePlan[]` ve `ServiceRating[]` ilişkilerini ekle
- [x] 1.7 Prisma migration oluştur ve uygula (`prisma migrate dev`)
- [x] 1.8 `apps/mobile/constants/theme.ts` dosyasını oluştur (Colors, Radius, Shadow, GradientCTA token'ları)

## Phase 2: Yeni API Endpoint'leri (Web)

- [x] 2.1 `GET /api/mobile/firma/servis/[id]` — Servis detay endpoint'i (vehicle, customer, mechanic, items, checklist)
- [x] 2.2 `PATCH /api/mobile/firma/servis/[id]/kapat` — İş kapatma (qualityCheckNotes, status → COMPLETED, push notification)
- [x] 2.3 `GET /api/mobile/firma/onay` — WAITING_APPROVAL listesi
- [x] 2.4 `POST /api/mobile/firma/onay/[id]` — Onayla/Reddet (action: 'approve' | 'reject', reason?)
- [x] 2.5 `GET /api/mobile/firma/personel/[id]` — Personel detay + performans metrikleri
- [x] 2.6 `GET /api/mobile/firma/stok/hareketler` — Sayfalandırılmış stok hareketleri (page, limit, partId?)
- [x] 2.7 `GET /api/mobile/musteri/servis/[id]` — Müşteri için servis detay (customerId doğrulaması ile)
- [x] 2.8 `POST /api/mobile/musteri/servis/[id]/rating` — ServiceRating kaydı oluştur
- [x] 2.9 `POST /api/mobile/musteri/arac` — Yeni araç kaydı (plate, brand, model, year, imageUrl?)
- [x] 2.10 `GET /api/mobile/musteri/profil` — Müşteri profil + loyalty tier + rewardPoints
- [x] 2.11 Mevcut `GET /api/mobile/firma/panel` endpoint'ini weeklyChart, bayStatus, completedTodayCount alanlarıyla genişlet
- [x] 2.12 Tüm yeni endpoint'lere JWT auth + tenantId izolasyon kontrolü ekle

## Phase 3: Shared Components

- [x] 3.1 `apps/mobile/components/GlassHeader.tsx` — Glass effect header (title, subtitle, rightAction, onBack)
- [x] 3.2 `apps/mobile/components/KpiCard.tsx` — KPI metrik kartı (label, value, icon, variant, trend)
- [x] 3.3 `apps/mobile/components/StatusBadge.tsx` — Pill-shaped durum rozeti (status → renk eşlemesi)
- [x] 3.4 `apps/mobile/components/PrimaryButton.tsx` — Gradient CTA butonu (gradient/outline/ghost variant, loading state)
- [x] 3.5 `apps/mobile/components/ServiceCard.tsx` — Servis emri kartı (priority left-border, ACİL badge)
- [x] 3.6 `apps/mobile/components/MechanicAvatar.tsx` — Avatar (imageUrl veya initials fallback)
- [x] 3.7 `apps/mobile/components/ProgressBar.tsx` — Animated progress bar
- [x] 3.8 `apps/mobile/components/SegmentedControl.tsx` — Tab filter control
- [x] 3.9 `apps/mobile/components/StepIndicator.tsx` — Wizard adım göstergesi
- [x] 3.10 `apps/mobile/lib/api.ts` dosyasını tüm yeni endpoint'lerle genişlet

## Phase 4: Firma — Yeniden Tasarlanacak Ekranlar

- [x] 4.1 `(firma)/panel.tsx` — KPI bento grid (4 kart), haftalık chart, bay status grid, kritik uyarılar, period filter
- [x] 4.2 `(firma)/kuyruk.tsx` — Günlük özet strip, segmented control (Bekleyen/Devam Eden), priority left-border ServiceCard'lar
- [x] 4.3 `(firma)/finans.tsx` — Gradient hero card (gelir/gider/net), haftalık chart, gecikmiş alacaklar listesi
- [x] 4.4 `(firma)/personel.tsx` — Özet satırı (Aktif Usta/Açık İş/Ort. Yük), MechanicAvatar'lı kart listesi, personel detay navigasyonu
- [x] 4.5 `(firma)/stok.tsx` — Kritik stok kartları (kırmızı left-border), son hareketler (IN/OUT renk kodlaması), Barkod Tara butonu
- [x] 4.6 `(firma)/_layout.tsx` — Tab navigator'ı Obsidian renk tokenlarıyla güncelle (navy shadow, borderTopColor kaldır)

## Phase 5: Firma — Yeni Ekranlar (Servis İşlemleri)

- [x] 5.1 `(firma)/servis-detay/[id].tsx` — Vehicle hero, müşteri/usta bilgisi, inspection checklist, tamamlanma yüzdesi, "İşi Kapat" / "Parça Talep Et" butonları
- [x] 5.2 `(firma)/is-kapat/[id].tsx` — Quality control checklist, qualityCheckNotes textarea, submit → COMPLETED + push notification
- [x] 5.3 `(firma)/onay.tsx` — WAITING_APPROVAL listesi, onayla/reddet action'ları, red gerekçesi modal
- [x] 5.4 `(firma)/barkod.tsx` — expo-camera ile barkod tarayıcı, parça arama sonucu, izin yönetimi

## Phase 6: Firma — Yeni Ekranlar (Stok & Depo)

- [x] 6.1 `(firma)/depolar.tsx` — Depo listesi (isim, lokasyon, toplam kalem sayısı)
- [x] 6.2 `(firma)/depo/[id].tsx` — Depo stok detayı (parça listesi, mevcut/minimum stok)
- [x] 6.3 `(firma)/parca-talep.tsx` — Parça talep formu (depo seçimi, parça, miktar)
- [x] 6.4 `(firma)/stok-guncelle/[id].tsx` — Stok güncelleme formu (miktar, hareket tipi, açıklama)
- [x] 6.5 `(firma)/stok-hareketler.tsx` — Sayfalandırılmış stok hareketleri (IN/OUT/ADJUST renk kodlaması)

## Phase 7: Firma — Yeni Ekranlar (Personel & Vardiya)

- [x] 7.1 `(firma)/personel/[id].tsx` — Personel profil (avatar, uzmanlıklar, iletişim, aktif iş listesi)
- [x] 7.2 `(firma)/personel-performans.tsx` — Performans metrikleri (tamamlanan iş, ort. süre, puan)
- [x] 7.3 `(firma)/vardiya.tsx` — Haftalık vardiya takvimi (tüm ustalar, shiftStart/shiftEnd/workDays)

## Phase 8: Firma — Yeni Ekranlar (Finans & Raporlar)

- [x] 8.1 `(firma)/gelir-raporu.tsx` — Aylık gelir dağılımı (kategoriye göre)
- [x] 8.2 `(firma)/servis-raporu.tsx` — Servis operasyon metrikleri
- [x] 8.3 `(firma)/raporlar.tsx` — İndirilebilir raporlar listesi (PDF export)
- [x] 8.4 `(firma)/tahsilat-ekle.tsx` — Yeni tahsilat formu (müşteri, tutar, ödeme yöntemi)
- [x] 8.5 `(firma)/tahsilatlar.tsx` — Sayfalandırılmış tahsilat listesi
- [x] 8.6 `(firma)/tahsilat/[id].tsx` — Tahsilat detay + makbuz görünümü
- [x] 8.7 `(firma)/fatura/[id].tsx` — Fatura detay (kalemler, KDV, toplam, ödeme durumu)

## Phase 9: Firma — Yeni Ekranlar (Yardımcı)

- [x] 9.1 `(firma)/bildirimler.tsx` — Bildirim listesi (okundu/okunmadı durumu)
- [x] 9.2 `(firma)/ayarlar.tsx` — Uygulama ayarları (dil, bildirimler, biyometrik)
- [x] 9.3 `(firma)/destek.tsx` — SSS ve destek iletişim seçenekleri
- [x] 9.4 `(firma)/mesajlar.tsx` — Usta/müşteri mesajlaşma ekranı
- [x] 9.5 `(firma)/hizmetler.tsx` — Hizmet kataloğu (isim, fiyat, süre)

## Phase 10: Müşteri — Yeniden Tasarlanacak Ekranlar

- [x] 10.1 `(musteri)/panel.tsx` — Aktif servis hero card (plaka, ilerleme, tahmini teslim), 2x2 quick actions, son işlemler
- [x] 10.2 `(musteri)/takip.tsx` — Timeline progress, WAITING_APPROVAL onay banner'ı, onayla/reddet action'ları
- [x] 10.3 `(musteri)/gecmis.tsx` — Arama çubuğu, servis geçmişi kartları (plaka, tarih, tutar, durum badge)
- [x] 10.4 `(musteri)/randevu.tsx` — 3-adım wizard: (1) Araç seç → (2) Hizmet/tarih seç → (3) Özet + onayla
- [x] 10.5 `(musteri)/profil.tsx` — Loyalty hero card (tier badge, puan), tier progress bar, ödül marketplace, QR kod
- [x] 10.6 `(musteri)/_layout.tsx` — Tab navigator'ı Obsidian renk tokenlarıyla güncelle

## Phase 11: Müşteri — Yeni Ekranlar (Servis & Araç)

- [x] 11.1 `(musteri)/servis/[id].tsx` — Servis detay (araç, usta, durum timeline, belgeler, rating prompt)
- [x] 11.2 `(musteri)/arac-ekle.tsx` — 3-adım wizard: (1) Bilgiler (plaka/marka/model/yıl/fotoğraf) → (2) Belgeler → (3) Onay

## Phase 12: Müşteri — Yeni Ekranlar (Ödeme)

- [x] 12.1 `(musteri)/odeme.tsx` — Fatura detay + ödeme yöntemi seçimi
- [x] 12.2 `(musteri)/odeme-taksit.tsx` — Taksit planı seçenekleri
- [x] 12.3 `(musteri)/makbuz/[id].tsx` — Ödeme makbuzu (indir/paylaş)
- [x] 12.4 `(musteri)/kartlar.tsx` — Kayıtlı kartlar (ekle/sil)
- [x] 12.5 `(musteri)/odemeler.tsx` — Ödeme geçmişi listesi

## Phase 13: Müşteri — Yeni Ekranlar (Onboarding & Diğer)

- [x] 13.1 `(musteri)/onboarding.tsx` — İlk açılış feature highlight ekranları (swipeable)
- [x] 13.2 `(auth)/sms-dogrula.tsx` — 6 haneli OTP girişi, yeniden gönder, hata yönetimi
- [x] 13.3 `(musteri)/mesajlar.tsx` — Usta ile mesajlaşma thread'leri
- [x] 13.4 `(musteri)/bildirimler.tsx` — Bildirim listesi (okundu/okunmadı)
- [x] 13.5 `(musteri)/belgeler/[id].tsx` — Servis belgeleri (indir/paylaş)

## Phase 14: Testler

- [x] 14.1 `apps/mobile/__tests__/properties/theme.property.test.ts` — P1: Renk token tutarlılığı (fast-check, 100+ iterasyon)
- [x] 14.2 `apps/mobile/__tests__/properties/card-components.property.test.ts` — P2: Kart border radius minimum değeri
- [x] 14.3 `apps/mobile/__tests__/properties/touch-targets.property.test.ts` — P3: Touch target minimum 48dp
- [x] 14.4 `apps/mobile/__tests__/properties/shadow.property.test.ts` — P4: Navy shadow renk doğrulaması
- [x] 14.5 `apps/mobile/__tests__/properties/service-card.property.test.ts` — P5: Servis kartı öncelik renk eşlemesi
- [x] 14.6 `apps/mobile/__tests__/properties/overdue-color.property.test.ts` — P6: Gecikmiş alacak renk uygulaması
- [x] 14.7 `apps/mobile/__tests__/properties/checklist.property.test.ts` — P7: Checklist tamamlanma yüzdesi hesabı
- [x] 14.8 `apps/mobile/__tests__/properties/tier-progress.property.test.ts` — P8: Tier ilerleme yüzdesi hesabı
- [x] 14.9 `apps/web/__tests__/api/mobile/firma-servis.test.ts` — Servis detay API entegrasyon testi
- [x] 14.10 `apps/web/__tests__/api/mobile/firma-onay.test.ts` — Onay API entegrasyon testi
- [x] 14.11 `apps/web/__tests__/api/mobile/musteri-profil.test.ts` — Müşteri profil API entegrasyon testi
