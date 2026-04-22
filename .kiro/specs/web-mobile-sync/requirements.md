# Gereksinimler Belgesi — Web-Mobile Senkronizasyonu

## Giriş

Bu özellik, `apps/mobile/` uygulamasında tamamlanan tüm ekranları ve Prisma şemasına eklenen yeni modelleri (`MaintenancePlan`, `ServiceRating`) ile yeni alanları (`Mechanic.avatarUrl/shiftStart/shiftEnd/workDays/dailyTarget`, `ServiceOrder.qualityCheckNotes/qualityCheckedAt/qualityCheckedBy`, `Vehicle.imageUrl`) web uygulamasına (`apps/web`) yansıtmayı kapsar.

Hedef; web dashboard'unun (`/dashboard`) ve web mobil portalının (`/m/firma`, `/m/musteri`) mobil uygulama ile tam uyumlu, tutarlı ve eksiksiz hale getirilmesidir. Bu kapsamda:

1. **Dashboard güncellemeleri**: Yeni DB alanlarının mevcut dashboard sayfalarına eklenmesi
2. **Web mobil portal — firma**: Mobil uygulamada var olan ancak web portalında eksik olan 22 ekranın oluşturulması
3. **Web mobil portal — müşteri**: Mobil uygulamada var olan ancak web portalında eksik olan 8 ekranın oluşturulması
4. **Yeni API endpoint'leri**: Dashboard için `ServiceRating` ve `MaintenancePlan` yönetim endpoint'leri

---

## Sözlük

| Terim | Açıklama |
|-------|----------|
| `Web_App` | `apps/web/` dizinindeki Next.js 15 uygulaması |
| `Dashboard` | `/dashboard` altındaki firma yönetim paneli (TENANT_ADMIN, MECHANIC, RECEPTIONIST, ACCOUNTANT rolleri) |
| `Web_Firma_Portal` | `/m/firma` altındaki web tabanlı mobil firma portalı |
| `Web_Musteri_Portal` | `/m/musteri` altındaki web tabanlı müşteri self-servis portalı |
| `Mobile_App` | `apps/mobile/` dizinindeki Expo React Native uygulaması (referans kaynak) |
| `MaintenancePlan` | Araç bazlı bakım planı modeli (vehicleId, title, dueDate, dueMileage, isCompleted, tenantId) |
| `ServiceRating` | Servis değerlendirme modeli (serviceOrderId, customerId, rating 1-5, comment, tenantId) |
| `QualityCheck` | Servis emrindeki kalite kontrol alanları (qualityCheckNotes, qualityCheckedAt, qualityCheckedBy) |
| `Mechanic_Profile_Fields` | Usta modeline eklenen yeni alanlar: avatarUrl, shiftStart, shiftEnd, workDays, dailyTarget |
| `Vehicle_Image` | Araç modeline eklenen imageUrl alanı |
| `Tenant` | Çok kiracılı mimaride bir oto servis firması |
| `TENANT_ADMIN` | Firma yöneticisi rolü — dashboard'a tam erişim |
| `MECHANIC` | Usta rolü — servis emirleri ve iş günlüğü erişimi |
| `CUSTOMER` | Müşteri rolü — müşteri portalı erişimi |
| `Soft_Delete` | `deletedAt` alanı ile mantıksal silme deseni |
| `Tenant_Isolation` | Her sorgunun `tenantId` ile filtrelenmesi zorunluluğu |
| `SSE` | Server-Sent Events — gerçek zamanlı güncelleme mekanizması |
| `Server_Action` | Next.js `"use server"` direktifli sunucu tarafı fonksiyon |
| `StockMovement` | Stok giriş/çıkış/düzeltme hareketi (IN/OUT/ADJUST) |
| `Vardiya` | Usta çalışma saatleri ve günleri (shiftStart, shiftEnd, workDays) |
| `Tahsilat` | Müşteriden alınan ödeme kaydı (Payment modeli, INCOMING tipi) |
| `Barkod` | Parça barkod/QR kodu — stok arama için kullanılır |
| `PDF_Export` | jsPDF + html2canvas ile oluşturulan indirilebilir rapor |

---

## Bölüm 1: Dashboard — Yeni DB Alanlarının Entegrasyonu

### Gereksinim 1: Araç Detay Sayfasında Fotoğraf Desteği

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, araç detay sayfasında araç fotoğrafını görmek ve yüklemek istiyorum; böylece araç kaydını görsel olarak zenginleştirebilirim.

#### Kabul Kriterleri

1. WHEN `/dashboard/vehicles/[id]` sayfası yüklendiğinde, THE `Dashboard` SHALL `Vehicle.imageUrl` alanını araç bilgileri bölümünde görüntüler
2. WHEN `Vehicle.imageUrl` değeri mevcutsa, THE `Dashboard` SHALL araç fotoğrafını 16:9 oranında bir kart içinde gösterir
3. WHEN `Vehicle.imageUrl` değeri yoksa, THE `Dashboard` SHALL araç markasının baş harflerini içeren bir placeholder gösterir
4. WHEN kullanıcı "Fotoğraf Yükle" butonuna tıkladığında, THE `Dashboard` SHALL `/api/upload` endpoint'ini kullanarak S3'e yükleme yapar ve dönen URL'yi `Vehicle.imageUrl` alanına kaydeder
5. IF yükleme başarısız olursa, THEN THE `Dashboard` SHALL kullanıcıya hata mesajı gösterir ve mevcut fotoğrafı korur

---

### Gereksinim 2: Usta Profil Sayfasında Yeni Alanlar

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, usta detay sayfasında vardiya saatleri, çalışma günleri, günlük hedef ve profil fotoğrafını yönetmek istiyorum; böylece personel planlamasını web üzerinden yapabilirim.

#### Kabul Kriterleri

1. WHEN `/dashboard/mechanics/[id]` sayfası yüklendiğinde, THE `Dashboard` SHALL `avatarUrl`, `shiftStart`, `shiftEnd`, `workDays` ve `dailyTarget` alanlarını gösterir
2. WHEN `avatarUrl` mevcutsa, THE `Dashboard` SHALL usta fotoğrafını profil kartında gösterir; yoksa baş harf avatarı gösterir
3. WHEN `shiftStart` ve `shiftEnd` değerleri mevcutsa, THE `Dashboard` SHALL vardiya saatlerini "08:00 – 18:00" formatında gösterir
4. WHEN `workDays` dizisi mevcutsa, THE `Dashboard` SHALL çalışma günlerini Türkçe kısaltmalarla (Pzt, Sal, Çar, Per, Cum, Cmt, Paz) gösterir
5. WHEN `dailyTarget` değeri mevcutsa, THE `Dashboard` SHALL günlük hedef iş sayısını ve o günkü tamamlanan iş sayısını yan yana gösterir
6. WHEN kullanıcı usta düzenleme formunu kaydettiğinde, THE `Dashboard` SHALL `shiftStart`, `shiftEnd`, `workDays` ve `dailyTarget` alanlarını günceller
7. IF `shiftStart` veya `shiftEnd` "HH:MM" formatına uymuyorsa, THEN THE `Dashboard` SHALL formu kaydetmez ve format hatasını gösterir

---

### Gereksinim 3: Servis Detay Sayfasında Kalite Kontrol Bilgileri

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, servis emri detay sayfasında kalite kontrol notlarını ve kim tarafından ne zaman kontrol edildiğini görmek istiyorum; böylece iş kalitesini takip edebilirim.

#### Kabul Kriterleri

1. WHEN `/dashboard/services/[id]` sayfası yüklendiğinde, THE `Dashboard` SHALL `qualityCheckNotes`, `qualityCheckedAt` ve `qualityCheckedBy` alanlarını "Kalite Kontrol" başlıklı bir bölümde gösterir
2. WHEN `qualityCheckedAt` değeri mevcutsa, THE `Dashboard` SHALL kontrol tarihini ve saatini Türkçe yerel formatında gösterir
3. WHEN `qualityCheckNotes` değeri mevcutsa, THE `Dashboard` SHALL notları tam metin olarak gösterir
4. WHEN `qualityCheckNotes` değeri yoksa, THE `Dashboard` SHALL "Kalite kontrolü henüz yapılmadı" mesajını gösterir
5. WHILE servis emri `COMPLETED` statüsündeyken, THE `Dashboard` SHALL kalite kontrol bölümünü düzenlenebilir olarak gösterir
6. WHEN kullanıcı kalite kontrol notlarını güncellediğinde, THE `Dashboard` SHALL `qualityCheckedBy` alanını oturumdaki kullanıcının adıyla ve `qualityCheckedAt` alanını güncel zaman damgasıyla doldurur

---

### Gereksinim 4: Dashboard'da ServiceRating Yönetimi

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, müşterilerin servis değerlendirmelerini dashboard üzerinden görmek ve yönetmek istiyorum; böylece hizmet kalitesini ölçebilirim.

#### Kabul Kriterleri

1. WHEN `/dashboard/services/[id]` sayfası yüklendiğinde, THE `Dashboard` SHALL ilgili `ServiceRating` kaydını (yıldız puanı, yorum, tarih) gösterir
2. WHEN `ServiceRating` kaydı yoksa, THE `Dashboard` SHALL "Henüz değerlendirme yapılmadı" mesajını gösterir
3. THE `Dashboard` SHALL `/dashboard/analytics` sayfasında ortalama servis puanını (tüm `ServiceRating` kayıtlarının ortalaması) gösterir
4. WHEN `/dashboard/analytics` sayfası yüklendiğinde, THE `Dashboard` SHALL son 30 günün ortalama puanını ve puan dağılımını (1-5 yıldız) gösterir
5. THE `Dashboard` SHALL `ServiceRating` kayıtlarını listelemek için `GET /api/dashboard/ratings` endpoint'ini kullanır
6. WHEN bir `ServiceRating` kaydı silinmek istendiğinde, THE `Dashboard` SHALL yalnızca `TENANT_ADMIN` rolüne silme iznini verir

---

### Gereksinim 5: Dashboard'da MaintenancePlan Yönetimi

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, araç bazlı bakım planlarını dashboard üzerinden oluşturmak, görüntülemek ve güncellemek istiyorum; böylece periyodik bakım takibini web üzerinden yapabilirim.

#### Kabul Kriterleri

1. THE `Dashboard` SHALL `/dashboard/vehicles/[id]` sayfasında "Bakım Planları" sekmesi gösterir
2. WHEN "Bakım Planları" sekmesi açıldığında, THE `Dashboard` SHALL o araca ait tüm `MaintenancePlan` kayıtlarını listeler
3. WHEN kullanıcı "Yeni Bakım Planı" butonuna tıkladığında, THE `Dashboard` SHALL `title`, `dueDate`, `dueMileage` alanlarını içeren bir form gösterir
4. WHEN form kaydedildiğinde, THE `Dashboard` SHALL `POST /api/dashboard/maintenance-plans` endpoint'ini çağırır ve yeni kaydı listeye ekler
5. WHEN bir bakım planı tamamlandığında, THE `Dashboard` SHALL `isCompleted` alanını `true` olarak günceller ve kartı "Tamamlandı" olarak işaretler
6. IF `dueDate` geçmiş bir tarihse ve `isCompleted` false ise, THEN THE `Dashboard` SHALL bakım planını kırmızı uyarı rengiyle vurgular
7. WHEN kullanıcı bir bakım planını silmek istediğinde, THE `Dashboard` SHALL onay dialogu gösterir ve onay sonrası kaydı siler

---

### Gereksinim 6: Dashboard'da Usta Vardiya Yönetimi

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, tüm ustaların vardiya takvimini dashboard üzerinden görmek ve düzenlemek istiyorum; böylece iş gücü planlamasını merkezi olarak yapabilirim.

#### Kabul Kriterleri

1. THE `Dashboard` SHALL `/dashboard/staff` sayfasında "Vardiya Takvimi" görünümü sunar
2. WHEN "Vardiya Takvimi" görünümü açıldığında, THE `Dashboard` SHALL tüm aktif ustaların haftalık vardiya çizelgesini tablo formatında gösterir
3. WHEN bir usta hücresi tıklandığında, THE `Dashboard` SHALL o ustanın `shiftStart`, `shiftEnd` ve `workDays` alanlarını düzenlenebilir form olarak gösterir
4. WHEN form kaydedildiğinde, THE `Dashboard` SHALL `PATCH /api/dashboard/mechanics/[id]` endpoint'ini çağırır
5. WHEN `dailyTarget` değeri güncellediğinde, THE `Dashboard` SHALL o günkü tamamlanan iş sayısını hedefle karşılaştıran bir ilerleme çubuğu gösterir

---

### Gereksinim 7: Dashboard'da Stok Hareketleri Detay Sayfası

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, stok hareketlerini detaylı olarak görmek istiyorum; böylece hangi parçanın ne zaman, ne kadar hareket ettiğini takip edebilirim.

#### Kabul Kriterleri

1. THE `Dashboard` SHALL `/dashboard/inventory` sayfasında "Stok Hareketleri" sekmesi gösterir
2. WHEN "Stok Hareketleri" sekmesi açıldığında, THE `Dashboard` SHALL tüm `StockMovement` kayıtlarını sayfalandırılmış tablo olarak gösterir
3. WHEN tablo yüklendiğinde, THE `Dashboard` SHALL her satırda parça adı, hareket tipi (IN/OUT/ADJUST), miktar, tarih ve açıklama gösterir
4. WHEN hareket tipi `IN` ise, THE `Dashboard` SHALL satırı yeşil renk kodlamasıyla gösterir
5. WHEN hareket tipi `OUT` ise, THE `Dashboard` SHALL satırı kırmızı renk kodlamasıyla gösterir
6. WHEN hareket tipi `ADJUST` ise, THE `Dashboard` SHALL satırı sarı renk kodlamasıyla gösterir
7. WHEN kullanıcı parça adına göre arama yaptığında, THE `Dashboard` SHALL sonuçları anlık olarak filtreler
8. WHEN kullanıcı tarih aralığı filtresi uyguladığında, THE `Dashboard` SHALL yalnızca o aralıktaki hareketleri gösterir


---

## Bölüm 2: Web Mobil Portal — Firma Eksik Ekranlar

### Gereksinim 8: Servis Detay Ekranı (`/m/firma/servis-detay/[id]`)

**Kullanıcı Hikayesi:** Bir `MECHANIC` olarak, web mobil portalında aktif servis emrinin tüm detaylarını görmek istiyorum; böylece iş adımlarını takip edebilir ve kalite kontrolü yapabilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/servis-detay/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL araç bilgilerini (plaka, marka, model), müşteri adını ve atanan ustayı gösterir
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/servis/[id]` endpoint'inden veri çeker
3. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL tamamlanma yüzdesini gösteren bir ilerleme çubuğu gösterir
4. WHEN kullanıcı "İşi Kapat" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/is-kapat/[id]` sayfasına yönlendirir
5. WHEN kullanıcı "Parça Talep Et" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/parca-talep` sayfasına yönlendirir
6. IF servis emri bulunamazsa, THEN THE `Web_Firma_Portal` SHALL "Servis emri bulunamadı" mesajı gösterir ve kuyruk sayfasına yönlendirme linki sunar

---

### Gereksinim 9: İş Kapatma Ekranı (`/m/firma/is-kapat/[id]`)

**Kullanıcı Hikayesi:** Bir `MECHANIC` olarak, web mobil portalında tamamladığım işi kalite notlarıyla kapatmak istiyorum; böylece servis emrini `COMPLETED` statüsüne geçirebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/is-kapat/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL servis emri özetini ve kalite kontrol notları textarea'sını gösterir
2. WHEN kullanıcı "İşi Kapat ve Tamamla" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `PATCH /api/mobile/firma/servis/[id]/kapat` endpoint'ini çağırır
3. WHEN istek başarılı olduğunda, THE `Web_Firma_Portal` SHALL servis emri statüsünü `COMPLETED` olarak günceller ve kuyruk sayfasına yönlendirir
4. WHEN istek başarılı olduğunda, THE `Web_Firma_Portal` SHALL müşteriye push bildirimi gönderildiğini onay mesajıyla bildirir
5. IF `qualityCheckNotes` alanı boşsa, THEN THE `Web_Firma_Portal` SHALL formu göndermez ve "Kalite notu zorunludur" uyarısı gösterir

---

### Gereksinim 10: Onay Merkezi Ekranı (`/m/firma/onay`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında müşteri onayı bekleyen servis emirlerini görmek ve onaylamak/reddetmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/onay` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/onay` endpoint'inden `WAITING_APPROVAL` statüsündeki tüm emirleri çeker
2. WHEN onay kartı gösterildiğinde, THE `Web_Firma_Portal` SHALL araç plakasını, toplam tutarı ve aciliyet göstergesini gösterir
3. WHEN kullanıcı "Onayla" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/onay/[id]` endpoint'ini `action: "approve"` ile çağırır
4. WHEN kullanıcı "Reddet" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL red gerekçesi girmek için bir modal gösterir
5. WHEN red gerekçesi girilip onaylandığında, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/onay/[id]` endpoint'ini `action: "reject"` ve `reason` ile çağırır
6. IF liste boşsa, THEN THE `Web_Firma_Portal` SHALL "Bekleyen onay yok" mesajını gösterir

---

### Gereksinim 11: Barkod Tarayıcı Ekranı (`/m/firma/barkod`)

**Kullanıcı Hikayesi:** Bir `MECHANIC` olarak, web mobil portalında parça barkodunu okutarak stok araması yapmak istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/barkod` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL tarayıcı kamera API'sini kullanarak barkod okuma arayüzü gösterir
2. WHEN barkod okunduğunda, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/stok?barcode={code}` endpoint'ini çağırır
3. WHEN parça bulunduğunda, THE `Web_Firma_Portal` SHALL parça adını, stok miktarını ve fiyatını gösterir
4. WHEN parça bulunamadığında, THE `Web_Firma_Portal` SHALL "Parça bulunamadı" mesajı ve manuel arama seçeneği gösterir
5. IF kamera erişimi reddedilirse, THEN THE `Web_Firma_Portal` SHALL manuel barkod girişi için bir metin alanı gösterir

---

### Gereksinim 12: Depo Listesi Ekranı (`/m/firma/depolar`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm depoları listelemek istiyorum; böylece stok dağılımını görebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/depolar` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/depolar` endpoint'inden depo listesini çeker
2. WHEN depo kartı gösterildiğinde, THE `Web_Firma_Portal` SHALL depo adını, lokasyonunu ve toplam kalem sayısını gösterir
3. WHEN kullanıcı bir depo kartına tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/depo/[id]` sayfasına yönlendirir
4. IF depo listesi boşsa, THEN THE `Web_Firma_Portal` SHALL "Henüz depo tanımlanmamış" mesajını gösterir

---

### Gereksinim 13: Depo Detay Ekranı (`/m/firma/depo/[id]`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında belirli bir depodaki stok kalemlerini görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/depo/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/depolar/[id]` endpoint'inden depo stok detayını çeker
2. WHEN stok listesi gösterildiğinde, THE `Web_Firma_Portal` SHALL her parça için adı, mevcut stok miktarını ve minimum stok seviyesini gösterir
3. WHEN bir parçanın stoku minimum seviyenin altındaysa, THE `Web_Firma_Portal` SHALL o satırı uyarı rengiyle vurgular
4. WHEN kullanıcı "Stok Güncelle" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/stok-guncelle/[id]` sayfasına yönlendirir

---

### Gereksinim 14: Parça Talep Ekranı (`/m/firma/parca-talep`)

**Kullanıcı Hikayesi:** Bir `MECHANIC` olarak, web mobil portalında depodan parça talep etmek istiyorum; böylece servis işlemi için gerekli parçaları hızlıca isteyebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/parca-talep` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL depo seçimi, parça seçimi ve miktar alanlarını içeren bir form gösterir
2. WHEN kullanıcı formu gönderdiğinde, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/stok/talep` endpoint'ini çağırır
3. WHEN istek başarılı olduğunda, THE `Web_Firma_Portal` SHALL "Parça talebi oluşturuldu" onay mesajı gösterir
4. IF seçilen parçanın stoku yetersizse, THEN THE `Web_Firma_Portal` SHALL "Yetersiz stok" uyarısı gösterir ve formu göndermez

---

### Gereksinim 15: Stok Güncelleme Ekranı (`/m/firma/stok-guncelle/[id]`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında belirli bir parçanın stok miktarını güncellemek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/stok-guncelle/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL parça adını, mevcut stok miktarını ve hareket tipi seçimini (IN/OUT/ADJUST) gösterir
2. WHEN kullanıcı formu gönderdiğinde, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/stok/[id]/guncelle` endpoint'ini çağırır
3. WHEN istek başarılı olduğunda, THE `Web_Firma_Portal` SHALL güncel stok miktarını gösterir ve stok hareketleri listesine yönlendirir
4. IF girilen miktar sıfır veya negatifse, THEN THE `Web_Firma_Portal` SHALL "Geçersiz miktar" hatası gösterir

---

### Gereksinim 16: Stok Hareketleri Ekranı (`/m/firma/stok-hareketler`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm stok hareketlerini görmek istiyorum; böylece stok akışını takip edebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/stok-hareketler` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/stok/hareketler` endpoint'inden sayfalandırılmış stok hareketlerini çeker
2. WHEN hareket listesi gösterildiğinde, THE `Web_Firma_Portal` SHALL her satırda parça adı, hareket tipi, miktar ve tarihi gösterir
3. WHEN hareket tipi `IN` ise, THE `Web_Firma_Portal` SHALL satırı yeşil renk kodlamasıyla gösterir
4. WHEN hareket tipi `OUT` ise, THE `Web_Firma_Portal` SHALL satırı kırmızı renk kodlamasıyla gösterir
5. WHEN kullanıcı sayfanın sonuna geldiğinde, THE `Web_Firma_Portal` SHALL sonraki sayfayı otomatik yükler (infinite scroll)

---

### Gereksinim 17: Personel Detay Ekranı (`/m/firma/personel/[id]`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında belirli bir ustanın profilini, uzmanlıklarını ve aktif işlerini görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/personel/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/personel/[id]` endpoint'inden usta detayını çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL usta fotoğrafını (veya baş harf avatarını), adını, uzmanlıklarını ve iletişim bilgilerini gösterir
3. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL ustanın aktif servis emirlerini listeler
4. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL vardiya saatlerini ve çalışma günlerini gösterir
5. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL günlük hedef ve tamamlanan iş sayısını ilerleme çubuğuyla gösterir

---

### Gereksinim 18: Personel Performans Ekranı (`/m/firma/personel-performans`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm ustaların performans metriklerini karşılaştırmalı olarak görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/personel-performans` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL tüm aktif ustaların performans kartlarını gösterir
2. WHEN performans kartı gösterildiğinde, THE `Web_Firma_Portal` SHALL tamamlanan iş sayısını, ortalama tamamlama süresini ve ortalama müşteri puanını gösterir
3. WHEN dönem filtresi (Bu Hafta/Bu Ay) değiştirildiğinde, THE `Web_Firma_Portal` SHALL metrikleri seçilen döneme göre günceller
4. WHEN bir usta kartına tıklandığında, THE `Web_Firma_Portal` SHALL `/m/firma/personel/[id]` sayfasına yönlendirir

---

### Gereksinim 19: Vardiya Takvimi Ekranı (`/m/firma/vardiya`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm ustaların haftalık vardiya takvimini görmek istiyorum; böylece iş gücü planlamasını mobil üzerinden yapabilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/vardiya` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL tüm aktif ustaların haftalık vardiya çizelgesini gösterir
2. WHEN çizelge gösterildiğinde, THE `Web_Firma_Portal` SHALL her usta için `shiftStart`, `shiftEnd` ve `workDays` bilgilerini tablo formatında gösterir
3. WHEN bir usta satırına tıklandığında, THE `Web_Firma_Portal` SHALL `/m/firma/personel/[id]` sayfasına yönlendirir
4. IF bir ustanın vardiya bilgisi tanımlanmamışsa, THEN THE `Web_Firma_Portal` SHALL o satırda "Vardiya tanımlanmamış" mesajını gösterir


---

### Gereksinim 20: Gelir Raporu Ekranı (`/m/firma/gelir-raporu`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında aylık gelir dağılımını kategoriye göre görmek istiyorum; böylece finansal performansı mobil üzerinden takip edebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/gelir-raporu` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/finans/gelir-raporu` endpoint'inden aylık gelir verilerini çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL toplam aylık geliri ve kategoriye göre dağılımı (İşçilik, Parça, Diğer) gösterir
3. WHEN ay seçici değiştirildiğinde, THE `Web_Firma_Portal` SHALL seçilen aya ait verileri günceller
4. WHEN kullanıcı "PDF İndir" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL jsPDF ile raporu oluşturur ve indirme başlatır

---

### Gereksinim 21: Servis Raporu Ekranı (`/m/firma/servis-raporu`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında servis operasyon metriklerini görmek istiyorum; böylece iş verimliliğini ölçebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/servis-raporu` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL toplam servis sayısını, ortalama tamamlama süresini ve ortalama müşteri puanını gösterir
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL statüs dağılımını (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) gösterir
3. WHEN dönem filtresi değiştirildiğinde, THE `Web_Firma_Portal` SHALL metrikleri seçilen döneme göre günceller

---

### Gereksinim 22: Raporlar Listesi Ekranı (`/m/firma/raporlar`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında indirilebilir raporların listesini görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/raporlar` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL mevcut rapor türlerini (Gelir Raporu, Servis Raporu, Stok Raporu) listeler
2. WHEN kullanıcı bir rapor türüne tıkladığında, THE `Web_Firma_Portal` SHALL ilgili rapor sayfasına yönlendirir
3. WHEN kullanıcı "İndir" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL PDF raporu oluşturur ve indirme başlatır

---

### Gereksinim 23: Tahsilat Ekleme Ekranı (`/m/firma/tahsilat-ekle`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında yeni bir tahsilat kaydı oluşturmak istiyorum; böylece müşteriden alınan ödemeyi hızlıca sisteme girebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/tahsilat-ekle` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL müşteri seçimi, tutar, ödeme yöntemi (CASH/CREDIT_CARD/BANK_TRANSFER) ve not alanlarını içeren bir form gösterir
2. WHEN kullanıcı formu gönderdiğinde, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/finans/tahsilat` endpoint'ini çağırır
3. WHEN istek başarılı olduğunda, THE `Web_Firma_Portal` SHALL "Tahsilat kaydedildi" onay mesajı gösterir ve tahsilatlar listesine yönlendirir
4. IF tutar sıfır veya negatifse, THEN THE `Web_Firma_Portal` SHALL "Geçersiz tutar" hatası gösterir ve formu göndermez

---

### Gereksinim 24: Tahsilatlar Listesi Ekranı (`/m/firma/tahsilatlar`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm tahsilat kayıtlarını görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/tahsilatlar` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/finans/tahsilatlar` endpoint'inden sayfalandırılmış tahsilat listesini çeker
2. WHEN liste gösterildiğinde, THE `Web_Firma_Portal` SHALL her satırda müşteri adı, tutar, ödeme yöntemi ve tarihi gösterir
3. WHEN kullanıcı bir satıra tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/tahsilat/[id]` sayfasına yönlendirir
4. WHEN kullanıcı "Yeni Tahsilat" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL `/m/firma/tahsilat-ekle` sayfasına yönlendirir

---

### Gereksinim 25: Tahsilat Detay Ekranı (`/m/firma/tahsilat/[id]`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında belirli bir tahsilatın detaylarını ve makbuzunu görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/tahsilat/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/finans/tahsilat/[id]` endpoint'inden tahsilat detayını çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL müşteri adı, tutar, ödeme yöntemi, tarih ve ilgili servis emrini gösterir
3. WHEN kullanıcı "Makbuz İndir" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL PDF makbuz oluşturur ve indirme başlatır

---

### Gereksinim 26: Fatura Detay Ekranı (`/m/firma/fatura/[id]`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında belirli bir faturanın detaylarını görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/fatura/[id]` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/finans/fatura/[id]` endpoint'inden fatura detayını çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Firma_Portal` SHALL fatura numarasını, müşteri adını, kalem listesini (ad, miktar, birim fiyat, KDV, toplam), ara toplamı, KDV tutarını ve genel toplamı gösterir
3. WHEN kullanıcı "PDF İndir" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL fatura PDF'ini oluşturur ve indirme başlatır
4. WHEN fatura `PAID` statüsündeyse, THE `Web_Firma_Portal` SHALL "Ödendi" rozetini gösterir

---

### Gereksinim 27: Bildirimler Ekranı (`/m/firma/bildirimler`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında tüm bildirimleri görmek ve okundu olarak işaretlemek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/bildirimler` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/bildirimler` endpoint'inden bildirim listesini çeker
2. WHEN bildirim listesi gösterildiğinde, THE `Web_Firma_Portal` SHALL her bildirim için başlık, mesaj, tarih ve okundu/okunmadı durumunu gösterir
3. WHEN kullanıcı bir bildirime tıkladığında, THE `Web_Firma_Portal` SHALL bildirimi okundu olarak işaretler
4. WHEN kullanıcı "Tümünü Okundu İşaretle" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL tüm bildirimleri okundu olarak işaretler
5. IF bildirim listesi boşsa, THEN THE `Web_Firma_Portal` SHALL "Bildirim yok" mesajını gösterir

---

### Gereksinim 28: Mesajlar Ekranı (`/m/firma/mesajlar`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında müşterilerle ve ustalarla mesajlaşmak istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/mesajlar` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL aktif konuşma listesini gösterir
2. WHEN bir konuşmaya tıklandığında, THE `Web_Firma_Portal` SHALL mesaj geçmişini ve mesaj gönderme alanını gösterir
3. WHEN kullanıcı mesaj gönderdiğinde, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/mesajlar` endpoint'ini çağırır
4. WHEN yeni mesaj geldiğinde, THE `Web_Firma_Portal` SHALL SSE aracılığıyla konuşmayı günceller

---

### Gereksinim 29: Hizmetler Ekranı (`/m/firma/hizmetler`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında hizmet kataloğunu görmek istiyorum; böylece sunulan hizmetleri ve fiyatları hızlıca kontrol edebilirim.

#### Kabul Kriterleri

1. WHEN `/m/firma/hizmetler` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL `GET /api/mobile/firma/hizmetler` endpoint'inden hizmet listesini çeker
2. WHEN hizmet listesi gösterildiğinde, THE `Web_Firma_Portal` SHALL her hizmet için adı, fiyatını ve tahmini süresini gösterir
3. IF hizmet listesi boşsa, THEN THE `Web_Firma_Portal` SHALL "Henüz hizmet tanımlanmamış" mesajını gösterir

---

### Gereksinim 30: Destek Ekranı (`/m/firma/destek`)

**Kullanıcı Hikayesi:** Bir `TENANT_ADMIN` olarak, web mobil portalında sık sorulan soruları görmek ve destek talebi oluşturmak istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/firma/destek` sayfası yüklendiğinde, THE `Web_Firma_Portal` SHALL SSS listesini accordion formatında gösterir
2. WHEN kullanıcı "Destek Talebi Oluştur" butonuna tıkladığında, THE `Web_Firma_Portal` SHALL konu ve açıklama alanlarını içeren bir form gösterir
3. WHEN form gönderildiğinde, THE `Web_Firma_Portal` SHALL `POST /api/mobile/firma/destek` endpoint'ini çağırır ve "Talebiniz alındı" onay mesajı gösterir


---

## Bölüm 3: Web Mobil Portal — Müşteri Eksik Ekranlar

### Gereksinim 31: Servis Detay Ekranı (`/m/musteri/servis/[id]`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında belirli bir servis emrimin tüm detaylarını görmek istiyorum; böylece aracımın servis sürecini takip edebilirim.

#### Kabul Kriterleri

1. WHEN `/m/musteri/servis/[id]` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL `GET /api/mobile/musteri/servis/[id]` endpoint'inden servis detayını çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Musteri_Portal` SHALL araç bilgilerini, servis türünü, atanan ustayı ve durum zaman çizelgesini gösterir
3. WHEN servis `COMPLETED` statüsündeyse ve `ServiceRating` kaydı yoksa, THE `Web_Musteri_Portal` SHALL 1-5 yıldız değerlendirme bölümü gösterir
4. WHEN müşteri yıldız puanı ve yorum girip "Değerlendir" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL `POST /api/mobile/musteri/servis/[id]/rating` endpoint'ini çağırır
5. WHEN `ServiceRating` kaydı zaten mevcutsa, THE `Web_Musteri_Portal` SHALL mevcut değerlendirmeyi salt okunur olarak gösterir
6. IF servis emri müşteriye ait değilse, THEN THE `Web_Musteri_Portal` SHALL "Erişim reddedildi" mesajı gösterir ve müşteri paneline yönlendirir

---

### Gereksinim 32: Ödeme Ekranı (`/m/musteri/odeme`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında bekleyen faturamı ödeyebilmek istiyorum; böylece servisten çıkmadan önce ödemeyi tamamlayabilirim.

#### Kabul Kriterleri

1. WHEN `/m/musteri/odeme` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL ödenmemiş fatura detayını (kalemler, toplam tutar) ve ödeme yöntemi seçimini gösterir
2. WHEN kullanıcı ödeme yöntemini seçip "Öde" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL `POST /api/musteri/odeme` endpoint'ini çağırır
3. WHEN ödeme başarılı olduğunda, THE `Web_Musteri_Portal` SHALL `/m/musteri/makbuz/[id]` sayfasına yönlendirir
4. IF ödeme başarısız olursa, THEN THE `Web_Musteri_Portal` SHALL hata mesajı gösterir ve ödeme formunu sıfırlamaz

---

### Gereksinim 33: Taksit Ödeme Ekranı (`/m/musteri/odeme-taksit`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında taksit seçeneklerini görmek ve taksitli ödeme yapmak istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/musteri/odeme-taksit` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL mevcut taksit planı seçeneklerini (2/3/6/12 taksit) ve her seçenek için aylık ödeme tutarını gösterir
2. WHEN kullanıcı bir taksit planı seçip onayladığında, THE `Web_Musteri_Portal` SHALL `POST /api/musteri/odeme-taksit` endpoint'ini çağırır
3. WHEN istek başarılı olduğunda, THE `Web_Musteri_Portal` SHALL taksit planı özeti ve ilk ödeme makbuzunu gösterir

---

### Gereksinim 34: Makbuz Ekranı (`/m/musteri/makbuz/[id]`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında ödeme makbuzumu görmek ve indirmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/musteri/makbuz/[id]` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL `GET /api/musteri/makbuz/[id]` endpoint'inden makbuz detayını çeker
2. WHEN sayfa yüklendiğinde, THE `Web_Musteri_Portal` SHALL ödeme tutarını, tarihini, ödeme yöntemini ve ilgili servis emrini gösterir
3. WHEN kullanıcı "İndir" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL PDF makbuz oluşturur ve indirme başlatır
4. IF makbuz bulunamazsa, THEN THE `Web_Musteri_Portal` SHALL "Makbuz bulunamadı" mesajı gösterir ve ödemeler listesine yönlendirir

---

### Gereksinim 35: Kayıtlı Kartlar Ekranı (`/m/musteri/kartlar`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında kayıtlı ödeme kartlarımı yönetmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/musteri/kartlar` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL `GET /api/musteri/kartlar` endpoint'inden kayıtlı kart listesini çeker
2. WHEN kart listesi gösterildiğinde, THE `Web_Musteri_Portal` SHALL her kart için son 4 haneyi, kart tipini ve son kullanma tarihini gösterir
3. WHEN kullanıcı "Kart Ekle" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL Stripe Elements ile güvenli kart ekleme formu gösterir
4. WHEN kullanıcı bir kartı silmek istediğinde, THE `Web_Musteri_Portal` SHALL onay dialogu gösterir ve onay sonrası `DELETE /api/musteri/kartlar/[id]` endpoint'ini çağırır
5. IF kart listesi boşsa, THEN THE `Web_Musteri_Portal` SHALL "Kayıtlı kart yok" mesajı ve "Kart Ekle" butonu gösterir

---

### Gereksinim 36: Ödemeler Geçmişi Ekranı (`/m/musteri/odemeler`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında tüm ödeme geçmişimi görmek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/musteri/odemeler` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL `GET /api/musteri/odemeler` endpoint'inden sayfalandırılmış ödeme listesini çeker
2. WHEN liste gösterildiğinde, THE `Web_Musteri_Portal` SHALL her satırda tutar, ödeme yöntemi, tarih ve ilgili servis emrini gösterir
3. WHEN kullanıcı bir satıra tıkladığında, THE `Web_Musteri_Portal` SHALL `/m/musteri/makbuz/[id]` sayfasına yönlendirir
4. IF ödeme geçmişi boşsa, THEN THE `Web_Musteri_Portal` SHALL "Henüz ödeme yapılmamış" mesajını gösterir

---

### Gereksinim 37: Onboarding Ekranı (`/m/musteri/onboarding`)

**Kullanıcı Hikayesi:** Yeni bir `CUSTOMER` olarak, web mobil portalına ilk girişimde platformun özelliklerini tanıtan bir karşılama akışı görmek istiyorum.

#### Kabul Kriterleri

1. WHEN yeni bir müşteri ilk kez `/m/musteri` portalına girdiğinde, THE `Web_Musteri_Portal` SHALL onboarding sayfasına yönlendirir
2. WHEN onboarding sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL platform özelliklerini (Servis Takibi, Randevu, Ödeme, Belgeler) tanıtan slaytları gösterir
3. WHEN kullanıcı "Başla" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL onboarding tamamlandı bilgisini localStorage'a kaydeder ve müşteri paneline yönlendirir
4. WHEN onboarding daha önce tamamlanmışsa, THE `Web_Musteri_Portal` SHALL onboarding sayfasını atlar ve doğrudan müşteri panelini gösterir

---

### Gereksinim 38: Müşteri Bildirimler Ekranı (`/m/musteri/bildirimler`)

**Kullanıcı Hikayesi:** Bir `CUSTOMER` olarak, web mobil portalında tüm bildirimlerimi görmek ve okundu olarak işaretlemek istiyorum.

#### Kabul Kriterleri

1. WHEN `/m/musteri/bildirimler` sayfası yüklendiğinde, THE `Web_Musteri_Portal` SHALL `GET /api/musteri/bildirimler` endpoint'inden bildirim listesini çeker
2. WHEN bildirim listesi gösterildiğinde, THE `Web_Musteri_Portal` SHALL her bildirim için başlık, mesaj, tarih ve okundu/okunmadı durumunu gösterir
3. WHEN kullanıcı bir bildirime tıkladığında, THE `Web_Musteri_Portal` SHALL bildirimi okundu olarak işaretler
4. WHEN kullanıcı "Tümünü Okundu İşaretle" butonuna tıkladığında, THE `Web_Musteri_Portal` SHALL tüm bildirimleri okundu olarak işaretler
5. IF bildirim listesi boşsa, THEN THE `Web_Musteri_Portal` SHALL "Bildirim yok" mesajını gösterir


---

## Bölüm 4: Yeni API Endpoint'leri

### Gereksinim 39: Dashboard ServiceRating API Endpoint'leri

**Kullanıcı Hikayesi:** Bir geliştirici olarak, dashboard'un `ServiceRating` verilerini yönetebilmesi için CRUD endpoint'lerine ihtiyaç duyuyorum.

#### Kabul Kriterleri

1. WHEN `GET /api/dashboard/ratings` çağrıldığında, THE `Web_App` SHALL oturumdaki kullanıcının `tenantId`'sine ait tüm `ServiceRating` kayıtlarını sayfalandırılmış olarak döner
2. WHEN `GET /api/dashboard/ratings` çağrıldığında, THE `Web_App` SHALL `serviceOrderId`, `customerId`, `rating` ve `comment` alanlarını içeren kayıtları döner
3. WHEN `GET /api/dashboard/ratings/stats` çağrıldığında, THE `Web_App` SHALL ortalama puanı, toplam değerlendirme sayısını ve puan dağılımını (1-5) döner
4. WHEN `DELETE /api/dashboard/ratings/[id]` çağrıldığında, THE `Web_App` SHALL yalnızca `TENANT_ADMIN` rolündeki kullanıcıların silme işlemini gerçekleştirmesine izin verir
5. WHEN herhangi bir endpoint çağrıldığında, THE `Web_App` SHALL `auth()` ile JWT doğrulaması yapar ve `tenantId` izolasyonunu uygular
6. IF oturum geçersizse, THEN THE `Web_App` SHALL `401 Unauthorized` yanıtı döner

---

### Gereksinim 40: Dashboard MaintenancePlan API Endpoint'leri

**Kullanıcı Hikayesi:** Bir geliştirici olarak, dashboard'un `MaintenancePlan` verilerini yönetebilmesi için CRUD endpoint'lerine ihtiyaç duyuyorum.

#### Kabul Kriterleri

1. WHEN `GET /api/dashboard/maintenance-plans?vehicleId={id}` çağrıldığında, THE `Web_App` SHALL belirtilen araca ait tüm bakım planlarını döner
2. WHEN `POST /api/dashboard/maintenance-plans` çağrıldığında, THE `Web_App` SHALL `vehicleId`, `title`, `dueDate`, `dueMileage` alanlarını Zod ile doğrular ve yeni `MaintenancePlan` kaydı oluşturur
3. WHEN `PATCH /api/dashboard/maintenance-plans/[id]` çağrıldığında, THE `Web_App` SHALL `isCompleted`, `dueDate` veya `dueMileage` alanlarını günceller
4. WHEN `DELETE /api/dashboard/maintenance-plans/[id]` çağrıldığında, THE `Web_App` SHALL kaydı siler ve `204 No Content` döner
5. WHEN herhangi bir endpoint çağrıldığında, THE `Web_App` SHALL `tenantId` izolasyonunu uygular
6. IF `vehicleId` geçerli bir araca ait değilse, THEN THE `Web_App` SHALL `404 Not Found` yanıtı döner

---

### Gereksinim 41: Web Firma Portal Finans API Endpoint'leri

**Kullanıcı Hikayesi:** Bir geliştirici olarak, web firma portalının finans ekranlarını besleyecek yeni API endpoint'lerine ihtiyaç duyuyorum.

#### Kabul Kriterleri

1. WHEN `GET /api/mobile/firma/finans/gelir-raporu` çağrıldığında, THE `Web_App` SHALL seçilen aya ait toplam geliri ve kategoriye göre dağılımı döner
2. WHEN `GET /api/mobile/firma/finans/tahsilatlar` çağrıldığında, THE `Web_App` SHALL sayfalandırılmış `Payment` kayıtlarını (`paymentType: INCOMING`) döner
3. WHEN `POST /api/mobile/firma/finans/tahsilat` çağrıldığında, THE `Web_App` SHALL `customerId`, `amount`, `paymentMethod` alanlarını doğrular ve yeni `Payment` kaydı oluşturur
4. WHEN `GET /api/mobile/firma/finans/tahsilat/[id]` çağrıldığında, THE `Web_App` SHALL tahsilat detayını müşteri bilgileriyle birlikte döner
5. WHEN `GET /api/mobile/firma/finans/fatura/[id]` çağrıldığında, THE `Web_App` SHALL fatura detayını kalem listesiyle birlikte döner
6. WHEN herhangi bir endpoint çağrıldığında, THE `Web_App` SHALL JWT doğrulaması ve `tenantId` izolasyonu uygular

---

### Gereksinim 42: Web Firma Portal Yardımcı API Endpoint'leri

**Kullanıcı Hikayesi:** Bir geliştirici olarak, web firma portalının bildirim, mesaj, hizmet ve destek ekranlarını besleyecek API endpoint'lerine ihtiyaç duyuyorum.

#### Kabul Kriterleri

1. WHEN `GET /api/mobile/firma/bildirimler` çağrıldığında, THE `Web_App` SHALL oturumdaki kullanıcıya ait `Notification` kayıtlarını döner
2. WHEN `PATCH /api/mobile/firma/bildirimler/[id]/oku` çağrıldığında, THE `Web_App` SHALL bildirimi okundu olarak işaretler
3. WHEN `GET /api/mobile/firma/hizmetler` çağrıldığında, THE `Web_App` SHALL tenant'a ait aktif hizmet listesini döner
4. WHEN `POST /api/mobile/firma/destek` çağrıldığında, THE `Web_App` SHALL destek talebini kaydeder ve `201 Created` döner
5. WHEN `GET /api/mobile/firma/mesajlar` çağrıldığında, THE `Web_App` SHALL aktif konuşma listesini döner
6. WHEN `POST /api/mobile/firma/mesajlar` çağrıldığında, THE `Web_App` SHALL yeni mesaj kaydı oluşturur ve SSE aracılığıyla alıcıya bildirir

---

### Gereksinim 43: Web Müşteri Portal API Endpoint'leri

**Kullanıcı Hikayesi:** Bir geliştirici olarak, web müşteri portalının yeni ekranlarını besleyecek API endpoint'lerine ihtiyaç duyuyorum.

#### Kabul Kriterleri

1. WHEN `GET /api/musteri/odemeler` çağrıldığında, THE `Web_App` SHALL oturumdaki müşteriye ait `Payment` kayıtlarını sayfalandırılmış olarak döner
2. WHEN `GET /api/musteri/makbuz/[id]` çağrıldığında, THE `Web_App` SHALL ödeme makbuzu detayını döner ve müşteri sahipliğini doğrular
3. WHEN `GET /api/musteri/kartlar` çağrıldığında, THE `Web_App` SHALL müşterinin Stripe'ta kayıtlı kartlarını döner
4. WHEN `DELETE /api/musteri/kartlar/[id]` çağrıldığında, THE `Web_App` SHALL Stripe'tan kartı siler
5. WHEN `GET /api/musteri/bildirimler` çağrıldığında, THE `Web_App` SHALL müşteriye ait `Notification` kayıtlarını döner
6. WHEN herhangi bir endpoint çağrıldığında, THE `Web_App` SHALL müşteri kimliğini doğrular ve yalnızca kendi verilerine erişim izni verir


---

## Bölüm 5: Genel Teknik Gereksinimler

### Gereksinim 44: Tenant İzolasyonu ve Güvenlik

**Kullanıcı Hikayesi:** Bir geliştirici olarak, tüm yeni endpoint'lerin ve sayfa bileşenlerinin çok kiracılı izolasyon kurallarına uymasını istiyorum; böylece bir tenant'ın verisi başka bir tenant tarafından erişilemez.

#### Kabul Kriterleri

1. WHEN herhangi bir yeni API endpoint'i çağrıldığında, THE `Web_App` SHALL `auth()` fonksiyonu ile oturumu doğrular
2. WHEN oturum doğrulandığında, THE `Web_App` SHALL tüm Prisma sorgularını `tenantId: session.user.tenantId` filtresiyle kısıtlar
3. IF oturum geçersizse veya `tenantId` yoksa, THEN THE `Web_App` SHALL `401 Unauthorized` yanıtı döner
4. IF bir kayıt farklı bir `tenantId`'ye aitse, THEN THE `Web_App` SHALL `404 Not Found` yanıtı döner (bilgi sızdırmamak için)
5. WHEN yeni Server Action'lar oluşturulduğunda, THE `Web_App` SHALL `"use server"` direktifi ve Zod doğrulaması kullanır

---

### Gereksinim 45: Veri Tutarlılığı ve Senkronizasyon

**Kullanıcı Hikayesi:** Bir geliştirici olarak, mobil uygulama ve web uygulamasının aynı API endpoint'lerini kullanmasını istiyorum; böylece veri tutarsızlığı oluşmaz.

#### Kabul Kriterleri

1. THE `Web_Firma_Portal` SHALL `/api/mobile/firma/*` endpoint'lerini kullanır (mobil uygulama ile aynı endpoint'ler)
2. THE `Web_Musteri_Portal` SHALL `/api/mobile/musteri/*` endpoint'lerini kullanır (mobil uygulama ile aynı endpoint'ler)
3. WHEN bir servis emri statüsü değiştiğinde, THE `Web_App` SHALL SSE aracılığıyla ilgili web portal sayfalarını günceller
4. WHEN yeni bir `ServiceRating` kaydı oluşturulduğunda, THE `Web_App` SHALL dashboard analitik verilerini geçersiz kılar (cache invalidation)
5. WHEN yeni bir `MaintenancePlan` kaydı oluşturulduğunda, THE `Web_App` SHALL araç detay sayfasının önbelleğini geçersiz kılar

---

### Gereksinim 46: Hata Yönetimi ve Kullanıcı Deneyimi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, hata durumlarında anlamlı mesajlar görmek istiyorum; böylece ne yapacağımı bilebilirim.

#### Kabul Kriterleri

1. WHEN bir API isteği başarısız olduğunda, THE `Web_App` SHALL kullanıcıya Türkçe hata mesajı gösterir
2. WHEN bir sayfa yüklenirken veri çekiliyorsa, THE `Web_App` SHALL iskelet (skeleton) yükleme göstergesi gösterir
3. WHEN ağ bağlantısı kesildiğinde, THE `Web_App` SHALL "Bağlantı hatası, lütfen tekrar deneyin" mesajı gösterir
4. WHEN bir form gönderilirken, THE `Web_App` SHALL gönder butonunu devre dışı bırakır ve yükleme göstergesi gösterir
5. IF bir sayfa 404 hatası alırsa, THEN THE `Web_App` SHALL kullanıcıyı ilgili liste sayfasına yönlendiren bir hata sayfası gösterir

---

### Gereksinim 47: Mobil Uyumluluk ve Responsive Tasarım

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, web mobil portalının tüm yeni ekranlarının mobil cihazlarda düzgün görüntülenmesini istiyorum.

#### Kabul Kriterleri

1. THE `Web_Firma_Portal` SHALL tüm yeni ekranları 375px minimum genişlikte düzgün görüntüler
2. THE `Web_Musteri_Portal` SHALL tüm yeni ekranları 375px minimum genişlikte düzgün görüntüler
3. WHEN dokunmatik hedefler gösterildiğinde, THE `Web_App` SHALL minimum 44px yükseklik/genişlik uygular
4. WHEN listeler gösterildiğinde, THE `Web_App` SHALL kaydırma (scroll) davranışını mobil cihazlara uygun şekilde uygular
5. THE `Web_App` SHALL Tailwind CSS responsive sınıflarını (`sm:`, `md:`, `lg:`) kullanarak tüm ekran boyutlarına uyum sağlar

