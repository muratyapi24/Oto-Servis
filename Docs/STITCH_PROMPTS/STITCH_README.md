# 🎨 Google Stitch AI Tasarım Promptları - Hızlı Başlangıç Kılavuzu

## 📖 Genel Bakış

Bu klasörde, **ÖNCÜ OTO SERVİS PROGRAMI** SaaS platformunun tüm web sayfaları için Google Stitch (https://stitch.withgoogle.com/) kullanarak HTML tasarımları oluşturmanızı sağlayacak detaylı promptlar bulunmaktadır.

## 📁 Dosya Yapısı

```
BTS-V2/
├── PROJECT_ANALYSIS_AND_ROADMAP.md    # Ana proje analiz dökümanı
├── STITCH_PROMPTS.md                   # Tüm sayfalar için detaylı promptlar (2786 satır)
└── STITCH_README.md                    # Bu dosya - Kullanım kılavuzu
```

## 🚀 Nasıl Kullanılır?

### Adım 1: Prompt Seçimi

`STITCH_PROMPTS.md` dosyasını açın ve ihtiyacınız olan sayfanın promptunu bulun:

**Bölümler:**
1. **Landing Marketing Portal** (5 sayfa)
   - Ana Sayfa (Homepage)
   - Özellikler (Features)
   - Fiyatlandırma (Pricing)
   - Hakkımızda (About Us)
   - Blog Ana Sayfa

2. **Super Admin Portal** (3 sayfa)
   - Super Admin Dashboard
   - Tenant Yönetimi
   - Platform Analitik

3. **Web Firm/Workshop Portal** (2+ sayfa)
   - Workshop Dashboard
   - Servis İşlemleri
   - *(ve diğerleri)*

4. **Mobile Apps** (3 responsive web view)
   - Müşteri Mobil Uygulaması
   - Usta (Mechanic) Mobil Uygulaması
   - Admin Mobil Uygulaması

### Adım 2: Prompt'u Kopyalama

İstediğiniz sayfanın tamamını seçin (başlıkta "Prompt:" yazan yerden başlayıp "---" ayırıcısına kadar).

**Örnek:**
```markdown
### 1.1 Ana Sayfa (Homepage)

**Prompt:**

Create a modern, professional landing page homepage...
[... tüm detaylar ...]
Generate complete HTML with Tailwind CSS styling.

---
```

### Adım 3: Google Stitch'te Oluşturma

1. **https://stitch.withgoogle.com/** adresine gidin
2. Prompt input alanına kopyaladığınız prompt'u yapıştırın
3. **"Generate"** veya **"Create"** butonuna tıklayın
4. AI'nin tasarımı oluşturmasını bekleyin (genellikle 10-30 saniye)
5. Oluşturulan HTML'i önizleyin
6. Beğendiyseniz indirin veya kopyalayın

### Adım 4: Tasarımı Entegre Etme

İndirdiğiniz HTML dosyasını projenize ekleyin:
- `index.html` (ana sayfa için)
- `features.html` (özellikler sayfası için)
- vb.

Tailwind CSS CDN bağlantısını kontrol edin veya lokal kurulum yapın.

## 💡 İpuçları & En İyi Uygulamalar

### 1. Prompt Özelleştirme

Promptları kendi ihtiyaçlarınıza göre düzenleyebilirsiniz:

**Örnek Değişiklikler:**
```markdown
❌ Orijinal: "Primary: #2563EB (Trustworthy Blue)"
✅ Değiştirilmiş: "Primary: #DC2626 (Kırmızı - marka rengimiz)"

❌ Orijinal: "Font Family: Inter"
✅ Değiştirilmiş: "Font Family: Roboto (tercihimiz)"
```

### 2. İteratif İyileştirme

İlk sonuç mükemmel değilse:
- Prompt'a ek detaylar ekleyin
- Belirli bölümleri vurgulayın
- "Daha modern", "daha minimalist" gibi stil yönergeleri ekleyin

**Örnek Ek Not:**
```markdown
Additional notes:
- Make it more minimalist with lots of white space
- Use larger typography for headings
- Add more visual hierarchy
- Include micro-interactions on buttons
```

### 3. Responsive Test

Oluşturulan tasarımı farklı ekran boyutlarında test edin:
- Desktop (1920px, 1366px, 1024px)
- Tablet (768px, 834px)
- Mobile (375px, 414px)

Google Stitch genellikle responsive tasarım oluşturur, ancak kontrol edin.

### 4. Bileşen Kütüphanesi

Her sayfa için ayrı ayrı oluşturmak yerine:
1. Önce **Design System** prompt'u oluşturun (renkler, tipografi, bileşenler)
2. Sonra her sayfayı bu sistemi kullanarak oluşturun
3. Tutarlılık sağlayın

### 5. Türkçe İçerik

Promptlar İngilizce olsa da, oluşturulan HTML'de Türkçe karakterler kullanın:
- `ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü`
- UTF-8 encoding kontrol edin: `<meta charset="UTF-8">`

## 📊 Hangi Sayfa İçin Hangi Prompt?

### Landing Page Gerekliyse:
→ Bölüm 1.x (Ana Sayfa, Özellikler, Fiyatlandırma, vb.)

### Admin Panel Gerekliyse:
→ Bölüm 2.x (Super Admin Dashboard, Tenant Management)

### İşletme Yazılımı Gerekliyse:
→ Bölüm 3.x (Workshop Dashboard, Service Operations)

### Mobil Uygulama Gerekliyse:
→ Bölüm 4.x (Customer App, Mechanic App, Admin App)

## 🎯 Örnek Çalışma Akışı

**Senaryo:** Landing sayfasını oluşturmak istiyorsunuz

1. `STITCH_PROMPTS.md` dosyasını aç

2. `### 1.1 Ana Sayfa (Homepage)` bölümünü bul
3. Prompt'u kopyala
4. Google Stitch'e yapıştır
5. Oluştur → Önizle → İndir
6. `index.html` olarak kaydet
7. Tarayıcıda aç ve test et
8. Gerekirse düzenle
9. Diğer sayfalar için tekrarla

## 🔧 Alternatif AI Araçları

Google Stitch dışında şu araçları da kullanabilirsiniz:

1. **v0.dev** (Vercel) - React/Tailwind odaklı
2. **Locofy.ai** - Figma'dan code'a
3. **Anima App** - Design to code
4. **Builder.io** - AI-powered builder
5. **TeleportHQ** - Hand-coded feel

Aynı promptları bu araçlarda da deneyebilirsiniz.

## 📝 Prompt Mühendisliği

İyi prompt yazma teknikleri:

### 1. Bağlam Verin
```markdown
❌ Kötü: "Bir dashboard oluştur"
✅ İyi: "Oto servis işletmeleri için kapsamlı admin dashboard oluştur..."
```

### 2. Detaylı Açıklama
```markdown
❌ Kötü: "Güzel bir header olsun"
✅ İyi: "Fixed top navbar, white background, shadow-sm, logo solda, navigation ortada, iki buton sağda..."
```

### 3. Somut Örnekler
```markdown
❌ Kötü: "Fiyatlandırma kartları ekle"
✅ İyi: "3 fiyatlandırma kartı: Starter ₺299, Professional ₺599 (highlighted), Enterprise ₺999..."
```

### 4. Teknik Özellikler
```markdown
"Use Tailwind CSS utility classes, mobile-first responsive design, 
Inter font family, color palette: Primary #2563EB, smooth transitions"
```

### 5. Etkileşimler
```markdown
"Hover effects on cards (translateY(-4px)), smooth scroll animations, 
collapsible sections, modal dialogs with backdrop blur"
```

## 🎨 Renk Paleti Referansı

Tüm promptlarda tutarlı renk paleti kullanılmıştır:

```css
/* Brand Colors */
--primary: #2563EB;      /* Trustworthy Blue */
--secondary: #10B981;    /* Growth Green */
--accent: #F97316;       /* Energy Orange */
--dark: #1F2937;         /* Dark Gray */
--light: #F9FAFB;        /* Light Gray */

/* Text Colors */
--text-dark: #111827;
--text-gray: #6B7280;
--text-light: #FFFFFF;
```

## 📱 Responsive Breakpoints

Promptlarda şu breakpoints kullanılmıştır:

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## ⚠️ Dikkat Edilmesi Gerekenler

1. **HTML Kalitesi:**
   - Semantic HTML kullanın (`<header>`, `<main>`, `<section>`)
   - Accessibility (ARIA labels, alt text)
   - SEO friendly structure

2. **CSS Organizasyonu:**
   - Tailwind CDN veya build process
   - Custom styles için `<style>` blokları
   - Reusable utility classes

3. **JavaScript Bağımlılıkları:**
   - Charts için: Chart.js, Recharts
   - Icons için: Heroicons, Feather Icons
   - Animations için: GSAP, Framer Motion

4. **Performans:**
   - Image optimization
   - Lazy loading
   - Minified CSS/JS

## 🐛 Sorun Giderme

### Problem: HTML oluşmadı
**Çözüm:** Prompt çok uzun olabilir, bölümlere ayırın

### Problem: Tasarım bozuk görünüyor
**Çözüm:** Tailwind CSS CDN bağlantısını kontrol edin

### Problem: Responsive değil
**Çözüm:** Prompt'a "mobile-first responsive design" ekleyin

### Problem: Türkçe karakterler bozuk
**Çözüm:** UTF-8 encoding olduğundan emin olun

## 📞 Destek & Kaynaklar

### Dokümantasyon:
- [PROJECT_ANALYSIS_AND_ROADMAP.md](./PROJECT_ANALYSIS_AND_ROADMAP.md) - Tam proje analizi
- [STITCH_PROMPTS.md](./STITCH_PROMPTS.md) - Tüm promptlar

### Dış Kaynaklar:
- [Google Stitch Dokümantasyonu](https://stitch.withgoogle.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Best Practices for AI Design](https://example.com)

## 🎉 Başarı Hikayeleri

Bu promptlarla oluşturulabilecekler:

✅ **100+ sayfa** profesyonel HTML tasarımı  
✅ **Tutarlı design system** tüm platformlarda  
✅ **Responsive** mobil, tablet, desktop  
✅ **Accessible** WCAG 2.1 AA uyumlu  
✅ **Modern UI/UX** en son trendlere uygun  

## 🚀 Sonraki Adımlar

1. ✅ İlk sayfayı oluşturun (örn: Landing Page)
2. ✅ Test edin ve ince ayar yapın
3. ✅ Diğer sayfaları oluşturun
4. ✅ Tüm sayfaları birleştirin
5. ✅ Canlıya alın!

---

**Hazırlayan:** AI Assistant  
**Tarih:** 1 Nisan 2026  
**Proje:** BTS-V2 - ÖNCÜ OTO SERVİS PROGRAMI  

**İyi kodlamalar!** 🎨✨
