# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier_invoice_integration.test.ts >> Firma Platformu Entegrasyon Testleri >> Test 1: Giriş ve Ortam Hazırlığı
- Location: testsprite_tests\integration\supplier_invoice_integration.test.ts:31:7

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Stok Kartı Aç")')
    - locator resolved to <button class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <label class="block text-sm font-medium text-gray-700 mb-1">Açıklama / Not</label> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <label class="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <label class="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  4 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <label class="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <label class="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label> from <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e6]: precision_manufacturing
        - generic "Yıldız Oto Servis (DEMO)" [ref=e7]:
          - heading "Yıldız Oto Servis (DEMO)" [level=1] [ref=e8]
          - paragraph [ref=e9]: Oto Servis Yönetimi
      - navigation [ref=e10]:
        - link "dashboard Genel Bakış" [ref=e12] [cursor=pointer]:
          - /url: /dashboard
          - generic [ref=e13]: dashboard
          - generic [ref=e14]: Genel Bakış
        - generic [ref=e15]:
          - paragraph [ref=e16]: Servis
          - link "build Servis Emirleri" [ref=e17] [cursor=pointer]:
            - /url: /dashboard/services
            - generic [ref=e18]: build
            - generic [ref=e19]: Servis Emirleri
          - link "request_quote Teklifler" [ref=e20] [cursor=pointer]:
            - /url: /dashboard/quotes
            - generic [ref=e21]: request_quote
            - generic [ref=e22]: Teklifler
          - link "calendar_month Randevular" [ref=e23] [cursor=pointer]:
            - /url: /dashboard/appointments
            - generic [ref=e24]: calendar_month
            - generic [ref=e25]: Randevular
        - generic [ref=e26]:
          - paragraph [ref=e27]: Müşteri & Araç
          - link "people Müşteriler" [ref=e28] [cursor=pointer]:
            - /url: /dashboard/customers
            - generic [ref=e29]: people
            - generic [ref=e30]: Müşteriler
          - link "directions_car Araçlar" [ref=e31] [cursor=pointer]:
            - /url: /dashboard/vehicles
            - generic [ref=e32]: directions_car
            - generic [ref=e33]: Araçlar
          - link "handshake CRM & Bakım" [ref=e34] [cursor=pointer]:
            - /url: /dashboard/crm
            - generic [ref=e35]: handshake
            - generic [ref=e36]: CRM & Bakım
        - generic [ref=e37]:
          - paragraph [ref=e38]: Personel
          - link "group Personel" [ref=e39] [cursor=pointer]:
            - /url: /dashboard/mechanics
            - generic [ref=e40]: group
            - generic [ref=e41]: Personel
          - link "calendar_view_week Vardiya Takvimi" [ref=e42] [cursor=pointer]:
            - /url: /dashboard/staff
            - generic [ref=e43]: calendar_view_week
            - generic [ref=e44]: Vardiya Takvimi
        - generic [ref=e45]:
          - paragraph [ref=e46]: Stok & Tedarik
          - link "inventory_2 Stok & Envanter" [ref=e47] [cursor=pointer]:
            - /url: /dashboard/inventory
            - generic [ref=e48]: inventory_2
            - generic [ref=e49]: Stok & Envanter
          - link "local_shipping Tedarikçiler" [ref=e50] [cursor=pointer]:
            - /url: /dashboard/suppliers
            - generic [ref=e51]: local_shipping
            - generic [ref=e52]: Tedarikçiler
        - generic [ref=e53]:
          - paragraph [ref=e54]: Finans
          - link "payments Finans Genel" [ref=e55] [cursor=pointer]:
            - /url: /dashboard/finances
            - generic [ref=e56]: payments
            - generic [ref=e57]: Finans Genel
          - link "calculate Muhasebe" [ref=e58] [cursor=pointer]:
            - /url: /dashboard/finance/accounting
            - generic [ref=e59]: calculate
            - generic [ref=e60]: Muhasebe
          - link "receipt_long Faturalar" [ref=e61] [cursor=pointer]:
            - /url: /dashboard/finance/invoices
            - generic [ref=e62]: receipt_long
            - generic [ref=e63]: Faturalar
          - link "account_balance_wallet Ödemeler" [ref=e64] [cursor=pointer]:
            - /url: /dashboard/finance/payments
            - generic [ref=e65]: account_balance_wallet
            - generic [ref=e66]: Ödemeler
        - generic [ref=e67]:
          - paragraph [ref=e68]: Analitik
          - link "insights Analitik & Raporlar" [ref=e69] [cursor=pointer]:
            - /url: /dashboard/analytics
            - generic [ref=e70]: insights
            - generic [ref=e71]: Analitik & Raporlar
        - generic [ref=e72]:
          - paragraph [ref=e73]: Yönetim
          - link "notifications Bildirimler" [ref=e74] [cursor=pointer]:
            - /url: /dashboard/notifications
            - generic [ref=e75]: notifications
            - generic [ref=e76]: Bildirimler
          - link "location_on Lokasyonlar" [ref=e77] [cursor=pointer]:
            - /url: /dashboard/locations
            - generic [ref=e78]: location_on
            - generic [ref=e79]: Lokasyonlar
          - link "settings Ayarlar" [ref=e80] [cursor=pointer]:
            - /url: /dashboard/settings
            - generic [ref=e81]: settings
            - generic [ref=e82]: Ayarlar
      - generic [ref=e83]:
        - link "ABONELİK Paketinizi Yönetin upgrade Planı Yükselt" [ref=e84] [cursor=pointer]:
          - /url: /dashboard/settings/billing
          - paragraph [ref=e85]: ABONELİK
          - paragraph [ref=e86]: Paketinizi Yönetin
          - generic [ref=e87]:
            - generic [ref=e88]: upgrade
            - text: Planı Yükselt
        - generic [ref=e89]:
          - link "credit_card Abonelik & Fatura" [ref=e90] [cursor=pointer]:
            - /url: /dashboard/settings/billing
            - generic [ref=e91]: credit_card
            - text: Abonelik & Fatura
          - link "help Yardım Merkezi" [ref=e92] [cursor=pointer]:
            - /url: "#"
            - generic [ref=e93]: help
            - text: Yardım Merkezi
          - button "logout Çıkış Yap" [ref=e94]:
            - generic [ref=e95]: logout
            - text: Çıkış Yap
    - main [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]: search
            - textbox "Search orders, customers, license plates..." [ref=e101]
          - generic [ref=e102]:
            - link "Dashboard" [ref=e103] [cursor=pointer]:
              - /url: /dashboard
            - link "Inventory" [ref=e104] [cursor=pointer]:
              - /url: /dashboard/inventory
            - link "Customers" [ref=e105] [cursor=pointer]:
              - /url: /dashboard/customers
            - link "Reports" [ref=e106] [cursor=pointer]:
              - /url: "#"
        - generic [ref=e107]:
          - generic [ref=e108]:
            - button "notifications" [ref=e109]:
              - generic [ref=e110]: notifications
            - link "settings" [ref=e112] [cursor=pointer]:
              - /url: /dashboard/settings
              - generic [ref=e113]: settings
          - generic [ref=e114]:
            - generic [ref=e115]: DE
            - generic [ref=e116]:
              - paragraph [ref=e117]: Demo Yönetici
              - paragraph [ref=e118]: Servis Müdürü
      - generic [ref=e119]:
        - generic [ref=e121]:
          - heading "Garaj ve Depo" [level=2] [ref=e122]
          - heading "Stok & Envanter" [level=1] [ref=e123]
          - paragraph [ref=e124]: Depo stok seviyelerini, parça hareketlerini ve sipariş ihtiyaçlarını takip edin.
        - generic [ref=e125]:
          - generic [ref=e126]:
            - generic [ref=e128]:
              - img [ref=e129]
              - textbox "Ürün adı, barkod, kategori ara..." [ref=e132]
            - generic [ref=e133]:
              - button "Stok Uyarısı SMS" [ref=e134]:
                - img [ref=e135]
                - text: Stok Uyarısı SMS
              - link "Alım Geçmişi" [ref=e138] [cursor=pointer]:
                - /url: /dashboard/inventory/purchases
                - img [ref=e139]
                - text: Alım Geçmişi
              - link "Raporlar" [ref=e143] [cursor=pointer]:
                - /url: /dashboard/inventory/reports
                - img [ref=e144]
                - text: Raporlar
              - button "Barkod ile Stok Girişi" [ref=e147]:
                - img [ref=e148]
                - text: Barkod ile Stok Girişi
              - button "Yeni Kategori Ekle" [ref=e154]:
                - img [ref=e155]
                - generic [ref=e159]: Yeni Kategori Ekle
              - button "Yeni Parça Ekle" [ref=e160]:
                - img [ref=e161]
                - generic [ref=e165]: Yeni Parça Ekle
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - generic [ref=e169]:
                    - img [ref=e170]
                    - heading "Yeni Stok (Parça) Kartı" [level=2] [ref=e174]
                  - button [ref=e175]:
                    - img [ref=e176]
                - generic [ref=e179]:
                  - generic [ref=e180]:
                    - img [ref=e181]
                    - text: Bu parça veya barkod numarası sistemde zaten kayıtlı.
                  - generic [ref=e183]:
                    - generic [ref=e184]:
                      - heading "Parça Tanımı" [level=3] [ref=e185]
                      - generic [ref=e186]:
                        - generic [ref=e187]:
                          - generic [ref=e188]: Kategori *
                          - combobox [ref=e189]:
                            - option "-- Grup Seçiniz --"
                            - option "Genel Yedek Parça" [selected]
                        - generic [ref=e190]:
                          - generic [ref=e191]: Oem/Parça/Barkod No *
                          - 'textbox "Örn: 90915-YZZD2" [ref=e192]': PARCA-A-001
                        - generic [ref=e193]:
                          - generic [ref=e194]: Ürün Adı *
                          - textbox "Yağ Filtresi vb." [ref=e195]: Motor Yağı 5W30
                        - generic [ref=e196]:
                          - generic [ref=e197]: Parça Markası / Üretici
                          - textbox "Bosch, Mann vb." [ref=e198]
                        - generic [ref=e199]:
                          - generic [ref=e200]: Açıklama / Not
                          - textbox "Araç uyum bilgisi vs." [ref=e201]
                    - generic [ref=e202]:
                      - heading "Ticari Bilgiler" [level=3] [ref=e203]
                      - generic [ref=e204]:
                        - generic [ref=e205]:
                          - generic [ref=e206]: Alış Fiyatı (₺)
                          - spinbutton [ref=e207]: "150"
                        - generic [ref=e208]:
                          - generic [ref=e209]: Satış Fiyatı (₺)
                          - spinbutton [ref=e210]: "200"
                        - generic [ref=e211]:
                          - generic [ref=e212]: KDV Oranı (%)
                          - spinbutton [ref=e213]: "20"
                        - generic [ref=e214]:
                          - generic [ref=e215]: Stok Birimi
                          - combobox [ref=e216]:
                            - option "Adet" [selected]
                            - option "Litre (Lt)"
                            - option "Kutu"
                            - option "Metre (m)"
                            - option "Set/Takım"
                    - generic [ref=e217]:
                      - heading "Miktar / Depo" [level=3] [ref=e218]
                      - generic [ref=e219]:
                        - generic [ref=e220]:
                          - generic [ref=e221]: Eldeki Başlangıç Stoğu
                          - spinbutton [ref=e222]: "0"
                        - generic [ref=e223]:
                          - generic [ref=e224]: Kritik Stok Uyarı Seviyesi
                          - spinbutton [ref=e225]: "0"
                        - generic [ref=e226]:
                          - generic [ref=e227]: Depo Raf/Konum
                          - 'textbox "Örn: A-10-R3" [ref=e228]'
                        - generic [ref=e229]:
                          - generic [ref=e230]: Tedarikçi / Toptancı Adı (Opsiyonel)
                          - textbox "Toptancı firmayı yazınız" [ref=e231]
                    - generic [ref=e232]:
                      - button "İptal" [ref=e233]
                      - button "Stok Kartını Oluştur" [ref=e234]
          - generic [ref=e235]:
            - generic [ref=e236]:
              - img [ref=e238]
              - generic [ref=e242]:
                - text: Toplam Stok (Depo) Değeri
                - heading "₺24.455,00" [level=3] [ref=e243]
                - paragraph [ref=e244]: Depoda bulunan toplam 183 adet malzemenin alış fiyatı maliyeti üzerinden hesaplanmıştır.
            - generic [ref=e245]:
              - generic [ref=e246]:
                - text: Stok Çeşitliliği
                - generic [ref=e247]:
                  - generic [ref=e248]: "15"
                  - generic [ref=e249]: Farklı Ürün
              - generic [ref=e251]:
                - generic [ref=e252]: Kategori Sayısı
                - generic [ref=e253]: 1 Adet
            - generic [ref=e256]:
              - generic [ref=e257]:
                - generic [ref=e259]: Kritik Stok Uyarısı
                - generic [ref=e263]:
                  - generic [ref=e264]: "3"
                  - generic [ref=e265]: Ürün
              - button "Detayları Gör" [ref=e266]
          - generic [ref=e267]:
            - generic [ref=e268]:
              - heading "Depo Envanteri" [level=4] [ref=e270]:
                - img [ref=e271]
                - text: Depo Envanteri
              - table [ref=e275]:
                - rowgroup [ref=e276]:
                  - row "Ürün Bilgisi Kategori & Konum Stok Seviyesi Satış Fiyatı İşlem" [ref=e277]:
                    - columnheader "Ürün Bilgisi" [ref=e278]
                    - columnheader "Kategori & Konum" [ref=e279]
                    - columnheader "Stok Seviyesi" [ref=e280]
                    - columnheader "Satış Fiyatı" [ref=e281]
                    - columnheader "İşlem" [ref=e282]
                - rowgroup [ref=e283]:
                  - 'row "Motor Yağı 5W-40 (4L) MY-5W40-4L Genel Yedek Parça Raf: - 20 adet ₺504,00 + %20 KDV" [ref=e284]':
                    - cell "Motor Yağı 5W-40 (4L) MY-5W40-4L" [ref=e285]:
                      - generic [ref=e286]: Motor Yağı 5W-40 (4L)
                      - generic [ref=e288]: MY-5W40-4L
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e289]':
                      - generic [ref=e290]:
                        - img [ref=e291]
                        - text: Genel Yedek Parça
                      - generic [ref=e295]:
                        - img [ref=e296]
                        - text: "Raf: -"
                    - cell "20 adet" [ref=e300]:
                      - generic [ref=e302]: 20 adet
                    - cell "₺504,00 + %20 KDV" [ref=e303]:
                      - generic [ref=e304]: ₺504,00
                      - generic [ref=e305]: + %20 KDV
                    - cell [ref=e306]:
                      - button [ref=e308]:
                        - img [ref=e309]
                  - 'row "Yağ Filtresi YF-0001 Genel Yedek Parça Raf: - 25 adet ₺102,00 + %20 KDV" [ref=e313]':
                    - cell "Yağ Filtresi YF-0001" [ref=e314]:
                      - generic [ref=e315]: Yağ Filtresi
                      - generic [ref=e317]: YF-0001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e318]':
                      - generic [ref=e319]:
                        - img [ref=e320]
                        - text: Genel Yedek Parça
                      - generic [ref=e324]:
                        - img [ref=e325]
                        - text: "Raf: -"
                    - cell "25 adet" [ref=e329]:
                      - generic [ref=e331]: 25 adet
                    - cell "₺102,00 + %20 KDV" [ref=e332]:
                      - generic [ref=e333]: ₺102,00
                      - generic [ref=e334]: + %20 KDV
                    - cell [ref=e335]:
                      - button [ref=e337]:
                        - img [ref=e338]
                  - 'row "Hava Filtresi HF-0002 Genel Yedek Parça Raf: - 19 adet ₺132,00 + %20 KDV" [ref=e342]':
                    - cell "Hava Filtresi HF-0002" [ref=e343]:
                      - generic [ref=e344]: Hava Filtresi
                      - generic [ref=e346]: HF-0002
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e347]':
                      - generic [ref=e348]:
                        - img [ref=e349]
                        - text: Genel Yedek Parça
                      - generic [ref=e353]:
                        - img [ref=e354]
                        - text: "Raf: -"
                    - cell "19 adet" [ref=e358]:
                      - generic [ref=e360]: 19 adet
                    - cell "₺132,00 + %20 KDV" [ref=e361]:
                      - generic [ref=e362]: ₺132,00
                      - generic [ref=e363]: + %20 KDV
                    - cell [ref=e364]:
                      - button [ref=e366]:
                        - img [ref=e367]
                  - 'row "Polen Filtresi PF-0003 Genel Yedek Parça Raf: - 25 adet ₺120,00 + %20 KDV" [ref=e371]':
                    - cell "Polen Filtresi PF-0003" [ref=e372]:
                      - generic [ref=e373]: Polen Filtresi
                      - generic [ref=e375]: PF-0003
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e376]':
                      - generic [ref=e377]:
                        - img [ref=e378]
                        - text: Genel Yedek Parça
                      - generic [ref=e382]:
                        - img [ref=e383]
                        - text: "Raf: -"
                    - cell "25 adet" [ref=e387]:
                      - generic [ref=e389]: 25 adet
                    - cell "₺120,00 + %20 KDV" [ref=e390]:
                      - generic [ref=e391]: ₺120,00
                      - generic [ref=e392]: + %20 KDV
                    - cell [ref=e393]:
                      - button [ref=e395]:
                        - img [ref=e396]
                  - 'row "Ön Fren Balatası (Takım) FB-ON-001 Genel Yedek Parça Raf: - 14 adet ₺384,00 + %20 KDV" [ref=e400]':
                    - cell "Ön Fren Balatası (Takım) FB-ON-001" [ref=e401]:
                      - generic [ref=e402]: Ön Fren Balatası (Takım)
                      - generic [ref=e404]: FB-ON-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e405]':
                      - generic [ref=e406]:
                        - img [ref=e407]
                        - text: Genel Yedek Parça
                      - generic [ref=e411]:
                        - img [ref=e412]
                        - text: "Raf: -"
                    - cell "14 adet" [ref=e416]:
                      - generic [ref=e418]: 14 adet
                    - cell "₺384,00 + %20 KDV" [ref=e419]:
                      - generic [ref=e420]: ₺384,00
                      - generic [ref=e421]: + %20 KDV
                    - cell [ref=e422]:
                      - button [ref=e424]:
                        - img [ref=e425]
                  - 'row "Arka Fren Balatası FB-ARK-001 Genel Yedek Parça Raf: - 12 adet ₺324,00 + %20 KDV" [ref=e429]':
                    - cell "Arka Fren Balatası FB-ARK-001" [ref=e430]:
                      - generic [ref=e431]: Arka Fren Balatası
                      - generic [ref=e433]: FB-ARK-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e434]':
                      - generic [ref=e435]:
                        - img [ref=e436]
                        - text: Genel Yedek Parça
                      - generic [ref=e440]:
                        - img [ref=e441]
                        - text: "Raf: -"
                    - cell "12 adet" [ref=e445]:
                      - generic [ref=e447]: 12 adet
                    - cell "₺324,00 + %20 KDV" [ref=e448]:
                      - generic [ref=e449]: ₺324,00
                      - generic [ref=e450]: + %20 KDV
                    - cell [ref=e451]:
                      - button [ref=e453]:
                        - img [ref=e454]
                  - 'row "Balata Diski BD-0001 Genel Yedek Parça Raf: - 6 adet ₺456,00 + %20 KDV" [ref=e458]':
                    - cell "Balata Diski BD-0001" [ref=e459]:
                      - generic [ref=e460]: Balata Diski
                      - generic [ref=e462]: BD-0001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e463]':
                      - generic [ref=e464]:
                        - img [ref=e465]
                        - text: Genel Yedek Parça
                      - generic [ref=e469]:
                        - img [ref=e470]
                        - text: "Raf: -"
                    - cell "6 adet" [ref=e474]:
                      - generic [ref=e476]: 6 adet
                    - cell "₺456,00 + %20 KDV" [ref=e477]:
                      - generic [ref=e478]: ₺456,00
                      - generic [ref=e479]: + %20 KDV
                    - cell [ref=e480]:
                      - button [ref=e482]:
                        - img [ref=e483]
                  - 'row "Buji Takımı (4''lü) BJ-4LU-001 Genel Yedek Parça Raf: - 19 adet ₺240,00 + %20 KDV" [ref=e487]':
                    - cell "Buji Takımı (4'lü) BJ-4LU-001" [ref=e488]:
                      - generic [ref=e489]: Buji Takımı (4'lü)
                      - generic [ref=e491]: BJ-4LU-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e492]':
                      - generic [ref=e493]:
                        - img [ref=e494]
                        - text: Genel Yedek Parça
                      - generic [ref=e498]:
                        - img [ref=e499]
                        - text: "Raf: -"
                    - cell "19 adet" [ref=e503]:
                      - generic [ref=e505]: 19 adet
                    - cell "₺240,00 + %20 KDV" [ref=e506]:
                      - generic [ref=e507]: ₺240,00
                      - generic [ref=e508]: + %20 KDV
                    - cell [ref=e509]:
                      - button [ref=e511]:
                        - img [ref=e512]
                  - 'row "Triger Kayışı TK-0001 Genel Yedek Parça Raf: - 6 adet ₺660,00 + %20 KDV" [ref=e516]':
                    - cell "Triger Kayışı TK-0001" [ref=e517]:
                      - generic [ref=e518]: Triger Kayışı
                      - generic [ref=e520]: TK-0001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e521]':
                      - generic [ref=e522]:
                        - img [ref=e523]
                        - text: Genel Yedek Parça
                      - generic [ref=e527]:
                        - img [ref=e528]
                        - text: "Raf: -"
                    - cell "6 adet" [ref=e532]:
                      - generic [ref=e534]: 6 adet
                    - cell "₺660,00 + %20 KDV" [ref=e535]:
                      - generic [ref=e536]: ₺660,00
                      - generic [ref=e537]: + %20 KDV
                    - cell [ref=e538]:
                      - button [ref=e540]:
                        - img [ref=e541]
                  - 'row "Antifriz 5L AF-5L-001 Genel Yedek Parça Raf: - 19 adet ₺174,00 + %20 KDV" [ref=e545]':
                    - cell "Antifriz 5L AF-5L-001" [ref=e546]:
                      - generic [ref=e547]: Antifriz 5L
                      - generic [ref=e549]: AF-5L-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e550]':
                      - generic [ref=e551]:
                        - img [ref=e552]
                        - text: Genel Yedek Parça
                      - generic [ref=e556]:
                        - img [ref=e557]
                        - text: "Raf: -"
                    - cell "19 adet" [ref=e561]:
                      - generic [ref=e563]: 19 adet
                    - cell "₺174,00 + %20 KDV" [ref=e564]:
                      - generic [ref=e565]: ₺174,00
                      - generic [ref=e566]: + %20 KDV
                    - cell [ref=e567]:
                      - button [ref=e569]:
                        - img [ref=e570]
                  - 'row "Silecek Süpürgesi (Takım) SS-TKM-001 Genel Yedek Parça Raf: - 14 adet ₺156,00 + %20 KDV" [ref=e574]':
                    - cell "Silecek Süpürgesi (Takım) SS-TKM-001" [ref=e575]:
                      - generic [ref=e576]: Silecek Süpürgesi (Takım)
                      - generic [ref=e578]: SS-TKM-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e579]':
                      - generic [ref=e580]:
                        - img [ref=e581]
                        - text: Genel Yedek Parça
                      - generic [ref=e585]:
                        - img [ref=e586]
                        - text: "Raf: -"
                    - cell "14 adet" [ref=e590]:
                      - generic [ref=e592]: 14 adet
                    - cell "₺156,00 + %20 KDV" [ref=e593]:
                      - generic [ref=e594]: ₺156,00
                      - generic [ref=e595]: + %20 KDV
                    - cell [ref=e596]:
                      - button [ref=e598]:
                        - img [ref=e599]
                  - 'row "Akü 60Ah AKU-60AH Genel Yedek Parça Raf: - 4 adet ₺1.140,00 + %20 KDV" [ref=e603]':
                    - cell "Akü 60Ah AKU-60AH" [ref=e604]:
                      - generic [ref=e605]: Akü 60Ah
                      - generic [ref=e607]: AKU-60AH
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e608]':
                      - generic [ref=e609]:
                        - img [ref=e610]
                        - text: Genel Yedek Parça
                      - generic [ref=e614]:
                        - img [ref=e615]
                        - text: "Raf: -"
                    - cell "4 adet" [ref=e619]:
                      - generic [ref=e621]: 4 adet
                    - cell "₺1.140,00 + %20 KDV" [ref=e622]:
                      - generic [ref=e623]: ₺1.140,00
                      - generic [ref=e624]: + %20 KDV
                    - cell [ref=e625]:
                      - button [ref=e627]:
                        - img [ref=e628]
                  - 'row "Motor Yağı 5W30 PARCA-A-001 Genel Yedek Parça Raf: - 0 adet ₺240,00 + %20 KDV" [ref=e632]':
                    - cell "Motor Yağı 5W30 PARCA-A-001" [ref=e633]:
                      - generic [ref=e634]: Motor Yağı 5W30
                      - generic [ref=e636]: PARCA-A-001
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e637]':
                      - generic [ref=e638]:
                        - img [ref=e639]
                        - text: Genel Yedek Parça
                      - generic [ref=e643]:
                        - img [ref=e644]
                        - text: "Raf: -"
                    - cell "0 adet" [ref=e648]:
                      - generic [ref=e649]:
                        - generic [ref=e650]: 0 adet
                        - img [ref=e651]
                    - cell "₺240,00 + %20 KDV" [ref=e653]:
                      - generic [ref=e654]: ₺240,00
                      - generic [ref=e655]: + %20 KDV
                    - cell [ref=e656]:
                      - button [ref=e658]:
                        - img [ref=e659]
                  - 'row "Fren Balatası PARCA-B-002 Genel Yedek Parça Raf: - 0 adet ₺144,00 + %20 KDV" [ref=e663]':
                    - cell "Fren Balatası PARCA-B-002" [ref=e664]:
                      - generic [ref=e665]: Fren Balatası
                      - generic [ref=e667]: PARCA-B-002
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e668]':
                      - generic [ref=e669]:
                        - img [ref=e670]
                        - text: Genel Yedek Parça
                      - generic [ref=e674]:
                        - img [ref=e675]
                        - text: "Raf: -"
                    - cell "0 adet" [ref=e679]:
                      - generic [ref=e680]:
                        - generic [ref=e681]: 0 adet
                        - img [ref=e682]
                    - cell "₺144,00 + %20 KDV" [ref=e684]:
                      - generic [ref=e685]: ₺144,00
                      - generic [ref=e686]: + %20 KDV
                    - cell [ref=e687]:
                      - button [ref=e689]:
                        - img [ref=e690]
                  - 'row "Hava Filtresi PARCA-C-003 Genel Yedek Parça Raf: - 0 adet ₺96,00 + %20 KDV" [ref=e694]':
                    - cell "Hava Filtresi PARCA-C-003" [ref=e695]:
                      - generic [ref=e696]: Hava Filtresi
                      - generic [ref=e698]: PARCA-C-003
                    - 'cell "Genel Yedek Parça Raf: -" [ref=e699]':
                      - generic [ref=e700]:
                        - img [ref=e701]
                        - text: Genel Yedek Parça
                      - generic [ref=e705]:
                        - img [ref=e706]
                        - text: "Raf: -"
                    - cell "0 adet" [ref=e710]:
                      - generic [ref=e711]:
                        - generic [ref=e712]: 0 adet
                        - img [ref=e713]
                    - cell "₺96,00 + %20 KDV" [ref=e715]:
                      - generic [ref=e716]: ₺96,00
                      - generic [ref=e717]: + %20 KDV
                    - cell [ref=e718]:
                      - button [ref=e720]:
                        - img [ref=e721]
            - generic [ref=e725]:
              - generic [ref=e726]:
                - heading "Sipariş Verilmesi Gerekenler" [level=4] [ref=e728]:
                  - img [ref=e729]
                  - text: Sipariş Verilmesi Gerekenler
                - paragraph [ref=e731]: Kritik Stok Seviyesi Altındakiler
                - generic [ref=e732]:
                  - generic [ref=e733]:
                    - generic [ref=e734]:
                      - paragraph [ref=e735]: Motor Yağı 5W30
                      - paragraph [ref=e736]: "MİN: 0 adet / VAR: 0"
                    - button "SİPARİŞ" [ref=e737]
                  - generic [ref=e738]:
                    - generic [ref=e739]:
                      - paragraph [ref=e740]: Fren Balatası
                      - paragraph [ref=e741]: "MİN: 0 adet / VAR: 0"
                    - button "SİPARİŞ" [ref=e742]
                  - generic [ref=e743]:
                    - generic [ref=e744]:
                      - paragraph [ref=e745]: Hava Filtresi
                      - paragraph [ref=e746]: "MİN: 0 adet / VAR: 0"
                    - button "SİPARİŞ" [ref=e747]
              - generic [ref=e748]:
                - heading "Son Stok Hareketleri" [level=5] [ref=e749]:
                  - img [ref=e750]
                  - text: Son Stok Hareketleri
                - generic [ref=e754]:
                  - generic [ref=e755]:
                    - generic [ref=e756]: "--1"
                    - generic [ref=e757]:
                      - paragraph [ref=e758]: Silecek Süpürgesi (Takım)
                      - paragraph [ref=e759]: "Servis #23 — Silecek Süpürgesi (Takım) • 5 dakika önce"
                    - generic [ref=e760]: ÇIKIŞ
                  - generic [ref=e761]:
                    - generic [ref=e762]: "--2"
                    - generic [ref=e763]:
                      - paragraph [ref=e764]: Balata Diski
                      - paragraph [ref=e765]: "Servis #23 — Balata Diski • 5 dakika önce"
                    - generic [ref=e766]: ÇIKIŞ
                  - generic [ref=e767]:
                    - generic [ref=e768]: "--3"
                    - generic [ref=e769]:
                      - paragraph [ref=e770]: Yağ Filtresi
                      - paragraph [ref=e771]: "Servis #22 — Yağ Filtresi • 5 dakika önce"
                    - generic [ref=e772]: ÇIKIŞ
                  - generic [ref=e773]:
                    - generic [ref=e774]: "--3"
                    - generic [ref=e775]:
                      - paragraph [ref=e776]: Motor Yağı 5W-40 (4L)
                      - paragraph [ref=e777]: "Servis #22 — Motor Yağı 5W-40 (4L) • 5 dakika önce"
                    - generic [ref=e778]: ÇIKIŞ
                  - generic [ref=e779]:
                    - generic [ref=e780]: "--1"
                    - generic [ref=e781]:
                      - paragraph [ref=e782]: Akü 60Ah
                      - paragraph [ref=e783]: "Servis #19 — Akü 60Ah • 5 dakika önce"
                    - generic [ref=e784]: ÇIKIŞ
                - button "Tüm Hareketleri Gör" [ref=e785]
        - generic [ref=e787]:
          - generic [ref=e788]:
            - heading "Stok Hareketleri" [level=4] [ref=e789]:
              - img [ref=e790]
              - text: Stok Hareketleri
            - generic [ref=e794]:
              - button "Sadece İadeler" [ref=e795]:
                - img [ref=e796]
                - text: Sadece İadeler
              - generic [ref=e799]:
                - generic [ref=e800]:
                  - img [ref=e801]
                  - textbox "Parça adı ara..." [ref=e804]
                - textbox [ref=e805]
                - textbox [ref=e806]
                - button "Filtrele" [ref=e807]
          - table [ref=e809]:
            - rowgroup [ref=e810]:
              - row "Parça Tip Miktar Açıklama Tarih" [ref=e811]:
                - columnheader "Parça" [ref=e812]
                - columnheader "Tip" [ref=e813]
                - columnheader "Miktar" [ref=e814]
                - columnheader "Açıklama" [ref=e815]
                - columnheader "Tarih" [ref=e816]
            - rowgroup [ref=e817]:
              - 'row "Silecek Süpürgesi (Takım) ÇIKIŞ --1 Servis #23 — Silecek Süpürgesi (Takım) 05 May 2026 18:32" [ref=e818]':
                - cell "Silecek Süpürgesi (Takım)" [ref=e819]
                - cell "ÇIKIŞ" [ref=e820]:
                  - generic [ref=e822]: ÇIKIŞ
                - cell "--1" [ref=e823]
                - 'cell "Servis #23 — Silecek Süpürgesi (Takım)" [ref=e824]'
                - cell "05 May 2026 18:32" [ref=e825]
              - 'row "Balata Diski ÇIKIŞ --2 Servis #23 — Balata Diski 05 May 2026 18:32" [ref=e826]':
                - cell "Balata Diski" [ref=e827]
                - cell "ÇIKIŞ" [ref=e828]:
                  - generic [ref=e830]: ÇIKIŞ
                - cell "--2" [ref=e831]
                - 'cell "Servis #23 — Balata Diski" [ref=e832]'
                - cell "05 May 2026 18:32" [ref=e833]
              - 'row "Yağ Filtresi ÇIKIŞ --3 Servis #22 — Yağ Filtresi 05 May 2026 18:32" [ref=e834]':
                - cell "Yağ Filtresi" [ref=e835]
                - cell "ÇIKIŞ" [ref=e836]:
                  - generic [ref=e838]: ÇIKIŞ
                - cell "--3" [ref=e839]
                - 'cell "Servis #22 — Yağ Filtresi" [ref=e840]'
                - cell "05 May 2026 18:32" [ref=e841]
              - 'row "Motor Yağı 5W-40 (4L) ÇIKIŞ --3 Servis #22 — Motor Yağı 5W-40 (4L) 05 May 2026 18:32" [ref=e842]':
                - cell "Motor Yağı 5W-40 (4L)" [ref=e843]
                - cell "ÇIKIŞ" [ref=e844]:
                  - generic [ref=e846]: ÇIKIŞ
                - cell "--3" [ref=e847]
                - 'cell "Servis #22 — Motor Yağı 5W-40 (4L)" [ref=e848]'
                - cell "05 May 2026 18:32" [ref=e849]
              - 'row "Akü 60Ah ÇIKIŞ --1 Servis #19 — Akü 60Ah 05 May 2026 18:32" [ref=e850]':
                - cell "Akü 60Ah" [ref=e851]
                - cell "ÇIKIŞ" [ref=e852]:
                  - generic [ref=e854]: ÇIKIŞ
                - cell "--1" [ref=e855]
                - 'cell "Servis #19 — Akü 60Ah" [ref=e856]'
                - cell "05 May 2026 18:32" [ref=e857]
              - 'row "Buji Takımı (4''lü) ÇIKIŞ --1 Servis #18 — Buji Takımı (4''lü) 05 May 2026 18:32" [ref=e858]':
                - cell "Buji Takımı (4'lü)" [ref=e859]
                - cell "ÇIKIŞ" [ref=e860]:
                  - generic [ref=e862]: ÇIKIŞ
                - cell "--1" [ref=e863]
                - 'cell "Servis #18 — Buji Takımı (4''lü)" [ref=e864]'
                - cell "05 May 2026 18:32" [ref=e865]
              - 'row "Hava Filtresi ÇIKIŞ --1 Servis #18 — Hava Filtresi 05 May 2026 18:32" [ref=e866]':
                - cell "Hava Filtresi" [ref=e867]
                - cell "ÇIKIŞ" [ref=e868]:
                  - generic [ref=e870]: ÇIKIŞ
                - cell "--1" [ref=e871]
                - 'cell "Servis #18 — Hava Filtresi" [ref=e872]'
                - cell "05 May 2026 18:32" [ref=e873]
              - 'row "Yağ Filtresi ÇIKIŞ --1 Servis #18 — Yağ Filtresi 05 May 2026 18:32" [ref=e874]':
                - cell "Yağ Filtresi" [ref=e875]
                - cell "ÇIKIŞ" [ref=e876]:
                  - generic [ref=e878]: ÇIKIŞ
                - cell "--1" [ref=e879]
                - 'cell "Servis #18 — Yağ Filtresi" [ref=e880]'
                - cell "05 May 2026 18:32" [ref=e881]
              - 'row "Motor Yağı 5W-40 (4L) ÇIKIŞ --1 Servis #18 — Motor Yağı 5W-40 (4L) 05 May 2026 18:32" [ref=e882]':
                - cell "Motor Yağı 5W-40 (4L)" [ref=e883]
                - cell "ÇIKIŞ" [ref=e884]:
                  - generic [ref=e886]: ÇIKIŞ
                - cell "--1" [ref=e887]
                - 'cell "Servis #18 — Motor Yağı 5W-40 (4L)" [ref=e888]'
                - cell "05 May 2026 18:32" [ref=e889]
              - 'row "Antifriz 5L ÇIKIŞ --1 Servis #17 — Antifriz 5L 05 May 2026 18:32" [ref=e890]':
                - cell "Antifriz 5L" [ref=e891]
                - cell "ÇIKIŞ" [ref=e892]:
                  - generic [ref=e894]: ÇIKIŞ
                - cell "--1" [ref=e895]
                - 'cell "Servis #17 — Antifriz 5L" [ref=e896]'
                - cell "05 May 2026 18:32" [ref=e897]
              - 'row "Ön Fren Balatası (Takım) ÇIKIŞ --1 Servis #16 — Ön Fren Balatası (Takım) 05 May 2026 18:32" [ref=e898]':
                - cell "Ön Fren Balatası (Takım)" [ref=e899]
                - cell "ÇIKIŞ" [ref=e900]:
                  - generic [ref=e902]: ÇIKIŞ
                - cell "--1" [ref=e903]
                - 'cell "Servis #16 — Ön Fren Balatası (Takım)" [ref=e904]'
                - cell "05 May 2026 18:32" [ref=e905]
              - 'row "Yağ Filtresi ÇIKIŞ --1 Servis #15 — Yağ Filtresi 05 May 2026 18:32" [ref=e906]':
                - cell "Yağ Filtresi" [ref=e907]
                - cell "ÇIKIŞ" [ref=e908]:
                  - generic [ref=e910]: ÇIKIŞ
                - cell "--1" [ref=e911]
                - 'cell "Servis #15 — Yağ Filtresi" [ref=e912]'
                - cell "05 May 2026 18:32" [ref=e913]
              - 'row "Motor Yağı 5W-40 (4L) ÇIKIŞ --1 Servis #15 — Motor Yağı 5W-40 (4L) 05 May 2026 18:32" [ref=e914]':
                - cell "Motor Yağı 5W-40 (4L)" [ref=e915]
                - cell "ÇIKIŞ" [ref=e916]:
                  - generic [ref=e918]: ÇIKIŞ
                - cell "--1" [ref=e919]
                - 'cell "Servis #15 — Motor Yağı 5W-40 (4L)" [ref=e920]'
                - cell "05 May 2026 18:32" [ref=e921]
      - generic [ref=e923]:
        - generic [ref=e924]:
          - paragraph [ref=e925]: MS OTO SERVİS
          - paragraph [ref=e926]: © 2026 MS OTO SERVİS. All rights reserved.
        - generic [ref=e927]:
          - link "Privacy Policy" [ref=e928] [cursor=pointer]:
            - /url: "#"
          - link "Terms of Service" [ref=e929] [cursor=pointer]:
            - /url: "#"
          - link "Contact Support" [ref=e930] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e931]
  - button "Open Next.js Dev Tools" [ref=e937] [cursor=pointer]:
    - img [ref=e938]
```

# Test source

```ts
  1   | import { Page, expect } from '@playwright/test';
  2   | import * as testData from '../test_data/integration_test_data.json';
  3   | 
  4   | export class LoginPage {
  5   |   constructor(private page: Page) {}
  6   | 
  7   |   async goto() {
  8   |     await this.page.goto(`${testData.test_environment.base_url}/login`);
  9   |     await this.page.waitForLoadState('networkidle');
  10  |   }
  11  | 
  12  |   async login(email: string, password: string) {
  13  |     await this.page.fill('#email', email);
  14  |     await this.page.fill('#password', password);
  15  |     await this.page.click('button[type="submit"]');
  16  |   }
  17  | 
  18  |   async verifyLoginSuccess() {
  19  |     await this.page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
  20  |     await expect(this.page).toHaveURL(/.*dashboard.*/);
  21  |   }
  22  | }
  23  | 
  24  | export class SupplierPage {
  25  |   constructor(private page: Page) {}
  26  | 
  27  |   async goto() {
  28  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/suppliers`);
  29  |     await this.page.waitForLoadState('networkidle');
  30  |   }
  31  | 
  32  |   async createSupplier(supplierData: any) {
  33  |     await this.page.click('button:has-text("Yeni Tedarikçi Ekle")');
  34  |     await this.page.fill('input[name="name"]', supplierData.name);
  35  |     await this.page.fill('input[name="contactPerson"]', supplierData.contactPerson);
  36  |     await this.page.fill('input[name="email"]', supplierData.email);
  37  |     await this.page.fill('input[name="phone"]', supplierData.phone);
  38  |     await this.page.click('button:has-text("Kaydet"), button:has-text("Tanımla")');
  39  |     await this.page.waitForLoadState('networkidle');
  40  |   }
  41  | 
  42  |   async verifySupplierCreated(supplierName: string) {
  43  |     await expect(this.page.locator(`text=${supplierName}`).first()).toBeVisible();
  44  |   }
  45  | }
  46  | 
  47  | export class StockPage {
  48  |   constructor(private page: Page) {}
  49  | 
  50  |   async goto() {
  51  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory`);
  52  |     await this.page.waitForLoadState('networkidle');
  53  |   }
  54  | 
  55  |   async createPart(partData: any) {
> 56  |     await this.page.click('button:has-text("Stok Kartı Aç")');
      |                     ^ TimeoutError: page.click: Timeout 10000ms exceeded.
  57  |     
  58  |     // Kategori seçimi
  59  |     const categorySelect = this.page.locator('select[name="categoryId"]');
  60  |     if (await categorySelect.isVisible()) {
  61  |       await categorySelect.selectOption({ index: 1 });
  62  |     }
  63  |     
  64  |     await this.page.fill('input[name="partNumber"]', partData.partNumber);
  65  |     await this.page.fill('input[name="name"]', partData.name);
  66  |     await this.page.fill('input[name="purchasePrice"]', partData.purchasePrice.toString());
  67  |     await this.page.fill('input[name="sellingPrice"]', partData.sellingPrice.toString());
  68  |     
  69  |     await this.page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
  70  |     await this.page.waitForLoadState('networkidle');
  71  |   }
  72  | 
  73  |   async verifyPartCreated(partNumber: string) {
  74  |     await expect(this.page.locator(`text=${partNumber}`).first()).toBeVisible();
  75  |   }
  76  | }
  77  | 
  78  | export class InvoicePage {
  79  |   constructor(private page: Page) {}
  80  | 
  81  |   async goto() {
  82  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory/purchases`);
  83  |     await this.page.waitForLoadState('networkidle');
  84  |   }
  85  | 
  86  |   async createPurchaseInvoice(invoiceData: any) {
  87  |     await this.page.click('button:has-text("Stok Alımı Yap")');
  88  |     
  89  |     // Tedarikçi seçimi
  90  |     await this.page.selectOption('select', { label: invoiceData.supplierName });
  91  |     
  92  |     // Kalemleri ekle
  93  |     for (let i = 0; i < invoiceData.items.length; i++) {
  94  |       if (i > 0) await this.page.click('button:has-text("Ekle")');
  95  |       const item = invoiceData.items[i];
  96  |       
  97  |       // nth index ile select ve inputları hedefle
  98  |       await this.page.locator('select').nth(i + 1).selectOption({ label: item.partName });
  99  |       await this.page.locator('input[type="number"]').nth(i * 2).fill(item.quantity.toString());
  100 |     }
  101 |     
  102 |     await this.page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
  103 |     await this.page.waitForLoadState('networkidle');
  104 |   }
  105 | 
  106 |   async verifyInvoiceCreated() {
  107 |     await expect(this.page.locator('text=Başarıyla oluşturuldu, text=İşlem başarılı').first()).toBeVisible();
  108 |   }
  109 | }
  110 | 
  111 | export class PaymentPage {
  112 |   constructor(private page: Page) {}
  113 | 
  114 |   async goto() {
  115 |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/finance/payments/new`);
  116 |     await this.page.waitForLoadState('networkidle');
  117 |   }
  118 | 
  119 |   async makePartialPayment(supplierName: string, amount: number, notes: string) {
  120 |     // Tedarikçi seçimi
  121 |     await this.page.selectOption('select[name="supplierId"]', { label: supplierName });
  122 |     
  123 |     await this.page.fill('input[name="amount"]', amount.toString());
  124 |     await this.page.fill('textarea[name="notes"]', notes);
  125 |     await this.page.click('button:has-text("Kaydet"), button:has-text("Ödeme Yap")');
  126 |   }
  127 | }
  128 | 
  129 | export class StockMovementPage {
  130 |   constructor(private page: Page) {}
  131 | 
  132 |   async goto() {
  133 |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory/movements`);
  134 |     await this.page.waitForLoadState('networkidle');
  135 |   }
  136 | }
```