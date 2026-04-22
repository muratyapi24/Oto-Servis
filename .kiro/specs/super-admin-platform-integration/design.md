# Tasarım Belgesi: Super Admin Platform Entegrasyonu

## 1. Mimari Genel Bakış

BST Command Center, MS Oto Servis SaaS platformunun tüm tenant'larını, aboneliklerini, altyapısını ve operasyonlarını yöneten merkezi super admin panelidir. Next.js 15 App Router mimarisi üzerine inşa edilmiştir.

### Bileşen Hiyerarşisi

```
(super-admin) route group
├── layout.tsx                    ← Sidebar + main wrapper (Server Component)
│   ├── Sidebar.tsx               ← Collapsible nav (Client Component)
│   └── main
│       ├── page.tsx              ← Her sayfa (Server Component — veri çeker)
│       │   ├── header            ← Sticky h-12 başlık (inline veya ayrı bileşen)
│       │   ├── tab-nav           ← URL query param tabanlı sekmeler
│       │   ├── content           ← Sayfa içeriği
│       │   │   ├── [DataWidgets] ← Server Component (salt görüntüleme)
│       │   │   └── [Interactive] ← Client Component ("use client")
│       │   └── SuperAdminFooter  ← Footer (Server Component)
│       └── loading.tsx           ← Suspense fallback
```

### Server / Client Component Sınırları

| Katman | Tip | Sorumluluk |
|--------|-----|------------|
| `layout.tsx` | Server | Sidebar + main wrapper render |
| `Sidebar.tsx` | Client | `usePathname`, localStorage, toggle state |
| `page.tsx` | Server | `await` ile veri çekme, Server Action çağrısı |
| Metrik kartları, tablolar | Server | Salt veri görüntüleme |
| Arama inputları, filtreler | Client | `useState`, URL push |
| Modal / Dialog bileşenleri | Client | Form state, submit handler |
| Tab navigasyonu | Server | `searchParams` ile aktif tab tespiti |

### Veri Akışı

```
Browser Request
    ↓
middleware.ts (isAdmin kontrolü, redirect)
    ↓
layout.tsx (Server Component)
    ↓
page.tsx (Server Component)
    ↓ await
superadmin.actions.ts ("use server")
    ↓ isAdmin(session) kontrolü
prisma (PostgreSQL)
    ↓
Serialized data → JSX render
    ↓
Client Component'lere prop olarak geçilir
```


## 2. Collapsible Sidebar Tasarımı

### Grup Yapısı

Mevcut `Sidebar.tsx` 13 öğeyi düz liste olarak göstermektedir. Yeni yapı 40 sayfayı 8 collapsible grup altında organize eder.

```typescript
type NavItem = {
  name: string
  href: string
  icon: string
}

type NavGroup = {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "ana-yonetim",
    label: "Ana Yönetim",
    icon: "dashboard",
    items: [
      { name: "Sistem Sağlığı",      href: "/super-admin",                  icon: "monitor_heart" },
      { name: "Komuta Merkezi",       href: "/super-admin/command-center",   icon: "radar" },
      { name: "Stratejik İçgörüler",  href: "/super-admin/strategic-insights", icon: "insights" },
      { name: "SaaS Genel Bakış",     href: "/super-admin/saas-overview",    icon: "cloud" },
    ]
  },
  {
    id: "tenant-kullanici",
    label: "Tenant & Kullanıcı",
    icon: "apartment",
    items: [
      { name: "Firmalar",             href: "/super-admin/tenants",          icon: "apartment" },
      { name: "Kullanıcı Dizini",     href: "/super-admin/users",            icon: "group" },
      { name: "Yetki & Rol Yönetimi", href: "/super-admin/roles",            icon: "admin_panel_settings" },
      { name: "Tenant Performans",    href: "/super-admin/tenant-performance", icon: "leaderboard" },
    ]
  },
  {
    id: "abonelik-finans",
    label: "Abonelik & Finans",
    icon: "subscriptions",
    items: [
      { name: "Abonelikler",          href: "/super-admin/subscriptions",    icon: "subscriptions" },
      { name: "Paketler",             href: "/super-admin/plans",            icon: "inventory_2" },
      { name: "Ödemeler",             href: "/super-admin/payments",         icon: "account_balance_wallet" },
      { name: "Ödeme Operasyonları",  href: "/super-admin/payment-operations", icon: "payments" },
      { name: "İndirim & Kuponlar",   href: "/super-admin/coupons",          icon: "local_offer" },
      { name: "Ek Hizmetler",         href: "/super-admin/addons",           icon: "extension" },
    ]
  },
  {
    id: "teknik-altyapi",
    label: "Teknik Altyapı",
    icon: "dns",
    items: [
      { name: "Güvenlik Tehdit İzleme", href: "/super-admin/security",       icon: "security" },
      { name: "Veritabanı Sağlığı",   href: "/super-admin/database-health",  icon: "storage" },
      { name: "Yedekleme & Kurtarma", href: "/super-admin/backup-recovery",  icon: "backup" },
      { name: "Bulut Maliyet",        href: "/super-admin/cloud-costs",      icon: "cloud_done" },
      { name: "Kapasite Planlama",    href: "/super-admin/capacity",         icon: "speed" },
      { name: "Altyapı Haritası",     href: "/super-admin/infrastructure",   icon: "hub" },
      { name: "Dağıtım & Güncelleme", href: "/super-admin/deployments",      icon: "rocket_launch" },
    ]
  },
  {
    id: "analitik-raporlama",
    label: "Analitik & Raporlama",
    icon: "bar_chart",
    items: [
      { name: "Analitik",             href: "/super-admin/analytics",        icon: "bar_chart_4_bars" },
      { name: "Raporlar",             href: "/super-admin/reports",          icon: "summarize" },
      { name: "Özel Rapor",           href: "/super-admin/reports/custom",   icon: "edit_note" },
      { name: "Dinamik Rapor Sihirbazı", href: "/super-admin/reports",       icon: "auto_awesome" },
    ]
  },
  {
    id: "operasyon",
    label: "Operasyon",
    icon: "support_agent",
    items: [
      { name: "Destek Kuyruğu",       href: "/super-admin/support",          icon: "support_agent" },
      { name: "NPS Paneli",           href: "/super-admin/nps",              icon: "sentiment_satisfied" },
      { name: "Bildirimler",          href: "/super-admin/notifications",    icon: "notifications" },
      { name: "Otomasyon İş Akışı",   href: "/super-admin/automation",       icon: "account_tree" },
    ]
  },
  {
    id: "gelistirici-guvenlik",
    label: "Geliştirici & Güvenlik",
    icon: "code",
    items: [
      { name: "API Entegrasyonlar",   href: "/super-admin/api-integrations", icon: "api" },
      { name: "Geliştirici Portal",   href: "/super-admin/developer",        icon: "terminal" },
      { name: "KMS",                  href: "/super-admin/kms",              icon: "key" },
      { name: "Denetim Kasası",       href: "/super-admin/audit",            icon: "gavel" },
    ]
  },
  {
    id: "sistem-diagnostics",
    label: "Sistem Diagnostics",
    icon: "settings",
    items: [
      { name: "Loglar",               href: "/super-admin/logs",             icon: "history" },
      { name: "Ayarlar",              href: "/super-admin/settings",         icon: "settings" },
      { name: "Arşiv & Veri Temizleme", href: "/super-admin/archive",        icon: "archive" },
      { name: "Mobil Uygulama Yönetimi", href: "/super-admin/mobile-management", icon: "phone_android" },
    ]
  },
]
```

### State Yönetimi (localStorage)

```typescript
// Sidebar.tsx — Client Component
const STORAGE_KEY = "bst-sidebar-groups"

function useSidebarState(groups: NavGroup[], pathname: string) {
  // Aktif sayfanın grubunu bul
  const activeGroupId = groups.find(g =>
    g.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.id

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // localStorage'dan oku, aktif grubu her zaman aç
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    if (activeGroupId) parsed[activeGroupId] = true
    return parsed
  })

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { openGroups, toggleGroup, activeGroupId }
}
```

### Aktif Sayfa Tespiti

```typescript
// Exact match için: pathname === item.href
// Prefix match için: pathname.startsWith(item.href + "/")
// Ana sayfa özel durumu: pathname === "/super-admin" (startsWith hariç)
const isActive = (item: NavItem) =>
  item.href === "/super-admin"
    ? pathname === "/super-admin"
    : pathname === item.href || pathname.startsWith(item.href + "/")
```

### Sidebar CSS Yapısı

```
aside.w-64.bg-inverse-surface
├── div.header (logo + versiyon)
├── nav.flex-1.overflow-y-auto
│   └── [NAV_GROUPS.map]
│       ├── button.group-header (tıklanabilir, chevron ikonu)
│       │   ├── span.icon
│       │   ├── span.label (text-[9px] uppercase tracking-widest)
│       │   └── span.chevron (rotate-180 when open)
│       └── div.items (animate height: 0 → auto)
│           └── [items.map]
│               └── Link.item (border-l-2 aktif stil)
└── div.user-footer
```


## 3. Sayfa Şablonu

Tüm super admin sayfaları aşağıdaki yapıyı paylaşır:

```
page.tsx (Server Component)
├── <header> h-12 sticky top-0 z-40 bg-white border-b
│   ├── Sol: ikon + sayfa başlığı + arama inputu (varsa)
│   └── Sağ: durum badge + aksiyon butonları
├── <nav> tab-navigation (URL ?tab= query param)
│   └── Link[] — aktif tab border-b-2 border-primary
├── <div> flex-1 overflow-y-auto p-4
│   └── sayfa içeriği (grid, table, form vb.)
└── <SuperAdminFooter />
```

### Tab Navigasyonu Örüntüsü

```typescript
// page.tsx
export default async function SomePage(props: {
  searchParams?: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "overview"
  const page = parseInt(searchParams?.page || "1")
  const search = searchParams?.search || ""

  const data = await getSomeData({ tab, page, search })

  return (
    <>
      <header>...</header>
      <nav className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1">
        {TABS.map(t => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={tab === t.id
              ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5"
              : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-4">
        {/* içerik */}
      </div>
      <SuperAdminFooter />
    </>
  )
}
```

### Ortak CSS Sınıfları (global.css'te tanımlı)

| Sınıf | Kullanım |
|-------|----------|
| `data-widget` | Metrik kartı (bg-white border rounded shadow-sm p-4) |
| `dense-table` | Kompakt tablo (küçük padding, font-mono) |
| `chart-container` | Grafik wrapper |
| `sparkline` | SVG sparkline (w-24 h-10) |
| `bar` | Bar chart öğesi |
| `no-scrollbar` | Scrollbar gizleme |


## 4. Faz 1: Mevcut Sayfa Güncellemeleri

Her mevcut sayfa, karşılık gelen HTML tasarım dosyasıyla birebir eşleşecek şekilde güncellenecektir. Dönüşüm standartları:

- HTML `class=""` → Tailwind CSS 4 utility sınıfları
- Inline `style=""` → Tailwind arbitrary değerler veya `style` prop
- Statik/mock veriler → Server Action çağrıları
- `<a href>` → `<Link href>`
- `<select>`, `<input>`, `<button>` → Client Component içinde
- SVG grafikler → inline SVG (sparkline, donut, bar)

### 4.1 `/super-admin` — Sistem Sağlığı

**HTML Kaynak**: `bst_command_center_dashboards_phase_1/code.html`

**Mevcut Durum**: Kısmen implement edilmiş. Metrik kartlar, son firmalar tablosu ve altyapı yükü widget'ları mevcut.

**Güncellenecekler**:
- Header: `monitor_heart` ikonu, "Sistem Sağlığı" başlığı, arama inputu, uptime badge
- Tab nav: Genel Bakış, Firmalar, Sistem Durumu, İşlem Günlükleri
- Metrik grid: Toplam Firma, Aktif Kullanıcı, Aylık Ciro (MRR), Kayıp Oranı — sparkline ile
- Sol kolon (8/12): Son eklenen firmalar tablosu + Canlı Sistem Günlüğü
- Sağ kolon (4/12): Altyapı Yükü widget + Aktif Alarmlar + Pazar Payı donut chart
- Server Action: `getDashboardMetrics()` (mevcut)

### 4.2 `/super-admin/tenants` — Firma Yönetimi

**HTML Kaynak**: `firma_y_netimi_bst_command_center/code.html`

**Mevcut Durum**: Büyük ölçüde implement edilmiş. Sol filtre sidebar, dense-table, pagination mevcut.

**Güncellenecekler**:
- HTML tasarımındaki ek metrik kartlar (toplam firma, aktif, askıya alınmış, büyüme)
- Toplu işlem toolbar (seçili firmalar için)
- Gelişmiş filtre paneli (bölge, paket, sağlık durumu)
- Server Actions: `getExpandedTenants()`, `updateTenantStatus()`, `deleteTenant()`, `createTenantWithAdmin()` (mevcut)

### 4.3 `/super-admin/analytics` — Analitik Motoru

**HTML Kaynak**: `analitik_motoru_bst_command_center/code.html`

**Mevcut Durum**: Temel sayfa mevcut, HTML tasarımıyla tam eşleşme gerekiyor.

**Güncellenecekler**:
- Zaman aralığı seçici (7G, 30G, 90G, 1Y) — Client Component
- MRR trend grafiği (SVG line chart)
- Tenant büyüme grafiği (SVG bar chart)
- Cohort analizi tablosu
- Gelir dağılımı (plan bazında)
- Server Action: `getAnalyticsData(period)` — eklenecek

### 4.4 `/super-admin/logs` — İşlem Günlükleri

**HTML Kaynaklar**: `i_lem_g_nl_kleri_bst_command_center_1/code.html` + `i_lem_g_nl_kleri_bst_command_center_2/code.html`

**Mevcut Durum**: Temel sayfa mevcut.

**Güncellenecekler**:
- İki HTML dosyasını birleştiren tab yapısı: "Sistem Logları" + "İşlem Geçmişi"
- Seviye filtresi (INFO, WARNING, ERROR, CRITICAL) — URL query param
- Arama inputu — URL query param
- Zaman aralığı filtresi
- Log satırı: zaman damgası + seviye badge + modül + mesaj + trace ID
- Gerçek zamanlı log akışı (SSE veya polling)
- Server Action: `getAuditLogs(filter)` (mevcut)

### 4.5 `/super-admin/subscriptions` — Abonelik Yönetimi

**HTML Kaynaklar**: `abonelik_y_netimi_bst_command_center/code.html` + `abonelik_y_netim_merkezi_bst_command_center/code.html`

**Mevcut Durum**: Temel sayfa mevcut.

**Güncellenecekler**:
- Tab yapısı: "Tüm Abonelikler" + "Abonelik Merkezi" (iki HTML'yi birleştirir)
- MRR özet kartları (aktif, deneme, iptal, gecikmiş)
- Abonelik tablosu: tenant, plan, durum, dönem sonu, tutar
- Plan değiştirme ve iptal aksiyonları
- Server Actions: `getAllSubscriptions()`, `cancelSubscription()`, `changeSubscriptionPlan()` (mevcut)

### 4.6 `/super-admin/payment-operations` — Ödeme Operasyonları

**HTML Kaynak**: `deme_operasyonlar_bst_command_center/code.html`

**Güncellenecekler**:
- Özet kartlar: aktif, gecikmiş, iptal sayıları
- Ödeme tablosu: tenant, plan, tutar, durum, Stripe ID
- Gecikmiş ödemeler için aksiyon butonları
- Server Action: `getPaymentOperations()` (mevcut)

### 4.7 `/super-admin/payments` — Fatura ve Yinelenen Ödemeler

**HTML Kaynak**: `fatura_ve_yinelenen_demeler_bst_command_center/code.html`

**Güncellenecekler**:
- Fatura listesi tablosu
- Yinelenen ödeme takvimi
- Ödeme durumu filtreleri
- Server Action: `getPaymentsData()` — eklenecek

### 4.8 `/super-admin/settings` — Sistem Ayarları

**HTML Kaynak**: `sistem_ayarlar_bst_command_center/code.html`

**Güncellenecekler**:
- Tab yapısı: Genel, E-posta, Güvenlik, Entegrasyonlar, Bakım
- Form alanları: sistem adı, destek e-postası, bakım modu toggle
- Server Actions: `getSystemSettings()` (mevcut), `updateSystemSetting()` — eklenecek

### 4.9 `/super-admin/notifications` — Bildirimler

**HTML Kaynak**: `bildirimler_bst_command_center/code.html`

**Güncellenecekler**:
- Bildirim listesi: tip, başlık, içerik, zaman, okundu durumu
- Toplu okundu işaretleme
- Bildirim tipi filtreleri
- Server Action: `getSystemNotifications()` (mevcut), `markNotificationRead()` — eklenecek

### 4.10 `/super-admin/command-center` — Komuta Merkezi

**HTML Kaynak**: `komuta_merkezi_bst_command_center/code.html`

**Güncellenecekler**:
- Aktif tenant sayısı, hata sayısı, aktif kullanıcı, servis emri sayısı
- Son 24 saat hata logları
- Yakında sona erecek abonelikler
- Hızlı aksiyon butonları
- Server Action: `getCommandCenterData()` (mevcut)

### 4.11 `/super-admin/strategic-insights` — Stratejik İçgörüler

**HTML Kaynak**: `stratejik_i_g_r_ler_bst_command_center/code.html`

**Güncellenecekler**:
- 6 aylık büyüme grafiği (yeni tenant + iptal)
- Top 5 tenant (servis emri bazında)
- Churn rate göstergesi
- Server Action: `getStrategicInsights()` (mevcut)

### 4.12 `/super-admin/tenant-performance` — Tenant Performans Matrisi

**HTML Kaynak**: `tenant_performans_matrisi_bst_command_center/code.html`

**Güncellenecekler**:
- Performans matrisi tablosu: tenant, kullanıcı, servis emri, müşteri, plan
- Sıralama ve filtreleme
- Server Action: `getTenantPerformanceMatrix()` (mevcut)


## 5. Faz 2: Yeni Modüller

### 5.1 Güvenlik & Altyapı Grubu

#### `/super-admin/security` — Güvenlik Tehdit İzleme
**HTML**: `g_venlik_tehdit_i_zleme_bst_command_center/code.html`

**Bileşen Yapısı**:
```
security/
├── page.tsx                    ← Server Component
│   ├── ThreatSummaryCards      ← kritik, yüksek, orta, düşük sayıları
│   ├── ThreatTable             ← tehdit listesi (dense-table)
│   ├── GeoThreatMap            ← SVG dünya haritası veya placeholder
│   └── SecurityAlertsList      ← aktif alarmlar
└── components/
    └── ThreatActionMenu.tsx    ← Client Component (engelle, yoksay)
```

**Server Actions**: `getSecurityThreats()`, `getSecurityAlerts()`, `blockThreat()`

#### `/super-admin/database-health` — Veritabanı Sağlık Monitörü
**HTML**: `veritaban_sa_l_k_monit_r_bst_command_center/code.html`

**Bileşen Yapısı**:
```
database-health/
├── page.tsx
│   ├── DBMetricCards           ← bağlantı sayısı, sorgu süresi, boyut
│   ├── SlowQueryTable          ← yavaş sorgular tablosu
│   ├── ConnectionPoolChart     ← SVG bar chart
│   └── TableSizeList           ← tablo boyutları
```

**Server Actions**: `getDatabaseHealthMetrics()`

#### `/super-admin/backup-recovery` — Yedekleme ve Kurtarma
**HTML**: `yedekleme_ve_kurtarma_bst_command_center/code.html`

**Bileşen Yapısı**:
```
backup-recovery/
├── page.tsx
│   ├── BackupStatusCards       ← son yedek zamanı, boyut, durum
│   ├── BackupHistoryTable      ← yedek geçmişi
│   └── BackupTriggerButton     ← Client Component (manuel yedek)
```

**Server Actions**: `getBackupStatus()`, `triggerBackup()`

#### `/super-admin/cloud-costs` — Bulut Maliyet Yönetimi
**HTML**: `bulut_maliyet_y_netimi_bst_command_center/code.html`

**Bileşen Yapısı**:
```
cloud-costs/
├── page.tsx
│   ├── CostSummaryCards        ← bu ay, geçen ay, tahmin
│   ├── CostByServiceChart      ← SVG donut chart (compute, storage, network)
│   └── CostTrendChart          ← SVG line chart (6 aylık)
```

**Server Actions**: `getCloudCostMetrics()`

#### `/super-admin/capacity` — Kapasite Planlama
**HTML**: `kapasite_planlama_bst_command_center/code.html`

**Bileşen Yapısı**:
```
capacity/
├── page.tsx
│   ├── CapacityMetricCards     ← CPU, RAM, disk, network kullanımı
│   ├── CapacityTrendChart      ← SVG line chart
│   └── CapacityForecastTable   ← tahmin tablosu
```

**Server Actions**: `getCapacityMetrics()`

#### `/super-admin/infrastructure` — Altyapı Haritası
**HTML**: `altyap_haritas_bst_command_center/code.html`

**Bileşen Yapısı**:
```
infrastructure/
├── page.tsx
│   ├── InfraNodeCards          ← sunucu/servis kartları
│   ├── InfraTopologyDiagram    ← SVG topoloji diyagramı
│   └── ServiceHealthList       ← servis sağlık listesi
```

**Server Actions**: `getInfrastructureMap()`

#### `/super-admin/deployments` — Dağıtım ve Güncelleme Yönetimi
**HTML**: `da_t_m_ve_g_ncelleme_y_netimi_bst_command_center/code.html`

**Bileşen Yapısı**:
```
deployments/
├── page.tsx
│   ├── DeploymentStatusCards   ← aktif, bekleyen, başarısız
│   ├── DeploymentHistoryTable  ← dağıtım geçmişi
│   └── DeploymentActionMenu    ← Client Component (rollback, retry)
```

**Server Actions**: `getDeploymentHistory()`, `getDeploymentStatus()`

### 5.2 Kullanıcı & Yetki Grubu

#### `/super-admin/users` — Kullanıcı Dizini (Güncelleme)
**HTML**: `kullan_c_dizini_bst_command_center/code.html`

**Mevcut**: `getAllSystemUsers()` var, sayfa temel düzeyde implement edilmiş.

**Güncellenecekler**:
- Tenant adı, rol, durum, son giriş sütunları
- Arama + filtre (Client Component)
- Kullanıcı durum değiştirme (aktif/pasif)
- Server Actions: `getUserDirectory()`, `updateUserStatus()`

#### `/super-admin/roles` — Yetki ve Rol Yönetimi
**HTML**: `yetki_ve_rol_y_netimi_bst_command_center/code.html`

**Bileşen Yapısı**:
```
roles/
├── page.tsx
│   ├── RoleSummaryCards        ← rol sayıları
│   ├── RBACMatrix              ← rol × izin tablosu
│   └── RoleEditDialog          ← Client Component (izin toggle)
```

**Server Actions**: `getRolesAndPermissions()`, `updateRolePermissions()`

### 5.3 Abonelik & Finans Genişletme

#### `/super-admin/subscriptions/[id]` — Abonelik Detay
**HTML**: `abonelik_detay_ve_d_zenleme_bst_command_center/code.html`

**Bileşen Yapısı**:
```
subscriptions/[id]/
├── page.tsx                    ← params.id ile veri çek
│   ├── SubscriptionDetailCard  ← tenant, plan, durum, dönem
│   ├── PaymentHistoryTable     ← ödeme geçmişi
│   └── SubscriptionEditForm    ← Client Component (plan değiştir, iptal)
```

**Server Actions**: `getSubscriptionById(id)`, `updateSubscription(id, data)`

#### `/super-admin/subscriptions/new` — Yeni Abonelik
**HTML**: `yeni_abonelik_olu_tur_bst_command_center/code.html`

**Bileşen Yapısı**:
```
subscriptions/new/
├── page.tsx
│   └── NewSubscriptionForm     ← Client Component (tenant seç, plan seç, tarih)
```

**Server Actions**: `createSubscription(data)`

#### `/super-admin/plans` — Abonelik Paketleri
**HTML Kaynaklar**: `abonelik_paketleri_liste/code.html` + `paket_d_zenle_olu_tur/code.html`

**Bileşen Yapısı**:
```
plans/
├── page.tsx
│   ├── PlanListTable           ← paket listesi
│   └── PlanEditDialog          ← Client Component (oluştur/düzenle)
```

**Server Actions**: `getSubscriptionPlans()` (mevcut), `createSubscriptionPlan()` (mevcut), `updateSubscriptionPlan()`

#### `/super-admin/coupons` — İndirim ve Kupon Yönetimi
**HTML**: `i_ndirim_ve_kupon_y_netimi/code.html`

**Bileşen Yapısı**:
```
coupons/
├── page.tsx
│   ├── CouponSummaryCards      ← aktif, kullanılan, süresi dolmuş
│   ├── CouponTable             ← kupon listesi
│   └── CouponCreateDialog      ← Client Component
```

**Server Actions**: `getCoupons()`, `createCoupon(data)`, `deactivateCoupon(id)`

#### `/super-admin/addons` — Ek Hizmetler
**HTML**: `ek_hizmetler_add_ons/code.html`

**Bileşen Yapısı**:
```
addons/
├── page.tsx
│   ├── AddonSummaryCards
│   ├── AddonTable
│   └── AddonEditDialog         ← Client Component
```

**Server Actions**: `getAddons()`, `createAddon(data)`, `updateAddon(id, data)`

### 5.4 Analitik & Raporlama

#### `/super-admin/reports` — Dinamik Rapor Sihirbazı
**HTML**: `dinamik_rapor_sihirbaz/code.html`

**Bileşen Yapısı**:
```
reports/
├── page.tsx
│   └── ReportWizard            ← Client Component
│       ├── Step1: Metrik seçimi
│       ├── Step2: Dönem filtresi
│       ├── Step3: Grafik tipi
│       └── Step4: Önizleme + PDF export
```

**Server Actions**: `generateReport(params)`, `getReportTemplates()`

#### `/super-admin/reports/custom` — Özel Rapor Oluşturucu
**HTML**: `zel_rapor_olu_turucu_bst_command_center/code.html`

**Bileşen Yapısı**:
```
reports/custom/
├── page.tsx
│   └── CustomReportBuilder     ← Client Component (drag-drop metrik seçimi)
```

**Server Actions**: `generateReport(params)` (paylaşımlı)

#### `/super-admin/saas-overview` — SaaS Genel Bakış
**HTML**: `saas_genel_bak_bst_command_center/code.html`

**Bileşen Yapısı**:
```
saas-overview/
├── page.tsx
│   ├── SaaSMetricCards         ← MRR, Churn, ARR, LTV
│   ├── GrowthChart             ← SVG line chart
│   └── PlanDistributionChart   ← SVG donut chart
```

**Server Actions**: `getSaaSOverviewMetrics()`

### 5.5 Operasyon Modülleri

#### `/super-admin/support` — Destek Kuyruğu
**HTML**: `destek_kuyru_u_bst_command_center/code.html`

**Bileşen Yapısı**:
```
support/
├── page.tsx
│   ├── SupportSummaryCards     ← açık, bekleyen, çözülen
│   ├── TicketTable             ← bilet listesi (öncelik, durum, tenant)
│   └── TicketActionMenu        ← Client Component (ata, kapat, öncelik değiştir)
```

**Server Actions**: `getSupportQueue()`, `updateSupportTicket(id, data)`

#### `/super-admin/nps` — NPS Paneli
**HTML**: `m_teri_geri_bildirim_nps_paneli/code.html`

**Bileşen Yapısı**:
```
nps/
├── page.tsx
│   ├── NPSScoreCard            ← genel NPS skoru
│   ├── NPSDistributionChart    ← SVG bar chart (0-10 dağılımı)
│   ├── NPSTrendChart           ← SVG line chart
│   └── NPSResponseTable        ← yorum listesi
```

**Server Actions**: `getNPSMetrics()`, `getNPSResponses()`

#### `/super-admin/automation` — Otomasyon İş Akışı
**HTML**: `otomasyon_i_ak_d_zenleyici/code.html`

**Bileşen Yapısı**:
```
automation/
├── page.tsx
│   ├── WorkflowSummaryCards    ← aktif, pasif, çalışan
│   ├── WorkflowList            ← iş akışı listesi
│   └── WorkflowToggle          ← Client Component (aktif/pasif)
```

**Server Actions**: `getAutomationWorkflows()`, `toggleAutomationWorkflow(id)`

### 5.6 Geliştirici & Güvenlik Modülleri

#### `/super-admin/api-integrations` — API ve Entegrasyon Yönetimi
**HTML**: `api_ve_entegrasyon_y_netimi_bst_command_center/code.html`

**Bileşen Yapısı**:
```
api-integrations/
├── page.tsx
│   ├── IntegrationSummaryCards ← aktif, hata, toplam
│   ├── IntegrationTable        ← entegrasyon listesi (durum, son çağrı, başarı oranı)
│   └── IntegrationToggle       ← Client Component
```

**Server Actions**: `getAPIIntegrations()`, `getAPIUsageStats()`

#### `/super-admin/developer` — Geliştirici API Portalı
**HTML**: `geli_tirici_api_portal_bst_command_center/code.html`

**Bileşen Yapısı**:
```
developer/
├── page.tsx
│   ├── APIKeyTable             ← API anahtarları listesi
│   ├── APIUsageChart           ← SVG bar chart
│   └── APIKeyActions           ← Client Component (oluştur, iptal)
```

**Server Actions**: `getAPIKeys()`, `createAPIKey()`, `revokeAPIKey(id)`

#### `/super-admin/kms` — KMS Yönetimi
**HTML**: `veri_g_venli_i_kms_y_netimi/code.html`

**Bileşen Yapısı**:
```
kms/
├── page.tsx
│   ├── KMSKeyTable             ← anahtar listesi (rotasyon durumu, son rotasyon)
│   └── KMSRotateButton         ← Client Component (onay diyaloğu ile)
```

**Server Actions**: `getKMSKeys()`, `rotateKMSKey(id)`

#### `/super-admin/audit` — Denetim Kasası
**HTML**: `denetim_kasas_bst_command_center/code.html`

**Bileşen Yapısı**:
```
audit/
├── page.tsx
│   ├── AuditSummaryCards       ← bugün, bu hafta, kritik
│   ├── AuditTrailTable         ← zaman, kullanıcı, modül, işlem, detay
│   └── AuditFilters            ← Client Component (modül, seviye, tarih aralığı)
```

**Server Actions**: `getAuditTrail(filters)`

### 5.7 Sistem Diagnostics

#### `/super-admin/archive` — Sistem Arşiv ve Veri Temizleme
**HTML**: `sistem_ar_iv_veri_temizleme/code.html`

**Bileşen Yapısı**:
```
archive/
├── page.tsx
│   ├── ArchiveSummaryCards     ← arşivlenen kayıt sayısı, boyut
│   ├── ArchiveDataTable        ← arşiv listesi (yaş filtresi)
│   └── PurgeConfirmDialog      ← Client Component (onay diyaloğu)
```

**Server Actions**: `getArchiveData()`, `purgeArchivedData(criteria)`

#### `/super-admin/mobile-management` — Mobil Uygulama Yönetimi
**HTML**: `mobil_uygulama_y_netimi/code.html`

**Bileşen Yapısı**:
```
mobile-management/
├── page.tsx
│   ├── MobileAppMetricCards    ← aktif cihaz, sürüm dağılımı, push istatistikleri
│   ├── VersionDistributionChart ← SVG bar chart
│   └── PushNotificationStats   ← gönderilen, teslim edilen, açılan
```

**Server Actions**: `getMobileAppStats()`

### 5.8 Dinamik Rotalar

#### `/super-admin/tenants/[id]` — Tenant Detay Analizi
**HTML**: `tenant_detay_analizi_bst_command_center/code.html`

**Bileşen Yapısı**:
```
tenants/[id]/
├── page.tsx                    ← params.id ile tenant çek, bulunamazsa redirect
│   ├── TenantInfoCard          ← firma bilgileri, abonelik durumu
│   ├── TenantUserTable         ← kullanıcı listesi
│   ├── TenantActivityLog       ← son aktivite logları
│   └── TenantQuickActions      ← Client Component (abonelik değiştir, durum güncelle, not ekle)
```

**Server Actions**: `getTenantById(id)`, `updateTenantStatus()` (mevcut)

**Redirect Mantığı**:
```typescript
const tenant = await getTenantById(params.id)
if (!tenant || tenant.error) redirect("/super-admin/tenants")
```


## 6. Server Actions Genişletmesi

Tüm yeni fonksiyonlar `apps/web/lib/actions/superadmin.actions.ts` dosyasına eklenir. Ayrı dosya oluşturulmaz.

### Fonksiyon Şablonu

```typescript
export async function exampleAction(input: InputType) {
  try {
    const session = await auth()
    if (!isAdmin(session)) return { error: "Yetkisiz erişim" }

    // Zod doğrulama (mutasyon fonksiyonları için)
    const validated = ExampleSchema.safeParse(input)
    if (!validated.success) return { error: "Geçersiz veri" }

    const result = await prisma.someModel.findMany({ ... })

    // Kritik işlemler için audit log
    await prisma.auditLog.create({
      data: { level: "INFO", module: "MODULE-NAME", message: "...", userId: session.user.id }
    })

    revalidatePath("/super-admin/some-page") // mutasyon sonrası
    return { data: result } // veya { success: "..." }
  } catch (error) {
    console.error("Action Error:", error)
    return { error: "İşlem başarısız." }
  }
}
```

### Eklenecek Fonksiyon Grupları

```typescript
// ==========================================
// ANALYTICS
// ==========================================
getAnalyticsData(period: "7d" | "30d" | "90d" | "1y")

// ==========================================
// PAYMENTS
// ==========================================
getPaymentsData()
updateSystemSetting(key: string, value: string)
markNotificationRead(id: string)

// ==========================================
// SECURITY
// ==========================================
getSecurityThreats()
getSecurityAlerts()
blockThreat(threatId: string)

// ==========================================
// DATABASE HEALTH
// ==========================================
getDatabaseHealthMetrics()

// ==========================================
// BACKUP
// ==========================================
getBackupStatus()
triggerBackup()

// ==========================================
// CLOUD COSTS
// ==========================================
getCloudCostMetrics()

// ==========================================
// CAPACITY
// ==========================================
getCapacityMetrics()

// ==========================================
// INFRASTRUCTURE
// ==========================================
getInfrastructureMap()

// ==========================================
// DEPLOYMENTS
// ==========================================
getDeploymentHistory()
getDeploymentStatus()

// ==========================================
// USERS (genişletme)
// ==========================================
getUserDirectory(filters?: { search?: string; role?: string; tenantId?: string })
updateUserStatus(userId: string, isActive: boolean)

// ==========================================
// ROLES
// ==========================================
getRolesAndPermissions()
updateRolePermissions(roleId: string, permissions: string[])

// ==========================================
// SUBSCRIPTIONS (genişletme)
// ==========================================
getSubscriptionById(id: string)
updateSubscription(id: string, data: SubscriptionUpdateInput)
createSubscription(data: NewSubscriptionInput)
updateSubscriptionPlan(planId: string, data: PlanUpdateInput)

// ==========================================
// COUPONS
// ==========================================
getCoupons()
createCoupon(data: CouponInput)
deactivateCoupon(id: string)

// ==========================================
// ADDONS
// ==========================================
getAddons()
createAddon(data: AddonInput)
updateAddon(id: string, data: AddonInput)

// ==========================================
// SUPPORT
// ==========================================
getSupportQueue(filters?: { priority?: string; status?: string; tenantId?: string })
updateSupportTicket(id: string, data: TicketUpdateInput)

// ==========================================
// NPS
// ==========================================
getNPSMetrics()
getNPSResponses(filters?: { period?: string })

// ==========================================
// AUTOMATION
// ==========================================
getAutomationWorkflows()
toggleAutomationWorkflow(id: string)

// ==========================================
// API INTEGRATIONS
// ==========================================
getAPIIntegrations()
getAPIUsageStats()
getAPIKeys()
createAPIKey(name: string)
revokeAPIKey(id: string)

// ==========================================
// KMS
// ==========================================
getKMSKeys()
rotateKMSKey(id: string)

// ==========================================
// AUDIT
// ==========================================
getAuditTrail(filters?: { module?: string; level?: string; from?: Date; to?: Date })

// ==========================================
// ARCHIVE
// ==========================================
getArchiveData(filters?: { olderThanDays?: number })
purgeArchivedData(criteria: PurgeCriteria)

// ==========================================
// MOBILE
// ==========================================
getMobileAppStats()

// ==========================================
// REPORTS
// ==========================================
generateReport(params: ReportParams)
getReportTemplates()

// ==========================================
// SAAS OVERVIEW
// ==========================================
getSaaSOverviewMetrics()

// ==========================================
// TENANT DETAIL
// ==========================================
getTenantById(id: string)
```

### Paralel Veri Çekme Örüntüsü

Veri yoğun sayfalarda `Promise.all` kullanılır:

```typescript
export default async function SomePage() {
  const [metrics, list, alerts] = await Promise.all([
    getSomeMetrics(),
    getSomeList(),
    getSomeAlerts(),
  ])
  // ...
}
```


## 7. Dosya / Klasör Organizasyonu

```
apps/web/
├── app/
│   └── (super-admin)/
│       └── super-admin/
│           ├── page.tsx                          ← Sistem Sağlığı (güncelle)
│           ├── loading.tsx                       ← Suspense fallback
│           ├── tenants/
│           │   ├── page.tsx                      ← Firma Yönetimi (güncelle)
│           │   ├── CreateTenantDialog.tsx
│           │   ├── TenantActionMenu.tsx
│           │   └── [id]/
│           │       └── page.tsx                  ← Tenant Detay (YENİ)
│           ├── analytics/
│           │   └── page.tsx                      ← Analitik (güncelle)
│           ├── logs/
│           │   └── page.tsx                      ← Loglar (güncelle)
│           ├── subscriptions/
│           │   ├── page.tsx                      ← Abonelikler (güncelle)
│           │   ├── [id]/
│           │   │   └── page.tsx                  ← Abonelik Detay (YENİ)
│           │   └── new/
│           │       └── page.tsx                  ← Yeni Abonelik (YENİ)
│           ├── payment-operations/
│           │   └── page.tsx                      ← Ödeme Operasyonları (güncelle)
│           ├── payments/
│           │   └── page.tsx                      ← Ödemeler (güncelle)
│           ├── settings/
│           │   └── page.tsx                      ← Ayarlar (güncelle)
│           ├── notifications/
│           │   └── page.tsx                      ← Bildirimler (güncelle)
│           ├── command-center/
│           │   └── page.tsx                      ← Komuta Merkezi (güncelle)
│           ├── strategic-insights/
│           │   └── page.tsx                      ← Stratejik İçgörüler (güncelle)
│           ├── tenant-performance/
│           │   └── page.tsx                      ← Tenant Performans (güncelle)
│           ├── users/
│           │   └── page.tsx                      ← Kullanıcı Dizini (güncelle)
│           ├── plans/
│           │   └── page.tsx                      ← Abonelik Paketleri (YENİ)
│           ├── coupons/
│           │   └── page.tsx                      ← Kuponlar (YENİ)
│           ├── addons/
│           │   └── page.tsx                      ← Ek Hizmetler (YENİ)
│           ├── roles/
│           │   └── page.tsx                      ← Rol Yönetimi (YENİ)
│           ├── security/
│           │   ├── page.tsx                      ← Güvenlik (YENİ)
│           │   └── components/
│           │       └── ThreatActionMenu.tsx
│           ├── database-health/
│           │   └── page.tsx                      ← DB Sağlık (YENİ)
│           ├── backup-recovery/
│           │   └── page.tsx                      ← Yedekleme (YENİ)
│           ├── cloud-costs/
│           │   └── page.tsx                      ← Bulut Maliyet (YENİ)
│           ├── capacity/
│           │   └── page.tsx                      ← Kapasite (YENİ)
│           ├── infrastructure/
│           │   └── page.tsx                      ← Altyapı (YENİ)
│           ├── deployments/
│           │   └── page.tsx                      ← Dağıtım (YENİ)
│           ├── reports/
│           │   ├── page.tsx                      ← Rapor Sihirbazı (YENİ)
│           │   └── custom/
│           │       └── page.tsx                  ← Özel Rapor (YENİ)
│           ├── saas-overview/
│           │   └── page.tsx                      ← SaaS Genel Bakış (YENİ)
│           ├── support/
│           │   └── page.tsx                      ← Destek Kuyruğu (YENİ)
│           ├── nps/
│           │   └── page.tsx                      ← NPS Paneli (YENİ)
│           ├── automation/
│           │   └── page.tsx                      ← Otomasyon (YENİ)
│           ├── api-integrations/
│           │   └── page.tsx                      ← API Entegrasyonlar (YENİ)
│           ├── developer/
│           │   └── page.tsx                      ← Geliştirici Portal (YENİ)
│           ├── kms/
│           │   └── page.tsx                      ← KMS (YENİ)
│           ├── audit/
│           │   └── page.tsx                      ← Denetim Kasası (YENİ)
│           ├── archive/
│           │   └── page.tsx                      ← Arşiv (YENİ)
│           └── mobile-management/
│               └── page.tsx                      ← Mobil Yönetim (YENİ)
├── components/
│   └── super-admin/
│       ├── Sidebar.tsx                           ← Collapsible (yeniden yaz)
│       └── Footer.tsx                            ← Değişmez
└── lib/
    └── actions/
        └── superadmin.actions.ts                 ← Tüm yeni fonksiyonlar buraya
```


## 8. Veri Akışı

### Okuma Akışı (Server Component)

```
1. Browser → GET /super-admin/some-page?tab=x&page=1
2. middleware.ts → session kontrolü → SUPER_ADMIN değilse /superadmin-login
3. layout.tsx render (Sidebar + main)
4. page.tsx render:
   const data = await getSomeData({ tab, page })
   // getSomeData içinde:
   //   isAdmin(session) kontrolü
   //   prisma.someModel.findMany({ ... })
5. JSX → HTML → Browser
```

### Yazma Akışı (Server Action)

```
1. Client Component → form submit / button click
2. Server Action çağrısı (RPC-like)
3. isAdmin(session) kontrolü
4. Zod doğrulama
5. prisma mutation
6. auditLog.create (kritik işlemler)
7. revalidatePath (önbellek temizle)
8. { success } veya { error } döndür
9. Client Component → toast / redirect
```

### Pagination Örüntüsü

```typescript
// URL: /super-admin/users?page=2&search=ali&role=MECHANIC
const page = parseInt(searchParams?.page || "1")
const pageSize = 50
const skip = (page - 1) * pageSize

const [users, total] = await Promise.all([
  prisma.user.findMany({
    where: whereClause,
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" },
    include: { tenant: { select: { name: true } } }
  }),
  prisma.user.count({ where: whereClause })
])

const totalPages = Math.ceil(total / pageSize)
```

## 9. Güvenlik

### Middleware Koruması

`middleware.ts` içinde super admin rotaları için mevcut koruma tüm yeni rotalara da uygulanır:

```typescript
// middleware.ts — mevcut yapıya ekleme
const superAdminRoutes = [
  "/super-admin",
  // Tüm alt rotalar zaten /super-admin prefix'i ile korunuyor
]

// Yeni rotalar otomatik olarak (super-admin) route group layout'u
// üzerinden auth kontrolüne tabi olur.
// Ek olarak her Server Action'da isAdmin(session) kontrolü yapılır.
```

### İki Katmanlı Koruma

1. **Middleware katmanı**: `session.user.role !== "SUPER_ADMIN"` → redirect
2. **Server Action katmanı**: Her fonksiyonda `isAdmin(session)` kontrolü

### Hassas İşlemler için Onay Diyaloğu

Aşağıdaki işlemler Client Component'te onay diyaloğu gerektirir:
- Toplu veri silme (`purgeArchivedData`)
- Tenant silme (`deleteTenant`)
- KMS anahtar rotasyonu (`rotateKMSKey`)
- Rol izinleri değiştirme (`updateRolePermissions`)

```typescript
// Örnek onay diyaloğu pattern
const [pending, setPending] = useState(false)
const [showConfirm, setShowConfirm] = useState(false)

const handleDangerousAction = async () => {
  if (!showConfirm) { setShowConfirm(true); return }
  setPending(true)
  const result = await dangerousAction(id)
  if (result.error) toast.error(result.error)
  else toast.success(result.success)
  setPending(false)
  setShowConfirm(false)
}
```

### Audit Log Seviyeleri

| Seviye | Kullanım |
|--------|----------|
| `INFO` | Oluşturma, güncelleme, görüntüleme |
| `WARNING` | Silme, iptal, askıya alma |
| `ERROR` | Başarısız işlemler |
| `CRITICAL` | Güvenlik ihlali, toplu silme, anahtar rotasyonu |

## 10. Performans

### Promise.all ile Paralel Veri Çekme

Birden fazla bağımsız sorgu olan sayfalarda paralel çekme zorunludur:

```typescript
// Kötü (sıralı — yavaş)
const metrics = await getMetrics()
const list = await getList()
const alerts = await getAlerts()

// İyi (paralel — hızlı)
const [metrics, list, alerts] = await Promise.all([
  getMetrics(),
  getList(),
  getAlerts(),
])
```

### Pagination Limitleri

| Sayfa | Limit |
|-------|-------|
| Tenant listesi | 50 kayıt/sayfa |
| Kullanıcı dizini | 50 kayıt/sayfa |
| Log görüntüleyici | 100 kayıt/sayfa |
| Denetim kasası | 50 kayıt/sayfa |
| Destek kuyruğu | 25 kayıt/sayfa |

### revalidatePath Stratejisi

```typescript
// Mutasyon sonrası ilgili sayfayı yenile
revalidatePath("/super-admin/tenants")           // tenant işlemleri
revalidatePath("/super-admin/subscriptions")     // abonelik işlemleri
revalidatePath("/super-admin/users")             // kullanıcı işlemleri
revalidatePath("/super-admin")                   // dashboard metrikleri
```

### Loading States

Her sayfa için `loading.tsx` oluşturulur:

```typescript
// app/(super-admin)/super-admin/some-page/loading.tsx
export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-3 text-outline">
        <span className="material-symbols-outlined animate-spin">refresh</span>
        <span className="text-xs font-mono uppercase">Yükleniyor...</span>
      </div>
    </div>
  )
}
```

### URL Query Param ile Filtre State

Filtreler URL'de tutulur; böylece sayfa yenilemesinde ve paylaşımda durum korunur:

```typescript
// Filtre değiştiğinde router.push ile URL güncellenir (Client Component)
const updateFilter = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString())
  params.set(key, value)
  router.push(`?${params.toString()}`)
}
```


## 11. Tasarım Sistemi Referansı

### MD3 Renk Token Haritası (Tailwind CSS 4)

| Token | Değer | Kullanım |
|-------|-------|----------|
| `primary` | `#00175c` | Ana aksiyon, aktif nav, border vurgu |
| `primary-container` | `#00288e` | Kurumsal plan badge, buton hover |
| `tertiary-fixed` | `#6ffbbe` | Yeşil aksan, uptime badge, aktif durum |
| `error` | `#ba1a1a` | Hata durumu, kritik alarm |
| `inverse-surface` | `#2c3134` | Sidebar arka planı |
| `background` | `#f6fafe` | Sayfa arka planı |
| `outline` | (sistem) | İkincil metin, border |
| `surface-container-low` | (sistem) | Input arka planı |

### Ortak Bileşen Stilleri

```typescript
// Aktif nav item
"bg-primary/20 text-white border-l-2 border-primary"

// Pasif nav item
"hover:bg-white/5 text-surface-dim border-l-2 border-transparent"

// Grup başlığı
"text-[9px] font-bold uppercase tracking-widest text-outline"

// Sticky header
"h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40"

// Aktif tab
"px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5"

// Pasif tab
"px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent"

// Durum badge (aktif)
"flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded text-[10px] font-bold uppercase"

// Hata badge
"px-1.5 py-0.5 bg-error text-white text-[9px] font-bold rounded"
```

### HTML → TSX Dönüşüm Kontrol Listesi

Her sayfa dönüşümünde şu adımlar izlenir:

1. `class=""` → `className=""`
2. `for=""` → `htmlFor=""`
3. `<a href="">` → `<Link href="">`
4. Inline `style=""` → Tailwind arbitrary veya `style` prop
5. Statik veri → Server Action çağrısı
6. `onclick=""` → Client Component'e taşı
7. `<select>`, `<input>` → Client Component içinde `useState`
8. SVG grafikleri → inline SVG (değişmez)
9. TypeScript tipleri → `interface` veya `type` ile tanımla
10. `any` tipinden kaçın → Prisma generated types kullan
