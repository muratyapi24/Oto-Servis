# Gereksinimler Belgesi

## Giriş

Bu belge, MS Oto Servis SaaS platformunun **Stok & Parça Yönetimi** modülünün genişletilmiş gereksinimlerini tanımlar. Platformda `Part`, `PartCategory`, `StockMovement`, `Supplier` ve `Location` modelleri temel düzeyde mevcuttur; `/dashboard/inventory` sayfası temel liste ve metrik görünümü sunmaktadır. Bu spec, mevcut altyapı üzerine sekiz kritik eksikliği gidererek tam kapsamlı bir stok yönetim sistemi oluşturmayı hedefler.

Kapsam: Barkod/QR okuma ile hızlı stok girişi, otomatik yeniden sipariş uyarıları, periyodik stok sayım modülü, parça iade akışları, çoklu lokasyon arası transfer, gelişmiş raporlama, tedarikçi satın alma siparişi (PO) yönetimi ve mobil senkronizasyon.

## Sözlük

- **Stok_Yöneticisi**: Stok ve parça işlemlerini gerçekleştiren sistem bileşeni (Server Actions katmanı)
- **Barkod_Okuyucu**: Web kamerası veya mobil kamera aracılığıyla barkod/QR kod tarayan bileşen
- **Reorder_Motoru**: Stok seviyelerini izleyerek otomatik yeniden sipariş uyarısı üreten arka plan servisi (Inngest job)
- **Sayım_Modülü**: Periyodik envanter sayımı iş akışını yöneten sistem bileşeni
- **Transfer_Yöneticisi**: Lokasyonlar arası parça transferi taleplerini ve onay akışını yöneten bileşen
- **PO_Yöneticisi**: Tedarikçiye gönderilen satın alma siparişlerini (Purchase Order) oluşturan ve takip eden bileşen
- **Rapor_Motoru**: Stok değer, hareket geçmişi ve kritik stok raporlarını üreten bileşen
- **SSE_Kanalı**: Server-Sent Events aracılığıyla gerçek zamanlı stok güncellemelerini ileten altyapı
- **Part**: Stok kartı — `packages/database/prisma/schema.prisma` içindeki `Part` modeli
- **StockMovement**: Stok hareketi kaydı — `StockMovementType` enum değerleri: `IN`, `OUT`, `ADJUST`
- **Location**: Şube/depo lokasyonu — `Location` modeli
- **PurchaseOrder**: Tedarikçiye gönderilen satın alma siparişi (yeni model)
- **StockCount**: Periyodik sayım oturumu (yeni model)
- **StockTransfer**: Lokasyonlar arası transfer talebi (yeni model)
- **Tenant**: Çok kiracılı mimaride bir oto servis firması
- **minStockLevel**: `Part` modelindeki minimum stok eşiği alanı
- **currentStock**: `Part` modelindeki anlık stok miktarı alanı

---

## Gereksinimler

### Gereksinim 1: Barkod ve QR Kod ile Hızlı Stok Girişi

**Kullanıcı Hikayesi:** Bir depo sorumlusu olarak, web kamerası veya mobil kamera ile barkod/QR kod okuyarak parça aramak ve hızlı stok girişi yapmak istiyorum; böylece manuel arama süresini ortadan kaldırarak stok güncellemelerini saniyeler içinde tamamlayabilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı barkod tarama ekranını açtığında, THE Barkod_Okuyucu SHALL web kamerası veya `expo-camera` aracılığıyla canlı kamera akışını başlatır.
2. WHEN Barkod_Okuyucu bir barkod veya QR kod algıladığında, THE Stok_Yöneticisi SHALL algılanan kodu `Part.partNumber` alanında arar ve 500ms içinde sonucu döner.
3. WHEN taranan kod sistemde kayıtlı bir `Part` ile eşleştiğinde, THE Stok_Yöneticisi SHALL parça adı, mevcut stok miktarı ve birim fiyatı içeren parça kartını kullanıcıya gösterir.
4. WHEN taranan kod sistemde kayıtlı hiçbir `Part` ile eşleşmediğinde, THE Stok_Yöneticisi SHALL kullanıcıya "Parça bulunamadı" mesajı gösterir ve yeni parça oluşturma formunu önerir.
5. WHEN kullanıcı taranan parça için stok giriş miktarını onayladığında, THE Stok_Yöneticisi SHALL `Part.currentStock` değerini artırır ve `StockMovement` kaydını `type: IN` olarak oluşturur.
6. THE Stok_Yöneticisi SHALL aynı oturumda birden fazla parçanın sıralı taranmasına izin verir; her tarama bağımsız bir `StockMovement` kaydı oluşturur.
7. IF kamera erişimi reddedilirse veya kamera donanımı mevcut değilse, THEN THE Barkod_Okuyucu SHALL manuel barkod girişi için metin alanı sunar.
8. WHERE mobil uygulama kullanılıyorsa, THE Barkod_Okuyucu SHALL `expo-camera` ile arka kamerayı kullanır ve tarama sonucunu 1 saniye içinde işler.

---

### Gereksinim 2: Otomatik Yeniden Sipariş (Reorder Point) Uyarısı

**Kullanıcı Hikayesi:** Bir servis yöneticisi olarak, bir parçanın stok miktarı minimum seviyenin altına düştüğünde otomatik uyarı almak ve tedarikçiye sipariş önerisi görmek istiyorum; böylece stok tükenmesini önleyebilirim.

#### Kabul Kriterleri

1. WHEN herhangi bir `StockMovement` kaydı oluşturulduğunda, THE Reorder_Motoru SHALL ilgili `Part.currentStock` değerini `Part.minStockLevel` ile karşılaştırır.
2. WHEN `Part.currentStock` değeri `Part.minStockLevel` değerine eşit veya daha düşük olduğunda, THE Reorder_Motoru SHALL tenant'ın `TENANT_ADMIN` ve `ACCOUNTANT` rolündeki kullanıcılarına uygulama içi bildirim gönderir.
3. THE Reorder_Motoru SHALL aynı parça için 24 saat içinde yalnızca bir uyarı bildirimi gönderir; tekrarlayan hareketlerde bildirim çoğaltmaz.
4. WHEN kritik stok uyarısı tetiklendiğinde, THE Stok_Yöneticisi SHALL ilgili parçanın bağlı `Supplier` bilgisini içeren sipariş önerisi kartı oluşturur.
5. WHEN kullanıcı sipariş önerisi kartını onayladığında, THE PO_Yöneticisi SHALL taslak `PurchaseOrder` kaydını otomatik olarak oluşturur.
6. THE Stok_Yöneticisi SHALL `/dashboard/inventory` sayfasında kritik stok seviyesindeki parçaları ayrı bir "Kritik Stok" bölümünde listeler.
7. WHERE `Part.minStockLevel` değeri 0 olarak ayarlanmışsa, THE Reorder_Motoru SHALL o parça için yeniden sipariş uyarısı göndermez.
8. IF Inngest job çalışma sırasında hata alırsa, THEN THE Reorder_Motoru SHALL hatayı `AuditLog` tablosuna kaydeder ve işlemi yeniden dener.

---

### Gereksinim 3: Stok Sayım Modülü

**Kullanıcı Hikayesi:** Bir depo sorumlusu olarak, periyodik envanter sayımı yapabilmek, fiili miktarları sisteme girebilmek, fark raporunu görebilmek ve sayımı onaylayarak stok düzeltmesi yapabilmek istiyorum; böylece sistemdeki stok verileri gerçek fiziksel stokla uyumlu kalır.

#### Kabul Kriterleri

1. WHEN kullanıcı yeni sayım oturumu başlattığında, THE Sayım_Modülü SHALL seçilen lokasyon ve kategori filtrelerine göre aktif `Part` kayıtlarından sayım listesi oluşturur ve `StockCount` kaydını `status: DRAFT` olarak kaydeder.
2. THE Sayım_Modülü SHALL sayım listesinde her parça için parça adı, parça numarası, sistemdeki mevcut stok miktarı ve fiili miktar giriş alanını gösterir.
3. WHEN kullanıcı bir parça için fiili miktarı girdiğinde, THE Sayım_Modülü SHALL fark miktarını (fiili miktar − sistem miktarı) anlık olarak hesaplar ve gösterir.
4. WHEN kullanıcı sayımı onayladığında, THE Sayım_Modülü SHALL fark miktarı sıfırdan farklı olan her parça için `StockMovement` kaydını `type: ADJUST` olarak oluşturur.
5. WHEN sayım onaylandığında, THE Sayım_Modülü SHALL her etkilenen `Part.currentStock` değerini fiili miktara eşitler.
6. THE Sayım_Modülü SHALL onaylanan sayım için fark raporu oluşturur; rapor parça adı, önceki miktar, fiili miktar, fark ve toplam değer etkisini içerir.
7. WHILE sayım oturumu `DRAFT` durumundayken, THE Sayım_Modülü SHALL kullanıcının fiili miktarları düzenlemesine izin verir.
8. WHEN sayım `COMPLETED` durumuna geçtiğinde, THE Sayım_Modülü SHALL sayım kaydını salt okunur yapar ve değişikliğe izin vermez.
9. IF aynı lokasyon için zaten açık (`DRAFT` durumunda) bir sayım oturumu varsa, THEN THE Sayım_Modülü SHALL yeni sayım başlatma isteğini reddeder ve mevcut oturumu gösterir.
10. THE Sayım_Modülü SHALL tamamlanan sayım raporunu PDF olarak dışa aktarma imkânı sunar.

---

### Gereksinim 4: Parça İade Akışı

**Kullanıcı Hikayesi:** Bir servis teknisyeni olarak, serviste kullanılmayan parçaları depoya iade edebilmek ve tedarikçiye iade işlemini kayıt altına alabilmek istiyorum; böylece stok doğruluğu korunur ve iade süreçleri izlenebilir olur.

#### Kabul Kriterleri

1. WHEN kullanıcı servis emrinden depoya iade başlattığında, THE Stok_Yöneticisi SHALL iade edilecek parçayı, miktarı ve iade nedenini içeren form sunar.
2. WHEN servis-depo iadesi onaylandığında, THE Stok_Yöneticisi SHALL `Part.currentStock` değerini iade miktarı kadar artırır ve `StockMovement` kaydını `type: IN`, `reason: "Servis İadesi: #[serviceOrderId]"` olarak oluşturur.
3. WHEN kullanıcı tedarikçiye iade başlattığında, THE Stok_Yöneticisi SHALL iade edilecek parçayı, miktarı, tedarikçiyi ve iade nedenini içeren form sunar.
4. WHEN tedarikçiye iade onaylandığında, THE Stok_Yöneticisi SHALL `Part.currentStock` değerini iade miktarı kadar azaltır ve `StockMovement` kaydını `type: OUT`, `reason: "Tedarikçi İadesi: [supplierName]"` olarak oluşturur.
5. IF iade miktarı `Part.currentStock` değerini aşıyorsa, THEN THE Stok_Yöneticisi SHALL işlemi reddeder ve "Yetersiz stok" hata mesajı döner.
6. THE Stok_Yöneticisi SHALL tüm iade hareketlerini stok hareket geçmişinde `İade` etiketi ile ayrıca filtrelenable şekilde listeler.
7. WHEN tedarikçiye iade kaydedildiğinde, THE Stok_Yöneticisi SHALL ilgili `Supplier.balance` değerini iade tutarı kadar azaltır.

---

### Gereksinim 5: Çoklu Lokasyon Arası Parça Transferi

**Kullanıcı Hikayesi:** Bir servis yöneticisi olarak, şubeler arasında parça transfer talebi oluşturabilmek, talebi onaylayabilmek ve transferin stok hareketlerine yansımasını görmek istiyorum; böylece şubeler arası stok dengesizliklerini giderebilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı transfer talebi oluşturduğunda, THE Transfer_Yöneticisi SHALL kaynak lokasyon, hedef lokasyon, parça ve miktar bilgilerini içeren `StockTransfer` kaydını `status: PENDING` olarak oluşturur.
2. THE Transfer_Yöneticisi SHALL transfer talebini hedef lokasyonun `TENANT_ADMIN` rolündeki kullanıcılarına bildirim olarak iletir.
3. WHEN transfer talebi onaylandığında, THE Transfer_Yöneticisi SHALL kaynak lokasyondaki `Part.currentStock` değerini transfer miktarı kadar azaltır ve hedef lokasyondaki `Part.currentStock` değerini aynı miktar kadar artırır.
4. WHEN transfer tamamlandığında, THE Transfer_Yöneticisi SHALL kaynak lokasyon için `StockMovement` kaydını `type: OUT`, `reason: "Transfer Çıkışı → [hedefLokasyon]"` olarak ve hedef lokasyon için `type: IN`, `reason: "Transfer Girişi ← [kaynakLokasyon]"` olarak oluşturur.
5. IF transfer miktarı kaynak lokasyondaki `Part.currentStock` değerini aşıyorsa, THEN THE Transfer_Yöneticisi SHALL talebi reddeder ve "Kaynak depoda yetersiz stok" hata mesajı döner.
6. WHEN transfer talebi reddedildiğinde, THE Transfer_Yöneticisi SHALL `StockTransfer` kaydını `status: REJECTED` olarak günceller ve talep sahibine bildirim gönderir.
7. THE Transfer_Yöneticisi SHALL transfer sonrasında kaynak ve hedef lokasyonlardaki toplam stok miktarının değişmediğini garanti eder (kaynak azalması = hedef artışı).
8. THE Transfer_Yöneticisi SHALL tüm transfer taleplerini durum, tarih ve lokasyon filtresiyle listelenebilir şekilde saklar.

---

### Gereksinim 6: Gelişmiş Stok Raporları

**Kullanıcı Hikayesi:** Bir servis yöneticisi olarak, stok değer raporu, hareket geçmişi, en çok kullanılan parçalar ve kritik stok raporlarına erişmek istiyorum; böylece stok yönetimi kararlarını veriye dayalı olarak alabilirim.

#### Kabul Kriterleri

1. THE Rapor_Motoru SHALL stok değer raporunu üretir; rapor her parça için mevcut stok miktarı, alış fiyatı ve toplam değeri (miktar × alış fiyatı) içerir ve kategori bazında gruplandırılmış toplam değeri gösterir.
2. WHEN kullanıcı hareket geçmişi raporunu talep ettiğinde, THE Rapor_Motoru SHALL tarih aralığı, parça, lokasyon ve hareket tipi (`IN`/`OUT`/`ADJUST`) filtrelerine göre `StockMovement` kayıtlarını listeler.
3. THE Rapor_Motoru SHALL belirtilen tarih aralığında en çok `OUT` hareketi olan ilk 20 parçayı kullanım sıklığına göre sıralı listeler.
4. THE Rapor_Motoru SHALL `currentStock ≤ minStockLevel` koşulunu sağlayan tüm parçaları kritik stok raporu olarak listeler; rapor parça adı, mevcut stok, minimum stok ve bağlı tedarikçi bilgisini içerir.
5. THE Rapor_Motoru SHALL tüm raporları PDF ve CSV formatlarında dışa aktarma imkânı sunar.
6. WHEN kullanıcı stok değer raporunu talep ettiğinde, THE Rapor_Motoru SHALL raporu 3 saniye içinde üretir.
7. THE Rapor_Motoru SHALL her rapor için son güncelleme tarihini ve saatini gösterir.
8. WHERE çoklu lokasyon özelliği aktifse, THE Rapor_Motoru SHALL raporları lokasyon bazında filtreleme ve karşılaştırma imkânı sunar.

---

### Gereksinim 7: Tedarikçi Satın Alma Siparişi (PO) Yönetimi

**Kullanıcı Hikayesi:** Bir satın alma sorumlusu olarak, tedarikçiye satın alma siparişi oluşturabilmek, sipariş durumunu takip edebilmek ve teslim alım işlemiyle stoku güncelleyebilmek istiyorum; böylece tedarik sürecini uçtan uca yönetebilirim.

#### Kabul Kriterleri

1. WHEN kullanıcı yeni satın alma siparişi oluşturduğunda, THE PO_Yöneticisi SHALL tedarikçi, sipariş kalemleri (parça, miktar, birim fiyat), beklenen teslim tarihi ve notları içeren `PurchaseOrder` kaydını `status: DRAFT` olarak oluşturur.
2. WHEN kullanıcı siparişi tedarikçiye gönderdiğinde, THE PO_Yöneticisi SHALL `PurchaseOrder.status` değerini `SENT` olarak günceller ve sipariş özetini e-posta ile tedarikçiye iletir.
3. THE PO_Yöneticisi SHALL sipariş listesinde her siparişin durumunu (`DRAFT`, `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`) gösterir.
4. WHEN kullanıcı teslim alım işlemi başlattığında, THE PO_Yöneticisi SHALL sipariş kalemlerini listeler ve her kalem için teslim alınan miktarın girilmesine izin verir.
5. WHEN teslim alım onaylandığında, THE PO_Yöneticisi SHALL teslim alınan her kalem için `Part.currentStock` değerini artırır ve `StockMovement` kaydını `type: IN`, `reason: "Satın Alma Siparişi: [poNumber]"` olarak oluşturur.
6. WHEN tüm sipariş kalemleri tam olarak teslim alındığında, THE PO_Yöneticisi SHALL `PurchaseOrder.status` değerini `RECEIVED` olarak günceller.
7. WHEN sipariş kalemlerinin yalnızca bir kısmı teslim alındığında, THE PO_Yöneticisi SHALL `PurchaseOrder.status` değerini `PARTIALLY_RECEIVED` olarak günceller ve kalan miktarları gösterir.
8. IF sipariş iptal edilirse, THEN THE PO_Yöneticisi SHALL `PurchaseOrder.status` değerini `CANCELLED` olarak günceller ve stok hareketleri oluşturmaz.
9. THE PO_Yöneticisi SHALL satın alma siparişini PDF formatında dışa aktarma imkânı sunar.
10. WHEN teslim alım tamamlandığında, THE PO_Yöneticisi SHALL ilgili `Supplier.balance` değerini teslim alınan toplam tutar kadar artırır.

---

### Gereksinim 8: Mobil Uygulamada Stok Senkronizasyonu

**Kullanıcı Hikayesi:** Bir servis teknisyeni olarak, mobil uygulamada stok bilgilerinin web uygulamasındaki değişikliklerle anlık olarak senkronize olmasını istiyorum; böylece sahada doğru stok bilgisiyle çalışabilirim.

#### Kabul Kriterleri

1. WHEN web uygulamasında bir `StockMovement` kaydı oluşturulduğunda, THE SSE_Kanalı SHALL ilgili tenant'ın aktif mobil oturumlarına stok güncelleme olayını 2 saniye içinde iletir.
2. WHEN mobil uygulama stok güncelleme olayı aldığında, THE Stok_Yöneticisi SHALL etkilenen `Part.currentStock` değerini TanStack React Query önbelleğinde günceller.
3. THE Stok_Yöneticisi SHALL mobil uygulamada stok listesini son senkronizasyon zamanını göstererek sunar.
4. WHILE mobil uygulama çevrimdışıyken, THE Stok_Yöneticisi SHALL son başarılı senkronizasyondaki stok verilerini Zustand store'da önbelleğe alır ve kullanıcıya çevrimdışı modda olduğunu bildirir.
5. WHEN mobil uygulama çevrimiçi duruma geçtiğinde, THE Stok_Yöneticisi SHALL çevrimdışı sürede gerçekleşen tüm stok değişikliklerini otomatik olarak senkronize eder.
6. THE Stok_Yöneticisi SHALL mobil uygulamada barkod tarama ile stok girişi yapıldığında, işlemi web uygulamasına 3 saniye içinde yansıtır.
7. IF senkronizasyon sırasında çakışma (conflict) tespit edilirse, THEN THE Stok_Yöneticisi SHALL sunucu tarafındaki değeri esas alır ve kullanıcıya çakışma bildirimi gösterir.

---

### Gereksinim 9: Stok Hareketi Bütünlüğü ve Doğruluk Özellikleri

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, stok miktarlarının hiçbir zaman negatife düşmemesini ve her stok hareketinin `Part.currentStock` değerini doğru şekilde güncellemesini istiyorum; böylece stok verilerinin tutarlılığı ve güvenilirliği garanti altına alınır.

#### Kabul Kriterleri

1. THE Stok_Yöneticisi SHALL `type: OUT` veya `type: ADJUST` (negatif fark) içeren her `StockMovement` işleminden önce `Part.currentStock ≥ hareket miktarı` koşulunu doğrular.
2. IF `Part.currentStock` değeri hareket miktarından küçükse, THEN THE Stok_Yöneticisi SHALL işlemi reddeder, `StockMovement` kaydı oluşturmaz ve "Yetersiz stok: mevcut [X], talep edilen [Y]" hata mesajı döner.
3. WHEN herhangi bir `StockMovement` kaydı oluşturulduğunda, THE Stok_Yöneticisi SHALL `Part.currentStock` değerini atomik bir veritabanı işlemi (Prisma transaction) içinde günceller.
4. THE Stok_Yöneticisi SHALL `Part.currentStock` değerinin tüm `StockMovement` kayıtlarının kümülatif toplamıyla tutarlı olduğunu garanti eder: `currentStock = Σ(IN miktarları) − Σ(OUT miktarları) + Σ(ADJUST miktarları)`.
5. WHEN stok sayım onayı gerçekleştiğinde, THE Sayım_Modülü SHALL fark miktarını `ADJUST` hareketi olarak kaydeder; pozitif fark `+miktar`, negatif fark `−miktar` olarak işlenir.
6. WHEN lokasyonlar arası transfer tamamlandığında, THE Transfer_Yöneticisi SHALL kaynak lokasyon stok azalması ile hedef lokasyon stok artışının eşit olduğunu doğrular; toplam stok değişmez.
7. THE Stok_Yöneticisi SHALL tüm stok değiştiren işlemleri (IN, OUT, ADJUST, Transfer, İade) Prisma transaction içinde gerçekleştirir; kısmi başarı durumunda tüm işlemi geri alır (rollback).
8. IF bir transaction rollback gerçekleşirse, THEN THE Stok_Yöneticisi SHALL hatayı `AuditLog` tablosuna kaydeder ve kullanıcıya işlemin başarısız olduğunu bildirir.
