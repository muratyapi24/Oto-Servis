# Requirements Document

## Introduction

MS Oto Servis uygulamasında müşteri, araç, usta, fatura ve randevu için detay sayfaları eksiktir. Bu özellik; her varlık için `/dashboard/{entity}/[id]` rotasında tam kapsamlı bir detay sayfası sunar. Sayfalar Next.js 15 Server Component mimarisine uygun olarak, mevcut Prisma modelleri ve server action'lar üzerine inşa edilir. Tüm sayfalar multi-tenant izolasyonunu korur; yani bir tenant'ın verisi başka bir tenant tarafından görüntülenemez.

---

## Glossary

- **DetailPage**: Tek bir varlığa ait tüm bilgileri ve ilişkili verileri gösteren `/dashboard/{entity}/[id]` rotasındaki sayfa.
- **CustomerDetailPage**: `/dashboard/customers/[id]` rotasındaki müşteri detay sayfası.
- **VehicleDetailPage**: `/dashboard/vehicles/[id]` rotasındaki araç detay sayfası.
- **MechanicDetailPage**: `/dashboard/mechanics/[id]` rotasındaki usta detay sayfası.
- **InvoiceDetailPage**: `/dashboard/finances/invoices/[id]` rotasındaki fatura detay sayfası.
- **AppointmentDetailPage**: `/dashboard/appointments/[id]` rotasındaki randevu detay sayfası.
- **System**: MS Oto Servis Next.js uygulaması (server action katmanı dahil).
- **Tenant**: Sisteme kayıtlı bir oto servis firması.
- **ServiceOrder**: Araç için açılmış iş emri / servis fişi.
- **Invoice**: Müşteriye kesilen veya tedarikçiden alınan fatura kaydı.
- **Appointment**: Müşteri tarafından veya servis tarafından oluşturulan randevu kaydı.
- **SoftDelete**: `deletedAt` alanı dolu olan, sistemden kaldırılmış kayıt.

---

## Requirements

### Requirement 1: Tenant İzolasyonu ve Yetkilendirme

**User Story:** Bir servis personeli olarak, yalnızca kendi firmama ait kayıtların detaylarını görmek istiyorum; böylece başka firmaların verilerine erişilmesini önlerim.

#### Acceptance Criteria

1. WHEN bir kullanıcı herhangi bir DetailPage'e eriştiğinde, THE System SHALL kullanıcının oturum `tenantId` değerini doğrular ve yalnızca aynı `tenantId`'ye sahip kaydı döndürür.
2. IF istenen kaydın `tenantId` değeri oturumdaki `tenantId` ile eşleşmiyorsa, THEN THE System SHALL HTTP 404 yanıtı döndürür.
3. IF kullanıcının geçerli bir oturumu yoksa, THEN THE System SHALL kullanıcıyı `/login` sayfasına yönlendirir.
4. IF istenen kayıt `deletedAt` alanı dolu ise (SoftDelete), THEN THE System SHALL HTTP 404 yanıtı döndürür.

---

### Requirement 2: Müşteri Detay Sayfası

**User Story:** Bir servis personeli olarak, müşteri detay sayfasında müşterinin tüm bilgilerini, araçlarını, servis geçmişini ve finansal özetini tek ekranda görmek istiyorum; böylece müşteriyle ilgili tüm bağlamı hızlıca kavrayabilirim.

#### Acceptance Criteria

1. WHEN bir kullanıcı `/dashboard/customers/[id]` adresine eriştiğinde, THE System SHALL müşterinin temel bilgilerini (ad/soyad veya firma adı, telefon, e-posta, adres, vergi bilgileri, notlar) görüntüler.
2. WHEN CustomerDetailPage yüklendiğinde, THE System SHALL müşteriye ait tüm araçları (plaka, marka, model, yıl) liste halinde görüntüler.
3. WHEN CustomerDetailPage yüklendiğinde, THE System SHALL müşteriye ait ServiceOrder kayıtlarını (iş emri no, araç, durum, tarih, toplam tutar) tarih azalan sırada görüntüler.
4. WHEN CustomerDetailPage yüklendiğinde, THE System SHALL müşterinin toplam borç bakiyesini, toplam ödenen tutarı ve açık fatura sayısını özet kartlarda görüntüler.
5. WHEN CustomerDetailPage yüklendiğinde, THE System SHALL müşteriye ait son 10 ödeme kaydını (tarih, tutar, yöntem) görüntüler.
6. THE CustomerDetailPage SHALL müşteri bilgilerini düzenlemek için mevcut `updateCustomer` server action'ını kullanan bir düzenleme formu içerir.
7. WHEN bir araç satırına tıklandığında, THE System SHALL kullanıcıyı ilgili `/dashboard/vehicles/[id]` sayfasına yönlendirir.
8. WHEN bir servis satırına tıklandığında, THE System SHALL kullanıcıyı ilgili `/dashboard/services/[id]` sayfasına yönlendirir.

---

### Requirement 3: Araç Detay Sayfası

**User Story:** Bir servis personeli olarak, araç detay sayfasında aracın tüm teknik bilgilerini, servis geçmişini ve sahibini görmek istiyorum; böylece araca özel geçmişi takip edebilirim.

#### Acceptance Criteria

1. WHEN bir kullanıcı `/dashboard/vehicles/[id]` adresine eriştiğinde, THE System SHALL aracın tüm teknik bilgilerini (plaka, marka, model, yıl, şasi no, motor no, renk, yakıt tipi, vites, kilometre, sigorta bilgileri) görüntüler.
2. WHEN VehicleDetailPage yüklendiğinde, THE System SHALL aracın sahibi olan müşterinin adını ve telefon numarasını, `/dashboard/customers/[id]` sayfasına bağlantı içerecek şekilde görüntüler.
3. WHEN VehicleDetailPage yüklendiğinde, THE System SHALL araca ait ServiceOrder kayıtlarını (iş emri no, durum, tarih, şikayet açıklaması, toplam tutar) tarih azalan sırada görüntüler.
4. THE VehicleDetailPage SHALL araç bilgilerini düzenlemek için mevcut `updateVehicle` server action'ını kullanan bir düzenleme formu içerir.
5. WHEN bir servis satırına tıklandığında, THE System SHALL kullanıcıyı ilgili `/dashboard/services/[id]` sayfasına yönlendirir.
6. WHEN VehicleDetailPage yüklendiğinde, THE System SHALL aracın toplam servis sayısını ve toplam servis tutarını özet olarak görüntüler.

---

### Requirement 4: Usta Detay Sayfası

**User Story:** Bir servis yöneticisi olarak, usta detay sayfasında ustanın bilgilerini, aktif ve geçmiş işlerini görmek istiyorum; böylece iş yükünü ve performansını değerlendirebilirim.

#### Acceptance Criteria

1. WHEN bir kullanıcı `/dashboard/mechanics/[id]` adresine eriştiğinde, THE System SHALL ustanın temel bilgilerini (ad, soyad, telefon, e-posta, uzmanlıklar, deneyim yılı, saatlik ücret, aktiflik durumu) görüntüler.
2. WHEN MechanicDetailPage yüklendiğinde, THE System SHALL ustaya atanmış aktif ServiceOrder kayıtlarını (`PENDING` veya `IN_PROGRESS` statüsündeki) liste halinde görüntüler.
3. WHEN MechanicDetailPage yüklendiğinde, THE System SHALL ustanın tamamladığı ServiceOrder kayıtlarını (`COMPLETED` statüsündeki) tarih azalan sırada görüntüler.
4. WHEN MechanicDetailPage yüklendiğinde, THE System SHALL ustanın toplam tamamlanan iş sayısını ve aktif iş sayısını özet kartlarda görüntüler.
5. THE MechanicDetailPage SHALL usta bilgilerini düzenlemek için mevcut `updateMechanic` server action'ını kullanan bir düzenleme formu içerir.
6. WHEN bir servis satırına tıklandığında, THE System SHALL kullanıcıyı ilgili `/dashboard/services/[id]` sayfasına yönlendirir.

---

### Requirement 5: Fatura Detay Sayfası

**User Story:** Bir muhasebe personeli olarak, fatura detay sayfasında faturanın tüm kalemlerini, ödeme geçmişini görmek ve faturayı yazdırmak istiyorum; böylece finansal kayıtları doğru tutabilirim.

#### Acceptance Criteria

1. WHEN bir kullanıcı `/dashboard/finances/invoices/[id]` adresine eriştiğinde, THE System SHALL faturanın başlık bilgilerini (fatura no, tür, durum, müşteri adı, düzenleme tarihi, vade tarihi) görüntüler.
2. WHEN InvoiceDetailPage yüklendiğinde, THE System SHALL faturanın finansal özetini (ara toplam, indirim, KDV, genel toplam, ödenen tutar, kalan bakiye) görüntüler.
3. WHEN InvoiceDetailPage yüklendiğinde, THE System SHALL faturaya bağlı Payment kayıtlarını (tarih, tutar, ödeme yöntemi, notlar) tarih azalan sırada görüntüler.
4. WHEN InvoiceDetailPage yüklendiğinde ve faturanın ilişkili bir ServiceOrder'ı varsa, THE System SHALL ilgili servis iş emrine `/dashboard/services/[id]` bağlantısı içeren bir referans satırı görüntüler.
5. THE InvoiceDetailPage SHALL fatura durumu `DRAFT` veya `SENT` iken yeni ödeme kaydetmek için mevcut `recordPayment` server action'ını kullanan bir ödeme formu içerir.
6. THE InvoiceDetailPage SHALL tarayıcının yazdırma diyaloğunu tetikleyen bir "Yazdır" butonu içerir.
7. WHEN "Yazdır" butonuna tıklandığında, THE System SHALL fatura bilgilerini baskıya uygun bir düzende (`@media print` CSS) görüntüler.
8. IF fatura durumu `PAID` veya `CANCELLED` ise, THEN THE System SHALL ödeme formunu devre dışı bırakır ve yalnızca salt okunur görünüm sunar.

---

### Requirement 6: Randevu Detay Sayfası

**User Story:** Bir servis personeli olarak, randevu detay sayfasında randevunun tüm bilgilerini görmek ve durumunu güncellemek istiyorum; böylece randevu yönetimini etkin şekilde yapabilirim.

#### Acceptance Criteria

1. WHEN bir kullanıcı `/dashboard/appointments/[id]` adresine eriştiğinde, THE System SHALL randevunun tüm bilgilerini (müşteri adı, araç, tarih, saat, tür, notlar, mevcut durum) görüntüler.
2. WHEN AppointmentDetailPage yüklendiğinde, THE System SHALL müşteri adını `/dashboard/customers/[id]` sayfasına bağlantı içerecek şekilde görüntüler.
3. WHEN AppointmentDetailPage yüklendiğinde ve randevuya bir araç atanmışsa, THE System SHALL araç bilgisini (plaka, marka, model) `/dashboard/vehicles/[id]` sayfasına bağlantı içerecek şekilde görüntüler.
4. THE AppointmentDetailPage SHALL randevu durumunu güncellemek için mevcut `updateAppointmentStatus` server action'ını kullanan durum güncelleme kontrolleri içerir.
5. WHEN randevu durumu `COMPLETED` olarak güncellendiğinde, THE System SHALL mevcut `updateAppointmentStatus` action'ının oluşturduğu ServiceOrder kaydına `/dashboard/services/[id]` bağlantısı sunar.
6. IF randevuya henüz araç atanmamışsa ve durum `COMPLETED` yapılmak isteniyorsa, THEN THE System SHALL kullanıcıya "Araç atanmadan randevu tamamlanamaz" hata mesajını görüntüler.
7. THE AppointmentDetailPage SHALL randevu bilgilerini düzenlemek için mevcut `updateAppointment` server action'ını kullanan bir düzenleme formu içerir.

---

### Requirement 7: Veri Getirme Server Action'ları

**User Story:** Bir geliştirici olarak, her detay sayfası için gerekli verileri tek sorguda getiren server action'ların mevcut olmasını istiyorum; böylece sayfalar verimli ve güvenli şekilde yüklensin.

#### Acceptance Criteria

1. THE System SHALL `getCustomerById(id: string)` server action'ını sağlar; bu action müşteri bilgilerini, araçlarını, ServiceOrder'larını ve Payment kayıtlarını tek sorguda döndürür.
2. THE System SHALL `getVehicleById(id: string)` server action'ını sağlar; bu action araç bilgilerini, sahibi olan müşteriyi ve ServiceOrder kayıtlarını tek sorguda döndürür.
3. THE System SHALL `getMechanicById(id: string)` server action'ını sağlar; bu action usta bilgilerini, aktif ve tamamlanmış ServiceOrder kayıtlarını döndürür.
4. THE System SHALL `getInvoiceById(id: string)` server action'ını sağlar; bu action fatura bilgilerini, ilişkili müşteriyi, ServiceOrder'ı ve Payment kayıtlarını döndürür.
5. THE System SHALL `getAppointmentById(id: string)` server action'ını sağlar; bu action randevu bilgilerini, ilişkili müşteriyi ve aracı döndürür.
6. WHEN herhangi bir `getById` action'ı çağrıldığında, THE System SHALL oturumdaki `tenantId` ile kaydın `tenantId`'sini karşılaştırır ve eşleşmiyorsa `null` döndürür.
7. IF herhangi bir `getById` action'ı `null` döndürürse, THEN THE System SHALL ilgili sayfada Next.js `notFound()` fonksiyonunu çağırır.

---

### Requirement 8: Navigasyon ve Bağlantılar

**User Story:** Bir servis personeli olarak, detay sayfaları arasında kolayca gezinmek istiyorum; böylece ilgili kayıtlara hızlıca ulaşabilirim.

#### Acceptance Criteria

1. THE System SHALL her DetailPage'de ilgili liste sayfasına geri dönen bir "Geri" bağlantısı içerir.
2. WHEN CustomerDetailPage'deki bir araç satırına tıklandığında, THE System SHALL kullanıcıyı `/dashboard/vehicles/[id]` adresine yönlendirir.
3. WHEN VehicleDetailPage'deki müşteri bağlantısına tıklandığında, THE System SHALL kullanıcıyı `/dashboard/customers/[id]` adresine yönlendirir.
4. WHEN herhangi bir DetailPage'deki bir servis satırına tıklandığında, THE System SHALL kullanıcıyı `/dashboard/services/[id]` adresine yönlendirir.
5. WHEN herhangi bir DetailPage'deki bir fatura satırına tıklandığında, THE System SHALL kullanıcıyı `/dashboard/finances/invoices/[id]` adresine yönlendirir.
