# Görev Listesi: Super Admin Platform Entegrasyonu

## Görev 1: Collapsible Sidebar

- [x] 1. Collapsible Sidebar Yeniden Yazımı
  - [x] 1.1 `NAV_GROUPS` veri yapısını tanımla (8 grup, 40 öğe, ikon ve href ile)
  - [x] 1.2 `useSidebarState` hook'unu yaz (localStorage okuma/yazma, aktif grup tespiti)
  - [x] 1.3 Grup başlığı render'ını implement et (chevron ikonu, toggle animasyonu)
  - [x] 1.4 Aktif sayfa tespitini implement et (`pathname === item.href` ve `startsWith` mantığı)
  - [x] 1.5 Aktif nav item stilini uygula (`border-l-2 border-primary bg-primary/20 text-white`)
  - [x] 1.6 `overflow-y-auto` ile kaydırılabilir nav alanını ekle
  - [x] 1.7 Mevcut `Sidebar.tsx`'i yeni collapsible yapıyla değiştir

## Görev 2: Faz 1 — Mevcut Sayfa Güncellemeleri

- [x] 2. Faz 1 Sayfa Güncellemeleri
  - [x] 2.1 `/super-admin` — `bst_command_center_dashboards_phase_1/code.html` ile birebir eşleştir
  - [x] 2.2 `/super-admin/tenants` — `firma_y_netimi_bst_command_center/code.html` ile birebir eşleştir
  - [x] 2.3 `/super-admin/analytics` — `analitik_motoru_bst_command_center/code.html` ile birebir eşleştir
  - [x] 2.4 `/super-admin/logs` — iki HTML dosyasını birleştiren tab yapısını implement et
  - [x] 2.5 `/super-admin/subscriptions` — iki HTML dosyasını birleştiren tab yapısını implement et
  - [x] 2.6 `/super-admin/payment-operations` — `deme_operasyonlar_bst_command_center/code.html` ile eşleştir
  - [x] 2.7 `/super-admin/payments` — `fatura_ve_yinelenen_demeler_bst_command_center/code.html` ile eşleştir
  - [x] 2.8 `/super-admin/settings` — `sistem_ayarlar_bst_command_center/code.html` ile eşleştir
  - [x] 2.9 `/super-admin/notifications` — `bildirimler_bst_command_center/code.html` ile eşleştir
  - [x] 2.10 `/super-admin/command-center` — `komuta_merkezi_bst_command_center/code.html` ile eşleştir
  - [x] 2.11 `/super-admin/strategic-insights` — `stratejik_i_g_r_ler_bst_command_center/code.html` ile eşleştir
  - [x] 2.12 `/super-admin/tenant-performance` — `tenant_performans_matrisi_bst_command_center/code.html` ile eşleştir

## Görev 3: Server Actions Genişletmesi

- [x] 3. `superadmin.actions.ts` Genişletmesi
  - [x] 3.1 Analytics: `getAnalyticsData(period)` ekle
  - [x] 3.2 Payments: `getPaymentsData()`, `updateSystemSetting()`, `markNotificationRead()` ekle
  - [x] 3.3 Security: `getSecurityThreats()`, `getSecurityAlerts()`, `blockThreat()` ekle
  - [x] 3.4 Database: `getDatabaseHealthMetrics()` ekle
  - [x] 3.5 Backup: `getBackupStatus()`, `triggerBackup()` ekle
  - [x] 3.6 Cloud: `getCloudCostMetrics()` ekle
  - [x] 3.7 Capacity: `getCapacityMetrics()` ekle
  - [x] 3.8 Infrastructure: `getInfrastructureMap()` ekle
  - [x] 3.9 Deployments: `getDeploymentHistory()`, `getDeploymentStatus()` ekle
  - [x] 3.10 Users: `getUserDirectory(filters)`, `updateUserStatus()` ekle
  - [x] 3.11 Roles: `getRolesAndPermissions()`, `updateRolePermissions()` ekle
  - [x] 3.12 Subscriptions: `getSubscriptionById()`, `updateSubscription()`, `createSubscription()`, `updateSubscriptionPlan()` ekle
  - [x] 3.13 Coupons: `getCoupons()`, `createCoupon()`, `deactivateCoupon()` ekle
  - [x] 3.14 Addons: `getAddons()`, `createAddon()`, `updateAddon()` ekle
  - [x] 3.15 Support: `getSupportQueue()`, `updateSupportTicket()` ekle
  - [x] 3.16 NPS: `getNPSMetrics()`, `getNPSResponses()` ekle
  - [x] 3.17 Automation: `getAutomationWorkflows()`, `toggleAutomationWorkflow()` ekle
  - [x] 3.18 API: `getAPIIntegrations()`, `getAPIUsageStats()`, `getAPIKeys()`, `createAPIKey()`, `revokeAPIKey()` ekle
  - [x] 3.19 KMS: `getKMSKeys()`, `rotateKMSKey()` ekle
  - [x] 3.20 Audit: `getAuditTrail(filters)` ekle
  - [x] 3.21 Archive: `getArchiveData()`, `purgeArchivedData()` ekle
  - [x] 3.22 Mobile: `getMobileAppStats()` ekle
  - [x] 3.23 Reports: `generateReport()`, `getReportTemplates()` ekle
  - [x] 3.24 SaaS: `getSaaSOverviewMetrics()` ekle
  - [x] 3.25 Tenant Detail: `getTenantById()` ekle

## Görev 4: Güvenlik & Altyapı Modülleri

- [x] 4. Güvenlik & Altyapı Yeni Sayfaları
  - [x] 4.1 `/super-admin/security` — `page.tsx` oluştur, `getSecurityThreats()` + `getSecurityAlerts()` kullan, `ThreatActionMenu.tsx` Client Component ekle
  - [x] 4.2 `/super-admin/database-health` — `page.tsx` oluştur, `getDatabaseHealthMetrics()` kullan, metrik kartlar + yavaş sorgu tablosu
  - [x] 4.3 `/super-admin/backup-recovery` — `page.tsx` oluştur, `getBackupStatus()` kullan, yedek geçmişi tablosu + manuel yedek butonu
  - [x] 4.4 `/super-admin/cloud-costs` — `page.tsx` oluştur, `getCloudCostMetrics()` kullan, maliyet özet kartları + SVG donut chart
  - [x] 4.5 `/super-admin/capacity` — `page.tsx` oluştur, `getCapacityMetrics()` kullan, CPU/RAM/disk metrik kartları + trend chart
  - [x] 4.6 `/super-admin/infrastructure` — `page.tsx` oluştur, `getInfrastructureMap()` kullan, altyapı topoloji görünümü
  - [x] 4.7 `/super-admin/deployments` — `page.tsx` oluştur, `getDeploymentHistory()` kullan, dağıtım geçmişi tablosu + aksiyon menüsü

## Görev 5: Kullanıcı & Yetki Modülleri

- [x] 5. Kullanıcı & Yetki Yeni Sayfaları
  - [x] 5.1 `/super-admin/users` — `kullan_c_dizini_bst_command_center/code.html` ile güncelle, `getUserDirectory()` kullan, arama + filtre Client Component ekle
  - [x] 5.2 `/super-admin/roles` — `page.tsx` oluştur, `getRolesAndPermissions()` kullan, RBAC matrisi tablosu + `RoleEditDialog.tsx` Client Component

## Görev 6: Abonelik & Finans Genişletme

- [x] 6. Abonelik & Finans Yeni Sayfaları
  - [x] 6.1 `/super-admin/subscriptions/[id]` — `page.tsx` oluştur, `getSubscriptionById(params.id)` kullan, detay kartı + ödeme geçmişi + düzenleme formu
  - [x] 6.2 `/super-admin/subscriptions/new` — `page.tsx` oluştur, `NewSubscriptionForm.tsx` Client Component (tenant seç, plan seç, tarih)
  - [x] 6.3 `/super-admin/plans` — `page.tsx` oluştur, `getSubscriptionPlans()` kullan, paket listesi tablosu + `PlanEditDialog.tsx` Client Component
  - [x] 6.4 `/super-admin/coupons` — `page.tsx` oluştur, `getCoupons()` kullan, kupon tablosu + `CouponCreateDialog.tsx` Client Component
  - [x] 6.5 `/super-admin/addons` — `page.tsx` oluştur, `getAddons()` kullan, ek hizmet tablosu + `AddonEditDialog.tsx` Client Component

## Görev 7: Analitik & Raporlama Modülleri

- [x] 7. Analitik & Raporlama Yeni Sayfaları
  - [x] 7.1 `/super-admin/reports` — `page.tsx` oluştur, `ReportWizard.tsx` Client Component (4 adımlı sihirbaz: metrik seçimi, dönem, grafik tipi, önizleme + PDF export)
  - [x] 7.2 `/super-admin/reports/custom` — `page.tsx` oluştur, `CustomReportBuilder.tsx` Client Component (sürükle-bırak metrik seçimi)
  - [x] 7.3 `/super-admin/saas-overview` — `page.tsx` oluştur, `getSaaSOverviewMetrics()` kullan, MRR/Churn/ARR/LTV kartları + büyüme chart + plan dağılımı donut

## Görev 8: Operasyon Modülleri

- [x] 8. Operasyon Yeni Sayfaları
  - [x] 8.1 `/super-admin/support` — `page.tsx` oluştur, `getSupportQueue()` kullan, bilet tablosu (öncelik/durum/tenant filtresi) + `TicketActionMenu.tsx` Client Component
  - [x] 8.2 `/super-admin/nps` — `page.tsx` oluştur, `getNPSMetrics()` + `getNPSResponses()` kullan, NPS skoru + dağılım chart + trend chart + yorum tablosu
  - [x] 8.3 `/super-admin/automation` — `page.tsx` oluştur, `getAutomationWorkflows()` kullan, iş akışı listesi + `WorkflowToggle.tsx` Client Component

## Görev 9: Geliştirici & Güvenlik Modülleri

- [x] 9. Geliştirici & Güvenlik Yeni Sayfaları
  - [x] 9.1 `/super-admin/api-integrations` — `page.tsx` oluştur, `getAPIIntegrations()` + `getAPIUsageStats()` kullan, entegrasyon tablosu (durum, son çağrı, başarı oranı) + toggle
  - [x] 9.2 `/super-admin/developer` — `page.tsx` oluştur, `getAPIKeys()` kullan, API anahtarı tablosu + kullanım chart + `APIKeyActions.tsx` Client Component (oluştur, iptal)
  - [x] 9.3 `/super-admin/kms` — `page.tsx` oluştur, `getKMSKeys()` kullan, anahtar tablosu (rotasyon durumu) + `KMSRotateButton.tsx` Client Component (onay diyaloğu)
  - [x] 9.4 `/super-admin/audit` — `page.tsx` oluştur, `getAuditTrail()` kullan, denetim tablosu (zaman, kullanıcı, modül, işlem) + `AuditFilters.tsx` Client Component

## Görev 10: Sistem Diagnostics Modülleri

- [x] 10. Sistem Diagnostics Yeni Sayfaları
  - [x] 10.1 `/super-admin/archive` — `page.tsx` oluştur, `getArchiveData()` kullan, arşiv tablosu (yaş filtresi) + `PurgeConfirmDialog.tsx` Client Component (onay diyaloğu + audit log)
  - [x] 10.2 `/super-admin/mobile-management` — `page.tsx` oluştur, `getMobileAppStats()` kullan, aktif cihaz kartları + sürüm dağılımı chart + push notification istatistikleri

## Görev 11: Tenant & Abonelik Dinamik Rotalar

- [x] 11. Dinamik Rota Sayfaları
  - [x] 11.1 `/super-admin/tenants/[id]` — `page.tsx` oluştur, `getTenantById(params.id)` kullan, bulunamazsa `redirect("/super-admin/tenants")`, firma bilgi kartı + kullanıcı tablosu + aktivite logu + `TenantQuickActions.tsx` Client Component
  - [x] 11.2 Tenant detay sayfasından abonelik değiştirme, durum güncelleme ve not ekleme aksiyonlarını implement et
