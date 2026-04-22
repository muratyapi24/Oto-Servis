# Gereksinimler Belgesi - Eksik Özellikler Yol Haritası

## Giriş

Bu belge, MS Oto Servis SaaS projesindeki eksik özelliklerin kapsamlı gereksinimlerini tanımlar. Proje Next.js 14 App Router, PostgreSQL, Prisma ORM ve Turborepo monorepo mimarisi üzerine kurulmuştur. Bu gereksinimler, mevcut sistemin eksik kalan kritik özelliklerini tamamlamak ve kullanıcı deneyimini geliştirmek için tasarlanmıştır.

## Sözlük

- **Sistem**: MS Oto Servis SaaS platformu
- **Fatura_Modülü**: Finans yönetimi ve faturalama sistemi
- **Teklif_Sistemi**: Müşterilere sunulan servis teklif ve keşif yönetimi
- **Onay_Akışı**: Müşteri onay ve bildirim mekanizması
- **Randevu_Modülü**: Mobil müşteri randevu yönetim sistemi
- **Personel_Modülü**: Mobil firma personel ve vardiya yönetimi
- **Bildirim_Servisi**: SMS ve e-posta bildirim altyapısı
- **Dosya_Yöneticisi**: Fotoğraf ve belge yükleme sistemi
- **Performans_Raporu**: Usta performans ve komisyon takip sistemi
- **Ödeme_Entegrasyonu**: Stripe ödeme işleme sistemi
- **Super_Admin_Paneli**: Sistem yönetimi ve tenant izleme paneli


---

## Öncelik Sıralaması

| # | Özellik | Öncelik | Durum |
|---|---------|---------|-------|
| 1 | Fatura Detay Sayfası | 🔴 Kritik | Klasör var, sayfa eksik |
| 2 | Teklif/Keşif Sistemi | 🔴 Kritik | Tamamen eksik |
| 3 | Müşteri Onay Akışı | 🔴 Kritik | Mekanizma eksik |
| 4 | Mobil Müşteri Randevu Sayfası | 🔴 Kritik | Sayfa yok |
| 5 | Mobil Firma Personel Sayfası | 🟡 Orta | Tasarım hazır |
| 6 | SMS/E-posta Bildirimleri | 🟡 Orta | Altyapı yok |
| 7 | Dosya Yükleme Altyapısı | 🟡 Orta | Entegrasyon yok |
| 8 | Usta Performans Raporu | 🟡 Orta | Kısmen eksik |
| 9 | Stripe Ödeme Entegrasyonu | 🟢 Düşük | Şemada alan var |
| 10 | Super Admin Eksik Sayfalar | 🟢 Düşük | Tasarım hazır |
| 11 | Veritabanı Şeması Eksikleri | 🔴 Kritik | Tüm özellikler için gerekli |

---

## Gereksinimler

---

### Gereksinim 1: Fatura Detay Sayfası

**Kullanıcı Hikayesi:** Muhasebeci olarak, bir faturanın tüm detaylarını görmek, PDF olarak indirmek ve ödeme kaydetmek istiyorum; böylece finans akışını kesintisiz yönetebilirim.

#### Kabul Kriterleri

1. WHEN bir kullanıcı `/dashboard/finances/invoices/[id]` adresine gittiğinde, THE Fatura_Modülü SHALL fatura numarası, müşteri bilgisi, kalemler, ara toplam, KDV ve genel toplam bilgilerini görüntülemelidir.
2. WHEN bir fatura sayfası yüklendiğinde, THE Fatura_Modülü SHALL faturaya bağlı tüm ödeme kayıtlarını tarih, tutar ve ödeme yöntemi ile listeleyecektir.
3. WHEN bir kullanıcı "PDF İndir" butonuna tıkladığında, THE Fatura_Modülü SHALL faturayı yazdırılabilir PDF formatında tarayıcıda açacaktır.
4. WHEN bir kullanıcı ödeme kaydetmek istediğinde, THE Fatura_Modülü SHALL tutar, ödeme yöntemi (Nakit/Kredi Kartı/Havale) ve tarih alanlarını içeren bir form sunacaktır.
5. WHEN bir ödeme kaydedildiğinde, THE Fatura_Modülü SHALL faturanın `paidAmount` alanını güncelleyecek ve kalan bakiyeyi hesaplayacaktır.
6. WHEN fatura tamamen ödendiğinde, THE Fatura_Modülü SHALL fatura durumunu otomatik olarak `PAID` olarak güncelleyecektir.
7. IF bir fatura ID'si geçersizse veya bulunamazsa, THEN THE Fatura_Modülü SHALL kullanıcıyı finans listesi sayfasına yönlendirecektir.
8. WHEN fatura sayfası yüklendiğinde, THE Fatura_Modülü SHALL ilgili servis emri varsa servis emri numarasına tıklanabilir link sunacaktır.


---

### Gereksinim 2: Teklif/Keşif Sistemi

**Kullanıcı Hikayesi:** Resepsiyonist olarak, müşteriye servis öncesinde detaylı bir maliyet teklifi oluşturmak ve onaylatmak istiyorum; böylece müşteri memnuniyetini artırabilir ve anlaşmazlıkları önleyebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL `Quote` ve `QuoteItem` modellerini veritabanı şemasına ekleyecektir; Quote modeli tenantId, customerId, vehicleId, status (DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED), validUntil, subTotal, taxAmount, totalAmount alanlarını içerecektir.
2. WHEN bir kullanıcı `/dashboard/quotes` sayfasına gittiğinde, THE Teklif_Sistemi SHALL tüm teklifleri durum, müşteri adı, araç plakası, tutar ve tarih bilgileriyle listeleyecektir.
3. WHEN bir kullanıcı yeni teklif oluşturduğunda, THE Teklif_Sistemi SHALL müşteri seçimi, araç seçimi, kalem ekleme (parça/işçilik/diğer), KDV hesaplama ve geçerlilik tarihi alanlarını içeren bir form sunacaktır.
4. WHEN bir teklif kalemi eklendiğinde, THE Teklif_Sistemi SHALL miktar, birim fiyat, KDV oranı ve indirim alanlarına göre satır toplamını otomatik hesaplayacaktır.
5. WHEN bir teklif "Gönder" durumuna alındığında, THE Teklif_Sistemi SHALL teklif durumunu `SENT` olarak güncelleyecek ve müşteriye bildirim gönderecektir.
6. WHEN bir teklif kabul edildiğinde, THE Teklif_Sistemi SHALL teklif kalemlerini kullanarak otomatik olarak bir servis emri oluşturacaktır.
7. WHEN bir teklif reddedildiğinde, THE Teklif_Sistemi SHALL red nedenini kayıt altına alacak ve teklif durumunu `REJECTED` olarak güncelleyecektir.
8. WHEN geçerlilik tarihi geçen bir teklif sorgulandığında, THE Teklif_Sistemi SHALL teklif durumunu otomatik olarak `EXPIRED` olarak işaretleyecektir.
9. THE Teklif_Sistemi SHALL teklifi PDF formatında yazdırılabilir hale getirecektir.
10. WHEN bir teklif PDF'i oluşturulduğunda ve tekrar parse edildiğinde, THE Teklif_Sistemi SHALL aynı teklif verilerini üretecektir (round-trip özelliği).


---

### Gereksinim 3: Müşteri Onay Akışı

**Kullanıcı Hikayesi:** Servis teknisyeni olarak, bir servis emrini `WAITING_APPROVAL` durumuna aldığımda müşteriye otomatik bildirim gitmesini ve müşterinin mobil portal üzerinden onay/red verebilmesini istiyorum; böylece müşteri iletişimi hızlanır ve onay süreci dijitalleşir.

#### Kabul Kriterleri

1. WHEN bir servis emri `WAITING_APPROVAL` durumuna alındığında, THE Onay_Akışı SHALL müşterinin kayıtlı telefon numarasına SMS ve/veya e-posta ile bildirim gönderecektir.
2. THE Onay_Akışı SHALL her onay talebi için benzersiz ve güvenli bir onay token'ı üretecektir; token 48 saat geçerli olacaktır.
3. WHEN müşteri onay linkine tıkladığında, THE Onay_Akışı SHALL servis emri detaylarını (araç, işlemler, tahmini maliyet) mobil uyumlu bir sayfada gösterecektir.
4. WHEN müşteri "Onayla" butonuna tıkladığında, THE Onay_Akışı SHALL servis emri durumunu `IN_PROGRESS` olarak güncelleyecek ve firmaya bildirim gönderecektir.
5. WHEN müşteri "Reddet" butonuna tıkladığında, THE Onay_Akışı SHALL red nedenini kayıt altına alacak, servis emri durumunu `CANCELLED` olarak güncelleyecek ve firmaya bildirim gönderecektir.
6. WHILE müşteri mobil panelinde aktif bir `WAITING_APPROVAL` servis emri varken, THE Onay_Akışı SHALL müşteri panelinde belirgin bir "Onay Bekliyor" uyarısı ve aksiyon butonu gösterecektir.
7. IF onay token'ı süresi dolmuşsa, THEN THE Onay_Akışı SHALL müşteriye token'ın geçersiz olduğunu bildiren bir mesaj gösterecek ve firmayı bilgilendirecektir.
8. THE Onay_Akışı SHALL tüm onay/red işlemlerini zaman damgası ve müşteri kimliği ile audit log'a kaydedecektir.


---

### Gereksinim 4: Mobil Müşteri Randevu Sayfası

**Kullanıcı Hikayesi:** Müşteri olarak, mobil portal üzerinden servis randevusu oluşturmak istiyorum; böylece telefon etmeden kolayca randevu alabilir ve geçmiş randevularımı görebilirim.

#### Kabul Kriterleri

1. WHEN bir müşteri `/m/musteri/randevu` sayfasına gittiğinde, THE Randevu_Modülü SHALL araç seçimi, tarih seçimi, saat seçimi ve servis türü alanlarını içeren bir form sunacaktır.
2. WHEN müşteri randevu formu doldurduğunda, THE Randevu_Modülü SHALL seçilen tarih ve saatte müsait zaman dilimlerini gösterecektir.
3. WHEN bir randevu talebi gönderildiğinde, THE Randevu_Modülü SHALL randevuyu `PENDING` durumunda kaydedecek ve müşteriye onay mesajı gösterecektir.
4. WHEN bir randevu oluşturulduğunda, THE Randevu_Modülü SHALL firmaya yeni randevu bildirimi gönderecektir.
5. THE Randevu_Modülü SHALL müşterinin geçmiş ve gelecek randevularını tarih sırasıyla listeleyecektir.
6. WHEN müşteri ana panelindeki "Servis Randevusu" butonuna tıkladığında, THE Randevu_Modülü SHALL müşteriyi `/m/musteri/randevu` sayfasına yönlendirecektir.
7. WHEN müşteri geçmiş sayfasındaki "Randevu Talebi Oluştur" butonuna tıkladığında, THE Randevu_Modülü SHALL müşteriyi randevu oluşturma formuna yönlendirecektir.
8. IF müşterinin kayıtlı aracı yoksa, THEN THE Randevu_Modülü SHALL müşteriye araç bilgilerini girmesi için yönlendirme mesajı gösterecektir.
9. WHEN bir randevu iptal edildiğinde, THE Randevu_Modülü SHALL iptal nedenini kayıt altına alacak ve firmaya bildirim gönderecektir.


---

### Gereksinim 5: Mobil Firma Personel Sayfası

**Kullanıcı Hikayesi:** Firma yöneticisi olarak, mobil cihazımdan personel listesini, vardiya durumlarını ve performans özetlerini görmek istiyorum; böylece saha yönetimini kolaylaştırabilirim.

#### Kabul Kriterleri

1. WHEN bir firma yöneticisi `/m/firma/personel` sayfasına gittiğinde, THE Personel_Modülü SHALL tüm aktif ustaları fotoğraf, isim, uzmanlık alanı ve güncel durum bilgileriyle listeleyecektir.
2. THE Personel_Modülü SHALL her usta için o gün atanmış aktif servis emirlerinin sayısını ve durumunu gösterecektir.
3. WHEN bir usta kartına tıklandığında, THE Personel_Modülü SHALL ustanın detay sayfasını açacak; bu sayfada haftalık iş özeti, tamamlanan işler ve performans metrikleri yer alacaktır.
4. THE Personel_Modülü SHALL ustaları "Müsait", "Meşgul" ve "İzinli" durumlarına göre filtrelenebilir şekilde sunacaktır.
5. THE Personel_Modülü SHALL `stitch_sablon2/firma_mobil_personel_kadrosu.html` tasarımındaki görsel düzeni ve renk şemasını kullanacaktır.
6. WHEN sayfa yüklendiğinde, THE Personel_Modülü SHALL o günkü toplam aktif usta sayısını, toplam açık iş emri sayısını ve ortalama doluluk oranını özet kartlarda gösterecektir.
7. WHERE vardiya yönetimi özelliği aktifse, THE Personel_Modülü SHALL her usta için vardiya başlangıç/bitiş saatlerini gösterecektir.


---

### Gereksinim 6: SMS ve E-posta Bildirim Altyapısı

**Kullanıcı Hikayesi:** Sistem yöneticisi olarak, müşterilere servis durum güncellemeleri, randevu hatırlatmaları ve onay talepleri için otomatik SMS ve e-posta göndermek istiyorum; böylece müşteri iletişimi otomatikleşir ve müşteri memnuniyeti artar.

#### Kabul Kriterleri

1. THE Bildirim_Servisi SHALL Twilio veya benzeri bir SMS sağlayıcısı ile entegre olacaktır; API anahtarları ortam değişkenlerinde güvenli şekilde saklanacaktır.
2. THE Bildirim_Servisi SHALL SendGrid veya Resend gibi bir e-posta sağlayıcısı ile entegre olacaktır.
3. WHEN bir servis emri durumu değiştiğinde, THE Bildirim_Servisi SHALL müşteriye durum değişikliğini bildiren bir SMS ve e-posta gönderecektir.
4. WHEN bir randevu oluşturulduğunda, THE Bildirim_Servisi SHALL müşteriye randevu onay mesajı gönderecektir.
5. WHEN bir randevu tarihine 24 saat kaldığında, THE Bildirim_Servisi SHALL müşteriye hatırlatma mesajı gönderecektir.
6. WHEN bir teklif müşteriye gönderildiğinde, THE Bildirim_Servisi SHALL teklif linkini içeren bir bildirim gönderecektir.
7. THE Bildirim_Servisi SHALL her bildirim için şablon sistemi kullanacaktır; şablonlar veritabanında saklanacak ve dinamik değişkenler içerecektir.
8. THE Bildirim_Servisi SHALL gönderilen tüm bildirimleri zaman damgası, alıcı, tip ve durum (başarılı/başarısız) bilgileriyle log'layacaktır.
9. IF bir bildirim gönderimi başarısız olursa, THEN THE Bildirim_Servisi SHALL 3 kez yeniden deneme yapacak ve başarısız olursa sistem yöneticisine uyarı gönderecektir.
10. WHERE bir müşteri bildirim tercihlerini değiştirmişse, THE Bildirim_Servisi SHALL sadece müşterinin izin verdiği kanallara bildirim gönderecektir.


---

### Gereksinim 7: Dosya Yükleme Altyapısı

**Kullanıcı Hikayesi:** Usta olarak, servis emrine araç hasar fotoğrafları ve muayene görsellerini eklemek istiyorum; böylece müşteri ile şeffaf iletişim kurabilir ve anlaşmazlıkları önleyebilirim.

#### Kabul Kriterleri

1. THE Dosya_Yöneticisi SHALL AWS S3 veya Cloudflare R2 ile entegre olacaktır; bucket yapılandırması tenant bazlı izolasyonu sağlayacaktır.
2. WHEN bir kullanıcı servis emri sayfasında fotoğraf yüklemek istediğinde, THE Dosya_Yöneticisi SHALL sürükle-bırak veya dosya seçici arayüzü sunacaktır.
3. THE Dosya_Yöneticisi SHALL yüklenen görselleri otomatik olarak optimize edecektir; maksimum dosya boyutu 10MB, desteklenen formatlar JPEG, PNG ve WebP olacaktır.
4. WHEN bir dosya yüklendiğinde, THE Dosya_Yöneticisi SHALL dosyayı bulut depolama alanına yükleyecek ve URL'yi veritabanındaki `Document` modeline kaydedecektir.
5. THE Dosya_Yöneticisi SHALL yüklenen görselleri servis emri detay sayfasında galeri görünümünde gösterecektir.
6. WHEN bir dosya silindiğinde, THE Dosya_Yöneticisi SHALL hem veritabanı kaydını hem de bulut depolama alanındaki dosyayı silecektir.
7. THE Dosya_Yöneticisi SHALL `Document` modelini veritabanı şemasına ekleyecektir; model tenantId, serviceOrderId, vehicleId, fileName, fileUrl, fileType, fileSize, uploadedBy alanlarını içerecektir.
8. IF yükleme sırasında bir hata oluşursa, THEN THE Dosya_Yöneticisi SHALL kullanıcıya açıklayıcı hata mesajı gösterecek ve kısmi yüklemeyi temizleyecektir.
9. WHERE mobil cihazdan erişiliyorsa, THE Dosya_Yöneticisi SHALL kamera ile doğrudan fotoğraf çekme seçeneği sunacaktır.


---

### Gereksinim 8: Usta Performans Raporu Geliştirmesi

**Kullanıcı Hikayesi:** Firma yöneticisi olarak, her ustanın detaylı performans metriklerini, komisyon hesaplamalarını ve dönemsel karşılaştırmalarını görmek istiyorum; böylece adil ücretlendirme yapabilir ve verimliliği artırabilirim.

#### Kabul Kriterleri

1. THE Performans_Raporu SHALL `WorkLog` modelini veritabanı şemasına ekleyecektir; model mechanicId, serviceOrderId, startTime, endTime, durationMinutes, notes alanlarını içerecektir.
2. THE Performans_Raporu SHALL `CommissionRule` modelini veritabanı şemasına ekleyecektir; model tenantId, mechanicId, ruleType (PERCENTAGE/FIXED), value, minAmount, maxAmount alanlarını içerecektir.
3. WHEN bir usta detay sayfası açıldığında, THE Performans_Raporu SHALL seçilen dönem için ortalama iş tamamlama süresini, tamamlanan iş sayısını ve toplam işçilik tutarını gösterecektir.
4. THE Performans_Raporu SHALL mevcut ay ile bir önceki ayın performans metriklerini yan yana karşılaştırmalı olarak gösterecektir.
5. WHEN komisyon kuralları tanımlandığında, THE Performans_Raporu SHALL her usta için dönemsel komisyon tutarını otomatik hesaplayacak ve önizleme sunacaktır.
6. THE Performans_Raporu SHALL usta bazında haftalık/aylık iş yükü grafiğini görsel olarak sunacaktır.
7. WHEN bir servis emri tamamlandığında, THE Performans_Raporu SHALL ilgili ustanın iş log kaydını otomatik oluşturacaktır.
8. THE Performans_Raporu SHALL performans verilerini Excel veya CSV formatında dışa aktarma imkânı sunacaktır.


---

### Gereksinim 9: Stripe Ödeme Entegrasyonu

**Kullanıcı Hikayesi:** Firma sahibi olarak, abonelik planımı online olarak satın almak ve yönetmek istiyorum; böylece manuel ödeme süreçleri ortadan kalkar ve aboneliğimi kolayca yönetebilirim.

#### Kabul Kriterleri

1. THE Ödeme_Entegrasyonu SHALL Stripe SDK'yı projeye entegre edecektir; API anahtarları ortam değişkenlerinde güvenli şekilde saklanacaktır.
2. WHEN bir firma abonelik planı seçtiğinde, THE Ödeme_Entegrasyonu SHALL Stripe Checkout oturumu oluşturacak ve kullanıcıyı ödeme sayfasına yönlendirecektir.
3. WHEN ödeme başarıyla tamamlandığında, THE Ödeme_Entegrasyonu SHALL Stripe webhook aracılığıyla abonelik durumunu `ACTIVE` olarak güncelleyecektir.
4. WHEN abonelik yenileme tarihi geldiğinde, THE Ödeme_Entegrasyonu SHALL Stripe'ın otomatik yenileme mekanizmasını kullanacak ve sonucu veritabanına yansıtacaktır.
5. WHEN bir ödeme başarısız olduğunda, THE Ödeme_Entegrasyonu SHALL abonelik durumunu `PAST_DUE` olarak güncelleyecek ve firma yöneticisine bildirim gönderecektir.
6. THE Ödeme_Entegrasyonu SHALL abonelik geçmişini ve fatura belgelerini firma ayarlar sayfasında listeleyecektir.
7. WHEN bir firma aboneliğini iptal ettiğinde, THE Ödeme_Entegrasyonu SHALL mevcut dönem sonuna kadar erişimi sürdürecek ve `cancelAtPeriodEnd` alanını güncelleyecektir.
8. IF Stripe webhook imzası doğrulanamıyorsa, THEN THE Ödeme_Entegrasyonu SHALL isteği reddedecek ve güvenlik log'una kaydedecektir.


---

### Gereksinim 10: Super Admin Eksik Sayfalar

**Kullanıcı Hikayesi:** Super Admin olarak, tüm tenant'ların gerçek zamanlı sistem durumunu, stratejik içgörüleri, performans matrisini ve ödeme operasyonlarını tek bir panelden yönetmek istiyorum; böylece platform genelinde proaktif yönetim yapabilirim.

#### Kabul Kriterleri

1. WHEN Super Admin `/super-admin/command-center` sayfasına gittiğinde, THE Super_Admin_Paneli SHALL aktif tenant sayısını, anlık API istek sayısını, sistem kaynak kullanımını ve son 24 saatteki kritik hataları gerçek zamanlı gösterecektir.
2. WHEN Super Admin `/super-admin/strategic-insights` sayfasına gittiğinde, THE Super_Admin_Paneli SHALL aylık büyüme oranlarını, churn analizini, gelir projeksiyonlarını ve en aktif tenant'ları görsel grafiklerle sunacaktır.
3. WHEN Super Admin `/super-admin/tenant-performance` sayfasına gittiğinde, THE Super_Admin_Paneli SHALL tüm tenant'ları servis emri sayısı, gelir, aktif kullanıcı ve abonelik durumuna göre sıralanabilir bir matris tablosunda gösterecektir.
4. WHEN Super Admin `/super-admin/payment-operations` sayfasına gittiğinde, THE Super_Admin_Paneli SHALL tüm abonelik ödemelerini, başarısız ödeme girişimlerini ve iade taleplerini listeleyecektir.
5. THE Super_Admin_Paneli SHALL `Command Center.html`, `Strategic Insights Hub.html`, `Tenant Performance Matrix.html` ve `Payment Operations Panel.html` tasarım şablonlarındaki görsel düzeni kullanacaktır.
6. WHEN bir tenant'ın aboneliği sona erdiğinde, THE Super_Admin_Paneli SHALL Command Center'da uyarı gösterecektir.
7. THE Super_Admin_Paneli SHALL tüm bu sayfalar için yetki kontrolü uygulayacak; sadece `SUPER_ADMIN` rolündeki kullanıcılar erişebilecektir.


---

### Gereksinim 11: Veritabanı Şeması Eksikleri

**Kullanıcı Hikayesi:** Geliştirici olarak, tüm eksik özelliklerin ihtiyaç duyduğu veritabanı modellerinin şemaya eklenmesini istiyorum; böylece özellikler tutarlı ve ilişkisel bir veri yapısı üzerine inşa edilebilir.

#### Kabul Kriterleri

1. THE Sistem SHALL `Quote` modelini şemaya ekleyecektir; model tenantId, customerId, vehicleId, quoteNumber, status (DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED), validUntil, subTotal, discountAmount, taxAmount, totalAmount, notes alanlarını içerecektir.
2. THE Sistem SHALL `QuoteItem` modelini şemaya ekleyecektir; model quoteId, itemType, name, partId, quantity, unitPrice, taxRate, discount, subTotal, taxAmount, totalPrice alanlarını içerecektir.
3. THE Sistem SHALL `Notification` modelini şemaya ekleyecektir; model tenantId, customerId, type (SMS/EMAIL/IN_APP), channel, recipient, subject, body, status (PENDING/SENT/FAILED), sentAt, metadata alanlarını içerecektir.
4. THE Sistem SHALL `LoyaltyTransaction` modelini şemaya ekleyecektir; model tenantId, customerId, type (EARN/REDEEM), points, description, serviceOrderId, createdAt alanlarını içerecektir.
5. THE Sistem SHALL `Document` modelini şemaya ekleyecektir; model tenantId, serviceOrderId, vehicleId, fileName, fileUrl, fileType, fileSize, uploadedBy, createdAt alanlarını içerecektir.
6. THE Sistem SHALL `InspectionForm` modelini şemaya ekleyecektir; model tenantId, serviceOrderId, mechanicId, formData (JSON), completedAt alanlarını içerecektir.
7. THE Sistem SHALL `CommissionRule` modelini şemaya ekleyecektir; model tenantId, mechanicId, ruleType (PERCENTAGE/FIXED), value, minAmount, maxAmount, isActive alanlarını içerecektir.
8. THE Sistem SHALL `WorkLog` modelini şemaya ekleyecektir; model tenantId, mechanicId, serviceOrderId, startTime, endTime, durationMinutes, notes alanlarını içerecektir.
9. WHEN yeni modeller şemaya eklendiğinde, THE Sistem SHALL Prisma migration dosyası oluşturacak ve mevcut verilerle uyumluluğu koruyacaktır.
10. THE Sistem SHALL tüm yeni modeller için uygun index'leri tanımlayacaktır; en az tenantId ve ilişkili foreign key alanları index'lenecektir.
11. WHEN şema değişiklikleri uygulandığında ve geri alındığında, THE Sistem SHALL veritabanı tutarlılığını koruyacaktır (migration round-trip özelliği).


---

## Teknik Gereksinimler

### Genel Teknik Kısıtlar

1. THE Sistem SHALL tüm yeni özellikler için mevcut Turborepo monorepo yapısını (`apps/web`, `packages/database`) kullanacaktır.
2. THE Sistem SHALL tüm yeni server action'lar için `lib/actions/` dizinindeki mevcut dosya organizasyonunu takip edecektir.
3. THE Sistem SHALL tüm yeni form validasyonları için `lib/validations/` dizinindeki Zod şema yapısını kullanacaktır.
4. THE Sistem SHALL tüm yeni API endpoint'leri için NextAuth.js oturum doğrulaması ve tenant izolasyonu uygulayacaktır.
5. THE Sistem SHALL tüm yeni UI bileşenleri için mevcut Material Design 3 renk sistemi ve Tailwind CSS sınıflarını kullanacaktır.
6. THE Sistem SHALL tüm yeni veritabanı işlemleri için Prisma ORM kullanacaktır; ham SQL sorguları kullanılmayacaktır.
7. WHEN bir tenant'ın verisi sorgulandığında, THE Sistem SHALL her zaman `tenantId` filtresi uygulayacaktır; cross-tenant veri sızıntısı önlenecektir.

### Performans Gereksinimleri

1. WHEN bir sayfa yüklendiğinde, THE Sistem SHALL ilk içerik boyamasını (FCP) 3 saniye içinde tamamlayacaktır.
2. THE Sistem SHALL tüm liste sayfaları için sayfalama (pagination) uygulayacaktır; varsayılan sayfa boyutu 20 kayıt olacaktır.
3. WHEN bir dosya yüklendiğinde, THE Dosya_Yöneticisi SHALL yükleme ilerlemesini gerçek zamanlı olarak gösterecektir.

### Güvenlik Gereksinimleri

1. THE Sistem SHALL tüm dosya yükleme işlemlerinde dosya türü ve boyut doğrulaması yapacaktır.
2. THE Sistem SHALL tüm bildirim şablonlarında XSS saldırılarına karşı girdi temizleme uygulayacaktır.
3. THE Sistem SHALL Stripe webhook'larını imza doğrulaması ile koruyacaktır.
4. THE Onay_Akışı SHALL onay token'larını kriptografik olarak güvenli rastgele değerler kullanarak üretecektir.

