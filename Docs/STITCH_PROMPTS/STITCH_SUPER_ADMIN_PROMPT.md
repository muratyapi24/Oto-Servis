# Google Stitch — Süper Admin Platformu Tasarım Promptu (v2.0)

Bu doküman, **Oto Servis Yönetim Sistemi** projesinin en üst yetkili platformu olan **Süper Admin (BST Command Center)** panelinin tüm ekranlarını `https://stitch.withgoogle.com` üzerinde tasarlatmak için hazırlanmış, **son derece detaylı ve kullanıma hazır** promptu içermektedir.

> **Kullanım:** Aşağıdaki ` ```markdown ` bloğunun **tamamını** kopyalayıp Google Stitch'e yapıştırın. Prompt tek seferde çalışacak şekilde tasarlanmıştır; ancak Stitch'in karakter limiti olursa her `---` ayracıyla bölünmüş BÖLÜM'ü ayrı ayrı da gönderebilirsiniz.

---

```markdown
Sen, kurumsal SaaS yönetim panelleri (Admin Dashboard) tasarlayan uzman bir UI/UX Tasarımcısı ve Frontend Geliştiricisisin. Aşağıdaki yönergelere birebir uyarak, "Oto Servis Yönetim Sistemi — BST Command Center" Super Admin platformunun TÜM EKRANLARINI tek bir çalışır React + Tailwind CSS projesi olarak üret.

═══════════════════════════════════════════════
  GENEL TASARIM SİSTEMİ VE TEKNİK KURALLAR
═══════════════════════════════════════════════

**Proje Tanımı:**
Türkiye'deki oto servis işletmelerinin (firmaların/tenantların) abone olduğu, çok kiracılı (multi-tenant) SaaS platformunun ana kumanda merkezi. Bu panele sadece `SUPER_ADMIN` rolündeki sistem yöneticisi erişebilir. Platform genelindeki tüm firmaları, abonelikleri, kullanıcıları, finansal verileri, sistem sağlığını ve güvenlik loglarını buradan izler ve yönetir. Uygulama adı: "BST Command Center".

**Renk Paleti (Kesinlikle Uygula — Koyu Kurumsal Tema):**
- Primary: `#00288e` (Koyu Mavi — ana marka rengi, aktif öğeler)
- Primary Container: `#3f58a0` (Orta Mavi — badge, avatar arkaplanları)
- Secondary: `#4c662b` (Koyu Yeşil — ikincil aksiyonlar)
- Secondary Container: `#7c8e48` (Zeytuni — uyarı badge'leri)
- Tertiary / Success: `#6ffbbe` (Yeşil — pozitif trendler, sağlıklı durumlar)
- Tertiary Fixed: `#3fd298` (Koyu Yeşil Badge — aktif durum göstergeleri)
- Error: `#ba1a1a` (Kırmızı — hata, kritik alarm, başarısız işlem)
- Background: `#F1F5F9` (Slate-50 — içerik alanı zemin)
- Surface: `#FFFFFF` (Kart arka planı)
- Inverse Surface / Sidebar BG: `#1E293B` (Slate-800 — koyu sidebar ve koyu header barlar)
- On-Surface: `#0F172A` (Slate-900 — ana metin)
- Outline: `#64748B` (Slate-500 — ikincil metin, etiket, placeholder)

**Tipografi:**
- Font: Inter (Google Fonts)
- Ana Başlık: Black (900), tracking-tight, 24px (sayfa başlıkları)
- Widget/Kart Başlık: Bold, uppercase, tracking-widest, 9-10px (veri etiketleri)
- Veri Değerleri: Font-Mono, Bold, 20-24px (KPI rakamları)
- Gövde Metin: Regular, 11-12px
- Tablo içeriği: Font-mono, 10-11px

**Genel Tasarım Kuralları:**
1. Ekran: %100 genişlik, %100 yükseklik (Desktop masaüstü ekranı). Geniş w-full layout.
2. Layout: Sol Sidebar (w-64, koyu slate bg) + Ana İçerik Alanı (flex-1, overflow-y-auto). Her sayfanın kendi sticky top header barı var.
3. Tablo Stili: "dense-table" — çok sıkışık, kompakt, font-mono, 10-11px, hover:bg-primary/5, satır aralarında border-outline/10.
4. Kart Stili: `bg-white border border-outline/20 rounded shadow-sm`. Sparkline SVG grafikleri ile zenginleştirilmiş.
5. Veri Widget'ları: `data-widget` sınıfı — `bg-white border border-outline/20 rounded p-3 shadow-sm` içinde etiket(üst) + büyük mono rakam(orta) + küçük sparkline SVG(sağ).
6. Chart Container: `bg-white border border-outline/20 rounded p-4 shadow-sm` + başlık `data-header` (flex, between).
7. Config Card: `bg-white border border-outline/20 rounded shadow-sm overflow-hidden` + `config-header` (px-4 py-2 border-b, flex between) + `config-section` (p-4).
8. Status Badge: `px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight` + duruma göre renk.
9. Progress Bar: `h-1.5 w-full bg-surface-container rounded-full overflow-hidden` + içi dolu `h-full bg-{renk} w-[%]`.
10. Tüm metinler, etiketler, butonlar **KESİNLİKLE TÜRKÇE**. Para birimi ₺.
11. Gerçekçi ve sektöre uygun Türkçe sahte veriler kullan (Firma isimleri: "MS Oto Servis A.Ş.", "Garaj Motors", "Ankara Auto Plaza", "İstanbul Premium Servis", "Ege Servis Grubu", "Merkez Bakım A.Ş.").
12. İkonlar: Google Material Symbols (Outlined), `material-symbols-outlined` sınıfı ile.
13. Hover & Active: Butonlarda `hover:bg-primary/90 transition-colors`, tablolarda `hover:bg-primary/5`, kartlarda `hover:border-primary/40`.
14. DİKKAT: Stripe Dashboard, Vercel Dashboard, AWS Console düzeyinde enterprise-grade, veri yoğun, premium bir görünüm hedefle. Basit ve sade DEĞİL, data-rich ve kompakt.

═══════════════════════════════════════════════
  SOL MENÜ (SIDEBAR) VE NAVIGASYON
═══════════════════════════════════════════════

**Sol Sidebar (bg-[#1E293B], w-64, text-slate-400, h-full, border-r border-outline/20):**

- **Üst Logo Bölümü** (p-4 border-b bg-black/10):
  - Sol: 32x32 mavi kare ikon (analytics ikonu)
  - "BST COMMAND CENTER" (beyaz, uppercase, text-sm font-bold tracking-tight)
  - Altında: "v4.2.0 Stable" (9px, uppercase, tracking-widest, tertiary renk)

- **Ana Navigasyon** (nav, p-2, space-y-0.5):
  | Sıra | İkon (Material Symbol) | Etiket | Route |
  |------|----------------------|--------|-------|
  | 1 | `dashboard` | Sistem Sağlığı | `/super-admin` |
  | 2 | `radar` | Komuta Merkezi | `/super-admin/command-center` |
  | 3 | `insights` | Stratejik İçgörüler | `/super-admin/strategic-insights` |
  | 4 | `leaderboard` | Tenant Performans | `/super-admin/tenant-performance` |
  | 5 | `apartment` | Firmalar | `/super-admin/tenants` |
  | 6 | `group` | Kullanıcılar | `/super-admin/users` |
  | 7 | `subscriptions` | Abonelikler | `/super-admin/subscriptions` |
  | 8 | `account_balance_wallet` | Ödemeler | `/super-admin/payments` |
  | 9 | `payments` | Ödeme Operasyonları | `/super-admin/payment-operations` |
  | 10 | `bar_chart_4_bars` | Analitik | `/super-admin/analytics` |

- **Ayırıcı "System Diagnostics" Başlığı** (pt-4 pb-1 px-3 mt-4 — 9px bold uppercase tracking-widest text-outline)

- **Diagnostik Navigasyon:**
  | İkon | Etiket | Route |
  |------|--------|-------|
  | `settings` | Ayarlar | `/super-admin/settings` |
  | `history` | Loglar | `/super-admin/logs` |
  | `notifications` | Bildirimler | `/super-admin/notifications` |

- **Aktif Menü Stili:** `bg-primary/20 text-white border-l-2 border-primary`
- **Pasif Menü Stili:** `hover:bg-white/5 text-surface-dim border-l-2 border-transparent`

- **Alt Profil Bölümü** (p-3 border-t bg-black/5):
  - 32x32 avatar (baş harfler "AY", bg-primary-container)
  - "A. Yılmaz" (xs font-bold) + "Super Admin" (9px uppercase text-outline)
  - Sağda: `logout` ikonu (hover:text-white)

**Her Sayfanın Üst Header'ı (Sidebar İÇİNDE DEĞİL, ana içerik alanının en üstünde):**
- h-12, bg-white, border-b, sticky top-0 z-40
- Sol: Sayfa ikonu + Sayfa başlığı (sm font-bold uppercase) + Arama input
- Sağ: Durum badge'i ("🟢 Çalışma: %99.99") + Bildirim zili + Terminal ikonu

**Aşağıdaki ekranları, Sidebar tıklamalarına göre React State ile değiştir. Her menü öğesine tıklayınca ilgili bölüm gösterilsin.**

---

═══════════════════════════════════════════════
  BÖLÜM 0: SÜPER ADMİN GİRİŞ EKRANI
═══════════════════════════════════════════════

Sidebar/Header olmadan bağımsız, tam ekran login sayfası. Demo panelinde "🔐 Giriş" butonu ile erişilsin.

- **Zemin:** `bg-slate-950` tam ekran. Arka planda iki büyük blur daire (bg-blue-900/30 ve bg-purple-900/20, rounded-full blur-3xl).
- **Login Kartı** (max-w-md, bg-slate-900/80, backdrop-blur-xl, border border-slate-800, p-8, rounded-3xl, shadow-2xl):
  - Üstte: 64x64 gradient mavi kare ikon (`from-blue-600 to-blue-900`, içinde `ShieldAlert` ikonu)
  - Başlık: "Sistem Yönetimi" (2xl font-bold text-white)
  - Alt metin: "Yalnızca Kurucu Girişine İzin Verilir" (text-slate-400, sm)
  - **Input 1 — E-posta:** Sol ikonlu (`Mail`), placeholder "admin@sistem.com", bg-slate-950/50, border-slate-800, rounded-xl, py-3
  - **Input 2 — Şifre:** Sol ikonlu (`Lock`), Sağda göster/gizle toggle (`Eye`/`EyeOff`), aynı stilde
  - **Giriş Butonu:** "Sisteme Eriş →" tam genişlik, bg-blue-600, rounded-xl, py-3.5, font-bold, shadow-lg shadow-blue-900/50, hover:bg-blue-500
  - **Alt link:** "Firma paneline geri dön" (text-slate-500, hover:text-slate-300)
  - **Hata durumu:** Kırmızı alert kutusu (bg-red-950/50, border-red-900/50, text-red-200, AlertCircle ikonu)

---

═══════════════════════════════════════════════
  BÖLÜM 1: SİSTEM SAĞLIĞI (ANA DASHBOARD)
═══════════════════════════════════════════════

Panel açıldığında ilk gelen ekran. Route: `/super-admin`

**Üst Header:**
- İkon: `monitor_heart` + "Sistem Sağlığı" başlığı
- Arama: "Sistem günlükleri veya verilerde ara..."
- Sağ: "🟢 Çalışma: %99.99" badge + Terminal ikonu + Bildirim zili (kırmızı nokta)

**Alt Sekme Barı (Sub-tabs):**
- "Genel Bakış" (aktif) | "Firmalar" | "Sistem Durumu (Analitik)" | "İşlem Günlükleri" — link'ler

**4'lü KPI Widget Grid (2x2 veya 4x1):**
1. **Toplam Firma:** Büyük mono rakam (örn: "2") + "2 Aktif" küçük yeşil etiket + Sparkline SVG (yeşil çizgi, 6 aylık trend)
2. **Aktif Kullanıcı:** Büyük mono rakam (örn: "8") + "+5.2%" küçük yeşil etiket + Sparkline SVG
3. **Aylık Ciro (MRR):** Büyük mono rakam "₺16.700,00" + "MRR" etiketi + Sparkline SVG (mavi çizgi) — sol kenarı `border-l-2 border-primary`
4. **Kayıp Oranı (Churn):** "2.4%" + "-0.2%" kırmızı etiket + Sparkline SVG (kırmızı çizgi) — sol kenarı `border-l-2 border-error`

**İçerik Grid (12 kolon: 8 sol + 4 sağ):**

*Sol Kolon (col-span-8):*
- **Son Eklenen Firmalar Tablosu:**
  - Koyu başlık barı: "Son Eklenen Firmalar" + "Canlı Senkron" etiketi
  - Kolonlar: ID | Firma Adı (bold) | Hizmet Paketi (renkli badge: ENT=primary-container, PRO=secondary, STD=normal) | Kayıt Tarihi | Durum (yeşil/kırmızı nokta)
  - Örnek veriler: "MS Oto Servis A.Ş. — PRO — 13.04.2026 — 🟢" ve "Garaj Motors — STD — 13.04.2026 — 🟢"

- **Canlı Sistem Günlüğü:**
  - Koyu `bg-inverse-surface` başlık barı: "Canlı Sistem Günlüğü (Örnek)"
  - 3 satır log kaydı, her biri:
    - Zaman (mono, 9px) + Seviye Badge (yeşil "Kayıt" / mavi "Ödeme" / kahverengi "Güvenlik") + Mesaj + İzleme Kodu
    - Örn: `12:44:02 | KAYIT | "Ege Servis" sunucusu başarıyla kuruldu. | SYS-091`
    - Örn: `12:38:15 | ÖDEME | "Ankara Auto" paketi Enterprise'a yükseltildi. | AUTO-72`
    - Örn: `11:59:44 | GÜVENLİK | Hatalı giriş denemesi (IP: 95.1.x.x) - Engellendi. | SEC-403`

*Sağ Kolon (col-span-4):*
- **Altyapı Yükü Kartı:**
  - "API Gecikmesi: 124ms" — %35 progress bar (primary)
  - "DB İşlem Hızı: 8.2k ops/s" — %62 progress bar (tertiary)
  - "Depolama I/O: Yüksek" — %88 progress bar (secondary-container)

- **Aktif Alarmlar Kartı** (kırmızı border):
  - Başlık: "⚠️ Aktif Alarmlar" + "2 KRİTİK" kırmızı badge
  - Alarm 1: "Alan Sınırı: Merkez Servis — MS-42 %95 kotaya ulaştı" + "YÜKSELT" / "YOKSAY" linkleri
  - Alarm 2: "Abonelik Uç Hatası — cluster-beta'da 3 işlem başarısız" + "TÜMÜNÜ YENİDEN DENE" linki

- **Pazar Payı Kartı:**
  - Donut Chart SVG (3 dilim): ENT %52 (primary), PRO %31 (secondary-container), STD %17 (yeşil)
  - Sağda renk kodlu legend

---

═══════════════════════════════════════════════
  BÖLÜM 2: KOMUTA MERKEZİ
═══════════════════════════════════════════════

Route: `/super-admin/command-center`

- **Başlık:** "Komuta Merkezi" (3xl font-black) + "Gerçek zamanlı platform durumu ve sistem izleme"

- **4'lü KPI Kartları** (2x4 grid, her biri büyük renkli arka plan):
  - "Aktif Tenant: 2" (bg-blue-50, text-blue-700, 4xl font-black)
  - "Aktif Kullanıcı: 8" (bg-green-50, text-green-700)
  - "Aktif Servis: 6" (bg-orange-50, text-orange-700)
  - "Son 24s Hata: 0" (bg-red-50, text-red-700)

- **Süresi Dolan Abonelikler** (bg-orange-50, border-orange-200, rounded-2xl):
  - "7 Gün İçinde Sona Erecek Abonelikler" başlığı
  - Liste: Plan adı + Bitiş tarihi (font-mono, orange renk)

- **Son 24 Saat Sistem Hataları Tablosu:**
  - bg-slate-50 başlık, rounded-2xl, divide-y
  - Her satır: Module Badge (kırmızı) + Mesaj + Saat (mono)
  - Boşsa: "Hata kaydı bulunmuyor." mesajı

---

═══════════════════════════════════════════════
  BÖLÜM 3: STRATEJİK İÇGÖRÜLER
═══════════════════════════════════════════════

Route: `/super-admin/strategic-insights`

- **Başlık:** "Stratejik İçgörüler" + "Büyüme analizi, churn ve gelir projeksiyonları"

- **3'lü KPI Kartları:**
  - "Aktif Abonelik: 2" (bg-blue-50, 4xl)
  - "Churn Oranı: %0" (bg-red-50, 4xl)
  - "Son 6 Ay Yeni Tenant: 2" (bg-green-50, 4xl)

- **Aylık Yeni Tenant Büyümesi Bar Chart** (rounded-2xl, h-40 bar'lar, mavi çubuklar, ay etiketleri altında)

- **En Aktif Tenantlar (Servis Emri) Tablosu:**
  - Sıra numarası (mavi daire) + Firma adı + "X iş emri" (font-mono)

- **Aylık Churn Analizi Tablosu:**
  - Kolonlar: Dönem | Yeni Tenant (yeşil +) | İptal (kırmızı -)

---

═══════════════════════════════════════════════
  BÖLÜM 4: TENANT PERFORMANS MATRİSİ
═══════════════════════════════════════════════

Route: `/super-admin/tenant-performance`

- **Başlık:** "Tenant Performans Matrisi" + "Tüm tenantların servis, kullanıcı ve abonelik durumu"

- **Geniş Performans Tablosu** (rounded-2xl, shadow-sm):
  - Kolonlar: Firma | Kullanıcı (mono, sağ hizalı) | Servis Emri (mono, mavi, bold) | Müşteri (mono) | Plan | Abonelik Durumu (renkli badge: Aktif=yeşil, Deneme=mavi, Gecikme=turuncu, İptal=kırmızı, Süresi Doldu=gri) | Kayıt Tarihi
  - Hover: bg-slate-50

---

═══════════════════════════════════════════════
  BÖLÜM 5: FİRMALAR (TENANT YÖNETİMİ)
═══════════════════════════════════════════════

Route: `/super-admin/tenants`

**Header:**
- İkon: `apartment` + "Firma Yönetimi"
- Arama: "Firma adı, ID veya domaine göre ara..."
- Sağ: "AKTİF: 2 / 2" yeşil badge + "Yeni Firma Oluştur" mavi buton (+ dialog/modal)

**Alt Sekme Barı:** "Genel Bakış" | "Tüm Firmalar" (aktif) | "Dağıtım Sırası" | "Sağlık Denetimi"

**Sol Filtre Sidebar (w-56, bg-white, border-r):**
- **Hizmet Paketi:** Checkbox'lar — Kurumsal (42), Profesyonel (58), Standart (27)
- **Sağlık Durumu:** Renkli noktalı radio'lar — Sağlıklı / Askıya Alınmış
- **Bölge:** Dropdown — Tüm Bölgeler, TR-Marmara, TR-İç Anadolu, EU-Batı
- "Tüm Filtreleri Temizle" link

**Ana Tablo:**
- Toolbar: Görünüm seçici ("Sıkışık" / "Rahat") + "X kayıt gösteriliyor" + İndir/Yazdır/Ayar ikonları
- Kolonlar: ☐ (checkbox) | Firma Adı (avatar harfleri + isim + email) | Hizmet Paketi (renkli badge) | Veri Noktaları (U:3 V:3) | Durum (yeşil/kırmızı nokta + "AKTİF"/"ASKIYA ALINDI") | Oluşturulma Tarihi | İşlemler (3 nokta menü → Görüntüle, Şifre Sıfırla, Askıya Al)
- Alt: Sayfalama (← 1 2 →) + "Sayfa başına kayıt: 25/50/100" dropdown

---

═══════════════════════════════════════════════
  BÖLÜM 6: KULLANICILAR DİZİNİ
═══════════════════════════════════════════════

Route: `/super-admin/users`

**Header:** İkon: `manage_accounts` + "Kullanıcı Dizini" + Arama + "Yeni Kullanıcı" butonu + İndir/Filtre ikonları

**Alt Sekmeler:** "Tüm Kullanıcılar" | "Yöneticiler" | "Servis Personeli" | "Pasif"

**Tablo:**
- Kolonlar: Kullanıcı ID (#kısa) | İsim (bold) | E-posta (mavi link) | Sistem Rolü (renkli badge: SUPER_ADMIN=primary-container, TENANT_ADMIN=secondary, MECHANIC=gri, CUSTOMER=tertiary) | Firma | Son Giriş | Durum (Aktif/Askıya Alındı badge) | İşlemler (⋮)
- Alt: "TOPLAM X KAYITTAN 1-X ARASI GÖSTERİLİYOR" + sayfalama

---

═══════════════════════════════════════════════
  BÖLÜM 7: ABONELİK YÖNETİMİ
═══════════════════════════════════════════════

Route: `/super-admin/subscriptions`

**Header:** İkon: `subscriptions` + Dinamik başlık (sekmeye göre) + "Durum: Optimal" yeşil badge

**5 Alt Sekme:**
1. **Abonelik Merkezi (Hub):** Tüm aboneliklerin tablo listesi — Firma, Plan, Durum, Fiyat, Dönem Sonu
2. **Abonelik Analitiği:** Plan dağılımı grafikleri, trend analizi
3. **Performans & Tahmin:** "TAHMİN PENCERESİ: SONRAKİ 90 GÜN" dropdown + "Dışa Aktar" buton + MRR/ARR projeksiyonları
4. **Kurumsal Plan Detayı:** ENT plan kapsamındaki firmalar, limit kullanımları
5. **Pro Plan Detayı:** PRO plan kapsamındaki firmalar

**Abonelik Paketi Referansları:**
| Plan | Aylık | Yıllık | Kullanıcı | Araç |
|------|-------|--------|-----------|------|
| Standart | ₺2.500 | ₺25.000 | 3 | 500 |
| Profesyonel | ₺8.200 | ₺82.000 | 15 | 5.000 |
| Kurumsal | ₺20.000 | ₺200.000 | Sınırsız | Sınırsız |

---

═══════════════════════════════════════════════
  BÖLÜM 8: ÖDEMELER (FİNANSAL KONTROL MERKEZİ)
═══════════════════════════════════════════════

Route: `/super-admin/payments`

**Header:** İkon: `account_balance_wallet` + "Ödeme Operasyonları" + Arama ("TXID, İsim veya Kart Son 4 Hane ara...") + "Ağ: Aktif" badge

**5 Alt Sekme:** "Genel Bakış" | "İşlemler" | "Mutabakat" | "İtirazlar (Disputes)" | "Düzenli Ödemeler"

***Genel Bakış Sekmesi:***

- **4'lü KPI Widget'ları** (sparkline'lı):
  - "Aylık Toplam Gelir: ₺482,190" (border-l-primary, +14.2%)
  - "Başarılı İşlemler: 8,432" (border-l-tertiary, +5.2%)
  - "Başarısız Ödemeler: 124" (border-l-error, +2.1%)
  - "Ort. İşlem Değeri: ₺1,240" (sabit)

- **Gelire Göre En İyi Firmalar Tablosu** (koyu header):
  - Firma ID | Firma Adı | Abonelik Türü (badge) | İşlem Hacmi | Toplam Ciro (primary mono) | Pazar Payı (progress bar + %) | Durum (nokta)
  - Örn: "TN-882 | Ankara Auto Plaza | ENT | 1,240 | ₺84,500.00 | %17"

- **Son Yüksek Hacimli İşlemler** (koyu header, "CANLI AKIŞ"):
  - Her satır: Saat + İkon (daire) + Tutar + Firma + Fatura bilgisi + Başarılı/Reddedildi badge

- **Sağ Kolon (col-span-4):**
  - **Sanal Pos Performansı:** Stripe API (%99.98 SR), Iyzico Core (%98.40), Manuel Havale (Bekleyen Kontrol) — progress bar'lar
  - **Abonelik Yenilenme Oranları:** Donut chart SVG + legend (Yenilenen %88.5, Yeni Abone %3.5, Kayıp %2.4)
  - **Kritik Ödeme Alarmları:** Chargeback itirazı + Havale gecikmesi (kırmızı border kartlar)

***İşlemler Sekmesi:***
- 3 aksiyon kartı: Mutabakat Bekleyen (42 işlem), İtiraz Kuyruğu (08 bekleyen), Başarısız Tahsilat (12 deneme)
- Detaylı İşlem Kaydı Tablosu: Filtre barı (TÜMÜ/BAŞARILI/BAŞARISIZ/BEKLEYEN) + Tarih aralığı + XLSX İndir
  - Kolonlar: İşlem ID | Alıcı | Tutar | Yöntem | Durum (renkli badge) | Tarih | Aksiyon
  - 8 örnek işlem: "TXN-8429103 | Ankara Auto Plaza (ENT) | ₺12,500 | Visa ··4412 | Başarılı" vb.

---

═══════════════════════════════════════════════
  BÖLÜM 9: ÖDEME OPERASYONLARI
═══════════════════════════════════════════════

Route: `/super-admin/payment-operations`

- **Başlık:** "Ödeme Operasyonları" + "Abonelik ödemeleri, gecikme ve iade takibi"
- **3'lü KPI:** Aktif (yeşil), Gecikme (turuncu), İptal (kırmızı)
- **Tüm Abonelikler Tablosu:** Firma | E-posta | Plan | Aylık Ücret (mono, sağ hizalı) | Durum (renkli badge) | Dönem Sonu

---

═══════════════════════════════════════════════
  BÖLÜM 10: ANALİTİK MOTORU
═══════════════════════════════════════════════

Route: `/super-admin/analytics`

**Header:** İkon: `insights` + "Analitik Motoru" + Dönem seçici dropdown ("SON 30 GÜN" / "SON ÇEYREK" / "BU YIL") + "Rapor Oluştur" buton + Yenile ikonu

**4 Alt Sekme:** "Finansal İçgörüler" | "Kullanıcı Dinamikleri" | "Kaynak Dağılımı" | "Dönüşüm Hunileri"

***Finansal İçgörüler:***
- **Gelir Hızı:** Bar chart (7 sütun) + "₺384,250 — BU AY DÖNEMİ"
- **ARPU (Ort. Gelir Artışı):** Donut chart (%75) + "₺2,025/Birim"
- **Aylık Fatura Geliri Dağıtımı:** 12 aylık stacked bar chart (Abonelikler=primary, Ek Hizmetler=secondary-container)

***Kullanıcı Dinamikleri:***
- **Aktif Oturumlar:** Area chart SVG (gradient fill) + "1,843 — ↑12.4%"
- **Cohort Tablosu:** (NİS/MAY/HAZ satırları, 1-4 hafta sütunları, yoğunluk haritası renklendirmesiyle %92→%54 vb.)
- **Churn Risk Haritası:** 3 progress bar (Standart: %7.2 Yüksek Risk, Enterprise: %0.8 Düşük Risk, Profesyonel: %2.1 Orta Risk)

***Kaynak Dağılımı:***
- **CPU/RAM/Ağ Yük Durumu:** 3 progress bar (CPU %88 kırmızı, RAM %42 mavi, Ağ %65 yeşil) + "8.2k İŞLEM/SN"
- **Sistem Altyapı Tahsisi:** Donut chart (İşlem %60, Depolama %25, Ağ %15) + "Toplam Kullanım: %84"

---

═══════════════════════════════════════════════
  BÖLÜM 11: İŞLEM GÜNLÜKLERİ (AUDIT LOG)
═══════════════════════════════════════════════

Route: `/super-admin/logs`

**Header:** İkon: `terminal` + "İşlem Günlükleri" + "Aktif Oturum: main-cluster-01" badge + "🟢 Canlı Akış Aktif" badge + "Tüm Kaydı İndir" buton

**Filtre Barı:**
- Seviye: TÜMÜ | HATA | UYARI | BİLGİ (toggle butonlar, aktif=bg-primary text-white)
- Arama: "Kaynak, mesaj veya izleme ID'ye göre ara..." (font-mono)
- Kaynak: Dropdown (Tüm Modüller, API-GATEWAY, AUTH-SERVICE, BILLING-ENGINE, DATA-SYNC)
- Yenile ikonu

**Log Tablosu** (log-table, font-mono, 11px):
- Kolonlar: Zaman Damgası | Seviye (renkli badge: INFO=mavi, WARN=sarı, ERROR=kırmızı) | Modül (bold, renkli) | Mesaj (error ise bold kırmızı) | İzleme ID (opacity-70)

**Sağ Panel (w-64, border-l, hidden lg:block):**
- **Olay Dağılımı:** Hatalar vs Bilgi/Uyarılar — progress bar'lar
- **Modül Sağlamlığı:** API-GW (🟢), AUTH-SV (🟢), BILL-ENG (🔴 pulse animate), STORAGE (🟡)
- **Durum Özeti:** "Ödeme motorunda kesintili veritabanı yavaşlaması görülüyor." + "Tanılamayı Kullan" link

---

═══════════════════════════════════════════════
  BÖLÜM 12: SİSTEM AYARLARI
═══════════════════════════════════════════════

Route: `/super-admin/settings`

**Header:** İkon: `settings` + "Sistem Yapılandırma Merkezi" + "SÜREÇ-IDX: 0x2A4" badge + "Değişiklikleri Kaydet" buton

**5 Alt Sekme:** "Genel Ayarlar" | "Kimlik Doğrulama" | "Veritabanı Kümesi" | "API Webhook'ları" | "Yerelleştirme"

***Genel Ayarlar:***
- **Çekirdek Motor Yapılandırması** (config-card):
  - Sistem Tanımlayıcı: "BST-PROD-CLUSTER-001" (readonly)
  - Temel URL Ortamı: "https://core-prod.bstservis.com"
  - Sunucu Ping Aralığı: 30 ms
  - Veri Saklama Politikası: Standart (365 Gün) / Uyumluluk (7 Yıl) / Sıkı (90 Gün)

- **Varsayılan Firma Tedarik Ayarları:**
  - 3 toggle switch: Otomatik Ölçeklendirme / Çoklu-Bölge Kurulumu / Yedek DB Senkronu

- **Bildirim Aktarıcısı:**
  - SMTP Ağ Geçidi (host, port, protokol STARTTLS/SSL)
  - Servis durumu: Yeşil progress bar %100

- **Tehlikeli Alan** (bg-error/5, border-error/20):
  - "Kümeyi Yeniden Başlat" (outline kırmızı buton)
  - "Log Arşivini Temizle" (solid kırmızı buton)

***Kimlik Doğrulama:***
- 2FA toggle (süper yöneticiler için zorunlu)
- Otomatik Oturum Kapatma toggle (15 dk)
- Parola Karmaşıklığı tag'ları: Büyük Harf, Rakamlar, Semboller (aktif), Uzunluk 12+ (pasif)

***Veritabanı Kümesi:***
- Ağ İzin Listesi tablosu: CIDR Aralığı | Etiket | Silme ikonu
  - "192.168.1.0/24 — Şirket VPN" , "10.0.0.0/8 — Dahili Sunucu Kümesi"
  - "+ Kayıt Ekle" butonu

---

═══════════════════════════════════════════════
  BÖLÜM 13: BİLDİRİMLER
═══════════════════════════════════════════════

Route: `/super-admin/notifications`

**Header:** İkon: `notifications_active` + "Bildirimler" + Arama + "Sistem Aktif" badge

**Alt Sekmeler:** "Tümü" | "Okunmamış" | "Kritik" | "Sistem" | "Güvenlik"

**3'lü Üst Metrik Kartları** (renkli, ikonlu):
- "Okunmamış: X" (bg-secondary-container)
- "Kritik Alarm: X" (bg-error, beyaz metin)
- "Uyarılar: X" (bg-tertiary-fixed)

**Bildirim Tablosu** (koyu header, dense-table):
- Koyu header barı: "Bildirim Geçmişi & Log Kaydı" + filtre butonları (HEPSİ/SİSTEM/FİNANS) + "TÜMÜNÜ OKUNDU İŞARETLE"
- Kolonlar: Okunmamışsa mavi/kırmızı nokta | Zaman Damgası | Kategori (renkli badge: SYSTEM/SECURITY/BILLING) | Mesaj (Kritikse kırmızı bold başlık) | Önem Derecesi badge (CRITICAL=kırmızı, WARNING=kehribar, INFO=gri)
- Alt: Sayfalama

---

═══════════════════════════════════════════════
  SON ÇIKTI BEKLENTİLERİ VE KALİTE KRİTERLERİ
═══════════════════════════════════════════════

1. Tüm bölümleri TEK BİR React dosyasında, STATE yönetimi ile birleştir. Sol Sidebar'daki menü öğelerine tıklanınca ilgili sayfa görüntülensin.

2. Toplam minimum **15+ benzersiz ekran/görünüm** (alt sekmeler dahil 30+ alan).

3. Tutarlı design system: Her sayfada aynı widget, tablo, progress bar, badge stilleri.

4. Data-dense, enterprise-grade, kompakt tasarım. Stripe/Vercel/AWS Console hissiyatında.

5. Tüm focus/hover/active efektleri özenle eklenmiş olsun (ring-2 ring-primary/50, hover:bg-primary/5, transition-all).

6. Tüm metinler Türkçe, ₺ para birimi, Türk formatı tarihler.

7. Premium, göz alıcı, yatırımcıya sunulabilecek kalitede. Sade DEĞİL, data-rich ve kompakt.

8. Her tabloda "boş durum" mesajı olmalı ("Kayıt bulunamadı." vb.)
```

---

## 📊 Sayfa Envanteri

Yukarıdaki promptun kapsadığı toplam ekran ve alt sekme sayısı:

| Bölüm | Ekran Adı | Alt Sekmeler | Sayı |
|-------|-----------|-------------|------|
| Login | Süper Admin Giriş | - | 1 |
| Sistem Sağlığı | Ana Dashboard | Genel Bakış, Firmalar, Analitik, Loglar | 1 (+4) |
| Komuta Merkezi | Gerçek Zamanlı İzleme | - | 1 |
| Stratejik İçgörüler | Büyüme & Churn Analizi | - | 1 |
| Tenant Performans | Performans Matrisi Tablosu | - | 1 |
| Firmalar | Tenant Yönetim Tablosu | Tümü, Dağıtım, Sağlık | 1 (+3) |
| Kullanıcılar | Kullanıcı Dizini | Tümü, Yöneticiler, Personel, Pasif | 1 (+4) |
| Abonelikler | Abonelik Yönetimi | Hub, Analitik, Performans, ENT, PRO | 1 (+5) |
| Ödemeler | Finansal Kontrol | Overview, İşlemler, Mutabakat, İtirazlar, Düzenli | 1 (+5) |
| Ödeme Operasyonları | Abonelik Ödeme Takibi | - | 1 |
| Analitik | Analitik Motoru | Finansal, Kullanıcı, Kaynak, Huniler | 1 (+4) |
| Loglar | İşlem Günlükleri | Seviye Filtreleri | 1 |
| Ayarlar | Sistem Yapılandırma | Genel, Auth, DB, API, Locale | 1 (+5) |
| Bildirimler | Bildirim Geçmişi | Tümü, Okunmamış, Kritik, Sistem, Güvenlik | 1 (+5) |
| **TOPLAM** | | | **14 ana ekran + ~35 alt sekme = ~49 görünüm** |

---

## 🔗 Gerçek Proje Route Haritası

| Route | Dosya |
|-------|-------|
| `/superadmin-login` | `app/superadmin-login/page.tsx` |
| `/super-admin` | `app/(super-admin)/super-admin/page.tsx` |
| `/super-admin/command-center` | `app/(super-admin)/super-admin/command-center/page.tsx` |
| `/super-admin/strategic-insights` | `app/(super-admin)/super-admin/strategic-insights/page.tsx` |
| `/super-admin/tenant-performance` | `app/(super-admin)/super-admin/tenant-performance/page.tsx` |
| `/super-admin/tenants` | `app/(super-admin)/super-admin/tenants/page.tsx` |
| `/super-admin/users` | `app/(super-admin)/super-admin/users/page.tsx` |
| `/super-admin/subscriptions` | `app/(super-admin)/super-admin/subscriptions/page.tsx` |
| `/super-admin/payments` | `app/(super-admin)/super-admin/payments/page.tsx` |
| `/super-admin/payment-operations` | `app/(super-admin)/super-admin/payment-operations/page.tsx` |
| `/super-admin/analytics` | `app/(super-admin)/super-admin/analytics/page.tsx` |
| `/super-admin/logs` | `app/(super-admin)/super-admin/logs/page.tsx` |
| `/super-admin/settings` | `app/(super-admin)/super-admin/settings/page.tsx` |
| `/super-admin/notifications` | `app/(super-admin)/super-admin/notifications/page.tsx` |

---

**Son Güncelleme:** 15 Nisan 2026 · v2.0
**Kaynak Referanslar:** `Giris_Bilgileri.md`, `STITCH_MOBILE_APP_PROMPT.md`, Proje kaynak kodu (`apps/web/app/(super-admin)/`)
