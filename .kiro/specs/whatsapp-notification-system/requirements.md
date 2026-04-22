# Gereksinimler Belgesi

## Giriş

Bu belge, MS Oto Servis SaaS platformu için **WhatsApp ve Gelişmiş Bildirim Sistemi** özelliğinin gereksinimlerini tanımlar.

Türkiye'de WhatsApp kullanım oranı %90'ın üzerindedir ve oto servis müşterileri SMS yerine WhatsApp üzerinden iletişim kurmayı tercih etmektedir. Mevcut platformda `NotificationProvider` şemasında `WHATSAPP` tipi tanımlı olmasına rağmen `lib/notifications/whatsapp.ts` implementasyonu bulunmamaktadır. Bu özellik; WhatsApp Business API entegrasyonu, randevu hatırlatma otomasyonu, müşteri bildirim tercihleri yönetimi, bildirim geçmişi görüntüleme, tenant bazlı şablon özelleştirme ve toplu bildirim gönderimi kapsamlarını içermektedir.

---

## Sözlük

- **Bildirim_Sistemi**: Tüm bildirim kanallarını (SMS, WhatsApp, E-posta) yöneten servis katmanı
- **WhatsApp_Servisi**: Meta Cloud API veya Twilio WhatsApp üzerinden mesaj gönderen servis modülü (`lib/notifications/whatsapp.ts`)
- **Bildirim_Yöneticisi**: Kanal seçimi, yönlendirme ve yeniden deneme mantığını yöneten orkestrasyon katmanı
- **Şablon_Motoru**: Tenant bazlı özelleştirilebilir bildirim şablonlarını yöneten sistem
- **Tercih_Yöneticisi**: Müşteri bildirim kanalı tercihlerini saklayan ve sorgulayan servis
- **Randevu_Hatırlatıcı**: Randevu tarihinden belirli süre önce otomatik hatırlatma gönderen Inngest job'ı
- **Toplu_Bildirim_Servisi**: Belirli müşteri segmentlerine toplu mesaj gönderen servis
- **Tenant**: Platforma kayıtlı oto servis işletmesi
- **Müşteri**: Oto servise araç getiren son kullanıcı
- **Kanal**: Bildirim iletim yöntemi (SMS, WhatsApp, E-posta)
- **Sağlayıcı**: Bildirim iletimini gerçekleştiren üçüncü taraf servis (Twilio, Netgsm, Meta Cloud API)
- **İş_Emri**: Araç servis kaydı
- **Randevu**: Müşterinin servise gelmek için önceden belirlediği tarih/saat
- **Şablon**: Değişken alanlar içeren önceden tanımlanmış mesaj formatı
- **Segment**: Belirli kriterlere göre filtrelenmiş müşteri grubu
- **Webhook**: Sağlayıcıdan gelen durum güncellemesi bildirimi

---

## Gereksinimler

### Gereksinim 1: WhatsApp Business API Entegrasyonu

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, müşterilerime WhatsApp üzerinden bildirim göndermek istiyorum; çünkü Türkiye'de WhatsApp SMS'e kıyasla çok daha yüksek açılma oranına sahiptir ve müşteriler bu kanalı tercih etmektedir.

#### Kabul Kriterleri

1. THE Bildirim_Sistemi SHALL `lib/notifications/whatsapp.ts` modülünü içermelidir ve bu modül Twilio WhatsApp ile Meta Cloud API sağlayıcılarını desteklemelidir.
2. WHEN bir Tenant için `type: "WHATSAPP"` ve `isActive: true` olan bir `NotificationProvider` kaydı mevcutsa, THE WhatsApp_Servisi SHALL mesajı ilgili sağlayıcı üzerinden göndermelidir.
3. WHEN bir WhatsApp mesajı gönderildiğinde, THE WhatsApp_Servisi SHALL `Notification` tablosuna `type: "WHATSAPP"` ile kayıt oluşturmalıdır.
4. IF WhatsApp sağlayıcısı API hatası döndürürse, THEN THE WhatsApp_Servisi SHALL `Notification` kaydını `status: "FAILED"` olarak güncellemeli ve hata detayını `metadata` alanına yazmalıdır.
5. WHEN Meta Cloud API kullanılıyorsa, THE WhatsApp_Servisi SHALL onaylı WhatsApp Business mesaj şablonlarını (HSM — Highly Structured Messages) kullanmalıdır.
6. WHEN Twilio WhatsApp kullanılıyorsa, THE WhatsApp_Servisi SHALL `whatsapp:+90XXXXXXXXXX` formatında alıcı numarası oluşturmalıdır.
7. THE WhatsApp_Servisi SHALL telefon numarasını `+90XXXXXXXXXX` uluslararası formatına normalize etmelidir; 0 ile başlayan Türkiye numaralarını otomatik olarak dönüştürmelidir.
8. WHEN aktif bir WhatsApp sağlayıcısı bulunamazsa, THE WhatsApp_Servisi SHALL işlemi simülasyon modunda tamamlamalı ve `metadata: { simulated: true }` ile `status: "SENT"` kaydetmelidir.
9. THE Bildirim_Sistemi SHALL `notification/whatsapp.send` Inngest event'ini dinleyen bir `send-whatsapp` job'ı içermelidir; bu job 3 yeniden deneme ile çalışmalıdır.
10. WHERE Meta Cloud API sağlayıcısı yapılandırılmışsa, THE WhatsApp_Servisi SHALL `/api/webhooks/whatsapp` endpoint'i üzerinden gelen durum güncellemelerini (delivered, read, failed) işlemeli ve ilgili `Notification` kaydını güncellemeli dir.

---

### Gereksinim 2: Bildirim Kanalı Yönlendirme ve Tercih Yönetimi

**Kullanıcı Hikayesi:** Bir Müşteri olarak, hangi kanaldan (SMS, WhatsApp, E-posta) bildirim almak istediğimi seçmek istiyorum; çünkü bazı kanalları daha sık kontrol ediyorum ve gereksiz mesajlar almak istemiyorum.

#### Kabul Kriterleri

1. THE Bildirim_Sistemi SHALL her müşteri için kanal tercihlerini saklayan bir `CustomerNotificationPreference` veri yapısını desteklemelidir; bu yapı `smsEnabled`, `whatsappEnabled`, `emailEnabled` ve `preferredChannel` alanlarını içermelidir.
2. WHEN Bildirim_Yöneticisi bir bildirim göndermek üzere çağrıldığında, THE Bildirim_Yöneticisi SHALL müşterinin tercih ettiği kanalı öncelikli olarak kullanmalıdır.
3. WHEN müşterinin tercih ettiği kanal için aktif bir sağlayıcı mevcut değilse, THE Bildirim_Yöneticisi SHALL bir sonraki etkin kanala otomatik olarak geçiş yapmalıdır; öncelik sırası WhatsApp → SMS → E-posta şeklinde olmalıdır.
4. WHEN müşteri tüm kanalları devre dışı bırakmışsa, THE Bildirim_Yöneticisi SHALL bildirim göndermemeli ve bu durumu `status: "SKIPPED"` ile `Notification` tablosuna kaydetmelidir.
5. THE Tercih_Yöneticisi SHALL müşteri portal sayfasında (`/m/musteri`) kanal tercihlerini güncelleyebileceği bir arayüz sunmalıdır.
6. WHEN bir müşteri WhatsApp tercihini etkinleştirdiğinde, THE Tercih_Yöneticisi SHALL müşterinin telefon numarasının kayıtlı olduğunu doğrulamalıdır; telefon numarası yoksa etkinleştirmeyi reddetmeli ve kullanıcıya açıklayıcı hata mesajı göstermelidir.
7. THE Bildirim_Yöneticisi SHALL dashboard'da (`/dashboard/notifications/preferences`) tenant yöneticisinin varsayılan kanal önceliğini yapılandırabileceği bir ayar sayfası sunmalıdır.
8. WHEN bir müşteri bildirim tercihlerini güncellediğinde, THE Tercih_Yöneticisi SHALL değişikliği `Notification` tablosuna audit kaydı olarak yazmalıdır.

---

### Gereksinim 3: Randevu Hatırlatma Otomasyonu

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, müşterilerimin randevularını unutmaması için otomatik hatırlatma mesajları gönderilmesini istiyorum; çünkü randevu iptalleri ve geç gelenler servis verimliliğini düşürmektedir.

#### Kabul Kriterleri

1. THE Randevu_Hatırlatıcı SHALL randevu tarihinden 24 saat önce müşteriye otomatik hatırlatma mesajı göndermelidir.
2. THE Randevu_Hatırlatıcı SHALL randevu tarihinden 2 saat önce ikinci bir hatırlatma mesajı göndermelidir.
3. WHEN Inngest `appointment-reminder` job'ı çalıştığında, THE Randevu_Hatırlatıcı SHALL önümüzdeki 25 saat içindeki tüm onaylanmış randevuları sorgulamalı ve her biri için hatırlatma göndermelidir.
4. WHEN bir randevu iptal edildiğinde, THE Randevu_Hatırlatıcı SHALL bu randevu için planlanmış bekleyen hatırlatmaları iptal etmelidir.
5. THE Randevu_Hatırlatıcı SHALL aynı randevu için aynı hatırlatma tipini (24 saat veya 2 saat) yalnızca bir kez göndermeli; tekrar gönderimi önlemek için `Notification` tablosunu kontrol etmelidir.
6. WHEN hatırlatma mesajı gönderildiğinde, THE Randevu_Hatırlatıcı SHALL mesajda randevu tarihi, saati, servis adresi ve varsa araç plakasını içermelidir.
7. WHERE tenant WhatsApp sağlayıcısını yapılandırmışsa, THE Randevu_Hatırlatıcı SHALL hatırlatmaları WhatsApp üzerinden göndermelidir; aksi hâlde SMS kullanmalıdır.
8. THE Randevu_Hatırlatıcı SHALL Inngest cron job olarak her saat başı çalışmalıdır (`0 * * * *` zamanlaması).
9. IF randevu hatırlatma gönderimi başarısız olursa, THEN THE Randevu_Hatırlatıcı SHALL 3 kez yeniden denemelidir; tüm denemeler başarısız olursa tenant yöneticisine e-posta ile bildirim göndermelidir.

---

### Gereksinim 4: Bildirim Geçmişi ve İzleme

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, gönderilen tüm bildirimlerin geçmişini görmek istiyorum; çünkü müşteri şikayetlerini araştırmak ve bildirim başarı oranlarını takip etmek istiyorum.

#### Kabul Kriterleri

1. THE Bildirim_Sistemi SHALL `/dashboard/notifications` adresinde bildirim geçmişi listesi sayfası sunmalıdır.
2. THE Bildirim_Sistemi SHALL bildirim listesini tarih, kanal (SMS/WhatsApp/E-posta), durum (PENDING/SENT/FAILED/SKIPPED) ve müşteri adına göre filtrelenebilir şekilde sunmalıdır.
3. WHEN bir bildirim kaydına tıklandığında, THE Bildirim_Sistemi SHALL mesaj içeriği, alıcı, gönderim zamanı, sağlayıcı yanıtı ve yeniden deneme sayısını içeren detay görünümü açmalıdır.
4. THE Bildirim_Sistemi SHALL bildirim listesini sayfalama ile sunmalıdır; her sayfada en fazla 50 kayıt gösterilmelidir.
5. THE Bildirim_Sistemi SHALL dashboard ana sayfasında son 7 günün bildirim başarı oranını (SENT / toplam) özet kart olarak göstermelidir.
6. WHEN bir bildirim `status: "FAILED"` durumundaysa, THE Bildirim_Sistemi SHALL yöneticiye tek tıkla yeniden gönderme imkânı sunmalıdır.
7. THE Bildirim_Sistemi SHALL bildirim geçmişini yalnızca ilgili tenant'ın kayıtlarıyla sınırlandırmalıdır; tenant izolasyonu `tenantId` filtresiyle sağlanmalıdır.
8. THE Bildirim_Sistemi SHALL bildirim listesini CSV formatında dışa aktarma özelliği sunmalıdır.

---

### Gereksinim 5: Tenant Bazlı Şablon Özelleştirme

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, müşterilere gönderilen mesaj şablonlarını kendi servisimin adı ve tarzına göre özelleştirmek istiyorum; çünkü mevcut hardcoded şablonlar tüm servislerde aynı görünmekte ve marka kimliğimi yansıtmamaktadır.

#### Kabul Kriterleri

1. THE Şablon_Motoru SHALL her tenant için özelleştirilebilir bildirim şablonlarını veritabanında saklamalıdır; şablonlar `tenantId`, `type` (servis durumu, onay talebi, randevu, teklif, hatırlatma), `channel` (SMS, WhatsApp, E-posta) ve `body` alanlarını içermelidir.
2. WHEN bir bildirim gönderildiğinde, THE Şablon_Motoru SHALL önce tenant'a özgü şablonu aramalı; bulunamazsa `lib/notifications/templates.ts` içindeki varsayılan şablona geri dönmelidir.
3. THE Şablon_Motoru SHALL şablon gövdesinde `{{musteriAdi}}`, `{{aracPlaka}}`, `{{isEmriNo}}`, `{{durum}}`, `{{tutar}}`, `{{randevuTarihi}}`, `{{randevuSaati}}`, `{{onayUrl}}` değişkenlerini desteklemelidir.
4. WHEN bir şablon kaydedildiğinde, THE Şablon_Motoru SHALL şablonun tüm zorunlu değişkenleri içerdiğini doğrulamalı; eksik değişken varsa kaydetmeyi reddetmeli ve hangi değişkenlerin eksik olduğunu belirtmelidir.
5. THE Şablon_Motoru SHALL `/dashboard/notifications/templates` adresinde şablon yönetim arayüzü sunmalıdır; bu arayüzde şablon oluşturma, düzenleme, silme ve önizleme işlemleri yapılabilmelidir.
6. WHEN bir şablon önizlendiğinde, THE Şablon_Motoru SHALL değişkenleri örnek verilerle doldurarak gerçek mesaj görünümünü göstermelidir.
7. THE Şablon_Motoru SHALL SMS şablonları için karakter sayısını gerçek zamanlı olarak göstermeli; 160 karakteri aşan şablonlar için uyarı vermelidir.
8. WHERE WhatsApp kanalı için şablon oluşturuluyorsa, THE Şablon_Motoru SHALL Meta Cloud API için onay gerektiren HSM şablonlarını standart mesajlardan ayrı yönetmelidir.
9. THE Şablon_Motoru SHALL bir şablon silindiğinde ilgili şablonu `deletedAt` alanıyla soft-delete yapmalıdır; fiziksel silme yapmamalıdır.

---

### Gereksinim 6: Toplu Bildirim Gönderimi

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, tüm müşterilerime veya belirli bir müşteri segmentine (örneğin vadesi geçmiş faturası olanlar, belirli marka araç sahipleri) toplu mesaj göndermek istiyorum; çünkü kampanya duyuruları, bakım hatırlatmaları ve özel teklifler için bu özelliğe ihtiyacım var.

#### Kabul Kriterleri

1. THE Toplu_Bildirim_Servisi SHALL `/dashboard/notifications/bulk` adresinde toplu bildirim oluşturma arayüzü sunmalıdır.
2. THE Toplu_Bildirim_Servisi SHALL aşağıdaki müşteri segmentlerini desteklemelidir: tüm müşteriler, vadesi geçmiş faturası olanlar (X gün), belirli araç markası sahipleri, son X gün içinde servise gelmeyenler ve son X gün içinde servise gelenler.
3. WHEN bir toplu bildirim oluşturulduğunda, THE Toplu_Bildirim_Servisi SHALL hedef segment kriterlerine göre etkilenecek müşteri sayısını önizleme olarak göstermelidir.
4. WHEN toplu bildirim gönderimi başlatıldığında, THE Toplu_Bildirim_Servisi SHALL gönderimi Inngest job kuyruğuna almalı ve her müşteri için ayrı `notification/sms.send` veya `notification/whatsapp.send` event'i tetiklemelidir.
5. THE Toplu_Bildirim_Servisi SHALL toplu gönderim hızını dakikada en fazla 60 mesaj ile sınırlandırmalıdır; bu sınır aşıldığında gönderimler otomatik olarak kuyruğa alınmalıdır.
6. WHEN toplu bildirim gönderimi tamamlandığında, THE Toplu_Bildirim_Servisi SHALL toplam gönderilen, başarılı ve başarısız mesaj sayılarını içeren özet raporu tenant yöneticisine e-posta ile göndermelidir.
7. THE Toplu_Bildirim_Servisi SHALL toplu bildirim geçmişini `/dashboard/notifications/bulk` sayfasında listelemelidir; her kampanya için durum, hedef kitle, gönderim tarihi ve başarı oranı gösterilmelidir.
8. IF bir müşteri bildirim tercihlerinde ilgili kanalı devre dışı bırakmışsa, THEN THE Toplu_Bildirim_Servisi SHALL bu müşteriyi toplu gönderimden otomatik olarak çıkarmalıdır.
9. THE Toplu_Bildirim_Servisi SHALL toplu bildirim oluşturma ve gönderme işlemlerini yalnızca `TENANT_ADMIN` rolündeki kullanıcılara izin vermelidir.
10. WHEN toplu bildirim mesajı oluşturulurken, THE Toplu_Bildirim_Servisi SHALL `{{musteriAdi}}` ve `{{aracPlaka}}` kişiselleştirme değişkenlerini desteklemelidir.

---

### Gereksinim 7: WhatsApp Mesaj Şablonu Yönetimi (Meta Cloud API)

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, Meta Cloud API üzerinden WhatsApp mesajı gönderebilmek için onaylı mesaj şablonlarını yönetmek istiyorum; çünkü Meta, işletme hesaplarından gönderilen mesajların önceden onaylanmış şablonlara uygun olmasını zorunlu kılmaktadır.

#### Kabul Kriterleri

1. THE Şablon_Motoru SHALL Meta Cloud API için kullanılacak HSM şablonlarının `templateName` ve `languageCode` alanlarını veritabanında saklamalıdır.
2. WHEN Meta Cloud API üzerinden WhatsApp mesajı gönderildiğinde, THE WhatsApp_Servisi SHALL mesajı serbest metin olarak değil, kayıtlı HSM şablon adı ve parametre listesi olarak iletmelidir.
3. THE Şablon_Motoru SHALL `/dashboard/notifications/templates` arayüzünde HSM şablon adı ve dil kodu alanlarını içeren WhatsApp şablon formu sunmalıdır.
4. IF Meta Cloud API şablon adı geçersiz veya onaylanmamışsa, THEN THE WhatsApp_Servisi SHALL gönderimi `status: "FAILED"` olarak kaydetmeli ve hata mesajında şablon adını belirtmelidir.
5. WHERE Twilio WhatsApp sağlayıcısı kullanılıyorsa, THE WhatsApp_Servisi SHALL serbest metin mesajlarını da desteklemelidir; HSM şablonu zorunlu olmamalıdır.

---

### Gereksinim 8: Bildirim Sağlayıcı Yapılandırması

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, WhatsApp sağlayıcımı (Twilio veya Meta Cloud API) dashboard üzerinden yapılandırmak istiyorum; çünkü API anahtarlarını ve gönderici numarasını kolayca güncelleyebilmem gerekiyor.

#### Kabul Kriterleri

1. THE Bildirim_Sistemi SHALL `/dashboard/settings/notifications` adresinde sağlayıcı yapılandırma arayüzü sunmalıdır; bu arayüzde SMS, WhatsApp ve E-posta sağlayıcıları ayrı bölümler hâlinde yönetilebilmelidir.
2. WHEN bir WhatsApp sağlayıcısı yapılandırıldığında, THE Bildirim_Sistemi SHALL sağlayıcı türüne göre gerekli alanları dinamik olarak göstermelidir: Twilio için `accountSid`, `authToken`, `fromNumber`; Meta Cloud API için `phoneNumberId`, `accessToken`, `wabaId`.
3. THE Bildirim_Sistemi SHALL sağlayıcı yapılandırmasını kaydetmeden önce test mesajı gönderme imkânı sunmalıdır; test başarılıysa yapılandırma kaydedilmelidir.
4. IF sağlayıcı test mesajı başarısız olursa, THEN THE Bildirim_Sistemi SHALL hata detayını kullanıcıya göstermeli ve yapılandırmayı kaydetmemelidir.
5. THE Bildirim_Sistemi SHALL sağlayıcı `settings` alanındaki API anahtarlarını veritabanına kaydetmeden önce şifrelemeli; görüntüleme sırasında yalnızca son 4 karakteri göstermelidir.
6. WHEN bir sağlayıcı devre dışı bırakıldığında (`isActive: false`), THE Bildirim_Sistemi SHALL bu sağlayıcı üzerinden yeni bildirim gönderimini durdurmalı; mevcut kuyruktaki işleri tamamlamalıdır.

---

### Gereksinim 9: Bildirim Şablonu Ayrıştırma ve Doğrulama

**Kullanıcı Hikayesi:** Bir Tenant_Admin olarak, oluşturduğum şablonların doğru çalıştığından emin olmak istiyorum; çünkü hatalı şablonlar müşterilere bozuk mesajlar gönderilmesine yol açabilir.

#### Kabul Kriterleri

1. THE Şablon_Motoru SHALL şablon gövdesini ayrıştırarak `{{değişken}}` formatındaki tüm değişkenleri tespit etmelidir.
2. WHEN bir şablon render edildiğinde, THE Şablon_Motoru SHALL tüm `{{değişken}}` yer tutucularını sağlanan değerlerle değiştirmelidir.
3. THE Şablon_Motoru SHALL şablon ayrıştırma işlemini tersine çevrilebilir şekilde gerçekleştirmelidir: `render(parse(şablon), değerler)` işlemi orijinal değerleri korumalıdır (round-trip özelliği).
4. IF bir şablon render edilirken değeri sağlanmamış değişken varsa, THEN THE Şablon_Motoru SHALL eksik değişkeni boş string ile değiştirmemeli; bunun yerine `[değişken_adı]` formatında yer tutucu bırakmalı ve log'a uyarı yazmalıdır.
5. THE Şablon_Motoru SHALL aynı şablonu birden fazla kez render etmenin aynı sonucu ürettiğini garanti etmelidir (idempotent render).
6. WHEN bir şablon kaydedildiğinde, THE Şablon_Motoru SHALL şablon gövdesini ayrıştırarak kullanılan değişkenlerin listesini `variables` alanına otomatik olarak yazmalıdır.

---

### Gereksinim 10: Mobil Uygulama Bildirim Entegrasyonu

**Kullanıcı Hikayesi:** Bir Müşteri olarak, mobil uygulamadan bildirim tercihlerimi yönetmek ve geçmiş bildirimlerimi görmek istiyorum; çünkü masaüstü dashboard'a erişimim olmayabilir.

#### Kabul Kriterleri

1. THE Bildirim_Sistemi SHALL müşteri mobil uygulamasında (`/m/musteri`) bildirim tercihleri sayfası sunmalıdır; bu sayfada SMS, WhatsApp ve E-posta kanalları ayrı ayrı etkinleştirilebilir/devre dışı bırakılabilir olmalıdır.
2. THE Bildirim_Sistemi SHALL müşteri mobil uygulamasında son 30 günün bildirim geçmişini listeleyebilmelidir; her bildirim için kanal, tarih ve mesaj özeti gösterilmelidir.
3. WHEN müşteri mobil uygulamasından bildirim tercihini güncellediğinde, THE Tercih_Yöneticisi SHALL değişikliği 2 saniye içinde veritabanına yansıtmalıdır.
4. THE Bildirim_Sistemi SHALL müşteri mobil uygulamasındaki bildirim tercih sayfasını yalnızca kimliği doğrulanmış müşterilere göstermelidir.

