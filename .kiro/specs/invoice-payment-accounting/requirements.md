# Gereksinimler Belgesi

## Giriş

Bu belge, MS Oto Servis SaaS platformunun **Fatura, Ödeme ve Muhasebe Entegrasyonu** özelliğine ait gereksinimleri tanımlamaktadır. Mevcut altyapıda `Invoice` ve `Payment` modelleri temel düzeyde bulunmakta; ancak Türkiye'ye özgü yasal yükümlülükler (e-Fatura / e-Arşiv), yerel ödeme yöntemleri (iyzico / PayTR, çek, senet), kalem bazlı fatura detayı ve Paraşüt otomatik senkronizasyonu eksik kalmaktadır. Bu spec, söz konusu eksikliklerin tamamını kapsayan altı gereksinim grubunu tanımlar.

---

## Sözlük

- **Sistem**: MS Oto Servis SaaS platformunun tamamı (Next.js 15 web uygulaması + Prisma/PostgreSQL arka ucu).
- **Fatura_Motoru**: Fatura oluşturma, güncelleme, iptal ve PDF üretiminden sorumlu modül.
- **Kalem_Yöneticisi**: `InvoiceItem` kayıtlarını oluşturan, güncelleyen ve silen alt sistem.
- **e-Fatura_Servisi**: GİB (Gelir İdaresi Başkanlığı) uyumlu e-Fatura ve e-Arşiv belgelerini üreten ve ileten entegrasyon katmanı.
- **Ödeme_İşlemcisi**: iyzico ve PayTR ödeme altyapılarıyla iletişim kuran entegrasyon modülü.
- **Çek_Senet_Takipçisi**: Çek ve senet ödeme araçlarının vadelerini, durumlarını ve tahsilat süreçlerini yöneten modül.
- **Paraşüt_Köprüsü**: Paraşüt bulut muhasebe API'siyle çift yönlü senkronizasyonu yöneten entegrasyon katmanı.
- **PDF_Üreticisi**: Fatura PDF belgelerini sunucu tarafında üreten ve AWS S3'e yükleyen bileşen.
- **Tenant**: Platformu kullanan oto servis firması (çok kiracılı mimari).
- **GİB**: Gelir İdaresi Başkanlığı — Türkiye'de e-Fatura ve e-Arşiv altyapısını yöneten resmi kurum.
- **UBL-TR**: GİB tarafından zorunlu kılınan Türkiye'ye özgü XML fatura standardı.
- **KDV**: Katma Değer Vergisi — Türkiye'de geçerli tüketim vergisi.
- **ÖKC**: Ödeme Kaydedici Cihaz — perakende satışlarda kullanılan mali onay cihazı.
- **IBAN**: Uluslararası Banka Hesap Numarası.
- **Paraşüt**: Türkiye'de yaygın kullanılan bulut tabanlı muhasebe yazılımı.

---

## Gereksinimler

---

### Gereksinim 1: Kalem Bazlı Fatura Detayı (InvoiceItem)

**Kullanıcı Hikayesi:** Bir servis yöneticisi olarak, faturada işçilik, yedek parça ve ek hizmet kalemlerini ayrı satırlar hâlinde görmek istiyorum; böylece müşteriye şeffaf ve ayrıntılı bir fatura sunabileyim.

#### Kabul Kriterleri

1. THE **Kalem_Yöneticisi** SHALL her `Invoice` kaydına bağlı sıfır veya daha fazla `InvoiceItem` kaydı saklayabilmeli; her kalem `name`, `quantity`, `unitPrice`, `taxRate`, `discountRate` ve `lineTotal` alanlarını içermelidir.
2. WHEN bir `InvoiceItem` oluşturulduğunda veya güncellendiğinde, THE **Kalem_Yöneticisi** SHALL `lineTotal` değerini `(quantity × unitPrice × (1 - discountRate/100)) × (1 + taxRate/100)` formülüyle hesaplamalıdır.
3. WHEN bir faturanın kalemleri değiştiğinde, THE **Fatura_Motoru** SHALL `Invoice.subTotal`, `Invoice.taxAmount`, `Invoice.discountAmount` ve `Invoice.totalAmount` alanlarını kalem toplamlarından otomatik olarak yeniden hesaplamalıdır.
4. WHEN bir iş emri faturaya dönüştürüldüğünde, THE **Fatura_Motoru** SHALL `ServiceOrder.items` listesindeki her kalemi karşılık gelen bir `InvoiceItem` olarak kopyalamalıdır.
5. THE **Kalem_Yöneticisi** SHALL `InvoiceItem.type` alanını `LABOR` (işçilik), `PART` (yedek parça) veya `SERVICE` (hizmet) değerlerinden biriyle sınıflandırmalıdır.
6. IF bir `InvoiceItem` silindiğinde fatura durumu `PAID` ise, THEN THE **Kalem_Yöneticisi** SHALL silme işlemini reddetmeli ve hata mesajı döndürmelidir.
7. THE **Kalem_Yöneticisi** SHALL kalem sıralamasını `sortOrder` alanıyla korumalı; kullanıcı sıralamayı değiştirebildiğinde sıra numaralarını güncellenmelidir.

---

### Gereksinim 2: Fatura PDF Üretimi

**Kullanıcı Hikayesi:** Bir muhasebeci olarak, müşteriye göndermek üzere profesyonel görünümlü, firma logolu ve yasal bilgileri içeren bir fatura PDF'i indirmek istiyorum; böylece `window.print()` geçici çözümüne bağımlı kalmayayım.

#### Kabul Kriterleri

1. WHEN bir fatura `SENT` veya `PAID` durumuna geçtiğinde, THE **PDF_Üreticisi** SHALL sunucu tarafında (jsPDF + html2canvas kullanarak) fatura PDF'ini oluşturmalı ve AWS S3'e yükleyerek `Invoice.pdfUrl` alanını güncellemelidir.
2. THE **PDF_Üreticisi** SHALL oluşturulan PDF'e şu bilgileri dahil etmelidir: tenant firma adı, adresi, vergi numarası, IBAN, fatura numarası, düzenleme tarihi, vade tarihi, müşteri adı/unvanı, müşteri vergi numarası, kalem listesi (ad, miktar, birim fiyat, KDV oranı, satır toplamı), ara toplam, indirim, KDV tutarı ve genel toplam.
3. WHEN bir kullanıcı mevcut bir faturanın PDF'ini talep ettiğinde ve `Invoice.pdfUrl` dolu ise, THE **PDF_Üreticisi** SHALL mevcut S3 URL'sini döndürmeli; `pdfUrl` boş ise PDF'i yeniden oluşturmalıdır.
4. IF PDF oluşturma işlemi 30 saniye içinde tamamlanamazsa, THEN THE **PDF_Üreticisi** SHALL işlemi iptal etmeli, hatayı Sentry'e raporlamalı ve kullanıcıya hata mesajı döndürmelidir.
5. THE **PDF_Üreticisi** SHALL PDF dosyasını `invoices/{tenantId}/{invoiceNumber}.pdf` yol şablonuyla S3'e yüklemeli ve dosyayı yalnızca yetkili kullanıcıların erişebileceği şekilde private olarak işaretlemelidir.
6. WHERE tenant bir logo yüklemiş ise, THE **PDF_Üreticisi** SHALL firma logosunu PDF başlığına dahil etmelidir.
7. THE **PDF_Üreticisi** SHALL PDF içeriğini Türkçe olarak üretmeli; tarih formatı `DD.MM.YYYY`, para birimi formatı `₺#.###,##` şeklinde olmalıdır.

---

### Gereksinim 3: Türkiye Yerel Ödeme Yöntemleri (iyzico / PayTR ve Çek / Senet)

**Kullanıcı Hikayesi:** Bir oto servis sahibi olarak, müşterilerden iyzico veya PayTR aracılığıyla online ödeme almak ve çek / senet gibi geleneksel Türk ödeme araçlarını da sisteme kaydetmek istiyorum; böylece tüm tahsilatlarımı tek platformda takip edebileyim.

#### Kabul Kriterleri

1. THE **Ödeme_İşlemcisi** SHALL iyzico ve PayTR ödeme sağlayıcılarından en az birini desteklemeli; hangi sağlayıcının aktif olduğu tenant bazında yapılandırılabilir olmalıdır.
2. WHEN bir müşteri online ödeme başlattığında, THE **Ödeme_İşlemcisi** SHALL ödeme sağlayıcısının ödeme formunu (iyzico checkout form veya PayTR iframe) güvenli biçimde yüklemeli ve ödeme akışını başlatmalıdır.
3. WHEN ödeme sağlayıcısından başarılı ödeme bildirimi (webhook / callback) alındığında, THE **Ödeme_İşlemcisi** SHALL ilgili `Payment` kaydını oluşturmalı, fatura `paidAmount` değerini güncellemeli ve fatura tam ödenmiş ise durumu `PAID` olarak işaretlemelidir.
4. IF ödeme sağlayıcısından başarısız ödeme bildirimi alındığında, THEN THE **Ödeme_İşlemcisi** SHALL başarısız ödeme girişimini `PaymentAttempt` kaydı olarak saklamalı, hata kodunu ve mesajını kaydetmeli ve kullanıcıya açıklayıcı hata mesajı döndürmelidir.
5. THE **Çek_Senet_Takipçisi** SHALL `PaymentMethod` enum'una `CHECK` (çek) ve `PROMISSORY_NOTE` (senet) değerlerini eklemeli; bu yöntemlerle kaydedilen ödemeler için `checkNumber`, `bankName`, `dueDate` ve `drawerName` alanlarını saklayabilmelidir.
6. WHEN bir çek veya senedin vade tarihi 3 gün veya daha az kaldığında, THE **Çek_Senet_Takipçisi** SHALL ilgili tenant yöneticisine uygulama içi bildirim göndermelidir.
7. WHEN bir çek veya senet tahsil edildiğinde, THE **Çek_Senet_Takipçisi** SHALL kaydın durumunu `COLLECTED` olarak güncellemeli ve ilgili fatura bakiyesini düşmelidir.
8. IF bir çek veya senet karşılıksız çıktığında, THEN THE **Çek_Senet_Takipçisi** SHALL kaydın durumunu `BOUNCED` olarak işaretlemeli ve müşteri bakiyesini geri yüklemeli ve tenant yöneticisine bildirim göndermelidir.
9. THE **Ödeme_İşlemcisi** SHALL iyzico ve PayTR webhook isteklerini imza doğrulamasıyla (HMAC-SHA256) doğrulamalı; doğrulanamayan istekleri reddetmeli ve Sentry'e raporlamalıdır.
10. WHILE bir online ödeme işlemi devam ederken, THE **Ödeme_İşlemcisi** SHALL aynı fatura için eş zamanlı ikinci bir ödeme başlatılmasını engellemeli ve kullanıcıya bilgi mesajı göstermelidir.

---

### Gereksinim 4: e-Fatura ve e-Arşiv Entegrasyonu (GİB Uyumu)

**Kullanıcı Hikayesi:** Bir muhasebeci olarak, Türkiye'deki yasal zorunluluk gereği müşterilere e-Fatura veya e-Arşiv faturası kesmek istiyorum; böylece GİB uyumluluğunu sağlayabileyim ve kâğıt fatura süreçlerini ortadan kaldırabileyim.

#### Kabul Kriterleri

1. THE **e-Fatura_Servisi** SHALL GİB onaylı bir e-Fatura entegratörü (özel entegratör veya doğrudan GİB portalı) aracılığıyla UBL-TR 2.1 formatında e-Fatura belgesi oluşturabilmelidir.
2. THE **e-Fatura_Servisi** SHALL e-Fatura mükellefi olmayan müşteriler için e-Arşiv faturası oluşturabilmeli; e-Arşiv faturası PDF olarak müşteriye e-posta ile iletilmelidir.
3. WHEN bir fatura `SENT` durumuna geçtiğinde ve tenant e-Fatura entegrasyonu aktif ise, THE **e-Fatura_Servisi** SHALL müşterinin GİB sistemindeki e-Fatura mükellefiyetini vergi numarasıyla sorgulayarak uygun belge türünü (e-Fatura veya e-Arşiv) otomatik olarak seçmelidir.
4. WHEN e-Fatura başarıyla GİB'e iletildiğinde, THE **e-Fatura_Servisi** SHALL GİB'den dönen UUID ve ETTN (Elektronik Ticaret Takip Numarası) değerlerini `Invoice.eInvoiceUUID` ve `Invoice.eInvoiceETTN` alanlarında saklamalıdır.
5. IF e-Fatura iletimi başarısız olursa, THEN THE **e-Fatura_Servisi** SHALL hatayı Sentry'e raporlamalı, `Invoice.eInvoiceStatus` alanını `FAILED` olarak işaretlemeli ve tenant yöneticisine hata bildirimi göndermelidir.
6. THE **e-Fatura_Servisi** SHALL iptal edilen faturalar için GİB'e iptal bildirimi gönderebilmeli; iptal onaylandığında `Invoice.eInvoiceStatus` alanını `CANCELLED` olarak güncellenmelidir.
7. THE **e-Fatura_Servisi** SHALL oluşturulan UBL-TR XML belgesini `Invoice.eInvoiceXml` alanında veya S3'te saklamalı; belge en az 10 yıl erişilebilir olmalıdır.
8. WHERE tenant e-Fatura entegrasyonu yapılandırılmamış ise, THE **Fatura_Motoru** SHALL standart PDF fatura akışını kullanmaya devam etmeli ve kullanıcıya e-Fatura kurulumu için yönlendirme mesajı göstermelidir.
9. THE **e-Fatura_Servisi** SHALL e-Fatura gönderim durumunu (`PENDING`, `SENT`, `ACCEPTED`, `REJECTED`, `CANCELLED`) `Invoice.eInvoiceStatus` alanında takip etmelidir.
10. WHEN bir e-Fatura GİB tarafından reddedildiğinde, THE **e-Fatura_Servisi** SHALL red gerekçesini `Invoice.eInvoiceErrorMessage` alanına kaydetmeli ve tenant yöneticisine bildirim göndermelidir.

---

### Gereksinim 5: Paraşüt Otomatik Senkronizasyonu

**Kullanıcı Hikayesi:** Bir muhasebeci olarak, fatura oluşturulduğunda veya güncellendiğinde Paraşüt'e otomatik olarak senkronize edilmesini istiyorum; böylece manuel `syncInvoiceToParasut` çağrısına gerek kalmadan muhasebe kayıtlarım her zaman güncel kalsın.

#### Kabul Kriterleri

1. WHEN bir `Invoice` kaydı `DRAFT` dışında bir duruma geçtiğinde (örneğin `SENT`, `PAID`), THE **Paraşüt_Köprüsü** SHALL Inngest arka plan işi aracılığıyla Paraşüt senkronizasyonunu otomatik olarak tetiklemelidir.
2. WHEN bir `Invoice` güncellendiğinde ve `Invoice.externalId` dolu ise, THE **Paraşüt_Köprüsü** SHALL Paraşüt'teki ilgili faturayı güncellemeli; `externalId` boş ise yeni fatura oluşturmalıdır.
3. WHEN bir `Payment` kaydı oluşturulduğunda ve ilgili faturanın `externalId` değeri mevcut ise, THE **Paraşüt_Köprüsü** SHALL Paraşüt'e karşılık gelen ödeme kaydını otomatik olarak iletmelidir.
4. IF Paraşüt API'si erişilemez durumdaysa veya hata döndürüyorsa, THEN THE **Paraşüt_Köprüsü** SHALL Inngest'in üstel geri çekilme (exponential backoff) stratejisiyle en fazla 3 kez yeniden denemelidir; tüm denemeler başarısız olursa hatayı Sentry'e raporlamalı ve tenant yöneticisine bildirim göndermelidir.
5. THE **Paraşüt_Köprüsü** SHALL senkronizasyon girişimlerini `ParasutSyncLog` tablosunda kaydetmeli; her kayıt `invoiceId`, `attemptedAt`, `status` (`SUCCESS` / `FAILED`) ve `errorMessage` alanlarını içermelidir.
6. WHEN bir fatura iptal edildiğinde ve `Invoice.externalId` dolu ise, THE **Paraşüt_Köprüsü** SHALL Paraşüt'teki ilgili faturayı iptal etmelidir.
7. THE **Paraşüt_Köprüsü** SHALL müşteri kaydını Paraşüt'te oluşturmadan önce vergi numarasıyla arama yapmalı; mevcut kayıt bulunursa yeni kayıt oluşturmak yerine mevcut kaydı kullanmalıdır.
8. THE **Paraşüt_Köprüsü** SHALL `InvoiceItem` kalemlerini Paraşüt fatura satırlarına (`lines`) bire bir eşleştirmeli; kalem yoksa tek satırlık genel hizmet kalemi oluşturmalıdır.
9. WHERE tenant `AccountingIntegration` kaydı aktif değil ise, THE **Paraşüt_Köprüsü** SHALL senkronizasyon işlemini sessizce atlayarak herhangi bir hata üretmemelidir.
10. THE **Paraşüt_Köprüsü** SHALL OAuth2 token'ını önbellekte (process-level cache) tutmalı; token süresi dolmadan 60 saniye önce yenilemeli ve token yenileme hatalarını Sentry'e raporlamalıdır.

---

### Gereksinim 6: Fatura Numaralandırma ve Muhasebe Bütünlüğü

**Kullanıcı Hikayesi:** Bir muhasebeci olarak, fatura numaralarının sıralı, benzersiz ve tenant bazında izole olmasını istiyorum; böylece muhasebe kayıtlarında boşluk veya çakışma olmadan yasal uyumluluğu sağlayabileyim.

#### Kabul Kriterleri

1. THE **Fatura_Motoru** SHALL her tenant için fatura numaralarını `{YIL}-{SIRA}` formatında (örneğin `2025-0001`) üretmeli; sıra numarası her takvim yılı başında 1'den yeniden başlamalıdır.
2. THE **Fatura_Motoru** SHALL fatura numarası üretimini veritabanı düzeyinde kilitleme (SELECT FOR UPDATE veya sıra tablosu) kullanarak eş zamanlı isteklerde çakışmayı önlemelidir.
3. THE **Fatura_Motoru** SHALL `DRAFT` durumundaki faturalara geçici numara (`TASLAK-{timestamp}`) atamalı; fatura `SENT` durumuna geçtiğinde kalıcı sıralı numarayı atamalıdır.
4. IF bir fatura iptal edilirse, THEN THE **Fatura_Motoru** SHALL iptal edilen fatura numarasını yeniden kullanmamalı; sıra numarası bir sonraki faturada devam etmelidir.
5. THE **Fatura_Motoru** SHALL `Invoice.subTotal + Invoice.taxAmount - Invoice.discountAmount = Invoice.totalAmount` denkliğini her kayıt işleminde doğrulamalı; denklik sağlanmıyorsa işlemi reddetmelidir.
6. WHEN bir fatura `PAID` durumuna geçtiğinde, THE **Fatura_Motoru** SHALL `Invoice.paidAmount` değerinin `Invoice.totalAmount` değerine eşit veya büyük olduğunu doğrulamalıdır.
7. THE **Fatura_Motoru** SHALL her fatura işlemini (oluşturma, güncelleme, iptal, ödeme) `AuditLog` tablosuna `userId`, `action`, `entityId`, `entityType` ve `timestamp` alanlarıyla kaydetmelidir.
8. WHILE bir fatura `PAID` veya `CANCELLED` durumundayken, THE **Fatura_Motoru** SHALL fatura tutarlarının (`subTotal`, `taxAmount`, `totalAmount`) değiştirilmesini engellemeli ve hata mesajı döndürmelidir.

---
