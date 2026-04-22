# Design Document — Mobile Design Integration

## Overview

Bu tasarım belgesi, `stitch_otoservis_pro_mobil/otoservis_pro_obsidian/` klasöründeki Stitch HTML/Tailwind tasarım şablonlarının `apps/mobile/` Expo React Native uygulamasına entegrasyonunu kapsar. Entegrasyon iki ana eksende gerçekleşir:

1. **Tasarım Sistemi Uygulaması** — Obsidian renk paleti, tipografi, gölge ve bileşen standartlarının tüm ekranlara yansıtılması
2. **Ekran Genişletmesi** — Mevcut placeholder ekranların yeniden tasarlanması ve 40+ yeni ekranın oluşturulması

Uygulama, çok kiracılı (multi-tenant) SaaS mimarisinde çalışır. Mobil istemci, `apps/web/app/api/mobile/*` endpoint'lerini tüketir; kimlik doğrulama JWT tabanlıdır ve her istek `tenantId` ile izole edilir.

---

## Architecture

### Genel Mimari

```
┌─────────────────────────────────────────────────────────┐
│                   Expo React Native App                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  (auth)/     │  │  (firma)/    │  │  (musteri)/   │  │
│  │  login       │  │  Tab Nav     │  │  Tab Nav      │  │
│  │  sms-dogrula │  │  + Stack     │  │  + Stack      │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Shared Layer                           │ │
│  │  components/  │  lib/  │  constants/theme.ts        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              State & Data Layer                     │ │
│  │  Zustand (auth, ui)  │  TanStack Query (server)     │ │
│  │  offline-store.ts    │  api.ts (HTTP client)        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ HTTPS / JWT
┌─────────────────────────────────────────────────────────┐
│              Next.js Web App (apps/web)                  │
│  /api/mobile/firma/*   │   /api/mobile/musteri/*         │
│  NextAuth v5 JWT       │   Prisma + PostgreSQL           │
└─────────────────────────────────────────────────────────┘
```

### Navigasyon Hiyerarşisi

```
app/
├── _layout.tsx                    ← Root: QueryClient + StatusBar
├── (auth)/
│   ├── login.tsx                  ← Giriş ekranı
│   └── sms-dogrula.tsx            ← OTP doğrulama (YENİ)
├── (firma)/
│   ├── _layout.tsx                ← Tab Navigator (Panel/Kuyruk/Stok/Personel/Finans)
│   ├── panel.tsx                  ← KPI bento grid (YENİDEN TASARLA)
│   ├── kuyruk.tsx                 ← İş kuyruğu (YENİDEN TASARLA)
│   ├── finans.tsx                 ← Finansal özet (YENİDEN TASARLA)
│   ├── personel.tsx               ← Personel listesi (YENİDEN TASARLA)
│   ├── stok.tsx                   ← Stok özeti (YENİDEN TASARLA)
│   ├── servis-detay/[id].tsx      ← Servis detay + checklist (YENİ)
│   ├── is-kapat/[id].tsx          ← İş kapatma + QC (YENİ)
│   ├── onay.tsx                   ← Onay merkezi (YENİ)
│   ├── barkod.tsx                 ← Barkod tarayıcı (YENİ)
│   ├── depolar.tsx                ← Depo listesi (YENİ)
│   ├── depo/[id].tsx              ← Depo detay (YENİ)
│   ├── parca-talep.tsx            ← Parça talep formu (YENİ)
│   ├── stok-guncelle/[id].tsx     ← Stok güncelleme (YENİ)
│   ├── stok-hareketler.tsx        ← Stok hareketleri (YENİ)
│   ├── personel/[id].tsx          ← Personel detay (YENİ)
│   ├── personel-performans.tsx    ← Performans metrikleri (YENİ)
│   ├── vardiya.tsx                ← Vardiya takvimi (YENİ)
│   ├── gelir-raporu.tsx           ← Gelir raporu (YENİ)
│   ├── servis-raporu.tsx          ← Servis metrikleri (YENİ)
│   ├── raporlar.tsx               ← İndirilebilir raporlar (YENİ)
│   ├── tahsilat-ekle.tsx          ← Tahsilat formu (YENİ)
│   ├── tahsilatlar.tsx            ← Tahsilat listesi (YENİ)
│   ├── tahsilat/[id].tsx          ← Tahsilat detay (YENİ)
│   ├── fatura/[id].tsx            ← Fatura detay (YENİ)
│   ├── bildirimler.tsx            ← Bildirimler (YENİ)
│   ├── ayarlar.tsx                ← Uygulama ayarları (YENİ)
│   ├── destek.tsx                 ← Destek/SSS (YENİ)
│   ├── mesajlar.tsx               ← Mesajlaşma (YENİ)
│   └── hizmetler.tsx              ← Hizmet kataloğu (YENİ)
└── (musteri)/
    ├── _layout.tsx                ← Tab Navigator (Panel/Takip/Geçmiş/Randevu/Profil)
    ├── panel.tsx                  ← Aktif servis hero (YENİDEN TASARLA)
    ├── takip.tsx                  ← Canlı takip (YENİDEN TASARLA)
    ├── gecmis.tsx                 ← Servis geçmişi (YENİDEN TASARLA)
    ├── randevu.tsx                ← 3-adım wizard (YENİDEN TASARLA)
    ├── profil.tsx                 ← Sadakat programı (YENİDEN TASARLA)
    ├── servis/[id].tsx            ← Servis detay (YENİ)
    ├── arac-ekle.tsx              ← Araç kayıt wizard (YENİ)
    ├── odeme.tsx                  ← Ödeme ekranı (YENİ)
    ├── odeme-taksit.tsx           ← Taksit seçenekleri (YENİ)
    ├── makbuz/[id].tsx            ← Ödeme makbuzu (YENİ)
    ├── kartlar.tsx                ← Kayıtlı kartlar (YENİ)
    ├── odemeler.tsx               ← Ödeme geçmişi (YENİ)
    ├── onboarding.tsx             ← İlk açılış (YENİ)
    ├── mesajlar.tsx               ← Mesajlaşma (YENİ)
    ├── bildirimler.tsx            ← Bildirimler (YENİ)
    └── belgeler/[id].tsx          ← Servis belgeleri (YENİ)
```

### State Yönetimi

```
Zustand Stores:
├── useAuthStore         ← token, user (role, tenantId, customerId), isAuthenticated
├── useUIStore           ← theme, locale, isOffline
└── useWizardStore       ← step, formData (randevu ve araç-ekle wizard'ları için)

TanStack Query:
├── queryKey: ["firma-panel"]          staleTime: 5dk
├── queryKey: ["firma-kuyruk"]         staleTime: 1dk
├── queryKey: ["firma-servis", id]     staleTime: 30sn
├── queryKey: ["musteri-panel"]        staleTime: 5dk
├── queryKey: ["musteri-servis", id]   staleTime: 30sn
└── ... (her endpoint için ayrı key)
```

---

## Components and Interfaces

### Design Token Sistemi

`apps/mobile/constants/theme.ts` dosyası tüm tasarım tokenlarını merkezi olarak tanımlar:

```typescript
export const Colors = {
  primary: '#00236f',
  primaryContainer: '#1e3a8a',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  error: '#ba1a1a',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerLowest: '#ffffff',
  outline: '#757682',
  outlineVariant: '#c5c5d3',
} as const;

export const Radius = {
  sm: 8,
  md: 12,   // XL
  lg: 16,   // 2XL
  xl: 24,
} as const;

export const Shadow = {
  navy: {
    shadowColor: 'rgba(0,35,111,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 4,
  },
} as const;

export const GradientCTA = ['#3B82F6', '#1E3A8A'] as const;
```

### Shared Components

#### `GlassHeader.tsx`
```typescript
interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}
```
- `backgroundColor: 'rgba(255,255,255,0.8)'` + BlurView (expo-blur)
- Navy shadow uygulanır
- SafeAreaView padding dahil

#### `KpiCard.tsx`
```typescript
interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'primary' | 'surface' | 'success' | 'warning';
  trend?: { value: number; direction: 'up' | 'down' };
}
```
- `variant='primary'` → `primaryContainer` arka plan, beyaz metin
- `variant='surface'` → `surfaceContainerLowest` arka plan, `onSurface` metin
- Minimum 48dp touch target

#### `StatusBadge.tsx`
```typescript
interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}
// Status → renk eşlemesi:
// PENDING           → #f59e0b (amber)
// IN_PROGRESS       → primaryContainer (#1e3a8a)
// WAITING_APPROVAL  → #f97316 (orange)
// COMPLETED         → secondary (#006c49)
// CANCELLED         → error (#ba1a1a)
```

#### `PrimaryButton.tsx`
```typescript
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gradient' | 'outline' | 'ghost';
}
// gradient → LinearGradient ['#3B82F6', '#1E3A8A'] 135°
// Minimum height: 48dp
```

#### `ServiceCard.tsx`
```typescript
interface ServiceCardProps {
  order: {
    id: string;
    plate: string;
    vehicleModel: string;
    complaint: string;
    status: string;
    isUrgent: boolean;
    mechanicName?: string;
    completionPercentage: number;
  };
  onPress: () => void;
  showPriorityBorder?: boolean;
}
// isUrgent=true  → sol border: error (#ba1a1a) + "ACİL" badge
// isUrgent=false → sol border: primaryContainer (#1e3a8a)
```

#### `MechanicAvatar.tsx`
```typescript
interface MechanicAvatarProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: number; // default: 40
}
// avatarUrl varsa <Image>, yoksa initials (firstName[0] + lastName[0])
// Initials arka planı: primaryContainer
```

#### `ProgressBar.tsx`
```typescript
interface ProgressBarProps {
  value: number;   // 0-100
  color?: string;  // default: secondary
  height?: number; // default: 6
  animated?: boolean;
}
// Animated.Value ile smooth geçiş
// Arka plan: surfaceContainerHigh
```

#### `SegmentedControl.tsx`
```typescript
interface SegmentedControlProps {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
}
// Seçili: primaryContainer arka plan, beyaz metin
// Seçilmemiş: surfaceContainer arka plan, onSurface metin
// Minimum 48dp height
```

#### `StepIndicator.tsx`
```typescript
interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}
// Tamamlanan: secondary dolu daire
// Aktif: primaryContainer dolu daire
// Bekleyen: surfaceContainerHigh daire
```

---

## Data Models

### Prisma Schema Değişiklikleri

#### Vehicle modeline eklenenler
```prisma
model Vehicle {
  // ... mevcut alanlar ...
  imageUrl    String?  @db.Text   // Araç fotoğrafı (S3 URL)
}
```

#### Mechanic modeline eklenenler
```prisma
model Mechanic {
  // ... mevcut alanlar ...
  avatarUrl   String?  @db.Text
  shiftStart  String?  @db.VarChar(5)   // "08:00"
  shiftEnd    String?  @db.VarChar(5)   // "18:00"
  workDays    String[]                  // ["MON","TUE","WED","THU","FRI"]
  dailyTarget Int?
}
```

#### ServiceOrder modeline eklenenler
```prisma
model ServiceOrder {
  // ... mevcut alanlar ...
  qualityCheckNotes  String?   @db.Text
  qualityCheckedAt   DateTime?
  qualityCheckedBy   String?   @db.VarChar(255)
}
```

#### Yeni model: MaintenancePlan
```prisma
model MaintenancePlan {
  id          String    @id @default(uuid())
  tenantId    String
  vehicleId   String
  title       String    @db.VarChar(255)
  dueDate     DateTime? @db.Date
  dueMileage  Int?
  isCompleted Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])

  @@index([tenantId])
  @@index([vehicleId])
}
```

#### Yeni model: ServiceRating
```prisma
model ServiceRating {
  id             String   @id @default(uuid())
  tenantId       String
  serviceOrderId String   @unique
  customerId     String
  rating         Int      // 1-5
  comment        String?  @db.Text
  createdAt      DateTime @default(now())

  tenant         Tenant       @relation(fields: [tenantId], references: [id])
  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  customer       Customer     @relation(fields: [customerId], references: [id])

  @@index([tenantId])
  @@index([serviceOrderId])
}
```

### API Response Tipleri

```typescript
// Firma Panel
interface FirmaPanelResponse {
  overview: {
    userName: string;
    firmName: string;
    dailyRevenue: number;
    activeServicesCount: number;
    completedTodayCount: number;
    criticalAlertCount: number;
    collectionTotal: number;
    weeklyChart: { day: string; revenue: number; expense: number }[];
    bayStatus: { bayId: string; plate?: string; status: 'EMPTY' | 'OCCUPIED' | 'WAITING' }[];
    approvalQueue: ServiceOrderSummary[];
    escalations: ServiceOrderSummary[];
    criticalParts: PartSummary[];
  };
}

// Servis Detay
interface ServisDetayResponse {
  order: {
    id: string;
    orderNumber: number;
    status: string;
    isUrgent: boolean;
    completionPercentage: number;
    complaintDescription: string;
    vehicle: { plate: string; brand: string; model: string; year?: number; imageUrl?: string };
    customer: { firstName?: string; lastName?: string; phone: string };
    assignedMechanic?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
    items: ServiceItemSummary[];
    qualityCheckNotes?: string;
    qualityCheckedAt?: string;
  };
}

// Müşteri Profil
interface MusteriProfilResponse {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    rewardPoints: number;
    membershipTier: 'STANDARD' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    balance: number;
  };
  tierProgress: {
    currentTier: string;
    nextTier: string;
    currentPoints: number;
    requiredPoints: number;
    progressPercent: number;
  };
  vehicles: VehicleSummary[];
  recentTransactions: LoyaltyTransactionSummary[];
}
```

### Yeni API Endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/mobile/firma/servis/[id]` | Servis detay + checklist |
| PATCH | `/api/mobile/firma/servis/[id]/kapat` | İş kapat (COMPLETED + push) |
| GET | `/api/mobile/firma/onay` | WAITING_APPROVAL listesi |
| POST | `/api/mobile/firma/onay/[id]` | Onayla / Reddet |
| GET | `/api/mobile/firma/personel/[id]` | Personel detay + performans |
| GET | `/api/mobile/firma/stok/hareketler` | Sayfalandırılmış stok hareketleri |
| GET | `/api/mobile/musteri/servis/[id]` | Müşteri servis detay |
| POST | `/api/mobile/musteri/servis/[id]/rating` | Servis puanla |
| POST | `/api/mobile/musteri/arac` | Yeni araç ekle |
| GET | `/api/mobile/musteri/profil` | Profil + loyalty tier |

---

## Correctness Properties

### Property 1: Tasarım Token Renk Tutarlılığı
*For any* bileşen `Colors` token'ını kullanıyorsa, render edilen stil içindeki renk değerleri Obsidian paleti hex değerleriyle birebir eşleşmelidir.
**Validates: Requirement 2.1**

### Property 2: Kart Bileşenlerinde Border Radius Minimum Değeri
*For any* kart bileşeni render edildiğinde, `borderRadius` değeri 12dp'den küçük olmamalı ve `borderWidth: 1` içeren hiçbir stil kuralı bulunmamalıdır.
**Validates: Requirement 2.3**

### Property 3: Touch Target Minimum Boyutu
*For any* dokunulabilir eleman render edildiğinde, hesaplanan yükseklik ve genişlik değerleri 48dp'den küçük olmamalıdır.
**Validates: Requirement 2.4**

### Property 4: Floating Eleman Navy Shadow
*For any* elevation/shadow içeren bileşen render edildiğinde, `shadowColor` değeri navy-tinted (`rgba(0,35,111,x)`) olmalıdır; saf siyah kullanılmamalıdır.
**Validates: Requirement 2.7**

### Property 5: Servis Kartı Öncelik Renk Eşlemesi
*For any* `ServiceCard` bileşeni `showPriorityBorder=true` ile render edildiğinde, `isUrgent=true` → sol border `error (#ba1a1a)`, `isUrgent=false` → sol border `primaryContainer (#1e3a8a)` olmalıdır.
**Validates: Requirement 4.3**

### Property 6: Gecikmiş Alacak Renk Uygulaması
*For any* alacak kaydı `dueDate < Date.now()` koşulunu sağlıyorsa, render edilen metin ve badge rengi `error (#ba1a1a)` olmalıdır.
**Validates: Requirement 5.4**

### Property 7: Checklist Tamamlanma Yüzdesi Hesabı
*For any* N elemanlı checklist'te K eleman işaretlendiğinde, `completionPercentage = Math.floor((K / N) * 100)` eşitliği sağlanmalıdır. N=0 durumunda completionPercentage=0 olmalıdır.
**Validates: Requirement 8.3**

### Property 8: Tier İlerleme Yüzdesi Hesabı
*For any* `rewardPoints` değeri için, `tierProgress.progressPercent` değeri `[0, 100]` aralığında olmalı ve `(currentPoints - tierMin) / (tierMax - tierMin) * 100` formülüyle hesaplanmalıdır.
**Validates: Requirement 21.2**

---

## Error Handling

- **401 Unauthorized** → `useAuthStore.logout()`, `(auth)/login`'e yönlendir, AsyncStorage temizle
- **403 Forbidden** → Toast: "Bu işlem için yetkiniz yok"
- **404 Not Found** → Empty state: "Kayıt bulunamadı"
- **500 Server Error** → Toast + Sentry raporu
- **Offline** → `offline-store.ts`'den cache oku; cache yoksa "Çevrimdışısınız" banner
- **Kamera izni reddedildi** → Açıklama ekranı + Ayarlar'a yönlendirme
- **Biyometrik başarısız** → PIN fallback

---

## Testing Strategy

### Property-Based Testler (fast-check)

| Property | Test Dosyası |
|----------|-------------|
| P1: Renk token tutarlılığı | `theme.property.test.ts` |
| P2: Kart border radius | `card-components.property.test.ts` |
| P3: Touch target boyutu | `touch-targets.property.test.ts` |
| P4: Navy shadow | `shadow.property.test.ts` |
| P5: Servis kartı öncelik rengi | `service-card.property.test.ts` |
| P6: Gecikmiş alacak rengi | `overdue-color.property.test.ts` |
| P7: Checklist yüzdesi | `checklist.property.test.ts` |
| P8: Tier ilerleme yüzdesi | `tier-progress.property.test.ts` |

Her test minimum 100 iterasyon çalıştırır. Tag formatı: `// Feature: mobile-design-integration, Property {N}: {property_text}`

### Entegrasyon Testleri

API endpoint'leri `apps/web/__tests__/api/mobile/` dizininde test edilir:
- Auth enforcement (401 kontrolü)
- Tenant isolation (farklı tenantId ile veri sızıntısı kontrolü)
- Response shape doğrulaması
