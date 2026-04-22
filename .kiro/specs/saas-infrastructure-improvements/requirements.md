# Gereksinimler — SaaS Altyapı İyileştirmeleri

## Genel Bakış

Bu spec, mevcut MS Otoservis SaaS platformunun bulut altyapısı analizinde tespit edilen eksiklikleri gidermek ve platformu tam anlamıyla production-ready seviyeye çıkarmak için hazırlanmıştır. Tespitler iki kaynaktan birleştirilmiştir: `Docs/bulut_mimari_analizi.md` ve kod tabanı incelemesi.

Mevcut uyum oranı **~%71** olup bu plan tamamlandığında **%95+** hedeflenmektedir.

---

## FAZ 1 — Acil (Canlıya Çıkmadan Önce)

### Gereksinim 1: Hata İzleme ve Loglama (Sentry)

**Kullanıcı Hikayesi:** Platform yöneticisi olarak, canlı ortamda oluşan frontend ve backend hatalarını gerçek zamanlı görmek istiyorum; böylece kullanıcılar etkilenmeden önce müdahale edebileyim.

**Kabul Kriterleri:**
- [ ] `@sentry/nextjs` paketi kurulmuş ve yapılandırılmış olmalı
- [ ] Client-side (tarayıcı) JavaScript hataları Sentry'e iletilmeli
- [ ] Server-side (API route, Server Action) hataları Sentry'e iletilmeli
- [ ] Her hata kaydında tenant bilgisi (tenantId) etiket olarak yer almalı
- [ ] Source map'ler production build'de Sentry'e yüklenmeli
- [ ] `SENTRY_DSN` ortam değişkeni tanımlanmış olmalı
- [ ] Hata oranı eşiği aşıldığında alert tetiklenmeli (Sentry dashboard üzerinden)

**Doğruluk Özellikleri (Property-Based Testing):**
- P1.1: Herhangi bir Server Action'da fırlatılan hata, Sentry'e iletilmeli ve `console.error` ile de loglanmalı
- P1.2: Tenant bağlamı olan her hata kaydında `tenantId` etiketi boş olmamalı

---

### Gereksinim 2: Rate Limiting

**Kullanıcı Hikayesi:** Sistem güvenlik yöneticisi olarak, API endpoint'lerine yapılan aşırı istekleri otomatik olarak engellemek istiyorum; böylece brute-force ve DDoS saldırılarına karşı korunabileyim.

**Kabul Kriterleri:**
- [ ] `/api/auth` (login) endpoint'i: IP başına dakikada maksimum 10 istek
- [ ] `/api/upload` endpoint'i: IP başına dakikada maksimum 5 istek
- [ ] `/api/approval` endpoint'i: token başına maksimum 3 deneme
- [ ] Limit aşıldığında `429 Too Many Requests` HTTP yanıtı dönmeli
- [ ] Rate limit bilgisi response header'larında yer almalı (`X-RateLimit-Remaining`)
- [ ] Middleware seviyesinde uygulanmalı (her route'a ayrı ayrı eklenmemeli)
- [ ] Geliştirme ortamında rate limiting devre dışı bırakılabilmeli

**Doğruluk Özellikleri:**
- P2.1: Aynı IP'den N+1. istek (N = limit), her zaman 429 dönmeli
- P2.2: Farklı IP'lerden gelen istekler birbirinin limitini etkilememeli
- P2.3: Limit penceresi (window) süresi dolduğunda sayaç sıfırlanmalı

---

### Gereksinim 3: PWA Desteği

**Kullanıcı Hikayesi:** Mobil kullanıcı olarak, uygulamayı telefonumun ana ekranına ekleyebilmek ve temel sayfaları internet bağlantısı olmadan görüntüleyebilmek istiyorum.

**Kabul Kriterleri:**
- [ ] `manifest.json` (veya `manifest.webmanifest`) oluşturulmuş ve `<head>`'e eklenmiş olmalı
- [ ] Manifest içinde: `name`, `short_name`, `icons` (192x192, 512x512), `theme_color`, `background_color`, `display: standalone` tanımlı olmalı
- [ ] Service Worker kayıtlı olmalı
- [ ] Offline fallback sayfası (`/offline`) mevcut olmalı
- [ ] Lighthouse PWA skoru minimum 80 olmalı
- [ ] iOS Safari'de "Ana Ekrana Ekle" çalışmalı (`apple-touch-icon` meta tag'i)
- [ ] Android Chrome'da "Uygulamayı Yükle" banner'ı gösterilmeli

**Doğruluk Özellikleri:**
- P3.1: Service Worker kurulumu tamamlandıktan sonra `/offline` sayfası ağ bağlantısı olmadan erişilebilir olmalı
- P3.2: Manifest dosyası geçerli JSON formatında olmalı ve zorunlu alanları içermeli

---

### Gereksinim 4: Health Check Endpoint

**Kullanıcı Hikayesi:** DevOps mühendisi olarak, deployment sonrasında ve monitoring araçlarıyla servisin sağlıklı çalışıp çalışmadığını tek bir endpoint üzerinden kontrol etmek istiyorum.

**Kabul Kriterleri:**
- [ ] `GET /api/health` endpoint'i mevcut olmalı
- [ ] Yanıt: `{ status: "ok", db: "connected", timestamp: "..." }`
- [ ] Veritabanı bağlantısı kontrol edilmeli; bağlantı yoksa `503` dönmeli
- [ ] Yanıt süresi 500ms altında olmalı
- [ ] Endpoint authentication gerektirmemeli (public)

**Doğruluk Özellikleri:**
- P4.1: DB bağlantısı sağlıklıyken endpoint her zaman `200 OK` dönmeli
- P4.2: DB bağlantısı kesildiğinde endpoint `503 Service Unavailable` dönmeli

---

## FAZ 2 — Kısa Vadeli (İlk 3 Ay)

### Gereksinim 5: Redis Önbellekleme

**Kullanıcı Hikayesi:** Firma yöneticisi olarak, dashboard'un hızlı yüklenmesini istiyorum; her sayfa açılışında veritabanının yeniden sorgulanması yerine önbellekten veri gelmeli.

**Kabul Kriterleri:**
- [ ] Upstash Redis (serverless) veya self-hosted Redis entegre edilmeli
- [ ] Dashboard KPI metrikleri 5 dakika önbelleklenmeli
- [ ] Parça/stok listesi 10 dakika önbelleklenmeli
- [ ] Müşteri listesi (sayfalı) 2 dakika önbelleklenmeli
- [ ] Cache invalidation: ilgili veri güncellendiğinde önbellek temizlenmeli
- [ ] Cache hit/miss oranı loglanmalı
- [ ] `REDIS_URL` ortam değişkeni tanımlanmış olmalı

**Doğruluk Özellikleri:**
- P5.1: Önbelleklenmiş veri, TTL süresi dolmadan her zaman aynı sonucu dönmeli
- P5.2: Veri güncellemesi sonrası ilgili cache key silinmeli; bir sonraki istek taze veri getirmeli
- P5.3: Redis bağlantısı kesildiğinde sistem çökmemeli, DB'den fallback yapmalı

---

### Gereksinim 6: Real-time Güncellemeler (SSE)

**Kullanıcı Hikayesi:** Servis resepsiyonisti olarak, servis emri durumu değiştiğinde sayfayı yenilemeden anlık bildirim almak istiyorum.

**Kabul Kriterleri:**
- [ ] Server-Sent Events (SSE) endpoint'i: `GET /api/events/[tenantId]`
- [ ] Servis emri durum değişikliği (PENDING → IN_PROGRESS → COMPLETED) SSE ile yayınlanmalı
- [ ] Müşteri onay durumu değişikliği SSE ile yayınlanmalı
- [ ] Yeni randevu oluşturulduğunda SSE ile bildirim gönderilmeli
- [ ] Bağlantı koptuğunda client otomatik yeniden bağlanmalı (EventSource retry)
- [ ] Tenant izolasyonu: her tenant sadece kendi event'lerini almalı

**Doğruluk Özellikleri:**
- P6.1: Tenant A'nın event'leri Tenant B'nin SSE bağlantısına iletilmemeli
- P6.2: Durum değişikliği DB'ye yazıldıktan sonra maksimum 2 saniye içinde SSE event'i yayınlanmalı

---

### Gereksinim 7: Web Push Bildirimleri

**Kullanıcı Hikayesi:** Müşteri olarak, aracımın servis durumu değiştiğinde tarayıcı bildirimi almak istiyorum; böylece uygulamayı sürekli açık tutmak zorunda kalmayayım.

**Kabul Kriterleri:**
- [ ] Web Push API entegrasyonu (VAPID key'leri oluşturulmuş)
- [ ] Kullanıcı bildirim iznini kabul ettiğinde subscription DB'ye kaydedilmeli
- [ ] Servis emri durum değişikliğinde push bildirim gönderilmeli
- [ ] Randevu hatırlatması (1 gün önce) push bildirim olarak gönderilmeli
- [ ] Kullanıcı bildirimleri devre dışı bırakabilmeli
- [ ] `VAPID_PUBLIC_KEY` ve `VAPID_PRIVATE_KEY` ortam değişkenleri tanımlı olmalı

**Doğruluk Özellikleri:**
- P7.1: Bildirim izni verilmemiş kullanıcıya push gönderilmemeli
- P7.2: Geçersiz/süresi dolmuş subscription silinmeli, hata fırlatılmamalı

---

### Gereksinim 8: Background Job Sistemi

**Kullanıcı Hikayesi:** Platform yöneticisi olarak, e-posta ve SMS gönderimlerinin kullanıcı isteğini bloke etmemesini ve başarısız gönderimler için otomatik yeniden deneme yapılmasını istiyorum.

**Kabul Kriterleri:**
- [ ] Inngest veya BullMQ ile async job queue kurulmalı
- [ ] E-posta gönderimi async job'a taşınmalı
- [ ] SMS gönderimi async job'a taşınmalı
- [ ] Başarısız job'lar için exponential backoff ile 3 kez yeniden deneme
- [ ] Job durumu (pending/running/failed/completed) izlenebilir olmalı
- [ ] Günlük bakım hatırlatma job'ı (nextMaintenanceDate yaklaşan araçlar)

**Doğruluk Özellikleri:**
- P8.1: Job başarısız olduğunda retryCount artmalı ve maksimum 3 denemeden sonra FAILED durumuna geçmeli
- P8.2: Aynı job iki kez tetiklense bile idempotent çalışmalı (duplicate bildirim gönderilmemeli)

---

### Gereksinim 9: 2FA (İki Faktörlü Doğrulama)

**Kullanıcı Hikayesi:** Firma yöneticisi olarak, hesabıma yetkisiz erişimi önlemek için iki faktörlü doğrulama aktif etmek istiyorum.

**Kabul Kriterleri:**
- [ ] TOTP (Time-based One-Time Password) desteği — Google Authenticator uyumlu
- [ ] QR kod ile authenticator app kurulumu
- [ ] `hasTwoFactor` alanı `true` olan kullanıcılar login sonrası TOTP kodu istenmeli
- [ ] Yedek kodlar (backup codes) oluşturulabilmeli
- [ ] 2FA devre dışı bırakma şifre doğrulaması gerektirmeli
- [ ] `otpauth://` URI formatı desteklenmeli

**Doğruluk Özellikleri:**
- P9.1: Geçerli TOTP kodu ile giriş her zaman başarılı olmalı
- P9.2: Süresi dolmuş (30 saniyeden eski) TOTP kodu reddedilmeli
- P9.3: Aynı TOTP kodu iki kez kullanılamamalı (replay attack koruması)

---

## FAZ 3 — Uzun Vadeli (6-12 Ay)

### Gereksinim 10: Çoklu Lokasyon / Şube Desteği

**Kullanıcı Hikayesi:** Çok şubeli oto servis firması sahibi olarak, tüm şubelerimi tek bir hesaptan yönetmek ve şube bazlı raporlar almak istiyorum.

**Kabul Kriterleri:**
- [ ] `Location` modeli Prisma şemasına eklenmeli
- [ ] Tenant altında birden fazla lokasyon tanımlanabilmeli
- [ ] Servis emirleri, randevular ve stok lokasyon bazlı filtrelenebilmeli
- [ ] Dashboard'da lokasyon seçici bulunmalı
- [ ] Konsolide (tüm şubeler) ve lokasyon bazlı raporlar ayrı ayrı görüntülenebilmeli
- [ ] Kullanıcılar belirli lokasyonlara atanabilmeli

**Doğruluk Özellikleri:**
- P10.1: Lokasyon A'ya atanmış kullanıcı, Lokasyon B'nin verilerini görememeli
- P10.2: Konsolide rapor, tüm lokasyonların toplamına eşit olmalı

---

### Gereksinim 11: Native Mobil Uygulama (React Native / Expo)

**Kullanıcı Hikayesi:** Usta olarak, iş emirlerimi telefonumdan takip etmek, fotoğraf çekmek ve iş kaydı oluşturmak istiyorum; bunları native bir uygulama üzerinden yapmak web tarayıcısından daha hızlı ve kolay.

**Kabul Kriterleri:**
- [ ] `apps/mobile` altında Expo (React Native) projesi oluşturulmalı
- [ ] Mevcut `/m/firma/*` ve `/m/musteri/*` sayfaları native ekranlara taşınmalı
- [ ] Biometric authentication (Face ID / Touch ID) desteklenmeli
- [ ] Push notification (Firebase Cloud Messaging) entegre edilmeli
- [ ] Kamera entegrasyonu (servis fotoğrafı çekme)
- [ ] Offline mod: bağlantı yokken temel veriler görüntülenebilmeli
- [ ] App Store ve Google Play'e dağıtım yapılandırması hazır olmalı

**Doğruluk Özellikleri:**
- P11.1: Offline modda son senkronize edilen veriler görüntülenebilmeli
- P11.2: Bağlantı yeniden kurulduğunda offline'da yapılan değişiklikler senkronize edilmeli

---

### Gereksinim 12: Muhasebe Yazılımı Entegrasyonu

**Kullanıcı Hikayesi:** Muhasebeci olarak, oto servis sistemindeki fatura ve ödeme verilerini muhasebe yazılımına manuel girmek yerine otomatik aktarmak istiyorum.

**Kabul Kriterleri:**
- [ ] Parasut API entegrasyonu (Türkiye odaklı)
- [ ] Fatura oluşturulduğunda Parasut'a otomatik iletilmeli
- [ ] Ödeme kaydedildiğinde Parasut'ta eşleştirilmeli
- [ ] Entegrasyon ayarları tenant bazlı yapılandırılabilmeli
- [ ] Senkronizasyon hatalarında yöneticiye bildirim gönderilmeli
- [ ] Manuel senkronizasyon tetikleyici (dashboard'dan)

**Doğruluk Özellikleri:**
- P12.1: Fatura tutarı Parasut'taki kayıtla eşleşmeli
- P12.2: Entegrasyon devre dışıyken fatura oluşturma normal çalışmaya devam etmeli

---

### Gereksinim 13: Full-text Arama

**Kullanıcı Hikayesi:** Resepsiyonist olarak, müşteri adı, plaka veya telefon numarasıyla hızlı arama yapabilmek istiyorum; şu anki filtre bazlı arama yavaş ve yetersiz.

**Kabul Kriterleri:**
- [ ] Meilisearch veya PostgreSQL full-text search entegrasyonu
- [ ] Müşteri, araç (plaka), servis emri, parça aranabilmeli
- [ ] Arama sonuçları 200ms altında dönmeli
- [ ] Türkçe karakter desteği (ş, ğ, ü, ö, ç, ı)
- [ ] Fuzzy search (yazım hatası toleransı)
- [ ] Arama sonuçları tenant izolasyonuna uygun olmalı

**Doğruluk Özellikleri:**
- P13.1: "şahin" araması "sahin" ile de eşleşmeli (Türkçe normalizasyon)
- P13.2: Tenant A'nın müşterileri Tenant B'nin aramasında çıkmamalı

---

### Gereksinim 14: API Dokümantasyonu

**Kullanıcı Hikayesi:** Entegrasyon geliştirici olarak, MS Otoservis API'sini kullanmak için güncel ve interaktif bir dokümantasyona ihtiyacım var.

**Kabul Kriterleri:**
- [ ] OpenAPI 3.0 spec dosyası oluşturulmalı
- [ ] Swagger UI `/api/docs` adresinde erişilebilir olmalı
- [ ] Tüm public API endpoint'leri dokümante edilmeli
- [ ] Her endpoint için örnek request/response yer almalı
- [ ] Authentication (Bearer token) dokümantasyona dahil edilmeli

---

### Gereksinim 15: i18n (Çok Dil Desteği)

**Kullanıcı Hikayesi:** Yabancı uyruklu araç sahibi müşteri olarak, uygulamayı kendi dilimde kullanabilmek istiyorum.

**Kabul Kriterleri:**
- [ ] `next-intl` paketi entegre edilmeli
- [ ] Türkçe (tr) ve İngilizce (en) dil desteği
- [ ] Dil seçimi kullanıcı tercihine göre kaydedilmeli
- [ ] Tarih, para birimi formatları locale'e göre değişmeli
- [ ] Tüm UI metinleri çeviri dosyalarına taşınmalı

---

## Doğruluk Özellikleri Özeti (Property-Based Testing)

Aşağıdaki özellikler `fast-check` ile test edilecektir:

| ID | Özellik | Faz |
|----|---------|-----|
| P1.1 | Server Action hataları Sentry'e iletilmeli | 1 |
| P2.1 | Rate limit aşımında 429 dönmeli | 1 |
| P2.2 | Farklı IP'ler birbirini etkilememeli | 1 |
| P2.3 | Limit penceresi dolunca sayaç sıfırlanmalı | 1 |
| P3.1 | Offline'da /offline sayfası erişilebilir olmalı | 1 |
| P4.1 | DB sağlıklıyken /api/health 200 dönmeli | 1 |
| P4.2 | DB kesilince /api/health 503 dönmeli | 1 |
| P5.1 | Cache TTL içinde tutarlı veri dönmeli | 2 |
| P5.2 | Güncelleme sonrası cache temizlenmeli | 2 |
| P5.3 | Redis kesilince DB fallback çalışmalı | 2 |
| P6.1 | SSE tenant izolasyonu sağlamalı | 2 |
| P7.1 | İzinsiz kullanıcıya push gönderilmemeli | 2 |
| P8.1 | Job retry mekanizması doğru çalışmalı | 2 |
| P8.2 | Job idempotent olmalı | 2 |
| P9.1 | Geçerli TOTP kabul edilmeli | 2 |
| P9.2 | Süresi dolmuş TOTP reddedilmeli | 2 |
| P9.3 | Aynı TOTP iki kez kullanılamamalı | 2 |
| P10.1 | Lokasyon izolasyonu sağlanmalı | 3 |
| P13.1 | Türkçe karakter normalizasyonu çalışmalı | 3 |
| P13.2 | Arama tenant izolasyonuna uymalı | 3 |
