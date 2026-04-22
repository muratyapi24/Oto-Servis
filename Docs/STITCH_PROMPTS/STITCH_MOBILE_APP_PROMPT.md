# Google Stitch — Mobil Uygulama Platformu Tasarım Promptu (v2.0)

Bu doküman, **Oto Servis Yönetim Sistemi** projesinin mobil uygulama platformunun tüm ekranlarını `https://stitch.withgoogle.com` üzerinde tasarlatmak için hazırlanmış, **son derece detaylı ve kullanıma hazır** promptu içermektedir.

> **Kullanım:** Aşağıdaki ` ```markdown ` bloğunun **tamamını** kopyalayıp Google Stitch'e yapıştırın. Prompt tek seferde çalışacak şekilde tasarlanmıştır; ancak Stitch'in karakter limiti olursa her `---` ayracıyla bölünmüş BÖLÜM'ü ayrı ayrı da gönderebilirsiniz.

---

```markdown
Sen, modern SaaS mobil uygulamaları tasarlayan uzman bir UI/UX Tasarımcısı ve Frontend Geliştiricisisin. Aşağıdaki yönergelere birebir uyarak, "Oto Servis Yönetim Sistemi" mobil platformunun TÜM EKRANLARINI tek bir çalışır React + Tailwind CSS projesi olarak üret.

═══════════════════════════════════════════════
  GENEL TASARIM SİSTEMİ VE TEKNİK KURALLAR
═══════════════════════════════════════════════

**Proje Tanımı:**
Türkiye'deki oto servis işletmelerine yönelik SaaS tabanlı bir yönetim platformunun mobil uygulamasıdır. Üç farklı kullanıcı rolü (Müşteri/Araç Sahibi, Usta/Teknisyen, Yönetici/Servis Sahibi) tek bir uygulama çatısı altında, rol bazlı erişimle hizmet alır. Uygulama adı: "OtoServis Pro".

**Renk Paleti (Kesinlikle Uygula):**
- Primary: `#1E3A8A` (Koyu Mavi — güven ve profesyonellik)
- Primary Light: `#3B82F6` (Mavi — butonlar ve vurgular)
- Secondary: `#10B981` (Zümrüt Yeşili — onay, başarı, tamamlandı)
- Accent: `#F97316` (Turuncu — dikkat, beklemede, badge'ler)
- Danger: `#EF4444` (Kırmızı — hata, silme, uyarı)
- Background: `#F8FAFC` (Açık gri)
- Surface: `#FFFFFF` (Kart arka planı)
- Text Primary: `#1E293B` (Koyu metin)
- Text Secondary: `#64748B` (Açıklama metni)
- Border: `#E2E8F0`

**Tipografi:**
- Font: Inter (Google Fonts'tan yükle)
- Başlıklar: Bold, 20-24px
- Alt başlıklar: SemiBold, 16-18px
- Gövde metin: Regular, 14-15px
- Küçük metin / etiket: Medium, 12px

**Genel Tasarım Kuralları:**
1. Mobil çerçeve: `max-w-[430px] mx-auto min-h-screen bg-[#F8FAFC] relative overflow-hidden shadow-2xl` ile sarmalayarak telefon ekranı simüle et.
2. Köşe yuvarlatma: Kartlar `rounded-2xl`, Butonlar `rounded-xl`, Input'lar `rounded-lg`.
3. Gölge: Kartlara `shadow-md hover:shadow-lg transition-shadow`.
4. Glassmorphism: Header'larda `backdrop-blur-md bg-white/80`.
5. Bottom Navigation: Her rolün kendi 4-5 ikonlu alt menüsü olacak. Aktif ikon mavi, pasif gri. İkon altında küçük Türkçe etiket.
6. Status Bar simülasyonu: Her ekranın en üstünde saat, pil, sinyal simgesi.
7. Tüm metinler, etiketler, butonlar, placeholder'lar, bildirim metinleri vb. **KESİNLİKLE TÜRKÇE**. Lorem ipsum kullanma.
8. Gerçekçi ve sektöre uygun örnek veriler kullan (Türk isimleri, ₺ fiyatlar, Türk plakaları).
9. İkonlar için SVG inline ikonlar kullan veya lucide-react simüle et.
10. Mikro-animasyonlar: hover ve active state'lerde `transition-all duration-200`, kartlarda `hover:scale-[1.02]`.

**Demo Rol Değiştirici (Sayfanın En Üstü):**
Ekranın en üstüne sabit (fixed) bir "Demo Kontrol Paneli" koy:
- Arka plan: `bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]`, beyaz metin.
- "🔄 Rol Seç:" etiketi + 3 buton: "👤 Müşteri", "🛠️ Usta", "👑 Yönetici".
- Aktif role göre ilgili rol başlığı ve alt menüler değişsin (React state ile).
- Her rol seçildiğinde, rolün ilk alt sayfası (örneğin: Yönetici → Dashboard) otomatik gösterilsin.
- Her rolün kendi "Alt Sayfa Navigasyonu" tabları da üst kısımda küçük pill butonlar olarak gösterilsin.

═══════════════════════════════════════════════
  BÖLÜM 0: ONBOARDING VE KİMLİK DOĞRULAMA
═══════════════════════════════════════════════

Bu bölüm demo rol değiştiriciden BAĞIMSIZ olarak, uygulamanın giriş akışını gösterir. Demo panelinde ayrı bir "🔐 Giriş Ekranları" butonu olsun ve tıklandığında aşağıdaki ekranlar arası geçiş yapılabilsin.

**0.1 Splash / Karşılama Ekranı:**
- Tam ekran gradient arka plan (`from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]`)
- Ortada büyük animasyonlu (pulse efekti) logo: "OtoServis Pro" yazısı + altında araç silüeti ikonu.
- Altında: "Oto Servis Yönetiminde Yeni Nesil" sloganı (beyaz, italic).
- En altta 3 adet yatay çizgi ile "onboarding indicator dots" (3 sayfalık onboarding olacağını ima eder).

**0.2 Onboarding Slider (3 Sayfa - Swipe Edilebilir):**
Ekran 1: İllüstrasyon (araç görseli ikonu) + "Araçlarınızı Kolayca Yönetin" + "Servis geçmişi, bakım hatırlatmaları ve randevu sistemi ile araçlarınız güvende."
Ekran 2: İllüstrasyon (takvim ikonu) + "Randevunuzu Saniyeler İçinde Alın" + "Online randevu sistemi ile sıra beklemeden servis zamanı ayarlayın."
Ekran 3: İllüstrasyon (grafik ikonu) + "İşletmenizi Her Yerden Yönetin" + "Canlı dashboard, finans takibi ve personel yönetimi avucunuzun içinde."
- Her sayfada "Atla" (sağ üst) ve "İleri →" (alt sağ) butonları. Son sayfada "Başlayalım 🚀" butonu.
- Alt kısımda pagination dots (aktif nokta mavi, pasifler gri).

**0.3 Rol Seçim Ekranı:**
- Beyaz arka plan, üstte OtoServis Pro logosu (küçük).
- Başlık: "Nasıl Devam Etmek İstersiniz?"
- 3 adet **büyük kart** (dikey, `rounded-2xl shadow-lg p-6`), her kart farklı renk degrade üst kenar:
  - Kart 1 — Mavi degrade üst kenar:
    - İkon: 👤 (büyük, 48px)
    - Başlık: "Araç Sahibi Girişi"
    - Açıklama: "Araçlarınızı takip edin, randevu alın, fatura ödeyin."
    - Badge: "Yeni Kayıt Oluşturabilirsiniz"
  - Kart 2 — Yeşil degrade üst kenar:
    - İkon: 🛠️
    - Başlık: "Usta / Teknisyen Girişi"
    - Açıklama: "İş emirlerinizi görüntüleyin, dijital muayene yapın."
    - Badge: "Firma Hesabı Gerekli"
  - Kart 3 — Turuncu degrade üst kenar:
    - İkon: 👑
    - Başlık: "Yönetici / İşletme Sahibi"
    - Açıklama: "Finans, personel ve servis yönetimi tek ekranda."
    - Badge: "Tam Yetkili Erişim"

**0.4 Giriş Yap (Login) Ekranı:**
- Üstte: Seçilen role göre dinamik renk ve başlık. Örn: Müşteri seçildiyse mavi header "Araç Sahibi Portalı", Usta seçildiyse yeşil header "Teknisyen Portalı", Yönetici seçildiyse turuncu header "Yönetim Paneli".
- Logo (küçük, ortalanmış).
- "Hoş Geldiniz" büyük başlık + "Devam etmek için giriş yapın" alt metin.
- **Input Alanları** (her birinde sol tarafta ikon, floating label):
  - 📧 E-Posta veya Telefon Numarası
  - 🔒 Şifre (göster/gizle toggle ikonu sağda)
- "Şifremi Unuttum" — sağa dayalı mavi link.
- **"Giriş Yap"** — Tam genişlik, büyük (h-14), role göre renkli gradient buton (mavi/yeşil/turuncu).
- Ayırıcı çizgi: "─── veya ───"
- SSO Butonları (outline, tam genişlik):
  - "Google ile Devam Et" (Google logosu)
  - "Apple ile Devam Et" (Apple logosu)
- En altta (sadece Müşteri rolü için göster):
  - "Hesabınız yok mu? **Kayıt Oluştur**" (kalın mavi link)

**0.5 Kayıt Ol (Register) Ekranı — Sadece Müşteri Rolü İçin:**
- Header: "← Geri" butonu + "Yeni Hesap Oluştur" başlık.
- Form Alanları (her birinde ikon ve floating label):
  - 👤 Ad Soyad
  - 📧 E-Posta Adresi
  - 📱 Telefon Numarası (Türkiye formatı: +90 5XX XXX XX XX)
  - 🔒 Şifre (min 8 karakter, güçlülük göstergesi: Zayıf/Orta/Güçlü - renkli bar)
  - 🔒 Şifre Tekrar
- Checkbox: "☐ Kullanım Şartları ve KVKK Aydınlatma Metnini okudum, kabul ediyorum." (link olarak açılabilir)
- Checkbox: "☐ Kampanya ve bilgilendirme e-postaları almak istiyorum." (opsiyonel)
- **"Kayıt Ol"** - Tam genişlik büyük mavi gradient buton.
- Altta: "Zaten hesabınız var mı? **Giriş Yap**"

**0.6 Şifremi Unuttum Ekranı:**
- Header: "← Geri" + "Şifre Sıfırlama" başlık.
- Açıklama: "Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."
- 📧 E-Posta input.
- "Sıfırlama Bağlantısı Gönder" mavi buton.
- Gönderim sonrası başarı durumu: Yeşil tik ikonu + "Bağlantı gönderildi! Lütfen e-postanızı kontrol edin." mesajı.

**0.7 SMS / OTP Doğrulama Ekranı (Müşteri Mobil Giriş Alternatifi):**
- Başlık: "Telefon Doğrulama"
- Açıklama: "05XX XXX XX XX numarasına gönderilen 6 haneli kodu girin."
- 6 adet ayrı kutu (her biri tek karakter, `w-12 h-14 text-center text-2xl font-bold rounded-xl border-2`). Aktif kutu mavi border.
- Geri sayım: "Kodu tekrar gönder (00:45)" — süre dolunca "Tekrar Gönder" butonu aktif olsun.
- "Doğrula" mavi buton.

---

═══════════════════════════════════════════════
  BÖLÜM 1: MÜŞTERİ (ARAÇ SAHİBİ) UYGULAMASI
═══════════════════════════════════════════════

Bottom Navigation Menüsü: 🏠 Ana Sayfa | 📅 Randevular | 🚗 Garajım | 💳 Ödemeler | 👤 Profil

**1.1 Müşteri Ana Ekran (Dashboard):**
- **Header (Glassmorphism):**
  - Sol: "Merhaba, Ahmet 👋" (Bold, 20px) + altında "OtoServis Pro'ya hoş geldiniz" (gri, 14px).
  - Sağ: Bildirim zili ikonu (üzerinde kırmızı badge "3") + Profil avatar (dairesel, 40px).

- **Aktif Servis Kartı** (gradient mavi arka plan `from-[#1E3A8A] to-[#3B82F6]`, beyaz metin, `rounded-2xl p-5`):
  - Üst satır: "🔧 Aktif Servis" etiketi + "Detay →" linki
  - Araç bilgisi: "34 ABC 123 · Ford Focus 2020"
  - Durum: "Parça Siparişi Bekleniyor" + Progress bar (%60, turuncu)
  - Tahmini teslim: "📅 Tahmini: 14 Nisan 2026, Pazartesi"
  - Alt kısım: Atanan Usta: "Mert Usta · Motor Uzmanı"

- **Hızlı İşlemler Grid** (2x2, dairesel ikonlu kartlar):
  - 📅 "Randevu Al" (Mavi ikon, açık mavi bg)
  - 🚗 "Araç Ekle" (Yeşil ikon, açık yeşil bg)
  - 💳 "Fatura Öde" (Turuncu ikon, açık turuncu bg)
  - 💬 "Canlı Destek" (Mor ikon, açık mor bg)

- **Hatırlatmalar Bölümü** (Sarı/turuncu gradient sol kenar, `border-l-4 border-orange-400`):
  - "⏰ Bakım Hatırlatması" (Bold)
  - "Ford Focus · 34 ABC 123 — Bir sonraki periyodik bakımınıza **15 gün** kaldı."
  - "Hemen Randevu Oluştur →" butonu (küçük, outline turuncu)

- **Son İşlemler Listesi:**
  - Başlık: "Son Servis İşlemleri"
  - 2-3 satırlık liste (her biri): Tarih + Araç kısa bilgi + İşlem ("Yağ Değişimi") + Tutar ("₺2.450") + Durum badge ("Tamamlandı" yeşil / "Fatura Bekliyor" turuncu)

**1.2 Servis Takip Ekranı:**
- Header: "← Geri" + "Servis Takibi"
- **Araç Bilgi Kartı** (Üstte, gradient):
  - Plaka büyük: "34 ABC 123"
  - Alt bilgi: "Ford Focus · 2020 · 85.000 km"
  - İş Emri No: "#SE-2026-0047"

- **Dikey Stepper (Timeline)** — Servis ilerleme adımları:
  1. ✅ "Araç Teslim Alındı" — "12 Nisan 2026, 09:15" — Yeşil daire + çizgi
  2. ✅ "Arıza Tespiti Yapıldı" — "12 Nisan 2026, 10:30" — Yeşil daire + çizgi
     - Alt detay kartı: "Motor yağı kaçağı tespit edildi. Conta değişimi öneriliyor."
  3. ⏳ "Müşteri Onayı Bekleniyor" — **Turuncu yanıp sönen daire** + çizgi
     - **Onay Kartı** (`bg-orange-50 border border-orange-200 rounded-xl p-4`):
       - "Tahmini Maliyet: **₺8.500**"
       - Detay listesi: "Motor Contası: ₺3.200" + "İşçilik: ₺2.800" + "Yağ + Filtre Seti: ₺2.500"
       - İki buton yan yana: "❌ Reddet" (outline kırmızı) + "✅ Onayla" (yeşil solid büyük)
  4. ⬜ "Onarım Devam Ediyor" — Gri daire, soluk çizgi
  5. ⬜ "Kalite Kontrol" — Gri daire
  6. ⬜ "Teslime Hazır" — Gri daire

- **Servis Fotoğrafları:** Mini galeri (3-4 küçük kare thumbnail, tıklayınca büyütür)
- **İletişim:** "💬 Ustaya Mesaj Gönder" butonu (outline mavi)

**1.3 Araçlarım (Garajım) Ekranı:**
- Header: "Garajım" + Sağda "+" Araç Ekle ikonu
- **Araç Kartları** (dikey liste, her biri `rounded-2xl shadow-md`):
  - Kart 1:
    - Sol: Araç tipi ikonu (sedan silüeti)
    - Orta: "34 ABC 123" (büyük, bold) + "Ford Focus · 2020 · Dizel" + "85.230 km"
    - Sağ: Durum badge: "Serviste" (turuncu) veya "Garajda" (yeşil)
    - Alt kısım: "Son Servis: 15 Mart 2026 · Periyodik Bakım" + "Sonraki Bakım: 15 Haziran 2026"
  - Kart 2: Benzer yapıda farklı araç (06 DEF 456 · Renault Clio · 2022)
  - Kart 3: "34 GHI 789 · Toyota Corolla · 2026"
- Her kart tıklanınca **Araç Detay Sayfası** açılır (altta ayrıca tarif et).

**1.4 Araç Detay Alt Sayfası:**
- Üstte büyük araç silüeti / fotoğraf alanı (placeholder gradient).
- Araç bilgileri: Plaka, Marka, Model, Yıl, Motor tipi, Şanzıman, Yakıt, Renk, Şasi No.
- **Tab'lar:** "Servis Geçmişi" | "Belgeler" | "Hatırlatmalar"
  - Servis Geçmişi Tab: Tarihsel liste (tarih + işlem + tutar + durum badge)
  - Belgeler Tab: "Ruhsat", "Sigorta Poliçesi", "Muayene Belgesi" (dosya ikonları, yükleme tarihi)
  - Hatırlatmalar Tab: "Yağ Değişimi — 15 Haz 2026", "Lastik Değişimi — 1 Kas 2026"

**1.5 Randevu Alma Ekranı:**
- Header: "← Geri" + "Yeni Randevu"
- **Adım 1 — Araç Seçimi:**
  - Yatay kaydırmalı araç kartları (seçili olan mavi border).
- **Adım 2 — Sorun/İşlem Türü:**
  - Kategori kartları (2x2 grid): "🔧 Periyodik Bakım", "🚗 Kaporta/Boya", "⚡ Elektrik/Elektronik", "🔩 Motor/Mekanik", "❄️ Klima/Isıtma", "🛞 Lastik/Rot-Balans"
- **Adım 3 — Tarih Seçimi:**
  - Takvim widget (ayın günleri, müsait günler mavi, dolu günler gri).
  - Seçilen tarih altında müsait saat dilimleri (yatay pill butonlar): "09:00", "10:30", "13:00", "14:30", "16:00"
- **Adım 4 — Açıklama:**
  - Metin alanı: "Şikayetinizi kısaca açıklayın..." (textarea, 3 satır)
- **Özet Kartı** (`bg-blue-50 rounded-xl p-4`):
  - Araç: "34 ABC 123 · Ford Focus"
  - İşlem: "Periyodik Bakım"
  - Tarih: "14 Nisan 2026, Pazartesi · 10:30"
- **"Randevuyu Onayla"** — Büyük yeşil gradient buton.

**1.6 Ödemeler & Faturalar Ekranı:**
- Segmented Control: "Bekleyen" | "Ödenenler"
- **Bekleyen Fatura Kartı:**
  - İş Emri: "#SE-2026-0047"
  - Araç: "34 ABC 123 · Ford Focus"
  - Tutar: "₺8.500" (büyük, bold, kırmızı/turuncu)
  - Vade: "Son ödeme: 20 Nisan 2026" + kaç gün kaldığı badge
  - "Şimdi Öde" mavi buton + "Taksitle Öde" outline buton
- **Ödenen Fatura Kartı:** Benzer ama yeşil "✅ Ödendi" badge + "Faturayı İndir 📄" linki.

**1.7 Müşteri Profil Ekranı:**
- Üstte büyük profil kartı: Avatar (dairesel, 80px) + İsim + E-posta + Telefon + Üyelik: "Gold Üye ⭐" (altın badge)
- Puan kartı: "🎁 Sadakat Puanı: 1.250 puan" (küçük progress bar)
- Menü listesi (ikonlu, chevron sağda):
  - 👤 Kişisel Bilgiler
  - 🔔 Bildirim Ayarları
  - 🔒 Şifre Değiştir
  - 📄 KVKK & Gizlilik
  - ❓ Yardım & Destek
  - 🌙 Karanlık Mod (toggle switch)
  - 🚪 Çıkış Yap (kırmızı metin)
- Uygulama versiyonu: "v2.0.1" (küçük, gri, en altta)

---

═══════════════════════════════════════════════
  BÖLÜM 2: USTA / TEKNİSYEN UYGULAMASI
═══════════════════════════════════════════════

Bottom Navigation: 📋 İş Listem | 🔍 Parça Talep | 🔔 Bildirimler | 📊 Performansım

**2.1 İş Listem (Ana Ekran):**
- **Header:**
  - Sol: "Merhaba Mert Usta 🛠️" + "Bugün: 12 Nisan 2026 · Sabah Vardiyası"
  - Sağ: Bildirim ikonu (badge "5")
- **Günlük Özet Şeridi** (yatay scroll, 3 mini metrik kartı):
  - "📋 Bekleyen: 4" (turuncu)
  - "🔧 Devam Eden: 2" (mavi)
  - "✅ Tamamlanan: 6" (yeşil)

- **Segmented Control:** "Bekleyen İşler" | "Devam Edenler" | "Tamamlananlar"

- **İş Kartları** (dikey liste, `rounded-2xl shadow-md p-4`, sol kenarında öncelik renk çizgisi):
  - Kart 1 (Yüksek Öncelik — Sol kenar kırmızı):
    - Üst: "🔴 Yüksek Öncelik" badge + "⏱ ~3 saat"
    - Plaka: "34 XYZ 789" (bold, 18px)
    - Araç: "Mercedes C180 · 2021 · 35.000 km"
    - Şikayet: "Motor çalışırken titreşim ve güç kaybı"
    - Müşteri: "Ankara Nakliyat A.Ş. · 👑 VIP"
    - Alt butonlar: "🔍 Detay" (outline) + "▶ İşe Başla" (yeşil solid)
  - Kart 2 (Normal Öncelik — Sol kenar mavi):
    - "🔵 Normal" badge + "⏱ ~1.5 saat"
    - "34 ABC 123 · Ford Focus 2020"
    - "Periyodik bakım (yağ, filtre, fren kontrolü)"
    - Alt butonlar aynı yapı

**2.2 Aktif İşlem / Dijital Muayene Ekranı:**
- Header: "← İş Listesi" + İş Emri No + Kırmızı "⏱ Süre: 01:45:23" sayacı (Timer, çalışıyor)
- **Araç Bilgi Şeridi:** Plaka + Marka/Model + Müşteri + Km
- **Sekme Tab'ları:** "Kontrol Listesi" | "Fotoğraf/Kanıt" | "Parça/Malzeme" | "Notlar"

  **Tab 1 — Kontrol Listesi (Checklist):**
  - Kategori başlığı: "🔧 Motor Kontrolleri"
    - ☑ Yağ seviyesi — "Uygun" (yeşil)
    - ☑ Soğutma suyu — "Uygun"
    - ☐ Kayış durumu — "Kontrol edilmedi" (gri)
    - ⚠️ Motor contası — "Arızalı" (kırmızı, uyarı ikonu)
  - Kategori: "🛞 Alt Takım & Frenler"
    - ☑ Ön fren balatası — "Uygun (%65)"
    - ⚠️ Arka fren balatası — "Değişmeli (%15)" (kırmızı)
    - ☐ Amortisör — "Kontrol edilmedi"
  - Kategori: "⚡ Elektrik & Aydınlatma"
    - ☑ Akü — "12.4V, İyi"
    - ☑ Farlar — "Uygun"

  **Tab 2 — Fotoğraf/Kanıt:**
  - "📸 Araç Fotoğrafı Ekle" — Büyük kamera butonu (dashed border, `h-32 rounded-xl`)
  - Eklenen fotoğraflar: grid (2x2 thumbnail), her birinde silme X ikonu.
  - "🎤 Sesli Not Ekle" — Mikrofon butonu (turuncu, dairesel, pulse animasyon)

  **Tab 3 — Parça/Malzeme:**
  - Kullanılan parçalar listesi: Parça adı + Kodu + Adet + Birim Fiyat
    - "Motor Contası · MC-2021-F · 1 adet · ₺3.200"
    - "Motor Yağı 5W-30 · MY-530 · 4 litre · ₺2.000"
  - "➕ Parça Ekle" butonu → açılır modal (arama + stoktan seç + adet gir + talep et)
  - **Depodan Parça Talebi** butonu: "📦 Depodan Talep Et" (turuncu outline, tıklayınca arama + filtre penceresi)

  **Tab 4 — Notlar:**
  - Metin alanı: "Ek notlarınızı yazın..."
  - "Müşteriye İletilecek Öneri:" ayrı bir kutu (sarı arka plan): "Arka fren balataları acil değişmeli. Rot balkonu da kontrol edilmeli."

- **Alt Sabit Butonlar (Sticky Bottom):**
  - "⏸ İşlemi Duraklat" (turuncu outline, sol) + "✅ Tamamla & Kalite Kontrole Gönder" (yeşil solid, sağ, büyük)

**2.3 Bildirimler Ekranı (Usta):**
- Bildirim listesi (zaman damgalı):
  - "🔔 Yeni iş emri atandı — 34 DEF 456 · Fren sistemi" — "5 dk önce" (okunmamış, açık mavi bg)
  - "📦 Parça talebiniz onaylandı — Motor Contası (1 adet)" — "1 saat önce"
  - "⚠️ Acil iş emri — 06 GHI 789 · Yolda kalan araç" — "2 saat önce" (kırmızı sol border)

**2.4 Performansım Ekranı (Usta):**
- **Dönem Seçici:** "Bu Hafta" | "Bu Ay" | "Bu Yıl" (pill butonlar)
- **Büyük Metrik Kartları** (2x2 grid):
  - "✅ Tamamlanan İş: 48" (yeşil)
  - "⏱ Ort. Süre: 2.3 saat" (mavi)
  - "⭐ Müşteri Puanı: 4.8/5" (altın)
  - "💰 Tahmini Komisyon: ₺12.500" (yeşil)
- **Haftalık Grafik:** Basit bar chart (günlere göre tamamlanan iş sayısı)
- **Başarı Rozetleri:** "🏆 Ayın Ustası Mart 2026", "⚡ Hızlı Çözümcü (10+ iş/hafta)", "⭐ 5 Yıldız Ustası"
- **Son Değerlendirmeler:** Müşteri yorumları listesi (yıldız + yorum + müşteri adı + tarih)

---

═══════════════════════════════════════════════
  BÖLÜM 3: YÖNETİCİ / SERVİS SAHİBİ UYGULAMASI
═══════════════════════════════════════════════

Bottom Navigation: 📊 Dashboard | 🔧 Servis Alanı | 💰 Finans | 👥 Ekip | ⚙️ Ayarlar

**3.1 Yönetici Dashboard (Canlı Özet):**
- **Header:** "MS Oto Servis" logo + "12 Nisan 2026" + ayarlar dişli ikonu.
- **Dönem Filtresi:** "Bugün" | "Bu Hafta" | "Bu Ay" (küçük pill butonlar, sağ üst)

- **KPI Kartları** (2x2 grid, her biri renkli ikon ve değer):
  - "💰 Günlük Ciro" — "₺45.250" — "↑ %12 dünden fazla" (yeşil ok)
  - "🚗 Servisteki Araç" — "24" — "8 beklemede, 16 işlemde"
  - "✅ Bugün Tamamlanan" — "12 iş" — "Hedef: 15"
  - "⚠️ Kritik Uyarı" — "3" — kırmızı badge, tıklanabilir

- **Mini Ciro Grafiği** (Haftalık — basit area/line chart simülasyonu, gradient mavi alt dolgu)

- **Servis Alanı Canlı Durumu** (Grid, 2x3 — Lift/Bay Durumu):
  - "Lift 1: 🟢 Boş"
  - "Lift 2: 🔴 Dolu — 34 ABC 123 — Mert Usta"  
  - "Lift 3: 🔴 Dolu — 06 DEF 456 — Ali Usta"
  - "Lift 4: 🟡 Bekliyor — Parça bekleniyor"
  - "Lift 5: 🟢 Boş"
  - "Lift 6: 🔴 Dolu — 34 GHI 789 — Hakan Usta"

- **Kritik Uyarılar Bölümü** (kırmızı/turuncu border-left kartlar):
  - "⚠️ Stokta 5W-30 Motor Yağı tükenmek üzere! (Kalan: 3 litre)" — "Sipariş Ver →"
  - "📋 3 onay bekleyen teklif var." — "İncele →"
  - "💳 ₺12.800 vadesi geçmiş alacak mevcut." — "Tahsilat →"

**3.2 Onay Merkezi Ekranı:**
- **Segmented Control:** "Teklif Onayları" | "İskonto Talepleri" | "Masraf Onayları"

- **Teklif Onay Kartı:**
  - Müşteri: "Ahmet Yılmaz" + Araç: "34 ABC 123"
  - Toplam: "₺8.500" 
  - Talep eden: "Mert Usta"
  - Detay açılır: İşçilik + Parça dökümü
  - "❌ Reddet" + "✅ Onayla" butonları

- **İskonto Talep Kartı:**
  - "Mert Usta, Ankara Nakliyat A.Ş. müşterisi için %15 parça indirimi talep ediyor."
  - Orijinal: "₺5.000" → İndirimli: "₺4.250" → Fark: "₺750"
  - "❌ Reddet" + "✏️ Düzenle" + "✅ Onayla"

**3.3 Finans Özeti Ekranı:**
- **Günlük Gelir/Gider Kartı** (`bg-gradient-to-r from-green-500 to-emerald-600`, beyaz metin):
  - "Bugünün Geliri: ₺45.250" (büyük)
  - "Bugünün Gideri: ₺18.300"
  - "Net: ₺26.950"

- **Bekleyen Alacaklar Listesi:**
  - Her satır: Müşteri adı + Tutar + Vade tarihi + Gecikme gün sayısı (kırmızı badge eğer gecikmişse)
  - "Ahmet Yılmaz — ₺8.500 — 20 Nis — ⏳ 8 gün"
  - "ABC Lojistik — ₺15.200 — 10 Nis — 🔴 2 gün gecikmiş"

- **Ödeme Alma Butonu:** "💳 Hızlı Tahsilat" (yeşil buton, tıklayınca ödeme türü seçimi: Nakit/Kart/Havale)

**3.4 Ekip & Personel Durumu Ekranı:**
- **Usta Performans Kartları** (dikey liste, her biri):
  - Avatar + İsim + Uzmanlık
  - Bugünkü İş Tamamlama: Progress Ring (dairesel ilerleme, Örn: %75)
  - "Tamamlanan: 6/8" + "Ort. Süre: 2.1 saat" + "Puan: 4.9 ⭐"
  - Durum badge: "🟢 Çalışıyor" veya "☕ Molada" veya "🔴 İzinli"

- **Hızlı İşlemler:**
  - "📊 Detaylı Performans Raporu" link
  - "📅 Vardiya Planı Görüntüle" link
  - "➕ Yeni Personel Ekle" buton

**3.5 Stok Yönetimi Hızlı Erişim (Ayarlar içinde veya Ayrı Tab):**
- **Kritik Stok Uyarıları** (kırmızı border-left kartlar)
- **Barkod Okutma Butonu** (büyük, kamera ikonu, `h-16 rounded-2xl bg-blue-600`): "📷 Barkod ile Stok Sorgula"
- **Hızlı Stok Arama:** Input + sonuç listesi (Parça adı + Kod + Mevcut stok + Min stok seviyesi)
- Son stok hareketleri listesi

---

═══════════════════════════════════════════════
  SON ÇIKTI BEKLENTİLERİ VE KALİTE KRİTERLERİ
═══════════════════════════════════════════════

1. Tüm bölümleri TEK BİR HTML/React dosyasında, STATE yönetimi ile birleştir. Üstteki "Demo Rol Değiştirici" paneli ile roller arası, her rolün içindeki "Alt Sayfa Tab'ları" ile sayfalar arası geçiş yapılabilsin.

2. Toplam minimum 20+ benzersiz ekran/görünüm olmalı.

3. Her ekranda tutarlı renk paleti, spacing (p-4, gap-4 standart), ve tipografi kullanılmalı.

4. Scroll yapılabilen sayfalar doğal görünmeli, Bottom Navigation sabit (sticky bottom) kalmalı.

5. Boş durumlar (empty state) güzel bir "henüz veri yok" illüstrasyonu/mesajı ile gösterilmeli.

6. Butonlarda hover ve active efektleri (`hover:opacity-90 active:scale-95`) mutlaka olmalı.

7. Kartlarda `transition-all duration-200 hover:shadow-lg hover:scale-[1.01]` uygulanmalı.

8. Tüm metinler Türkçe, tüm para birimleri ₺ (Türk Lirası), tüm tarihler Türk formatı (GG Ay YYYY).

9. Premium, göz alıcı, yatırımcıya sunulabilecek kalitede olmalı. Sade, minimalist ama veri açısından zengin.
```

---

## 📊 Sayfa Envanteri

Yukarıdaki promptun kapsadığı toplam ekran sayısı:

| Bölüm | Ekran | Sayı |
|-------|-------|------|
| Auth & Onboarding | Splash, Onboarding (3), Rol Seçimi, Login, Register, Şifre Sıfırlama, OTP | 8 |
| Müşteri App | Dashboard, Servis Takip, Garajım, Araç Detay, Randevu, Ödemeler, Profil | 7 |
| Usta App | İş Listem, Aktif İşlem/Muayene (4 tab), Bildirimler, Performansım | 4 (+4 tab) |
| Yönetici App | Dashboard, Onay Merkezi, Finans, Ekip/Personel, Stok | 5 |
| **TOPLAM** | | **24+ ekran** |

---

**Son Güncelleme:** 12 Nisan 2026 · v2.0  
**Kaynak Referanslar:** `PROJECT_ANALYSIS_AND_ROADMAP.md`, `Giris_Bilgileri.md`
