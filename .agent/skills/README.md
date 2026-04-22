# Entegre Edilen AI Yetenekleri (Claude Skills)

Bu proje için en yararlı görülen "Awesome Claude Skills" yetenekleri `.agent/skills/` dizinine entegre edilmiştir. Bu yetenekler, geliştirme ve bakım süreçlerinde asistanın (Claude) daha verimli çalışmasını sağlar.

## 🛠️ Entegre Edilen Yetenekler

### 1. [webapp-testing](./webapp-testing/SKILL.md)
**Amacı:** Playwright kullanarak tarayıcı üzerinde otomatik testler gerçekleştirir.
- UI hatalarını tespit etme.
- Fonksiyonel testleri (Giriş, Kayıt, Hakediş oluşturma vb.) otomatikleştirme.
- Ekran görüntüsü alarak görsel doğrulama yapma.

### 2. [changelog-generator](./changelog-generator/SKILL.md)
**Amacı:** Git commit geçmişini analiz ederek son kullanıcıya yönelik anlamlı "Değişim Günlükleri" (Changelog) oluşturur.
- Yeni özellikleri ve hata düzeltmelerini otomatik listeleme.
- Versiyon notlarını teknik dilden çıkarıp daha anlaşılır hale getirme.

### 3. [mcp-builder](./mcp-builder/SKILL.md)
**Amacı:** Model Context Protocol (MCP) sunucuları oluşturmak için rehberlik sağlar.
- Yeni dış servis entegrasyonları için özel araçlar geliştirme.

### 4. [file-organizer](./file-organizer/SKILL.md)
**Amacı:** Proje dosya yapısını düzenli tutar.
- Gereksiz veya kopya dosyaları bulma.
- Daha iyi klasör yapıları önerme.

### 5. [content-research-writer](./content-research-writer/SKILL.md)
**Amacı:** Teknik dokümantasyon ve içerik üretiminde yardımcı olur.
- Araştırma yapma ve kaynak gösterme.
- Doküman taslaklarını iyileştirme.

### 6. [theme-factory](./theme-factory/SKILL.md)
**Amacı:** Görsel tasarımlar ve landing sayfaları için hazır tema ve renk paletleri sunar.

### 7. [skill-creator](./skill-creator/SKILL.md)
**Amacı:** Projeye özel yeni yetenekler tanımlamamızı sağlar.

---

**Nasıl Kullanılır?**
Claude'a "Web uygulamasını test et" veya "Son değişikliklerden changelog oluştur" gibi komutlar verdiğinizde, Claude bu dizindeki talimatları kullanarak işlemi gerçekleştirir.
