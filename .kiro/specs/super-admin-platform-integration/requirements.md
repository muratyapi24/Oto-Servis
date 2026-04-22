# Gereksinimler Belgesi

## Giriş

Bu belge, MS Oto Servis SaaS platformunun Super Admin yönetim panelini (`BST Command Center`) kapsamlı biçimde genişletmek için gereksinimleri tanımlar. `stitch_super_admin_platform/` klasöründe bulunan 60+ HTML tasarım dosyası, mevcut Next.js 15 App Router projesine entegre edilecektir.

Entegrasyon iki fazda gerçekleştirilecektir:
- **Faz 1**: Mevcut 12 sayfanın HTML tasarımlarıyla birebir güncellenmesi
- **Faz 2**: 28 yeni modülün projeye eklenmesi

Sonuç olarak super admin paneli; tenant yönetimi, abonelik ve finans, teknik altyapı, analitik, operasyon, geliştirici araçları ve sistem diagnostics olmak üzere 8 ana gruptan oluşan 40 sayfayı kapsayacaktır.

## Sözlük

- **Super_Admin_Panel**: `apps/web/app/(super-admin)/super-admin/` altındaki tüm yönetim sayfaları
- **Sidebar**: `apps/web/components/super-admin/Sidebar.tsx` — sol navigasyon bileşeni
- **SuperAdminFooter**: `apps/web/components/super-admin/Footer.tsx` — tüm sayfalarda kullanılan alt bilgi bileşeni
- **Server_Action**: `apps/web/lib/actions/superadmin.actions.ts` içindeki `"use server"` direktifli fonksiyonlar
- **Tenant**: Platforma kayıtlı oto servis firması (çok kiracılı mimari birimi)
- **HTML_Tasarim**: `stitch_super_admin_platform/` klasöründeki referans tasarım dosyaları
- **TSX_Bileseni**: HTML tasarımından dönüştürülmüş Next.js TypeScript React bileşeni
- **Material_Symbols**: Google Material Symbols Outlined ikon seti
- **MD3_Token**: Material Design 3 renk token sistemi (primary, secondary, tertiary, surface, outline vb.)
- **Server_Component**: Veri çekme işlemlerini sunucu tarafında yapan Next.js bileşeni
- **Client_Component**: `"use client"` direktifli, tarayıcı etkileşimi gerektiren bileşen
- **Tab_Navigation**: Sayfa içi sekme navigasyonu (URL query param ile yönetilen)
- **Dense_Table**: `dense-table` CSS sınıfıyla stillendirilmiş kompakt veri tablosu
- **Data_Widget**: `data-widget` CSS sınıfıyla stillendirilmiş metrik kartı
- **Collapsible_Sidebar**: Grup başlıklarına tıklanarak açılıp kapanabilen sidebar navigasyonu
- **Prisma**: `@repo/database` paketindeki ORM istemcisi
- **AuditLog**: Tüm kritik işlemlerin kaydedildiği denetim log tablosu
- **MRR**: Monthly Recurring Revenue — aylık yinelenen gelir
- **Churn**: Abonelik iptal oranı
- **NPS**: Net Promoter Score — müşteri memnuniyet skoru
- **KMS**: Key Management Service — şifreleme anahtarı yönetim servisi
- **RBAC**: Role-Based Access Control — rol tabanlı erişim kontrolü


## Gereksinimler

---

### Gereksinim 1: Tasarım Sistemi Uyumu ve Temel Bileşen Altyapısı

**Kullanıcı Hikayesi:** Bir super admin olarak, tüm panel sayfalarının tutarlı bir görsel dil kullanmasını istiyorum; böylece farklı modüller arasında geçiş yaparken arayüz bütünlüğü bozulmaz.

#### Kabul Kriterleri

1. THE Super_Admin_Panel SHALL HTML_Tasarim dosyalarındaki MD3_Token renk sistemini (primary, secondary, tertiary, surface, outline, error ve varyantları) Tailwind CSS 4 utility sınıfları olarak kullanmaya devam etmeli.
2. THE Super_Admin_Panel SHALL Material_Symbols Outlined ikon setini tüm sayfalarda tutarlı biçimde kullanmalı.
3. THE Super_Admin_Panel SHALL `data-widget`, `dense-table`, `chart-container`, `bar`, `sparkline` gibi mevcut global CSS sınıflarını koruyarak yeni sayfalarda da kullanmalı.
4. WHEN bir sayfa render edildiğinde, THE Super_Admin_Panel SHALL tutarlı header (h-12, sticky, z-40) + tab navigation + içerik alanı + SuperAdminFooter yapısını korumalı.
5. THE Super_Admin_Panel SHALL tüm sayfalarda SuperAdminFooter bileşenini en altta göstermeli.
6. THE Super_Admin_Panel SHALL responsive tasarım ilkelerine uygun olarak mobil (≥320px), tablet (≥768px) ve masaüstü (≥1024px) ekran boyutlarında kullanılabilir olmalı.
7. WHEN bir bileşen yalnızca veri görüntülüyorsa, THE Super_Admin_Panel SHALL Server_Component olarak implement etmeli.
8. WHEN bir bileşen kullanıcı etkileşimi (tıklama, form, modal) gerektiriyorsa, THE Super_Admin_Panel SHALL Client_Component olarak implement etmeli.


---

### Gereksinim 2: Collapsible Sidebar Navigasyonu

**Kullanıcı Hikayesi:** Bir super admin olarak, 40 sayfayı kapsayan navigasyonu gruplandırılmış ve daraltılabilir bir sidebar üzerinden yönetmek istiyorum; böylece ilgili olmayan grupları kapatarak çalışma alanımı düzenleyebilirim.

#### Kabul Kriterleri

1. THE Sidebar SHALL navigasyon öğelerini aşağıdaki 8 grup altında organize etmeli:
   - **Ana Yönetim**: Sistem Sağlığı, Komuta Merkezi, Stratejik İçgörüler, SaaS Genel Bakış
   - **Tenant & Kullanıcı**: Firmalar, Kullanıcı Dizini, Yetki & Rol Yönetimi, Tenant Performans
   - **Abonelik & Finans**: Abonelikler, Paketler, Ödemeler, Ödeme Operasyonları, İndirim & Kuponlar, Ek Hizmetler
   - **Teknik Altyapı**: Güvenlik Tehdit İzleme, Veritabanı Sağlığı, Yedekleme & Kurtarma, Bulut Maliyet, Kapasite Planlama, Altyapı Haritası, Dağıtım & Güncelleme
   - **Analitik & Raporlama**: Analitik, Raporlar, Özel Rapor, Dinamik Rapor Sihirbazı
   - **Operasyon**: Destek Kuyruğu, NPS Paneli, Bildirimler, Otomasyon İş Akışı
   - **Geliştirici & Güvenlik**: API Entegrasyonlar, Geliştirici Portal, KMS, Denetim Kasası
   - **Sistem Diagnostics**: Loglar, Ayarlar, Arşiv & Veri Temizleme, Mobil Uygulama Yönetimi
2. WHEN bir grup başlığına tıklandığında, THE Sidebar SHALL o grubun navigasyon öğelerini göstermeli veya gizlemeli (toggle).
3. WHEN aktif sayfa bir gruba aitse, THE Sidebar SHALL o grubu otomatik olarak açık göstermeli.
4. THE Sidebar SHALL aktif sayfayı `border-l-2 border-primary bg-primary/20 text-white` stilleriyle vurgulamalı.
5. THE Sidebar SHALL grup başlıklarını `text-[9px] font-bold uppercase tracking-widest text-outline` stiliyle göstermeli.
6. THE Sidebar SHALL daraltma/genişletme durumunu `localStorage`'da saklamalı; böylece sayfa yenilemesinde durum korunmalı.
7. THE Sidebar SHALL `w-64` genişliğini ve `bg-inverse-surface` arka plan rengini korumalı.
8. WHEN sidebar öğe sayısı görünür alanı aşarsa, THE Sidebar SHALL `overflow-y-auto` ile kaydırılabilir olmalı.


---

### Gereksinim 3: Faz 1 — Mevcut Sayfaların HTML Tasarımlarıyla Güncellenmesi

**Kullanıcı Hikayesi:** Bir super admin olarak, mevcut 12 sayfanın HTML tasarım dosyalarındaki güncel arayüzle birebir eşleşmesini istiyorum; böylece tasarım ile uygulama arasındaki tutarsızlıklar giderilir.

#### Kabul Kriterleri

1. WHEN `/super-admin` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `bst_command_center_dashboards_phase_1/code.html` tasarımıyla birebir eşleşen Sistem Sağlığı / Genel Bakış görünümünü sunmalı.
2. WHEN `/super-admin/tenants` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `firma_y_netimi_bst_command_center/code.html` tasarımıyla birebir eşleşen Firma Yönetimi görünümünü sunmalı.
3. WHEN `/super-admin/analytics` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `analitik_motoru_bst_command_center/code.html` tasarımıyla birebir eşleşen Analitik Motoru görünümünü sunmalı.
4. WHEN `/super-admin/logs` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `i_lem_g_nl_kleri_bst_command_center_1/code.html` ve `i_lem_g_nl_kleri_bst_command_center_2/code.html` tasarımlarını birleştiren İşlem Günlükleri görünümünü sunmalı.
5. WHEN `/super-admin/subscriptions` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `abonelik_y_netimi_bst_command_center/code.html` ve `abonelik_y_netim_merkezi_bst_command_center/code.html` tasarımlarını kapsayan Abonelik Yönetimi görünümünü sunmalı.
6. WHEN `/super-admin/payment-operations` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `deme_operasyonlar_bst_command_center/code.html` tasarımıyla birebir eşleşen Ödeme Operasyonları görünümünü sunmalı.
7. WHEN `/super-admin/payments` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `fatura_ve_yinelenen_demeler_bst_command_center/code.html` tasarımıyla birebir eşleşen Fatura ve Yinelenen Ödemeler görünümünü sunmalı.
8. WHEN `/super-admin/settings` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `sistem_ayarlar_bst_command_center/code.html` tasarımıyla birebir eşleşen Sistem Ayarları görünümünü sunmalı.
9. WHEN `/super-admin/notifications` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `bildirimler_bst_command_center/code.html` tasarımıyla birebir eşleşen Bildirimler görünümünü sunmalı.
10. WHEN `/super-admin/command-center` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `komuta_merkezi_bst_command_center/code.html` tasarımıyla birebir eşleşen Komuta Merkezi görünümünü sunmalı.
11. WHEN `/super-admin/strategic-insights` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `stratejik_i_g_r_ler_bst_command_center/code.html` tasarımıyla birebir eşleşen Stratejik İçgörüler görünümünü sunmalı.
12. WHEN `/super-admin/tenant-performance` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `tenant_performans_matrisi_bst_command_center/code.html` tasarımıyla birebir eşleşen Tenant Performans Matrisi görünümünü sunmalı.


---

### Gereksinim 4: Faz 2 — Güvenlik ve Altyapı Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, platformun güvenlik durumunu, veritabanı sağlığını, yedekleme süreçlerini ve altyapı haritasını tek bir panelden izlemek istiyorum; böylece teknik sorunlara proaktif müdahale edebilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/security` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `g_venlik_tehdit_i_zleme_bst_command_center/code.html` tasarımına uygun Güvenlik Tehdit İzleme görünümünü sunmalı.
2. WHEN `/super-admin/database-health` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `veritaban_sa_l_k_monit_r_bst_command_center/code.html` tasarımına uygun Veritabanı Sağlık Monitörü görünümünü sunmalı.
3. WHEN `/super-admin/backup-recovery` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `yedekleme_ve_kurtarma_bst_command_center/code.html` tasarımına uygun Yedekleme ve Kurtarma görünümünü sunmalı.
4. WHEN `/super-admin/capacity` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `kapasite_planlama_bst_command_center/code.html` tasarımına uygun Kapasite Planlama görünümünü sunmalı.
5. WHEN `/super-admin/infrastructure` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `altyap_haritas_bst_command_center/code.html` tasarımına uygun Altyapı Haritası görünümünü sunmalı.
6. WHEN `/super-admin/deployments` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `da_t_m_ve_g_ncelleme_y_netimi_bst_command_center/code.html` tasarımına uygun Dağıtım ve Güncelleme Yönetimi görünümünü sunmalı.
7. WHEN `/super-admin/cloud-costs` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `bulut_maliyet_y_netimi_bst_command_center/code.html` tasarımına uygun Bulut Maliyet Yönetimi görünümünü sunmalı.
8. THE Super_Admin_Panel SHALL güvenlik, altyapı ve yedekleme sayfalarında gerçek zamanlı durum göstergelerini (renk kodlu badge, pulse animasyonu) HTML tasarımındaki gibi sunmalı.


---

### Gereksinim 5: Faz 2 — Kullanıcı ve Yetki Yönetimi Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, tüm sistem kullanıcılarını ve rol/yetki yapılandırmalarını merkezi bir yerden yönetmek istiyorum; böylece erişim kontrolünü etkin biçimde uygulayabilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/users` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `kullan_c_dizini_bst_command_center/code.html` tasarımına uygun Kullanıcı Dizini görünümünü sunmalı.
2. WHEN `/super-admin/roles` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `yetki_ve_rol_y_netimi_bst_command_center/code.html` tasarımına uygun Yetki ve Rol Yönetimi görünümünü sunmalı.
3. THE Super_Admin_Panel SHALL kullanıcı listesini tenant adı, rol, durum ve son giriş tarihi sütunlarıyla Dense_Table formatında göstermeli.
4. THE Super_Admin_Panel SHALL rol yönetimi sayfasında RBAC matrisini (rol × izin) tablo formatında göstermeli.
5. WHEN bir kullanıcının durumu değiştirildiğinde, THE Super_Admin_Panel SHALL değişikliği AuditLog tablosuna kaydetmeli.
6. THE Super_Admin_Panel SHALL kullanıcı ve rol sayfalarında arama ve filtreleme işlevlerini Client_Component olarak sunmalı.


---

### Gereksinim 6: Faz 2 — Abonelik ve Finans Genişletme Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, abonelik paketlerini, indirimleri, ek hizmetleri ve bireysel abonelik detaylarını yönetmek istiyorum; böylece gelir optimizasyonu ve müşteri yaşam döngüsü yönetimini etkin biçimde yapabilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/subscriptions/[id]` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `abonelik_detay_ve_d_zenleme_bst_command_center/code.html` tasarımına uygun Abonelik Detay ve Düzenleme görünümünü sunmalı.
2. WHEN `/super-admin/subscriptions/new` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `yeni_abonelik_olu_tur_bst_command_center/code.html` tasarımına uygun Yeni Abonelik Oluştur görünümünü sunmalı.
3. WHEN `/super-admin/plans` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `abonelik_paketleri_liste/code.html` ve `paket_d_zenle_olu_tur/code.html` tasarımlarını kapsayan Abonelik Paketleri görünümünü sunmalı.
4. WHEN `/super-admin/coupons` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `i_ndirim_ve_kupon_y_netimi/code.html` tasarımına uygun İndirim ve Kupon Yönetimi görünümünü sunmalı.
5. WHEN `/super-admin/addons` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `ek_hizmetler_add_ons/code.html` tasarımına uygun Ek Hizmetler (Add-ons) görünümünü sunmalı.
6. THE Super_Admin_Panel SHALL abonelik detay sayfasında tenant bilgisi, plan geçmişi, ödeme durumu ve yenileme tarihini göstermeli.
7. WHEN yeni bir abonelik oluşturulduğunda, THE Super_Admin_Panel SHALL tenant seçimi, plan seçimi ve başlangıç tarihi alanlarını içeren bir form sunmalı.
8. WHEN bir kupon oluşturulduğunda, THE Super_Admin_Panel SHALL kupon kodunu, indirim tipini (yüzde/sabit), geçerlilik süresini ve kullanım limitini kaydetmeli.
9. THE Super_Admin_Panel SHALL abonelik ve finans işlemlerini Server_Action aracılığıyla gerçekleştirmeli ve her işlemi AuditLog tablosuna kaydetmeli.


---

### Gereksinim 7: Faz 2 — Analitik ve Raporlama Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, platform genelinde özelleştirilebilir raporlar oluşturmak ve dinamik analiz yapmak istiyorum; böylece veri odaklı kararlar alabilir ve paydaşlarla paylaşılabilir raporlar üretebilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/reports` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `dinamik_rapor_sihirbaz/code.html` tasarımına uygun Dinamik Rapor Sihirbazı görünümünü sunmalı.
2. WHEN `/super-admin/reports/custom` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `zel_rapor_olu_turucu_bst_command_center/code.html` tasarımına uygun Özel Rapor Oluşturucu görünümünü sunmalı.
3. WHEN `/super-admin/saas-overview` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `saas_genel_bak_bst_command_center/code.html` tasarımına uygun SaaS Genel Bakış görünümünü sunmalı.
4. THE Super_Admin_Panel SHALL rapor sihirbazında metrik seçimi, dönem filtresi ve grafik tipi seçeneklerini Client_Component olarak sunmalı.
5. THE Super_Admin_Panel SHALL oluşturulan raporları PDF olarak dışa aktarma işlevini desteklemeli.
6. THE Super_Admin_Panel SHALL SaaS Genel Bakış sayfasında MRR, Churn, aktif tenant sayısı ve büyüme oranı gibi temel metrikleri Data_Widget formatında göstermeli.


---

### Gereksinim 8: Faz 2 — Operasyon Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, destek taleplerini, müşteri memnuniyetini (NPS), otomasyon iş akışlarını ve bildirimleri tek bir operasyon merkezinden yönetmek istiyorum; böylece müşteri deneyimini ve operasyonel verimliliği artırabilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/support` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `destek_kuyru_u_bst_command_center/code.html` tasarımına uygun Destek Kuyruğu görünümünü sunmalı.
2. WHEN `/super-admin/nps` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `m_teri_geri_bildirim_nps_paneli/code.html` tasarımına uygun NPS Paneli görünümünü sunmalı.
3. WHEN `/super-admin/automation` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `otomasyon_i_ak_d_zenleyici/code.html` tasarımına uygun Otomasyon İş Akışı Düzenleyici görünümünü sunmalı.
4. THE Super_Admin_Panel SHALL destek kuyruğu sayfasında talepleri öncelik, durum ve tenant bazında filtreleyebilmeli.
5. THE Super_Admin_Panel SHALL NPS panelinde skor dağılımını, trend grafiğini ve yorum özetlerini göstermeli.
6. THE Super_Admin_Panel SHALL otomasyon sayfasında tetikleyici (trigger) ve eylem (action) çiftlerini görsel bir iş akışı editörü olarak sunmalı.


---

### Gereksinim 9: Faz 2 — Geliştirici ve Güvenlik Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, API entegrasyonlarını, geliştirici portalını, şifreleme anahtarı yönetimini ve denetim kasasını yönetmek istiyorum; böylece platform güvenliğini ve üçüncü taraf entegrasyonlarını kontrol altında tutabilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/api-integrations` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `api_ve_entegrasyon_y_netimi_bst_command_center/code.html` tasarımına uygun API ve Entegrasyon Yönetimi görünümünü sunmalı.
2. WHEN `/super-admin/developer` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `geli_tirici_api_portal_bst_command_center/code.html` tasarımına uygun Geliştirici API Portalı görünümünü sunmalı.
3. WHEN `/super-admin/kms` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `veri_g_venli_i_kms_y_netimi/code.html` tasarımına uygun KMS Yönetimi görünümünü sunmalı.
4. WHEN `/super-admin/audit` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `denetim_kasas_bst_command_center/code.html` tasarımına uygun Denetim Kasası görünümünü sunmalı.
5. THE Super_Admin_Panel SHALL API entegrasyon sayfasında her entegrasyonun durumunu (aktif/pasif/hata), son çağrı zamanını ve başarı oranını göstermeli.
6. THE Super_Admin_Panel SHALL geliştirici portalında API anahtarı oluşturma, iptal etme ve kullanım istatistiklerini sunmalı.
7. THE Super_Admin_Panel SHALL denetim kasası sayfasında tüm kritik işlemleri zaman damgası, kullanıcı, modül ve işlem detayıyla filtrelenebilir biçimde göstermeli.
8. THE Super_Admin_Panel SHALL KMS sayfasında şifreleme anahtarlarının rotasyon durumunu ve son rotasyon tarihini göstermeli.


---

### Gereksinim 10: Faz 2 — Sistem Diagnostics Modülleri

**Kullanıcı Hikayesi:** Bir super admin olarak, sistem arşivini, veri temizleme işlemlerini ve mobil uygulama yönetimini tek bir yerden kontrol etmek istiyorum; böylece platform bakımını ve veri yaşam döngüsünü etkin biçimde yönetebilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/archive` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `sistem_ar_iv_veri_temizleme/code.html` tasarımına uygun Sistem Arşiv ve Veri Temizleme görünümünü sunmalı.
2. WHEN `/super-admin/mobile-management` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `mobil_uygulama_y_netimi/code.html` tasarımına uygun Mobil Uygulama Yönetimi görünümünü sunmalı.
3. THE Super_Admin_Panel SHALL arşiv sayfasında veri yaşına göre filtreleme ve toplu silme işlemlerini onay diyaloğuyla sunmalı.
4. WHEN bir toplu veri silme işlemi başlatıldığında, THE Super_Admin_Panel SHALL kullanıcıdan onay almalı ve işlemi AuditLog tablosuna kaydetmeli.
5. THE Super_Admin_Panel SHALL mobil uygulama yönetimi sayfasında uygulama sürümlerini, aktif cihaz sayısını ve push notification istatistiklerini göstermeli.


---

### Gereksinim 11: Tenant Detay ve Dinamik Rotalar

**Kullanıcı Hikayesi:** Bir super admin olarak, belirli bir tenant veya aboneliğin detay sayfasına doğrudan erişmek istiyorum; böylece ilgili kaydı hızlıca inceleyip düzenleyebilirim.

#### Kabul Kriterleri

1. WHEN `/super-admin/tenants/[id]` sayfası render edildiğinde, THE Super_Admin_Panel SHALL `tenant_detay_analizi_bst_command_center/code.html` tasarımına uygun Tenant Detay Analizi görünümünü sunmalı.
2. THE Super_Admin_Panel SHALL tenant detay sayfasında firma bilgileri, abonelik durumu, kullanıcı listesi, araç sayısı ve son aktivite loglarını göstermeli.
3. WHEN geçersiz bir tenant ID ile `/super-admin/tenants/[id]` sayfasına erişildiğinde, THE Super_Admin_Panel SHALL kullanıcıyı tenant listesine yönlendirmeli.
4. THE Super_Admin_Panel SHALL dinamik rota sayfalarında (`[id]`) ilgili kaydı Prisma ile tenant isolation olmaksızın (super admin yetkisiyle) çekebilmeli.
5. THE Super_Admin_Panel SHALL tenant detay sayfasından doğrudan abonelik değiştirme, durum güncelleme ve not ekleme işlemlerini yapabilmeli.


---

### Gereksinim 12: Server Actions Genişletmesi

**Kullanıcı Hikayesi:** Bir super admin olarak, yeni modüllerin veri ihtiyaçlarının mevcut `superadmin.actions.ts` dosyasına eklenen Server_Action fonksiyonları aracılığıyla karşılanmasını istiyorum; böylece veri erişim katmanı tutarlı ve güvenli kalır.

#### Kabul Kriterleri

1. THE Server_Action SHALL her yeni modül için gerekli veri çekme ve mutasyon fonksiyonlarını `superadmin.actions.ts` dosyasına eklenmeli.
2. THE Server_Action SHALL her fonksiyonun başında `isAdmin(session)` kontrolü yapmalı; yetkisiz erişimde `{ error: "Yetkisiz erişim" }` döndürmeli.
3. THE Server_Action SHALL Zod şemasıyla doğrulanmış giriş verilerini kabul etmeli.
4. WHEN bir mutasyon işlemi (oluşturma, güncelleme, silme) gerçekleştirildiğinde, THE Server_Action SHALL ilgili sayfayı `revalidatePath` ile yenilemeli.
5. WHEN bir kritik işlem gerçekleştirildiğinde, THE Server_Action SHALL `prisma.auditLog.create` ile işlemi kaydetmeli.
6. THE Server_Action SHALL hata durumlarında `{ error: string }`, başarı durumlarında `{ success: string }` formatında yanıt döndürmeli.
7. THE Server_Action SHALL yeni modüller için aşağıdaki fonksiyon gruplarını içermeli:
   - Güvenlik: `getSecurityThreats`, `getSecurityAlerts`
   - Veritabanı: `getDatabaseHealthMetrics`
   - Yedekleme: `getBackupStatus`, `triggerBackup`
   - Kullanıcı: `getUserDirectory`, `updateUserStatus`
   - Roller: `getRolesAndPermissions`, `updateRolePermissions`
   - Bulut Maliyet: `getCloudCostMetrics`
   - Dağıtım: `getDeploymentHistory`, `getDeploymentStatus`
   - Destek: `getSupportQueue`, `updateSupportTicket`
   - NPS: `getNPSMetrics`, `getNPSResponses`
   - Otomasyon: `getAutomationWorkflows`, `toggleAutomationWorkflow`
   - API Entegrasyon: `getAPIIntegrations`, `getAPIUsageStats`
   - KMS: `getKMSKeys`, `rotateKMSKey`
   - Denetim: `getAuditTrail`
   - Arşiv: `getArchiveData`, `purgeArchivedData`
   - Mobil: `getMobileAppStats`
   - Raporlar: `generateReport`, `getReportTemplates`
   - SaaS Genel Bakış: `getSaaSOverviewMetrics`
   - Kapasite: `getCapacityMetrics`
   - Altyapı: `getInfrastructureMap`
   - Kupon: `getCoupons`, `createCoupon`, `deactivateCoupon`
   - Ek Hizmet: `getAddons`, `createAddon`, `updateAddon`


---

### Gereksinim 13: HTML'den TSX'e Dönüşüm Standartları

**Kullanıcı Hikayesi:** Bir geliştirici olarak, HTML tasarım dosyalarının Next.js TSX bileşenlerine dönüştürülmesinde tutarlı bir standart izlenmesini istiyorum; böylece kod kalitesi ve bakım kolaylığı sağlanır.

#### Kabul Kriterleri

1. THE Super_Admin_Panel SHALL her sayfa için `page.tsx` (Server Component) ve gerekli alt bileşenleri `components/` alt klasöründe organize etmeli.
2. THE Super_Admin_Panel SHALL HTML tasarımındaki inline `style` özelliklerini Tailwind CSS 4 utility sınıflarına dönüştürmeli; mümkün olmayan durumlarda `style` prop kullanmalı.
3. THE Super_Admin_Panel SHALL HTML tasarımındaki statik/mock verileri Server_Action çağrılarıyla gerçek Prisma verileriyle değiştirmeli.
4. THE Super_Admin_Panel SHALL HTML tasarımındaki `<select>`, `<input>`, `<button>` gibi interaktif öğeleri Client_Component içinde yönetmeli.
5. THE Super_Admin_Panel SHALL TypeScript strict modunda tip güvenliğini sağlamalı; `any` tipinden kaçınmalı.
6. THE Super_Admin_Panel SHALL bileşen prop tiplerini `interface` veya `type` ile tanımlamalı.
7. THE Super_Admin_Panel SHALL Tab_Navigation için URL query parametrelerini (`?tab=`) kullanmalı; böylece sekme durumu URL'de korunmalı.
8. THE Super_Admin_Panel SHALL sayfa başlıklarını ve UI metinlerini Türkçe olarak sunmalı.
9. THE Super_Admin_Panel SHALL SVG grafik öğelerini (sparkline, donut chart, bar chart) HTML tasarımındaki gibi inline SVG olarak implement etmeli.
10. THE Super_Admin_Panel SHALL `Link` bileşenini `<a>` etiketleri yerine kullanmalı.


---

### Gereksinim 14: Güvenlik ve Erişim Kontrolü

**Kullanıcı Hikayesi:** Bir super admin olarak, panel sayfalarının yalnızca `SUPER_ADMIN` rolüne sahip kullanıcılar tarafından erişilebilir olmasını istiyorum; böylece yetkisiz erişim engellenir.

#### Kabul Kriterleri

1. THE Super_Admin_Panel SHALL tüm sayfaları ve Server_Action fonksiyonlarını `SUPER_ADMIN` rolü kontrolüyle korumalı.
2. WHEN `SUPER_ADMIN` rolü olmayan bir kullanıcı super admin sayfasına erişmeye çalıştığında, THE Super_Admin_Panel SHALL kullanıcıyı `/superadmin-login` sayfasına yönlendirmeli.
3. THE Super_Admin_Panel SHALL mevcut `middleware.ts` içindeki super admin rota korumasını yeni eklenen tüm rotalar için de uygulamalı.
4. THE Super_Admin_Panel SHALL hassas işlemler (toplu silme, rol değiştirme, anahtar rotasyonu) için onay diyaloğu göstermeli.
5. THE Super_Admin_Panel SHALL tüm kritik işlemleri (oluşturma, güncelleme, silme, durum değiştirme) AuditLog tablosuna `userId`, `module`, `message` ve `level` alanlarıyla kaydetmeli.


---

### Gereksinim 15: Performans ve Veri Yükleme Stratejisi

**Kullanıcı Hikayesi:** Bir super admin olarak, panel sayfalarının hızlı yüklenmesini ve büyük veri setlerinde performanslı çalışmasını istiyorum; böylece günlük operasyonlarımı verimli biçimde yürütebilirim.

#### Kabul Kriterleri

1. THE Super_Admin_Panel SHALL veri yoğun sayfalarda (tenant listesi, log görüntüleyici, kullanıcı dizini) sayfalama (pagination) uygulayarak tek seferde en fazla 50 kayıt yüklemeli.
2. THE Super_Admin_Panel SHALL Server_Component sayfalarında veri çekme işlemlerini paralel `Promise.all` ile gerçekleştirmeli.
3. THE Super_Admin_Panel SHALL liste sayfalarında arama ve filtreleme işlemlerini URL query parametreleriyle yönetmeli; böylece filtre durumu paylaşılabilir ve yenilenebilir olmalı.
4. THE Super_Admin_Panel SHALL `revalidatePath` ile sayfa önbelleğini mutasyon sonrası temizlemeli.
5. THE Super_Admin_Panel SHALL büyük tablolarda `overflow-auto` ile yatay kaydırma desteği sunmalı.
6. WHILE bir veri yükleme işlemi devam ediyorsa, THE Super_Admin_Panel SHALL Next.js `loading.tsx` veya Suspense ile yükleme durumunu göstermeli.


---

### Gereksinim 16: Dosya ve Klasör Organizasyonu

**Kullanıcı Hikayesi:** Bir geliştirici olarak, yeni eklenen tüm sayfaların ve bileşenlerin proje yapısıyla tutarlı biçimde organize edilmesini istiyorum; böylece kod tabanı bakımı kolaylaşır.

#### Kabul Kriterleri

1. THE Super_Admin_Panel SHALL her yeni rota için `apps/web/app/(super-admin)/super-admin/{route}/page.tsx` dosyasını oluşturmalı.
2. THE Super_Admin_Panel SHALL her sayfanın alt bileşenlerini `apps/web/app/(super-admin)/super-admin/{route}/components/` klasöründe organize etmeli.
3. THE Super_Admin_Panel SHALL super admin'e özgü paylaşılan bileşenleri `apps/web/components/super-admin/` klasöründe tutmalı.
4. THE Super_Admin_Panel SHALL dinamik rotalar için `apps/web/app/(super-admin)/super-admin/{route}/[id]/page.tsx` yapısını kullanmalı.
5. THE Super_Admin_Panel SHALL yeni Server_Action fonksiyonlarını mevcut `apps/web/lib/actions/superadmin.actions.ts` dosyasına eklemeli; ayrı dosya oluşturmamalı.
6. THE Super_Admin_Panel SHALL TypeScript tip tanımlarını ilgili bileşen dosyasında veya `types.ts` dosyasında tanımlamalı.

