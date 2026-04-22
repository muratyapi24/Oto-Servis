# 🔧 OTO SERVİS SaaS Platformu
## Dağıtıma & Satışa Hazırlık Dökümanı
> Türkiye Oto Servis Sektörüne Yönelik B2B SaaS Rehberi — Versiyon 1.0 · 2025

---

## İçindekiler

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [SaaS Mimarisi & Teknoloji Stack](#2-saas-mimarisi--teknoloji-stack)
3. [Abonelik Modeli & Fiyatlandırma](#3-abonelik-modeli--fiyatlandırma)
4. [Teknik Dağıtıma Hazırlık Adımları](#4-teknik-dağıtıma-hazırlık-adımları)
5. [Mobil Uygulama Yayın Süreci](#5-mobil-uygulama-yayın-süreci)
6. [Ticari & Hukuki Hazırlık](#6-ticari--hukuki-hazırlık)
7. [Pazara Çıkış Stratejisi](#7-pazara-çıkış-go-to-market-stratejisi)
8. [Müşteri Başarısı & Destek](#8-müşteri-başarısı--destek-customer-success)
9. [Gelir & Büyüme Projeksiyonu](#9-gelir--büyüme-projeksiyonu)
10. [Yayınlama Yol Haritası](#10-yayınlama-yol-haritası)
11. [Rekabet Analizi & Farklılaşma](#11-rekabet-analizi--farklılaşma)
12. [Özet & Sonraki Adımlar](#12-özet--sonraki-adımlar)

---

## 1. Yönetici Özeti

Bu döküman, **Oto Servis** uygulamasını Türkiye'deki oto servis firmalarına **SaaS (Software as a Service)** modeli ile satışa sunmak için gereken tüm teknik, ticari ve operasyonel adımları kapsamaktadır. Aylık ve yıllık abonelik modeli üzerinden sürdürülebilir gelir elde etmek hedeflenmektedir.

> 🎯 **Hedef Pazar:** Türkiye genelinde yaklaşık **80.000+ kayıtlı oto servis işletmesi** bulunmaktadır. Bunların büyük çoğunluğu hâlâ kağıt tabanlı veya Excel ile yönetim yapmaktadır. Dijitalleşme için ciddi bir talep ve boşluk mevcuttur.

**Temel değer önerimiz:**

- Randevu ve iş emri yönetimi
- Müşteri & araç takip sistemi
- Stok & parça yönetimi
- Fatura, ödeme ve muhasebe entegrasyonu
- SMS / WhatsApp bildirim sistemi
- Mobil uygulama (iOS & Android)
- Raporlama ve iş analitikleri

---

## 2. SaaS Mimarisi & Teknoloji Stack

### 2.1 Çok Kiracılı (Multi-Tenant) Mimari

Her oto servis firması bağımsız bir **tenant** (kiracı) olarak sistemde yer alır. Veriler `tenantId` alanı ile satır bazlı izole edilir; büyük müşteriler için fiziksel izolasyon da sunulabilir.

**Mevcut Uygulama Stack:**

| Katman | Teknoloji / Araç | Açıklama |
|---|---|---|
| **Frontend (Web)** | Next.js 15 (App Router) + Tailwind CSS 4 | SEO uyumlu, PWA destekli, Framer Motion animasyonlar |
| **Mobil Web** | Next.js `/m/*` route'ları | Responsive, dokunmatik optimize, OTP girişi |
| **Native Mobil** | React Native (Expo) | iOS & Android — aynı API'leri tüketir |
| **Backend API** | Next.js Server Actions + API Routes | Type-safe, JWT kimlik doğrulama, RBAC |
| **Veritabanı** | PostgreSQL + Upstash Redis | Prisma ORM + serverless Redis (önbellek, rate limiting) |
| **Dosya Depolama** | AWS S3 / Cloudflare R2 | Fotoğraf, doküman, yedek dosyaları |
| **CDN** | Cloudflare / Vercel Edge Network | Küresel hız, DDoS koruması, SSL |
| **E-posta** | Resend | Bildirimler, fatura, onay e-postaları |
| **SMS / WhatsApp** | Twilio | Servis bildirimleri, OTP |
| **İzleme & Log** | Sentry 10 | Frontend + backend hata takibi |
| **Arka Plan İşler** | Inngest | Job kuyruğu, zamanlanmış görevler |
| **Arama** | Meilisearch | Full-text müşteri/araç/parça arama |
| **CI/CD Pipeline** | GitHub Actions | Otomatik test & dağıtım |
| **Ödeme Sistemi** | Stripe | Abonelik tahsilatı, webhook lifecycle |
| **Muhasebe** | Paraşüt | e-Fatura / e-Arşiv entegrasyonu |

> Teknik detaylar için: [ARCHITECTURE.md](./ARCHITECTURE.md)

### 2.2 Barındırma (Hosting) Seçenekleri

| Sağlayıcı | Türü | Avantaj | Aylık Tahmini Maliyet |
|---|---|---|---|
| **Hetzner** (Almanya/Fin) | VPS / Bulut | En uygun fiyat, yüksek performans | 20–80 € |
| **AWS Frankfurt** | Managed Cloud | Tam yönetilen, otomatik ölçekleme | 100–500 $ |
| **Google Cloud TR** | Managed Cloud | Düşük gecikme, Firebase entegrasyonu | 100–400 $ |
| **Turkcell / Vodafone Cloud** | Yerel Bulut | KVKK verisi Türkiye'de kalır | 150–600 ₺ |
| **DigitalOcean** | VPS / Managed | Kolay yönetim, Kubernetes desteği | 50–200 $ |

> 💡 **Öneri:** Başlangıç için Hetzner'de 2–3 sunucu (web + DB + Redis) kurarak aylık ~50€ ile hizmet verilebilir. Büyüdükçe AWS Frankfurt'a ya da yerel bir bulut sağlayıcısına geçiş planlanmalıdır. **KVKK uyumu için veriler Türkiye veya AB sınırları içinde tutulmalıdır.**

### 2.3 Mimari Diyagramı

```
Kullanıcı (Web / Mobil)
        │
        ▼
 ┌─────────────┐
 │  Cloudflare  │  ← CDN, DDoS Koruması, SSL, WAF
 └──────┬──────┘
        │
   ┌────┴─────┐
   │          │
   ▼          ▼
Next.js 15  React Native
(Web + API)  (Expo Mobil)
   │          │
   └────┬─────┘
        │
        ▼
 ┌──────────────────┐
 │  Next.js Backend  │  ← Server Actions + API Routes (JWT Auth, RBAC)
 │   (Multi-Tenant)  │  ← Upstash Redis (rate limiting, cache)
 └──┬───┬───┬───┬───┘
    │   │   │   │
    ▼   ▼   ▼   ▼
 PgSQL Redis  S3  Inngest
  (DB) (Cache) (Dosya) (Jobs)
    │
    ▼
 Resend / Twilio    Sentry
 (E-posta & SMS)    (İzleme)
```

### 2.4 Güvenlik & KVKK Uyumu

- SSL/TLS şifrelemesi (Let's Encrypt / Cloudflare)
- Rol tabanlı erişim kontrolü (RBAC) — Admin, Resepsiyonist, Muhasebeci, Usta
- Çift faktörlü kimlik doğrulama (2FA) — TOTP (authenticator uygulaması) + backup code
- IP bazlı rate limiting — Upstash Redis üzerinden (middleware)
- KVKK kapsamında `KvkkConsent` + `DataSubjectRequest` tabloları — veri silme / export API
- **Veri İşleme Sözleşmesi (DPA)** her müşteriye imzalatılmalı
- Audit log — `AuditLog` tablosunda tüm kritik işlemler kayıt altında
- Haftalık otomatik yedekleme + 30 günlük yedek saklama

---

## 3. Abonelik Modeli & Fiyatlandırma

### 3.1 Paket Yapısı

| Paket | Hedef Kitle | Aylık Fiyat | Yıllık Fiyat | Öne Çıkan Özellikler |
|---|---|---|---|---|
| 🥉 **Başlangıç** | 1–2 kişilik küçük servis | ₺499/ay | ₺4.990/yıl (%17 indirim) | Randevu, müşteri kaydı, temel fatura, 1 kullanıcı |
| 🥈 **Profesyonel** | Orta ölçekli servis | ₺999/ay | ₺9.990/yıl (%17 indirim) | Tüm başlangıç + stok, SMS, WhatsApp, 5 kullanıcı, mobil uygulama |
| 🥇 **Kurumsal** | Çok şubeli / büyük servis | ₺1.999/ay | ₺19.990/yıl (%17 indirim) | Tüm pro + çoklu şube, API erişimi, özel raporlama, öncelikli destek, sınırsız kullanıcı |

### 3.2 Ek Gelir Kalemleri

- **Kurulum & onboarding ücreti:** ₺1.000 – ₺3.000 (tek seferlik)
- **Beyaz etiket (white-label):** Servislerin kendi markasıyla kullanması — ₺2.500+/ay
- **SMS / bildirim paketi:** Aylık 1.000 SMS üzeri için ayrı paket
- **Veri göçü & entegrasyon hizmeti:** Eski sistemden aktarım için ₺2.000+
- **Eğitim & destek paketi:** Uzak masaüstü eğitim — ₺500/saat

### 3.3 Freemium & Deneme Stratejisi

- **14 günlük ücretsiz deneme** — kredi kartı gerekmez
- Deneme sonrası otomatik indirim teklifi: İlk 3 ay %30 indirim
- **Referans programı:** Müşteri getirene 1 ay ücretsiz kullanım
- Yıllık ödeme teşviki: Yıllık ödemede 2 ay ücretsiz (17% indirim)

---

## 4. Teknik Dağıtıma Hazırlık Adımları

### 4.1 Altyapı Kurulumu Checklist

| # | Görev | Durum | Sorumlu |
|---|---|---|---|
| 1 | Domain adı tescili (otoservis.app / .com.tr) | ⬜ Beklemede | Kurucu |
| 2 | SSL sertifikası kurulumu (Cloudflare / Let's Encrypt) | ⬜ Beklemede | DevOps |
| 3 | Production sunucu kurulumu (Hetzner / AWS) | ⬜ Beklemede | DevOps |
| 4 | Docker & Kubernetes (K3s) yapılandırması | ⬜ Beklemede | DevOps |
| 5 | PostgreSQL + Redis kurulumu ve yedekleme ayarları | ⬜ Beklemede | DevOps |
| 6 | CI/CD pipeline oluşturma (GitHub Actions) | ⬜ Beklemede | Dev |
| 7 | Sentry hata izleme entegrasyonu | ⬜ Beklemede | Dev |
| 8 | Cloudflare CDN ve WAF yapılandırması | ⬜ Beklemede | DevOps |
| 9 | E-posta servisi entegrasyonu (SendGrid) | ⬜ Beklemede | Dev |
| 10 | SMS entegrasyonu (Netgsm / İletimMerkezi) | ⬜ Beklemede | Dev |
| 11 | Ödeme sistemi entegrasyonu (iyzico / PayTR) | ⬜ Beklemede | Dev |
| 12 | Yük testi & stres testi (k6 / Locust) | ⬜ Beklemede | QA |
| 13 | Penetrasyon testi / güvenlik taraması | ⬜ Beklemede | Güvenlik |
| 14 | Yedekleme & kurtarma testi (DR drill) | ⬜ Beklemede | DevOps |
| 15 | KVKK metinleri & yasal sayfalar | ⬜ Beklemede | Hukuk |

### 4.2 Multi-Tenant Yapı Kontrol Listesi

- Her tenant için schema izolasyonu veya **row-level security (RLS)** PostgreSQL'de aktif mi?
- Tenant ID her API isteğinde doğrulanıyor mu?
- Subdomain yönlendirmesi: `musteri.otoservis.app` → doğru tenant'a yönlendiriliyor mu?
- Tenant onboarding süreci otomatik mi? (kayıt → DB schema → e-posta → onboarding ekranı)
- Tenant silme / hesap iptal akışı test edildi mi?

---

## 5. Mobil Uygulama Yayın Süreci

### 5.1 App Store (Apple)

1. Apple Developer Program üyeliği: **99 USD/yıl**
2. App Store Connect'te uygulama kaydı oluşturma
3. Uygulama ikonu, ekran görüntüleri ve açıklama hazırlanması (Türkçe)
4. App Review sürecine başvuru — ortalama **1–3 iş günü**
5. TestFlight ile beta test (müşteri adaylarına erişim)
6. Yayın sonrası push bildirim sertifikaları (.p8 APN) alınması

### 5.2 Google Play Store (Android)

1. Google Play Console üyeliği: **25 USD (tek seferlik)**
2. APK / AAB bundle imzalama (keystore dosyası güvenli saklanmalı!)
3. Play Store listesi oluşturma — Türkçe açıklama, ekran görüntüleri
4. Gizlilik politikası URL'si zorunlu
5. İnceleme süreci: ortalama **3–7 iş günü**
6. Firebase Cloud Messaging (FCM) push bildirim entegrasyonu

> 📱 **Mobil Strateji Notu:** İlk etapta **PWA (Progressive Web App)** ile başlanabilir; hem iOS hem Android'de ana ekrana eklenebilir ve mağaza onay sürecini bypass eder. Ardından native React Native uygulaması geliştirilerek mağazalara yüklenebilir. Bu, piyasaya çıkış süresini önemli ölçüde kısaltır.

---

## 6. Ticari & Hukuki Hazırlık

### 6.1 Şirket Kurulumu

- Şahıs şirketi yerine **Limited Şirket (Ltd. Şti.)** kurulması önerilir
- Vergi levhası & **e-fatura / e-arşiv** mükellefi olunması zorunludur
- Yazılım geliştirme & SaaS hizmetleri NACE kodu eklenmeli
- **KOSGEB Genç Girişimci Desteği** araştırılmalı (ücretsiz danışmanlık + hibe imkânı)

### 6.2 Sözleşmeler & Yasal Belgeler

| Belge | Açıklama | Öncelik |
|---|---|---|
| Hizmet Abonelik Sözleşmesi | Müşteriyle imzalanacak temel abonelik şartları | 🔴 Zorunlu |
| Gizlilik Politikası (KVKK) | Web & uygulama için KVKK uyumlu metin | 🔴 Zorunlu |
| Kullanım Koşulları | Platform kullanım şartları | 🔴 Zorunlu |
| Veri İşleme Sözleşmesi (DPA) | KVKK madde 12 uyumlu VİS | 🔴 Zorunlu |
| SLA (Servis Seviyesi Anlaşması) | Uptime garantisi, destek süresi taahhütleri | 🟡 Önemli |
| Geri Ödeme Politikası | İptal ve iade şartları | 🟡 Önemli |
| Bayi / Reseller Sözleşmesi | İleride bayilik sistemi kurulacaksa | 🟢 İsteğe Bağlı |

### 6.3 Ödeme & Fatura

- iyzico veya PayTR entegrasyonu ile otomatik abonelik tahsilatı
- Kredi kartı, havale/EFT, kapı önü ödeme seçenekleri
- Her ödeme için otomatik **e-fatura / e-arşiv faturası** gönderimi
- Başarısız ödeme durumunda otomatik yeniden deneme (retry) + bildirim akışı

---

## 7. Pazara Çıkış (Go-to-Market) Stratejisi

### 7.1 Hedef Müşteri Segmentleri

| Segment | Büyüklük | Karar Verici | Öncelik |
|---|---|---|---|
| Bağımsız küçük servisler | ~60.000 işletme | Oto servis sahibi | 🔴 Yüksek — En geniş kitle |
| Orta ölçekli yetkisiz servisler | ~15.000 işletme | İşletme sahibi / müdür | 🔴 Yüksek — Ödeme gücü var |
| Zincir servis grupları | ~2.000 işletme | Genel Müdür / IT | 🟡 Orta — Uzun satış döngüsü |
| Yetkili servisler (bayilik) | ~3.000 işletme | Marka kararı gerekli | 🟢 Düşük — Karmaşık karar süreci |

### 7.2 Dijital Pazarlama Kanalları

- **Google Ads** — "oto servis programı", "servis yönetim yazılımı" gibi arama reklamları
- **Facebook & Instagram Ads** — Türkiye'deki oto servis sahiplerine demografik hedefleme
- **YouTube** — "nasıl kullanılır" tanıtım videosu, Türkçe
- **SEO** — blog içerik: "oto servis nasıl yönetilir", "servis programı seçimi"
- **Oto Servis Dernekleri** (ASOD, TAYSAD) ile işbirliği ve sponsorluk
- **WhatsApp Business API** — potansiyel müşteri takibi ve demo talebi

### 7.3 Satış Süreci (7 Adım)

1. Potansiyel müşteri web sitesinden demo talebinde bulunur
2. Satış ekibi **24 saat içinde** geri döner, online demo ayarlanır
3. Demo gösterimi: 20–30 dakika ekran paylaşımı ile canlı demo
4. **14 günlük ücretsiz deneme** linki gönderilir
5. Deneme 7. günde check-in yapılır, sorular yanıtlanır
6. 14. günde ödeme teklifi + indirimli ilk ay teklifi sunulur
7. Sözleşme **dijital imza** ile tamamlanır (e-imza / DigiSeal TR)

### 7.4 Bayi & İş Ortağı Ağı

- Muhasebe yazılımı firmaları (Logo, Mikro, Zirve) ile entegrasyon ortaklığı
- Bölgesel BT danışmanları ile **bayi ağı** kurulması
- Oto yedek parça distribütörleri ile çapraz satış (referans programı)
- Meslek liseleri / oto servis kursları ile eğitim ortaklığı

---

## 8. Müşteri Başarısı & Destek (Customer Success)

### 8.1 Onboarding Süreci

| Aşama | Gün | Aktivite |
|---|---|---|
| Hoş Geldin | Gün 1 | Otomatik hoş geldin e-postası + kurulum video linki |
| Kurulum | Gün 1–3 | Temel yapılandırma: firma bilgileri, kullanıcılar, araç tipleri |
| Veri Aktarımı | Gün 2–5 | Mevcut müşteri/araç verilerinin içe aktarılması (CSV / Excel) |
| Eğitim | Gün 3–7 | Canlı online eğitim (Zoom), 1–2 saat |
| İlk İş Emri | Gün 7 | İlk iş emrinin sistemde oluşturulması — **"aha moment"** |
| 30. Gün Check-in | Gün 30 | Telefon / video görüşmesi, sorunlar giderilir, upsell değerlendirilir |

### 8.2 Destek Kanalları

- **Canlı sohbet** (Intercom / Crisp.chat) — uygulama içi
- **E-posta destek:** destek@otoservis.app — 24 saat yanıt SLA
- **WhatsApp destek hattı** — Türkiye pazarına özel (iş saatleri)
- **Bilgi tabanı & yardım merkezi** — Türkçe makaleler, video eğitimler
- Kurumsal paket: Öncelikli destek + özel hesap yöneticisi

### 8.3 Churn (Abonelik İptal) Önleme

- Kullanım analitikleri: 2 hafta giriş yapmayan kullanıcıya otomatik e-posta
- Özellik duyuruları: Her yeni özellik için uygulama içi bildirim + e-posta
- **Yıllık kullanım raporu:** Her müşteriye "bu yıl ne kadar iş yaptınız" özet e-postası
- İptal niyetinde olan kullanıcılara çıkış anketi + indirim teklifi

---

## 9. Gelir & Büyüme Projeksiyonu

### 9.1 İlk 12 Ay Projeksiyonu

| Dönem | Aktif Müşteri | Ort. Gelir/Müşteri | Aylık Gelir | Kümülatif Gelir |
|---|---|---|---|---|
| Ay 1–2 | 5 | ₺700 | ₺3.500 | ₺7.000 |
| Ay 3–4 | 20 | ₺750 | ₺15.000 | ₺37.000 |
| Ay 5–6 | 50 | ₺800 | ₺40.000 | ₺117.000 |
| Ay 7–9 | 100 | ₺850 | ₺85.000 | ₺372.000 |
| Ay 10–12 | 200 | ₺900 | ₺180.000 | ₺912.000 |

> 📊 **Temel Metrikler (Hedef):**
> - **MRR** 12. ayda ₺180.000+
> - **CAC** (Müşteri Edinme Maliyeti): ₺500–800
> - **LTV** (Müşteri Yaşam Boyu Değeri): ₺18.000+
> - **Churn Rate** hedefi: Ayda %2'nin altı
> - **NPS** hedefi: 40+

### 9.2 Gider Yapısı (Başlangıç)

| Gider Kalemi | Aylık Tahmini | Not |
|---|---|---|
| Sunucu & Altyapı | ₺2.500 | Hetzner, Cloudflare, CDN, SMS API |
| SMS / Bildirim | ₺1.000 | Müşteri başına değişken |
| Pazarlama & Reklam | ₺5.000 | Google Ads, sosyal medya |
| Yazılım Araçları (SaaS) | ₺1.500 | Intercom, Sentry, GitHub, Figma vb. |
| Personel (ilk 6 ay) | ₺0–15.000 | Kurucu + 1 geliştirici (isteğe bağlı) |
| Yasal & Muhasebe | ₺1.000 | Mali müşavir + hukuki danışmanlık |
| **TOPLAM** | **~₺11.000–26.000** | 50 müşteriye ulaştığında kâra geçiş beklenir |

---

## 10. Yayınlama Yol Haritası

| Hafta | Aşama | Görevler |
|---|---|---|
| Hafta 1–2 | **Altyapı Kurulumu** | Domain, sunucu, SSL, DB, CI/CD pipeline hazırlığı |
| Hafta 3–4 | **Son Geliştirmeler** | Ödeme sistemi, e-fatura, KVKK uyumu, multi-tenant testi |
| Hafta 5 | **Beta Test** | 5–10 pilot müşteriyle kapalı beta, geri bildirim toplama |
| Hafta 6 | **Uygulama Başvuruları** | App Store & Google Play başvuruları, inceleme süreci |
| Hafta 7 | **Yumuşak Lansman** | Product Hunt, sosyal medya duyurusu, e-posta listesi aktivasyonu |
| Hafta 8+ | **Büyüme Fazı** | Ücretli reklam, bayi görüşmeleri, özellik geliştirme döngüsü |

### İlk 90 Gün Kritik KPI'ları

- **İlk 30 gün:** 10 ücretli müşteri
- **İlk 60 gün:** MRR ₺10.000 aşmalı
- **İlk 90 gün:** İlk churn analizi, ürün-pazar uyumu anketi (PMF Survey)
- NPS skoru 30'un üzerinde tutulmalı

---

## 11. Rekabet Analizi & Farklılaşma

| Rakip | Güçlü Yanları | Zayıf Yanları | Fırsatımız |
|---|---|---|---|
| Logo / Mikro (Muhasebe) | Güçlü marka, geniş muhasebe özellikleri | Oto servise özel değil, pahalı | Entegrasyon + özel UX |
| Genel ERP yazılımları | Kapsamlı özellikler | Karmaşık kurulum, IT gerektiriyor | Kullanım kolaylığı |
| Excel / Kağıt | Sıfır maliyet, alışkanlık | Veri kaybı, raporlama yok | ROI hesabı ile ikna |
| Yabancı SaaS (İngilizce) | Gelişmiş özellikler | Türkçe yok, yerel destek yok | Yerel dil + destek + fiyat |

> 🏆 **Temel Rekabet Avantajımız:**
> Tamamen **Türkçe arayüz** + **yerli müşteri desteği** + **Türk ödeme sistemleri** + **KVKK uyumu** + **oto servise özel tasarlanmış iş akışları** — bu 5 faktörün kombinasyonu hiçbir rakipte aynı anda bulunmuyor.

---

## 12. Özet & Sonraki Adımlar

| Öncelik | Eylem | Sorumlu | Süre |
|---|---|---|---|
| 🔴 ACİL | Şirket kuruluşu & vergi kaydı | Kurucu | 1 hafta |
| 🔴 ACİL | Alan adı & sunucu kurulumu | DevOps | 1 hafta |
| 🔴 ACİL | KVKK metinleri & sözleşmeler | Hukuk | 2 hafta |
| 🔴 ACİL | Ödeme sistemi entegrasyonu | Dev | 2 hafta |
| 🟡 ÖNEMLİ | App Store & Google Play başvurusu | Dev | 3 hafta |
| 🟡 ÖNEMLİ | 5–10 beta müşterisi ile pilot test | Satış | 4 hafta |
| 🟡 ÖNEMLİ | Landing page & demo videosu | Pazarlama | 2 hafta |
| 🟢 PLANLAMA | Google Ads & dijital pazarlama | Pazarlama | 6+ hafta |
| 🟢 PLANLAMA | Bayi & iş ortağı görüşmeleri | Satış | 8+ hafta |

---

> *Türkiye'nin en iyi oto servis yönetim platformunu inşa etmek için yola çıktınız. Başarılar! 🚀*
