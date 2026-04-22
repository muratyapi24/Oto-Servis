# Google Stitch — WEB Platform Tasarım Promptu (v2.0)

Bu doküman, **Oto Servis Yönetim Sistemi** projesinin tüm WEB platformlarının (Landing, Super Admin, Firma Paneli) ekranlarını `https://stitch.withgoogle.com` üzerinde tasarlatmak için hazırlanmış, **son derece detaylı ve kullanıma hazır** promptları içermektedir.

> **Kullanım:** Her `PROMPT` bloğu ayrı bir Stitch oturumunda kullanılabilir. En verimli sonuç için her portal'ı (Landing, Super Admin, Firma) ayrı ayrı oluşturun ama aynı Tasarım Sistemi kurallarını uygulayın.

> **Referans Renk Paleti & Tasarım Sistemi:** Mobil prompttaki (`STITCH_MOBILE_APP_PROMPT.md`) design system ile tam uyumlu olması esastır.

---

## 📊 GENEL ENVANTER

| Portal | Sayfa Sayısı | Karmaşıklık |
|--------|-------------|-------------|
| Landing / Marketing | 6 sayfa | Orta |
| Super Admin Portal | 6 sayfa | Yüksek |
| Firma / Workshop Portal | 12+ sayfa | Çok Yüksek |
| Auth (Login/Register) | 4 sayfa | Düşük |
| **TOPLAM** | **28+ sayfa** | |

---

# ═══════════════════════════════════════
# BÖLÜM A: LANDING / MARKETING WEB SİTESİ
# ═══════════════════════════════════════

Aşağıdaki promptu doğrudan kopyalayıp Stitch'e yapıştırın.

```markdown
Sen, SaaS pazarlama siteleri konusunda uzmanlaşmış, dönüşüm odaklı premium web tasarımlar üreten bir UI/UX Tasarımcısısın.

**Proje:** "OtoServis Pro" — Oto servis işletmeleri için SaaS tabanlı yönetim platformu. Türkiye pazarına hitap ediyor. Tüm içerik Türkçe olmalıdır.

**Tasarım Sistemi (Tüm Sayfalarda Geçerli):**
- Primary: `#1E3A8A` (Koyu Mavi), `#2563EB` (Mavi)
- Secondary: `#10B981` (Zümrüt Yeşili)
- Accent: `#F97316` (Turuncu)
- Dark: `#0F172A`, `#1E293B`
- Light BG: `#F8FAFC`, `#FFFFFF`
- Text: `#1E293B` (koyu), `#64748B` (gri), `#FFFFFF` (beyaz)
- Font: Inter (Google Fonts)
- Rounded: `rounded-2xl` kartlar, `rounded-xl` butonlar
- Gölge: `shadow-lg` kartlar, `shadow-xl` hero elementleri
- Geçişler: `transition-all duration-300`, kartlarda `hover:shadow-xl hover:-translate-y-1`
- Max container: `max-w-7xl mx-auto px-4`

Bu marketing sitesinin aşağıdaki 6 sayfasını aralarında navigasyon ile GEÇİŞ YAPILABİLİR şekilde tek HTML dosyasında üret.

---

### SAYFA 1: ANA SAYFA (Homepage)

**A) Navbar (Tüm sayfalarda sabit, sticky top):**
- Sol: "OtoServis Pro" logo + "SaaS" küçük badge.
- Orta: Navigation linkleri: "Ana Sayfa", "Özellikler", "Fiyatlandırma", "Hakkımızda", "Blog", "İletişim".
- Sağ: "Giriş Yap" (outline mavi buton) + "Ücretsiz Dene" (solid turuncu buton, `bg-gradient-to-r from-orange-500 to-orange-600`).
- Scroll'da: Glassmorphism efekti (`backdrop-blur-lg bg-white/90 shadow-sm`).
- Mobil: Hamburger menü.

**B) Hero Section (Full viewport, gradient `from-[#0F172A] via-[#1E3A8A] to-[#2563EB]`):**
- Sol (60%):
  - Küçük badge: "🚀 Türkiye'nin 1 Numaralı Oto Servis Yazılımı" (sarı/turuncu pill badge)
  - Büyük başlık (52px, bold, beyaz): "Oto Servis Yönetimini **Dijitalleştirin**" (Dijitalleştirin kelimesi gradient text: `bg-gradient-to-r from-emerald-400 to-cyan-400`)
  - Alt metin (20px, `text-blue-200`): "Müşteri takibi, servis yönetimi, stok kontrolü, faturalandırma ve raporlama — hepsi tek bir platformda. 1.000+ servis işletmesi güveniyor."
  - 3 satırlık özellik (✓ ikonlu, beyaz): "✓ Bulut Tabanlı, Her Yerden Erişim", "✓ iOS & Android Mobil Uygulamalar", "✓ 7/24 Teknik Destek"
  - CTA Butonları: "14 Gün Ücretsiz Başlayın →" (büyük turuncu gradient) + "Canlı Demo İzleyin ▶" (beyaz outline, play ikonu)
  - Güven metrikleri (küçük): "1.000+ İşletme · %99.9 Uptime · SOC 2 Sertifikalı"
- Sağ (40%):
  - Perspektifli laptop mockup içinde dashboard ekran görüntüsü (simüle et; dashboard kartları, grafikler görünecek şekilde).
  - Yanında küçük telefon mockup (mobil uygulama).
  - Hafif dönen/floating animasyon (`animate-float` keyframes ile).

**C) Sosyal Kanıt / Güven Şeridi (Gri bg, `bg-slate-50`):**
- "1.000+ İşletme OtoServis Pro'yu Tercih Ediyor" başlık (küçük, gri).
- Müşteri logoları sırası (6-8 gri logo placeholder, `grayscale hover:grayscale-0 opacity-60 hover:opacity-100`).

**D) Özellikler Vitrin Bölümü (Beyaz bg):**
- Başlık: "İşletmenizi Büyütecek Tüm Araçlar" (36px, bold, ortalı)
- Alt metin: "Tek platform, sınırsız olanak."
- 3x2 Grid özellik kartları (her biri `rounded-2xl shadow-md hover:shadow-xl p-6`):
  1. 👥 "Müşteri İlişkileri (CRM)" — "Detaylı müşteri profilleri, araç geçmişi, iletişim takibi ve sadakat programı." — Sol üstte mavi daire ikon.
  2. 🔧 "Servis Yönetimi" — "İş emri oluşturma, usta atama, dijital muayene formu, süreç takibi." — Yeşil ikon.
  3. 📦 "Akıllı Stok Yönetimi" — "Barkod okuma, otomatik sipariş noktası, tedarikçi yönetimi." — Mor ikon.
  4. 💰 "Finansal Yönetim" — "Faturalandırma, kasa takibi, alacak/borç yönetimi, kâr analizi." — Turuncu ikon.
  5. 📱 "Mobil Uygulamalar" — "Usta, müşteri ve yönetici için ayrı mobil uygulama arayüzleri." — Pembe ikon.
  6. 📊 "İş Zekası & Raporlama" — "Özelleştirilebilir raporlar, performans takibi, tahminleme." — Cyan ikon.
- Her kartın altında "Daha Fazla Bilgi →" linki.

**E) Nasıl Çalışır Bölümü (`bg-slate-50`):**
- Başlık: "4 Adımda Başlayın"
- Yatay 4 adım (ok çizgileriyle bağlı, numaralı daireler):
  1. "📋 Ücretsiz Kayıt" — "30 saniyede hesabınızı oluşturun."
  2. "📥 Verilerinizi Aktarın" — "Mevcut müşteri ve araç verilerinizi içe aktarın."
  3. "⚙️ Özelleştirin" — "Servis süreçlerinizi ve kullanıcı rollerinizi ayarlayın."
  4. "🚀 Büyümeye Başlayın" — "Otomasyon araçlarıyla işinizi büyütün."

**F) Müşteri Yorumları (Beyaz bg):**
- Başlık: "Müşterilerimiz Ne Diyor?"
- 3 adet testimonial kartı (yan yana, `rounded-2xl shadow-md p-6`):
  - Kart: 5 yıldız ⭐⭐⭐⭐⭐ + yorum metni (italik tırnak içinde) + müşteri avatar (daire) + isim + firma + konum.
  - Örnek: "OtoServis Pro sayesinde müşteri memnuniyetimiz %40 arttı, işlem süremiz yarıya düştü." — Ahmet Yılmaz, Yılmaz Oto Servis, İstanbul

**G) Fiyatlandırma Ön İzleme (`bg-gradient-to-b from-blue-50 to-white`):**
- Başlık: "Her İşletme İçin Uygun Plan"
- 3 fiyat kartı:
  - **Başlangıç:** "₺2.500/ay" — 3 kullanıcı — Temel özellikler — "Başlayın" outline buton
  - **Profesyonel** (Önerilen, vurgulu, `scale-105 ring-2 ring-blue-500`): "₺8.200/ay" — 15 kullanıcı — Tüm özellikler + Mobil — "14 Gün Ücretsiz Dene" mavi buton — "EN POPÜLER" turuncu badge üstte
  - **Kurumsal:** "₺20.000/ay" — Sınırsız — White-label + API — "Satış ile Görüşün" mor outline buton
- Altında: "Tüm planlar 14 gün ücretsiz deneme içerir. Kredi kartı gerekmez."

**H) CTA Bölümü (Koyu bg `#0F172A`):**
- "İşletmenizi Dijitalleştirmeye Hazır mısınız?" (beyaz, büyük)
- "14 gün ücretsiz. Kredi kartı gerekmez."
- E-posta input + "Hemen Başla →" turuncu buton (inline form).

**I) Footer (Koyu bg `#0F172A`, beyaz metin):**
- 4 sütun: Şirket Bilgisi (logo + slogan + sosyal medya ikonları) | Ürün (Özellikler, Fiyatlandırma, Demo, Güncellemeler) | Destek (Yardım Merkezi, Dokümantasyon, API, Topluluk) | Yasal (Gizlilik Politikası, KVKK, Kullanım Şartları, Çerez Politikası)
- Alt bar: "© 2026 OtoServis Pro. Tüm hakları saklıdır." + TR|EN dil seçici.

---

### SAYFA 2: ÖZELLİKLER (Features)

**Header Banner:** Mavi gradient bg, "Platform Özellikleri" (48px) + "İşletmenizi yönetmek için ihtiyacınız olan her şey" alt metin.

**Yapışkan Kategori Tab'ları** (scroll'da sticky):
- "Tümü" | "Müşteri Yönetimi" | "Servis İşlemleri" | "Stok & Parça" | "Finans" | "Raporlama" | "Mobil"

**Her Kategori İçin Detaylı Bölüm** (sağ-sol alternatif yerleşim):

Bölüm 1 — CRM & Müşteri Yönetimi (resim solda, metin sağda):
- Başlık: "👥 360° Müşteri İlişkileri"
- Bullet listesi: "✓ Bireysel/Kurumsal müşteri ayrımı", "✓ Araç bazlı tam geçmiş takibi", "✓ Otomatik SMS/e-posta hatırlatmalar", "✓ Sadakat programı & puan sistemi", "✓ KVKK uyumlu veri yönetimi"
- Sağda: Müşteri detay ekranı mockup placeholder.
- Vurgu kartı: "⏱ Ortalama %50 daha hızlı müşteri kayıt süreci"

Bölüm 2 — Servis Yönetimi (metin solda, resim sağda):
- "🔧 Uçtan Uca Servis Takibi"
- "✓ İş emri oluşturma ve iş akışı (Kanban/Tablo)", "✓ Usta atama ve performans izleme", "✓ Dijital araç muayene formu (fotoğraf/video)", "✓ Servis bay canlı durum takibi", "✓ Müşteriye otomatik durum bildirimi (WhatsApp/SMS)"
- Mockup: Kanban/tablo servis listesi.

Bölüm 3 — Stok & Envanter:
- "📦 Akıllı Envanter Yönetimi"
- "✓ Barkod/QR kod ile hızlı stok takibi", "✓ Otomatik yenileme noktası uyarıları", "✓ Tedarikçi yönetimi ve satın alma siparişleri", "✓ Çoklu depo desteği", "✓ Negatif stok uyarıları"

Bölüm 4 — Finansal Yönetim:
- "💰 Tam Entegre Finans Modülü"
- "✓ Profesyonel fatura oluşturma (PDF)", "✓ Nakit/Kredi Kartı/Havale tahsilat", "✓ Alacak/borç yaşlandırma raporu", "✓ Kâr marjı analizi (işlem bazlı)", "✓ Muhasebe entegrasyonu (Logo, Parasüt)"

Bölüm 5 — Raporlama & İş Zekası:
- "📊 Veri Odaklı Kararlar"
- "✓ Günlük/haftalık/aylık servis istatistikleri", "✓ Usta performans raporları", "✓ Finansal özet ve KPI dashboard", "✓ Stok hareket raporları", "✓ Excel/PDF dışa aktarma"

**Entegrasyon Grid** (mavi bg):
- "🔌 Entegrasyonlar" başlık.
- 3x3 Logo grid: Stripe, iyzico, WhatsApp Business, Google Calendar, SMS (Twilio), Google Maps, Excel, PDF, API.

**Karşılaştırma Tablosu** (beyaz bg):
- "Neden OtoServis Pro?" başlık.
- Tablo: Özellik | OtoServis Pro | Geleneksel Yazılım | Excel
  - Bulut erişim: ✅ | ❌ | ❌
  - Mobil uygulama: ✅ | ❌ | ❌
  - Otomatik yedekleme: ✅ | ❌ | ❌
  - 7/24 destek: ✅ | ⚠️ | ❌
  - Maliyet: ₺2.500/ay'dan | ₺30.000+ tek seferlik | Ücretsiz ama riskli

**Alt CTA:** "Tüm Özellikleri Keşfedin — 14 Gün Ücretsiz" turuncu buton.

---

### SAYFA 3: FİYATLANDIRMA (Pricing)

**Hero:** Mavi gradient, "Şeffaf Fiyatlandırma, Gizli Ücret Yok" (48px) + "Aylık / Yıllık (%20 Tasarruf)" toggle switch.

**3 Fiyat Kartı** (detaylı — projenin gerçek paketlerini yansıtır):

**Kart 1 — Standart** (beyaz, solda):
- "₺2.500" /ay (yıllık: ₺25.000/yıl — ₺2.083/ay)
- "Küçük işletmeler için"
- 14 gün ücretsiz deneme
- ✅ 3 Kullanıcı, ✅ 500 Araç limiti, ✅ Müşteri yönetimi, ✅ Araç kayıt, ✅ Servis takibi, ✅ Temel stok, ✅ Web portal, ✅ E-posta destek
- ❌ Mobil uygulama, ❌ Gelişmiş raporlama, ❌ SMS gönderimi, ❌ API erişimi
- "Ücretsiz Başlayın" outline mavi buton

**Kart 2 — Profesyonel** (vurgulu, ortada, `scale-105 ring-2 ring-blue-500 shadow-2xl`):
- "EN POPÜLER" turuncu badge üstte
- "₺8.200" /ay (yıllık: ₺82.000/yıl — ₺6.833/ay)
- "Büyüyen işletmeler için eksiksiz çözüm"
- 14 gün ücretsiz deneme
- Standart'ın tüm özellikleri +
- ✅ 15 Kullanıcı, ✅ 5.000 Araç, ✅ Sınırsız servis, ✅ Gelişmiş stok & barkod, ✅ Fatura oluşturma, ✅ SMS & E-posta bildirimler, ✅ iOS & Android mobil, ✅ Dijital muayene formu, ✅ Temel raporlama, ✅ Müşteri portalı, ✅ Telefon desteği (8x5), ✅ Google Calendar entegrasyonu
- "14 Gün Ücretsiz Dene" solid mavi buton
- "✓ 30 gün para iade garantisi"

**Kart 3 — Kurumsal** (beyaz, sağda):
- "₺20.000" /ay (yıllık: ₺200.000/yıl)
- "Çok şubeli ve ölçeklenen işletmeler için"
- 30 gün ücretsiz deneme
- Profesyonel'in tüm özellikleri +
- ✅ Sınırsız kullanıcı & araç, ✅ Çoklu şube desteği, ✅ Gelişmiş BI & özel raporlar, ✅ Tam API erişimi, ✅ Özel entegrasyonlar, ✅ VIP 7/24 destek, ✅ Özel hesap yöneticisi, ✅ White-label çözüm, ✅ SSO (Single Sign-On), ✅ SLA garantisi (%99.9)
- "Satış ile Görüşün" mor outline buton

**Plan Karşılaştırma Tablosu** (tam genişlikte, katlanabilir):
- Kategori bazlı satırlar: Kullanıcı & Erişim, Müşteri Yönetimi, Servis İşlemleri, Stok, Finans, Raporlama, Mobil, Entegrasyon, Destek.
- Her satırda 3 sütun (Standart / Pro / Kurumsal) — ✅ / ❌ / sayı değerleri.

**Ek Paketler** (gri bg, 2x2 grid):
- "📱 Ek SMS Paketi — ₺500 (1.000 SMS)" + "Ekle" butonu
- "🎧 Öncelikli Destek — ₺1.000/ay" + "Ekle" butonu
- "📊 İş Zekası Modülü — ₺2.000/ay" + "Ekle" butonu
- "🚚 Filo Yönetimi — ₺3.000/ay" + "Ekle" butonu

**SSS / FAQ Bölümü** (beyaz bg, accordion):
- "Ücretsiz deneme süresi ne kadar?" → "14 gün (Kurumsal paket 30 gün). Kredi kartı gerekmez."
- "İstediğim zaman plan değiştirebilir miyim?" → "Evet, anında yükseltme veya düşürme yapabilirsiniz."
- "Gizli ücretler var mı?" → "Hayır, tamamen şeffaf fiyatlandırma."
- "Yıllık ödemede indirim var mı?" → "Evet, yıllık ödemede %20 indirim."
- "Verilerim güvende mi?" → "SOC 2 sertifikalı, SSL/TLS şifrelemeli, günlük yedekleme."
- "Mevcut verilerimi taşıyabilir miyim?" → "Evet, Excel'den veri içe aktarma desteği mevcut."

---

### SAYFA 4: HAKKIMIZDA

**Hero:** Tam yükseklik, koyu overlay'li servis atölyesi arkaplan görseli. "2026'dan Geleceğe — Oto Servis Teknolojisinde Öncü" (beyaz, 52px).
Altında 4 istatistik: "1.000+ İşletme" | "50.000+ Servis İşlemi" | "%99.8 Memnuniyet" | "7/24 Destek"

**Hikayemiz:** Sol metin + sağ görsel. Misyon ve vizyon paragrafları.

**Değerlerimiz (4 kart):**
- ❤️ Müşteri Odaklılık — "Her kararımızda müşterilerimizi düşünürüz."
- 💡 Sürekli İnovasyon — "Teknolojiyi sektöre uyarlıyoruz."
- 🛡️ Güven & Şeffaflık — "Dürüst iletişim, şeffaf fiyatlandırma."
- 🏆 Kalite Standartları — "ISO 9001, SOC 2 sertifikalı."

**Ekip (4 kart):** Fotoğraf (daire) + İsim + Ünvan + LinkedIn ikonu. (CEO, CTO, Operasyon Müdürü, Destek Müdürü)

**İletişim:** Adres + Harita placeholder + Telefon + E-posta + İletişim formu.

---

### SAYFA 5: BLOG

**Blog Header:** "Oto Servis & İşletme Blogu" + "İşletmenizi büyütmeniz için ipuçları" + Arama + Kategori pill filtreleri.

**Öne Çıkan Yazı** (büyük kart, gradient bg): Başlık + Özet + Yazar + Tarih + Okuma süresi + "Devamını Oku" butonu.

**Yazı Grid'i (3 sütun):** Her kart: Kapak görseli + Kategori badge + Başlık + Özet + Yazar avatar + İsim + Tarih + Okuma süresi.

**Sidebar (sağda):** Newsletter abone ol formu + Popüler Yazılar listesi + Kategori listesi + Etiket bulutu.

---

### SAYFA 6: İLETİŞİM

**Sol:** İletişim formu (Ad Soyad, E-posta, Telefon, Konu seçimi dropdown [Genel Bilgi / Demo Talebi / Teknik Destek / Satış], Mesaj textarea, "Gönder" buton).

**Sağ:** Adres bilgileri + Telefon + E-posta + Çalışma saatleri + Sosyal medya + Harita placeholder.
```

---

# ═══════════════════════════════════════
# BÖLÜM B: SUPER ADMIN PORTAL
# ═══════════════════════════════════════

Aşağıdaki promptu doğrudan kopyalayıp Stitch'e yapıştırın.

```markdown
Sen, SaaS platform yönetim panelleri konusunda uzmanlaşmış, veri yoğun dashboard tasarımları üreten bir UI/UX Tasarımcısısın.

**Proje:** "OtoServis Pro" platformunun Super Admin Portalı. Bu panel, tüm tenant (firma) işletmelerini, abonelikleri, kullanıcıları, gelirleri ve sistem sağlığını yöneten merkezi yönetim konsoludur. Tüm içerik Türkçe.

**Tasarım Sistemi:**
- Primary: `#1E3A8A`, `#2563EB` (Mavi)
- Secondary: `#10B981` (Yeşil)
- Accent: `#F97316` (Turuncu)
- Danger: `#EF4444` (Kırmızı)
- Background: `#F1F5F9` (Ana konteyner), `#FFFFFF` (Kartlar)
- Sidebar: `#0F172A` (Çok koyu — sidebar arka planı; beyaz ikonlar/metin)
- Font: Inter, 14px base
- Kartlar: `rounded-xl shadow-sm border border-slate-200 hover:shadow-md`
- Tablo: zebra stripe, sticky header, sortable sütunlar
- Chart renkleri: Mavi serisi (`#3B82F6`, `#60A5FA`, `#93C5FD`) + yeşil/turuncu vurgular

**Layout:** Klasik admin — Sol sabit sidebar (240px, collapse edilebilir) + Üst navbar + Sağdaki ana içerik alanı.

Bu portal'ın 6 sayfasını aralarında sidebar navigasyonu ile geçiş yapılabilir şekilde tek HTML'de üret.

---

### SAYFA 1: SUPER ADMIN DASHBOARD

**Üst Navbar (beyaz, `shadow-sm`):**
- Sol: "OtoServis Pro — Super Admin" logo + badge "ADMIN".
- Orta: Global arama inputu: "Tenant, kullanıcı veya işlem ara..." (geniş, `w-96`, search ikonu).
- Sağ: Bildirim zili (badge "7") + Yardım "?" ikonu + Admin profil dropdown ("Süper Admin · superadmin@bstservis.com").

**Sol Sidebar (Koyu `#0F172A`, beyaz metin, ikonlu menü):**
- 📊 Dashboard ← aktif (mavi highlight, sol border)
- 🏢 Tenant Yönetimi
- 👥 Kullanıcılar
- 💳 Abonelikler & Ödemeler
- 📈 Platform Analitiği
- ⚙️ Sistem Ayarları
- 🔔 Bildirimler
- 🔒 Güvenlik & Audit Log
- 📝 Destek Talepleri
- 🎯 Stratejik Bilgiler
- ---
- 🌐 Komut Merkezi
- Alt: Sidebar daralt/genişlet butonu.

**Ana İçerik:**

**Breadcrumb:** "Super Admin > Dashboard"
**Başlık satırı:** "Platform Özeti" + Sağda: "Son 30 Gün ▼" dönem seçici + "📥 Rapor İndir" buton.

**4 KPI Metrik Kartı** (üst sıra, eşit genişlikte):
- 🏢 "Aktif İşletme" — "148" — "+12 bu ay ↑" (yeşil ok) — Mini sparkline.
- 👥 "Toplam Kullanıcı" — "2.847" — "+156 ↑" — "847 aktif (son 24s)" alt metin.
- 💰 "Aylık Gelir (MRR)" — "₺847.500" — "+%8.4 ↑" — Önceki aya kıyasla.
- 🟢 "Sistem Sağlığı" — "%99.98 Uptime" — "Tüm sistemler normal" — Yeşil durum noktası.

**Gelir Trendi Grafiği** (tam genişlik kart, `h-72`):
- Başlık: "Aylık Gelir Trendi" + Tab: "Gelir" | "Tenant Büyümesi" | "Aktivite"
- Bar + Line combination chart (12 aylık). X ekseni: aylar. Y ekseni: TL.
- Tooltip: Aylık detay.

**2 Sütunlu Grid:**
  **Sol — Plan Dağılımı (Donut Chart):**
  - Başlık: "Plan Bazlı Tenant Dağılımı"
  - Donut: Standart %39 (58 tenant) | Profesyonel %45 (67) | Kurumsal %16 (23)
  - Ortada toplam: "148"

  **Sağ — Gelir Dağılımı (Horizontal Bar):**
  - Başlık: "Plana Göre Gelir Payı"
  - Standart: ₺145.000 (%17) | Profesyonel: ₺549.500 (%47) | Kurumsal: ₺460.000 (%36)

**Son Kayıt Olan Tenant'lar Tablosu:**
- Başlık: "Son Kayıtlar" + Sağda "Tümünü Gör →"
- Tablo Sütunları: İşletme Adı | Plan (badge) | Kayıt Tarihi | Durum (●Aktif/●Deneme/●Askıda) | Kullanıcı Sayısı | Aylık Gelir | İşlemler (⋮ dropdown)
- 5 satırlık veri: Gerçekçi Türk firma isimleri.

**Sistem Uyarıları Kartı:**
- 🔴 Kritik: "Tenant #47 veritabanı bağlantı hatası — 5 dk önce" — "İncele" link.
- 🟡 Uyarı: "API rate limit — Tenant #89 — 15 dk önce."
- 🔵 Bilgi: "Yeni tenant kaydı: Yıldız Oto Servis — 1 saat önce."

**Destek Talepleri Mini Özeti:**
- Açık: 23 (kırmızı badge) | Devam Eden: 15 (sarı) | Çözülen: 142 (yeşil)
- Son 2 ticket: "Fatura sorunu — Yüksek Öncelik — Açık", "API entegrasyonu — Orta — Devam Ediyor"

---

### SAYFA 2: TENANT YÖNETİMİ

**Başlık:** "İşletme Yönetimi" + "+ Yeni Tenant Oluştur" mavi buton.
**Filtreler:** Arama + Plan dropdown + Durum dropdown + Tarih aralığı + "148 işletme bulundu".
**Görünüm Toggle:** 📋 Tablo | 📦 Kart görünümü.

**Tablo Görünümü:** İşletme (logo + isim + domain) | Plan (badge) | Durum | Kullanıcı | Aylık Gelir | Kayıt | Son Giriş | İşlemler (Görüntüle/Düzenle/Askıya Al/Sil).
- Bulk select checkbox'ları + Toplu işlem butonu.
- Pagination: "1-12 / 148" + sayfa numaraları + "12/sayfa" seçici.

**Yeni Tenant Modal (+ butona tıklayınca):**
- Step 1: Temel Bilgiler (İşletme Adı, Domain slug, Logo upload, Adres, Telefon, E-posta)
- Step 2: Plan & Abonelik (Plan seçimi, Fiyat, Deneme süresi, Başlangıç/Bitiş tarihi)
- Step 3: Admin Kullanıcı (Ad, Soyad, E-posta, Şifre + güçlülük göstergesi)
- Step 4: Limitler (Max kullanıcı, Max araç, Depolama, API erişimi toggle)
- "İptal" + "Oluştur" butonlar.

**Tenant Detay Slide-Over (Tenant ismine tıklayınca):**
- Sağdan açılan panel (%50 genişlik). Tab'lar: "Genel Bakış" | "Kullanıcılar" | "Faturalar" | "Aktivite" | "Ayarlar"
- Genel Bakış: Domain, plan, tarihler, kullanım metrikleri (progress bar'lar: Kullanıcı 5/15, Depolama 45GB/100GB), hızlı istatistikler.

---

### SAYFA 3: ABONELİKLER & ÖDEMELER

**KPI Satırı:** Aktif Abonelik: 148 | Toplam MRR: ₺847.500 | Ortalama ARPU: ₺5.726 | Churn Rate: %3.2

**Abonelik Listesi Tablosu:** İşletme | Plan | Durum (Aktif/Deneme/Süresi Doldu/İptal) | Başlangıç | Bitiş | Tutar | Ödeme Durumu (✅Ödendi/⚠️Gecikmiş/❌Ödenmedi) | İşlemler.

**Ödeme Geçmişi:** Son ödemeler listesi (Tarih, Tenant, Tutar, Yöntem, Durum badge).

---

### SAYFA 4: PLATFORM ANALİTİĞİ

**KPI Satırı:** Toplam Gelir (90 gün): ₺2.547.890 (+%15.8) | Yeni Kayıt: 47 | Churn Rate: %3.2 (-0.8) | LTV:CAC: 4.2:1

**Gelir Trendi Grafiği** (12 aylık, tahmin çizgisi dahil).
**2 Sütun:** Tenant Büyüme Funnel (Trial→Aktif→Ödeme→Tutulan) + Aktif Kullanıcı Trendi (DAU/WAU/MAU area chart).
**Churn Analizi:** Kayıp nedenleri pie chart (Fiyat %37, Özellik %25, Destek %13, Rakip %15, Diğer %10) + Risk altındaki tenant'lar listesi.
**Özellik Kullanım İstatistikleri:** Horizontal bar'lar (CRM %94, Servis %89, Stok %76, Fatura %82, Mobil %45).
**Cohort Analizi:** Heatmap tablo (kayıt ayı bazında aylık tutma oranları, yeşilden kırmızıya renk skalası).
**AI Tahminleri Kartı:** 🤖 "Önümüzdeki çeyrekte %23 büyüme öngörülüyor" + "12 tenant churn riskinde" + "23 tenant upgrade'e uygun"

---

### SAYFA 5: GÜVENLİK & AUDIT LOG

**Filtreler:** Tarih aralığı + Kullanıcı seçici + İşlem tipi (Giriş/Düzenleme/Silme/Yetki değişikliği) + Tenant seçici.
**Audit Log Tablosu:** Zaman damgası | Kullanıcı | Tenant | İşlem | Detay | IP Adresi | Durum (Başarılı/Başarısız badge).
- Gerçek zamanlı güncelleme göstergesi.
- CSV/Excel dışa aktarma.

---

### SAYFA 6: SİSTEM AYARLARI

**Tab'lar:** "Genel" | "E-posta Şablonları" | "Bildirim Kuralları" | "Entegrasyonlar" | "Yedekleme"

**Genel Tab:** Platform adı, Logo upload, Varsayılan dil, Timezone, 2FA zorunluluğu toggle, Bakım modu toggle.
**E-posta Tab:** Şablon listesi (Hoş geldin, Şifre sıfırlama, Ödeme hatırlatma, vb.) + düzenleme.
**Bildirim Tab:** Kural listesi (Yeni tenant → E-posta, Ödeme başarısız → SMS+E-posta, Yüksek CPU → Slack).
**Entegrasyon Tab:** Stripe API key input, Twilio SID/Token, SendGrid API Key, Slack Webhook — her biri toggle ile aktif/pasif.
**Yedekleme Tab:** Son yedekleme: "12 Nisan 2026, 03:00" + "Manuel Yedek Al" buton + Yedekleme geçmişi tablosu.
```

---

# ═══════════════════════════════════════
# BÖLÜM C: FİRMA / WORKSHOP WEB PORTALI
# ═══════════════════════════════════════

Aşağıdaki promptu doğrudan kopyalayıp Stitch'e yapıştırın.

```markdown
Sen, SaaS iş uygulamaları konusunda uzmanlaşmış, operasyonel dashboard ve CRUD sayfa tasarımları üreten bir UI/UX Tasarımcısısın.

**Proje:** "OtoServis Pro" platformunun firma portalı — bir oto servis işletmesinin günlük operasyonlarını yönettiği ana web uygulaması. Kullanıcı rolleri: TENANT_ADMIN (tam yetkili), STAFF (sınırlı yetkili personel). Tüm içerik Türkçe.

**Tasarım Sistemi (Önceki bölümlerle aynı paletler).**
**Layout:** Sol sidebar (koyu, 240px, collapse edilebilir) + Üst navbar (beyaz, breadcrumb) + Ana içerik (`bg-[#F1F5F9]`). Sidebar alt gruplara ayrılmış ikonlu menü.

**Sidebar Navigasyon:**
- 📊 Dashboard ← aktif
- 📅 Randevu Takvimi
- 🔧 Servis İşlemleri (badge: "4")
- 👥 Müşteriler
- 🚗 Araçlar
- 📄 Teklifler
- ---
- 📦 Stok Listesi
- ➕ Stok Girişi
- 📋 Satın Alma Siparişleri
- 🏭 Tedarikçiler
- ---
- 💰 Kasa İşlemleri
- 📄 Faturalar
- 💳 Ödemeler
- 📊 Finansal Raporlar
- ---
- 👨‍🔧 Ustalar / Personel
- 📈 Analitik & Raporlar
- ⚙️ Ayarlar
- ---
- Alt: 📱 Mobil Uygulamalar + 🎓 Eğitim + 📞 Destek + 🚪 Çıkış

Bu portal'ın 12 sayfasını aralarında sidebar navigasyonu ile geçiş yapılabilir şekilde tek HTML'de üret.

---

### SAYFA 1: FİRMA DASHBOARD

**Üst Navbar:** Sol: "MS Oto Servis A.Ş." (firma adı + logo) | Orta: "+ Hızlı Oluştur ▼" dropdown (Servis Emri, Müşteri, Araç, Teklif, Fatura) | Sağ: Bildirim (badge "5") + Mesaj (badge "2") + "Ahmet Yıldırım · Admin" profil dropdown.

**Hoş geldin banner** (mavi gradient kart):
- "Merhaba Ahmet! 👋 · 12 Nisan 2026, Cumartesi" + "Bugün 12 servis randevunuz var" + Inline metrikler: "₺45.200 bu hafta" | "89 aktif müşteri" | "3 onay bekliyor"

**4 KPI Kartı:**
- 🔧 "Bugünkü Servisler" — "12" — Devam: 4 | Tamamlanan: 6 | Bekleyen: 2 — Progress bar 50%
- ⏳ "Onay Bekleyenler" — "5" — 2 teklif + 2 ek iş + 1 masraf — "2 Acil" kırmızı badge
- 💰 "Bugünkü Tahsilat" — "₺23.450" — Hedef: ₺20.000 ✅ — ₺15.890 bekleyen alacak
- ⚠️ "Kritik Stok" — "3 ürün" — Motor Yağı: 2 | Fren Balatası: 1 — "Sipariş Ver →"

**Servis Bay Durumu (Canlı Monitoring) — Grid kart:**
- Bay 1: 🟠 DEVAM — "34 ABC 123 · Ford Focus · Genel Bakım · Mert Usta · %65" — progress bar — "Detay | Tamamla"
- Bay 2: 🟡 BEKLİYOR — "06 XYZ 789 · VW Golf · Trambasyon · Parça bekleniyor"
- Bay 3: ⚪ BOŞ — "Sonraki: 13:00 — BMW 5"
- Bay 4: 🟢 TAMAMLANDI — "35 KLM 456 · Audi A4 · Debriyaj · Mert Usta" — "Teslim Et | Fatura"

**Yaklaşan Randevular (Timeline kart):**
- Bugün Öğleden Sonra: 13:00 Toyota Corolla (Bakım) | 14:30 Renault Megane (Fren) | 16:00 Honda Civic (Klima)
- Yarın: 09:00 Mercedes (VIP) | 10:30 Fiat Egea
- "Tüm Takvim →" + "Randevu Ekle" butonlar.

**Son Aktiviteler (Feed):** 10:45 Servis tamamlandı (Audi A4) | 10:30 Yeni müşteri | 10:15 Stok girişi | 09:50 Teklif onayı | 09:30 Ödeme ₺3.200

**Performans Metrikleri:** Servis Sayısı: 47 (+%20) | Ort. Süre: 2.3s | Müşteri Memnuniyeti: 4.7/5 | İlk Seferde Çözüm: %94

**Stok Uyarıları Kartı:** Kritik (kırmızı bg) + Düşük stok (sarı bg) + Tükenen (siyah bg).

---

### SAYFA 2: SERVİS İŞLEMLERİ

**Başlık:** "Servis İşlemleri" + Filtreler + "+ Yeni Servis Emri" mavi buton.
**Görünüm Toggle:** 📋 Tablo | 📊 Kanban

**Tablo Görünümü:**
- Sütunlar: Servis No | Araç (Marka Model Plaka) | Müşteri | Servis Bilgisi (Neden + Km) | Usta (avatar + isim) | Durum (renkli badge: Bekliyor/Devam/Tamamlandı/Teslim/İptal) | Tutar | Ödeme (✅/⚠️/❌) | İşlemler (⋮)
- Satır hover: Hızlı durum değiştir + SMS gönder + Ara butonları.

**Kanban Görünümü (5 sütun, drag-drop simülasyonu):**
- BEKLİYOR (sarı) | DEVAM EDİYOR (turuncu) | KONTROL (mavi) | TAMAMLANDI (yeşil) | TESLİM (gri)
- Her sütunda iş emri kartları: Araç + Müşteri + Usta + Progress + Öncelik badge.

**Yeni Servis Modal (Step Wizard):**
- Step 1: Müşteri/Araç Seçimi (arama + seçim)
- Step 2: Servis Bilgileri (neden, km, yakıt, hasar checklist, fotoğraf)
- Step 3: İşlem & Parça Ekleme (envanterden seç, işçilik ekle, usta ata, bay seç)
- "Oluştur" butonu.

**Servis Detay Modal (geniş, scrollable):**
- Sol Sütun: Araç bilgileri kartı (fotoğraf, plaka, marka/model/yıl, VIN, km, müşteri, geçmiş servis sayısı) + Servis geçmişi timeline.
- Sağ Sütun: Servis detayları (kabul/bitiş/bay) + Malzeme & İşçilik tablosu (Parça Adı | Miktar | Birim | KDV | İndirim | Toplam + "Malzeme Ekle" + "İşçilik Ekle") + Öneriler kartı + Belgeler (fotoğraf/PDF) + Finansal Özet (toplam/kdv/indirim/genel toplam/ödenen/kalan) + Dijital imza.
- Footer: "İptal | Kaydet | Tamamla | Fatura Oluştur"

---

### SAYFA 3: MÜŞTERİLER

**Başlık + Filtreler + "+ Yeni Müşteri" + Export (Excel/PDF).**
**Tablo:** Müşteri Tipi (Bireysel/Kurumsal badge) | Ad Soyad/Firma | Telefon | E-posta | Araç Sayısı | Toplam Harcama | Son Servis | Üyelik (Gold/Silver/Bronze badge) | Puan | İşlemler.
**Müşteri Detay Slide-Over:** Profil + Araç listesi + Servis geçmişi + Ödeme geçmişi + İletişim notları + KVKK izinleri.
**Yeni Müşteri Modal:** Tip seçimi (Bireysel/Kurumsal) + Ad/Soyad (veya Firma Adı + Vergi No) + Telefon + E-posta + Adres + Not.

---

### SAYFA 4: ARAÇLAR

**Başlık + Filtreler (Marka, Model, Yıl, Müşteri) + "+ Yeni Araç".**
**Tablo:** Plaka | Marka/Model | Yıl | Yakıt | Km | Müşteri | VIN | Son Servis | Sonraki Bakım | İşlemler.
**Araç Detay:** Araç bilgi kartı + Servis geçmişi listesi + Belgeler (ruhsat, sigorta) + Hatırlatma takvimi.

---

### SAYFA 5: RANDEVU TAKVİMİ

**Takvim Görünümü (Haftalık — ana, Günlük ve Aylık alternatifler):**
- Sütunlar: Saatler (08:00-18:00) x Günler.
- Randevular: Renkli bloklar (Periyodik: mavi, Onarım: turuncu, Kaporta: mor, vb.)
- Her blok: Araç + Müşteri + İşlem tipi + Usta.
- "+ Randevu" butonu (tıklayınca saat/tarih seçili modal).
- Sağ kenar: Bugünkü randevu listesi (mini kart'lar).

---

### SAYFA 6: TEKLİFLER

**Tablo:** Teklif No | Müşteri | Araç | Tarih | Geçerlilik | Tutar | Durum (Beklemede/Onaylandı/Reddedildi/Servise dönüştü) | İşlemler.
**Yeni Teklif Modal:** Müşteri/Araç seçimi + Parça/İşçilik ekleme + KDV/indirim + Geçerlilik süresi + Notlar + "PDF Oluştur".
**Teklif Detay:** PDF önizleme + "Servise Dönüştür" butonu + Onay/Red durumu takibi.

---

### SAYFA 7: STOK LİSTESİ & YÖNETİMİ

**KPI Satırı:** Toplam Ürün: 250 | Toplam Değer: ₺485.000 | Kritik Stok: 8 | Tükenen: 2
**Tablo:** Parça Kodu | Parça Adı | Kategori (badge) | Tip (Parça/İşçilik) | Giren | Çıkan | Mevcut Stok (kırmızı eğer negatif/düşük) | Min Stok | Birim Fiyat | İşlemler.
**Stok Girişi Modal:** Parça seçimi + Fatura No + Tedarikçi + Tarih + Miktar + Birim Maliyet.
**Barkod Okutma Simülasyonu:** Kamera ikonu + input alanı + otomatik parça tanıma.

---

### SAYFA 8: TEDARİKÇİLER

**Tablo:** Tedarikçi Adı | Yetkili Kişi | Telefon | E-posta | Kategori | Açık Bakiye | Son Sipariş | İşlemler.
**Tedarikçi Detay:** İletişim bilgileri + Sipariş geçmişi + Bakiye durumu.

---

### SAYFA 9: KASA İŞLEMLERİ & ÖDEMELER

**Günlük Kasa Özeti (üst kart, yeşil gradient):**
- Bugünkü Tahsilat: ₺23.450 | Bugünkü Gider: ₺8.200 | Net: ₺15.250

**Tahsilat Alma Modal:** Müşteri/Fatura seçimi + Tutar + Ödeme Tipi (Nakit/Kart/Havale/EFT radio butonlar) + Açıklama + "Kaydet".

**Fatura Listesi:** Fatura No | Müşteri | Araç | Tarih | Tutar | KDV | Toplam | Ödeme Durumu | İşlemler (Görüntüle/Yazdır/PDF).
**Fatura Detay Modal:** PDF önizleme + Ödeme geçmişi + "Ödeme Al" butonu.

**Alacak/Borç Tablosu:** Müşteri | Toplam Borç | Tahsil Edilen | Kalan | Gecikme (gün) | Son Ödeme Tarihi | İşlemler (Ödeme Al / Hatırlatma Gönder).

---

### SAYFA 10: USTALAR & PERSONEL

**Usta Kartları (Grid, 3 sütun):**
- Her kart: Avatar + İsim + Uzmanlık Alanları (badge'ler: Motor, Elektrik, Kaporta vb.) + Durum (🟢 Çalışıyor / ☕ Molada / 🔴 İzinli) + Saatlik Ücret + Komisyon Oranı + Bugünkü metrikler (Tamamlanan: X, Ort. Süre: Y, Puan: Z) + "Detay | Düzenle"

**Performans Raporu Kartı:** Bar chart — ustalara göre tamamlanan iş sayısı (haftalık). İsim + bar + sayı.

**Yeni Usta Modal:** Ad Soyad + Telefon + E-posta + Uzmanlık alanları (çoklu seçim) + Saatlik ücret + Komisyon %.

---

### SAYFA 11: ANALİTİK & RAPORLAR

**Dönem Seçici:** Bugün | Bu Hafta | Bu Ay | Son 3 Ay | Özel Aralık
**Rapor Kategorileri Tab:** "Servis" | "Finansal" | "Stok" | "Performans"

**Servis Tab:** Servis sayısı trendi (line chart) + En sık yapılan işlemler (bar) + Marka/model dağılımı (pie) + Ort. servis süresi.
**Finansal Tab:** Gelir/Gider trendi (area chart) + Gelir kalemleri dağılımı (parça vs. işçilik) + Alacak yaşlandırma raporu + Kâr marjı trend.
**Stok Tab:** Stok hareket grafiği + En çok kullanılan parçalar + Negatif stok uyarıları listesi + Stok değeri trendi.
**Performans Tab:** Usta bazlı iş sayısı + Ort. çözüm süresi + Müşteri memnuniyet puanı trendi + İlk seferde çözüm oranı.

Her grafik altında "📥 Excel İndir" + "📄 PDF İndir" butonları.

---

### SAYFA 12: AYARLAR

**Tab'lar:** "Firma Bilgileri" | "Kullanıcılar & Roller" | "Servis Ayarları" | "Bildirim Ayarları" | "Entegrasyonlar"

**Firma Tab:** Firma adı, Logo upload, Adres, Telefon, E-posta, Vergi No, Fatura şablonu seçimi.
**Kullanıcılar Tab:** Kullanıcı listesi (İsim, E-posta, Rol badge, Son Giriş, Durum, İşlemler) + "Kullanıcı Ekle" modal (İsim, E-posta, Şifre, Rol seçimi: Admin/Servis Danışmanı/Muhasebe/Usta).
**Servis Ayarları Tab:** Çalışma saatleri (gün bazlı), Bay/Lift sayısı, Randevu süresi defaults, KDV oranı, Para birimi.
**Bildirim Tab:** Toggle listesi: "Yeni servis emri → E-posta ☑ SMS ☐", "Servis tamamlandı → E-posta ☑ SMS ☑ WhatsApp ☑", "Stok uyarısı → E-posta ☑ SMS ☐", vb.
**Entegrasyon Tab:** Ödeme (iyzico API key), SMS (Twilio), E-posta (SendGrid), Takvim (Google Calendar OAuth), Muhasebe (Logo/Parasüt) — her biri kart şeklinde, "Bağla / Ayır" butonlu.
```

---

## 📊 TÜM WEB PLATFORM SAYFA ENVANTERİ

| Bölüm | Sayfa | Sayı |
|-------|-------|------|
| **Landing** | Ana Sayfa, Özellikler, Fiyatlandırma, Hakkımızda, Blog, İletişim | 6 |
| **Super Admin** | Dashboard, Tenant Yönetimi, Abonelikler, Analitik, Güvenlik/Audit, Ayarlar | 6 |
| **Firma Portal** | Dashboard, Servis İşlemleri, Müşteriler, Araçlar, Randevu, Teklifler, Stok, Tedarikçiler, Kasa/Fatura, Ustalar, Analitik, Ayarlar | 12 |
| **TOPLAM** | | **24 sayfa** |

> **NOT:** Auth (Login/Register) sayfaları mobil prompttakiyle aynı tasarım diline sahiptir; web versiyonları tam sayfa (full-page, centered card) formatında olmalıdır.

---

**Son Güncelleme:** 12 Nisan 2026 · v2.0  
**Kaynak Referanslar:** `PROJECT_ANALYSIS_AND_ROADMAP.md`, `Giris_Bilgileri.md`, `STITCH_PROMPTS.md` (mevcut detaylı prompt kütüphanesi), Proje route yapısı (`apps/web/app/`)
