# Tasarım Belgesi — Web-Mobile Senkronizasyonu

## Genel Bakış

Bu belge, `apps/mobile/` uygulamasında tamamlanan tüm ekranları ve Prisma şemasına eklenen yeni modelleri (`MaintenancePlan`, `ServiceRating`) ile yeni alanları web uygulamasına (`apps/web`) yansıtmak için gereken teknik tasarımı kapsar.

Kapsam dört ana başlıkta özetlenir:

1. **Dashboard güncellemeleri** — Yeni DB alanlarının (`Vehicle.imageUrl`, `Mechanic` vardiya alanları, `ServiceOrder` kalite kontrol alanları) mevcut dashboard sayfalarına entegrasyonu; `ServiceRating` ve `MaintenancePlan` yönetim arayüzleri
2. **Web firma portalı** — `/m/firma/*` altında 22 eksik ekranın oluşturulması
3. **Web müşteri portalı** — `/m/musteri/*` altında 8 eksik ekranın oluşturulması
4. **Yeni API endpoint'leri** — Dashboard için `ServiceRating` ve `MaintenancePlan` CRUD; firma/müşteri portalı için finans, bildirim, mesaj ve yardımcı endpoint'ler

Tüm değişiklikler mevcut Next.js 15 App Router, Prisma ORM, NextAuth v5 ve Tailwind CSS 4 altyapısı üzerine inşa edilir. Mobil uygulama ve web portalı aynı `/api/mobile/*` endpoint'lerini paylaşır; bu sayede veri tutarlılığı garanti altına alınır.

---

## Mimari

### Genel Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js 15)                    │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  /dashboard/*    │  │  /m/firma/*      │  │ /m/musteri/* │  │
│  │  (TENANT_ADMIN,  │  │  (Web Firma      │  │ (Web Müşteri │  │
│  │   MECHANIC,      │  │   Portalı)       │  │  Portalı)    │  │
│  │   RECEPTIONIST,  │  │                  │  │              │  │
│  │   ACCOUNTANT)    │  │                  │  │              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           ▼                     ▼                    ▼          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer                             │   │
│  │  /api/dashboard/*   /api/mobile/firma/*   /api/mobile/   │   │
│  │  (Dashboard CRUD)   (Firma Portal + RN)   musteri/*      │   │
│  │                                           (Müşteri +RN)  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              Server Actions (lib/actions/*.ts)            │   │
│  │  vehicle.actions  mechanic.actions  service.actions  ...  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │  @repo/database (Prisma)  │
              │  PostgreSQL               │
              └───────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │  apps/mobile     │           │  AWS S3           │
    │  (Expo RN)       │           │  (Dosya Depolama) │
    │  /api/mobile/*   │           └──────────────────┘
    │  endpoint'lerini │
    │  tüketir         │
    └──────────────────┘
```

### Veri Akışı

**Dashboard Güncellemeleri:**
```
Kullanıcı (TENANT_ADMIN) → /dashboard/vehicles/[id]
  → Server Component (page.tsx)
  → Server Action (getVehicleById)
  → Prisma (Vehicle + imageUrl)
  → VehicleDetailClient (Client Component)
  → /api/upload (S3 yükleme)
  → Server Action (updateVehicle)
```

**Web Firma Portalı:**
```
Kullanıcı (MECHANIC/TENANT_ADMIN) → /m/firma/servis-detay/[id]
  → Server Component (page.tsx)
  → fetch('/api/mobile/firma/servis/[id]')  ← Mobil ile aynı endpoint
  → API Route Handler (auth + tenantId check)
  → Prisma (ServiceOrder + ilişkiler)
  → Client Component (render)
```

**Gerçek Zamanlı Güncellemeler (SSE):**
```
Servis emri statüsü değişir
  → Server Action (updateServiceOrder)
  → lib/sse.ts (broadcastToTenant)
  → /api/events/[tenantId] (SSE stream)
  → Web portal sayfaları (EventSource listener)
```

### Kimlik Doğrulama ve Yetkilendirme

- **Dashboard**: `auth()` → `session.user.role` kontrolü (TENANT_ADMIN, MECHANIC, RECEPTIONIST, ACCOUNTANT)
- **Web Firma Portalı**: `auth()` → `session.user.tenantId` + rol kontrolü
- **Web Müşteri Portalı**: `auth()` → `session.user.customerId` kontrolü (CUSTOMER rolü)
- **API Endpoint'leri**: Her route handler'da `auth()` çağrısı zorunlu; `tenantId` izolasyonu

### Paylaşılan Endpoint Stratejisi

Web firma/müşteri portalları, React Native mobil uygulamasıyla **aynı** `/api/mobile/*` endpoint'lerini kullanır. Bu tasarım kararının gerekçeleri:

- Tek kaynak gerçeği (single source of truth) — veri tutarsızlığı riski ortadan kalkar
- Endpoint bakım maliyeti yarıya iner
- Mobil ve web arasında davranış paritesi garanti edilir

Yalnızca dashboard'a özgü işlemler (`ServiceRating` silme, `MaintenancePlan` CRUD) `/api/dashboard/*` altında ayrı endpoint'lere sahiptir.

---

## Bileşenler ve Arayüzler

### Bölüm 1: Dashboard Güncellemeleri

#### 1.1 Araç Detay Sayfası — Fotoğraf Desteği

**Dosya:** `apps/web/app/(dashboard)/dashboard/vehicles/[id]/VehicleDetailClient.tsx`

Mevcut `VehicleDetailClient` bileşenine yeni bir "Araç Fotoğrafı" kartı eklenir.

```typescript
// Yeni prop alanı (Vehicle tipine eklenir)
interface VehicleWithImage {
  // ... mevcut alanlar
  imageUrl: string | null;
}

// Yeni bileşen parçası
function VehicleImageCard({ vehicle }: { vehicle: VehicleWithImage }) {
  // imageUrl varsa: <Image> bileşeni (16:9 oranı, object-cover)
  // imageUrl yoksa: marka baş harfleri placeholder
  // "Fotoğraf Yükle" butonu → /api/upload → updateVehicle Server Action
}
```

**Server Action (güncelleme):**
```typescript
// lib/actions/vehicle.actions.ts
export async function updateVehicleImage(
  vehicleId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }>
```

#### 1.2 Usta Detay Sayfası — Yeni Alanlar

**Dosya:** `apps/web/app/(dashboard)/dashboard/mechanics/[id]/MechanicDetailClient.tsx`

Mevcut `MechanicDetailClient` bileşenine yeni bir "Vardiya & Hedef" bölümü eklenir.

```typescript
interface MechanicWithShift {
  // ... mevcut alanlar
  avatarUrl: string | null;
  shiftStart: string | null;  // "08:00"
  shiftEnd: string | null;    // "18:00"
  workDays: string[];         // ["MON","TUE","WED","THU","FRI"]
  dailyTarget: number | null;
}

// Yardımcı fonksiyon
function formatShiftTime(start: string | null, end: string | null): string
// Örnek: "08:00 – 18:00" veya "Tanımlanmamış"

function formatWorkDays(days: string[]): string
// Örnek: "Pzt, Sal, Çar, Per, Cum"

// Gün kısaltma haritası
const DAY_MAP: Record<string, string> = {
  MON: "Pzt", TUE: "Sal", WED: "Çar",
  THU: "Per", FRI: "Cum", SAT: "Cmt", SUN: "Paz"
}
```

**Usta Düzenleme Formu — Yeni Alanlar:**
```typescript
// Zod şeması (lib/validations/mechanic.ts'e eklenir)
const shiftSchema = z.object({
  shiftStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli").nullable(),
  shiftEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli").nullable(),
  workDays: z.array(z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])),
  dailyTarget: z.number().int().positive().nullable(),
  avatarUrl: z.string().url().nullable(),
})
```

#### 1.3 Servis Detay Sayfası — Kalite Kontrol Bölümü

**Dosya:** `apps/web/app/(dashboard)/dashboard/services/[id]/page.tsx`

Mevcut servis detay sayfasına yeni bir "Kalite Kontrol" bölümü eklenir.

```typescript
// Yeni bileşen (aynı dosyaya veya ayrı component'e)
function QualityControlSection({
  order
}: {
  order: ServiceOrderWithQC
}) {
  // qualityCheckedAt varsa: tarih/saat + qualityCheckedBy + qualityCheckNotes
  // yoksa: "Kalite kontrolü henüz yapılmadı" mesajı
  // COMPLETED statüsünde: düzenlenebilir form
}

// Server Action
export async function updateQualityCheck(
  serviceOrderId: string,
  data: { qualityCheckNotes: string }
): Promise<{ success: boolean; error?: string }>
// qualityCheckedBy: session.user.name
// qualityCheckedAt: new Date()
```

#### 1.4 Servis Detay Sayfası — ServiceRating Bölümü

**Dosya:** `apps/web/app/(dashboard)/dashboard/services/[id]/page.tsx`

```typescript
function ServiceRatingSection({
  serviceOrderId,
  rating
}: {
  serviceOrderId: string;
  rating: ServiceRating | null;
}) {
  // rating varsa: yıldız gösterimi (salt okunur) + yorum + tarih
  // yoksa: "Henüz değerlendirme yapılmadı"
}
```

#### 1.5 Analytics Sayfası — ServiceRating Metrikleri

**Dosya:** `apps/web/app/(dashboard)/dashboard/analytics/page.tsx`

Mevcut analytics sayfasına yeni bir "Müşteri Memnuniyeti" bölümü eklenir.

```typescript
// Yeni veri çekme (Server Component içinde)
const [ratingStats] = await Promise.all([
  // ... mevcut sorgular
  prisma.serviceRating.aggregate({
    where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
    _avg: { rating: true },
    _count: { rating: true }
  })
])

// Puan dağılımı için ayrı sorgu
const ratingDistribution = await prisma.serviceRating.groupBy({
  by: ['rating'],
  where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
  _count: { rating: true }
})
```

#### 1.6 Vehicles Detay — MaintenancePlan Sekmesi

**Dosya:** `apps/web/app/(dashboard)/dashboard/vehicles/[id]/VehicleDetailClient.tsx`

Mevcut araç detay sayfasına "Bakım Planları" sekmesi eklenir.

```typescript
// Sekme bileşeni
function MaintenancePlansTab({ vehicleId }: { vehicleId: string }) {
  // Bakım planları listesi
  // "Yeni Bakım Planı" butonu → modal form
  // Gecikmiş planlar kırmızı vurgu (dueDate < now && !isCompleted)
}

// Form şeması
const maintenancePlanSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  dueDate: z.string().datetime().nullable(),
  dueMileage: z.number().int().positive().nullable(),
})
```

#### 1.7 Staff Sayfası — Vardiya Takvimi Görünümü

**Dosya:** `apps/web/app/(dashboard)/dashboard/staff/page.tsx`

Mevcut personel sayfasına "Vardiya Takvimi" sekmesi eklenir.

```typescript
function ShiftCalendarView({ mechanics }: { mechanics: MechanicWithShift[] }) {
  // Tablo: satır = usta, sütun = gün (Pzt-Paz)
  // Her hücre: shiftStart-shiftEnd veya "-"
  // Tıklanabilir hücre → inline düzenleme formu
}
```

#### 1.8 Inventory Sayfası — Stok Hareketleri Sekmesi

**Dosya:** `apps/web/app/(dashboard)/dashboard/inventory/page.tsx`

Mevcut stok sayfasına "Stok Hareketleri" sekmesi eklenir.

```typescript
// Renk kodlaması
const MOVEMENT_COLORS = {
  IN: "text-green-700 bg-green-50",
  OUT: "text-red-700 bg-red-50",
  ADJUST: "text-yellow-700 bg-yellow-50"
}

// Sayfalandırma: cursor-based pagination
interface StockMovementsQuery {
  page: number;
  limit: number;
  partName?: string;
  startDate?: string;
  endDate?: string;
}
```

---

### Bölüm 2: Web Firma Portalı — Yeni Ekranlar

Tüm yeni firma portalı ekranları `apps/web/app/m/firma/` altında oluşturulur. Her ekran:
- Server Component (page.tsx) — veri çekme + auth kontrolü
- Client Component (*Client.tsx) — etkileşimli UI

#### Ortak Layout Bileşeni

**Dosya:** `apps/web/app/m/firma/layout.tsx` (mevcut, genişletilecek)

Mevcut layout'a yeni navigasyon linkleri eklenir:
- Servis Detay, İş Kapat, Onay Merkezi (mevcut kuyruk'tan erişim)
- Barkod, Depolar, Stok Hareketleri, Parça Talep
- Personel Detay, Performans, Vardiya
- Gelir Raporu, Servis Raporu, Raporlar
- Tahsilat Ekle, Tahsilatlar, Fatura Detay
- Bildirimler, Mesajlar, Hizmetler, Destek

#### Yeni Ekran Listesi ve Bileşen İmzaları

```typescript
// /m/firma/servis-detay/[id]/page.tsx
interface ServisDetayPageProps {
  params: Promise<{ id: string }>
}
// fetch: GET /api/mobile/firma/servis/[id]
// Render: araç hero, müşteri/usta bilgisi, ilerleme çubuğu, butonlar

// /m/firma/is-kapat/[id]/page.tsx
// fetch: GET /api/mobile/firma/servis/[id] (özet için)
// Action: PATCH /api/mobile/firma/servis/[id]/kapat
// Form: qualityCheckNotes (zorunlu)

// /m/firma/onay/page.tsx
// fetch: GET /api/mobile/firma/onay
// Actions: POST /api/mobile/firma/onay/[id] (approve/reject)
// Modal: red gerekçesi

// /m/firma/barkod/page.tsx
// Client-only: navigator.mediaDevices.getUserMedia
// fetch: GET /api/mobile/firma/stok?barcode={code}

// /m/firma/depolar/page.tsx
// fetch: GET /api/mobile/firma/depolar

// /m/firma/depo/[id]/page.tsx
// fetch: GET /api/mobile/firma/depolar/[id]

// /m/firma/parca-talep/page.tsx
// fetch: GET /api/mobile/firma/depolar (depo listesi)
// Action: POST /api/mobile/firma/stok/talep

// /m/firma/stok-guncelle/[id]/page.tsx
// fetch: GET /api/mobile/firma/stok?partId={id}
// Action: POST /api/mobile/firma/stok/[id]/guncelle

// /m/firma/stok-hareketler/page.tsx
// fetch: GET /api/mobile/firma/stok/hareketler?page=1&limit=20
// Infinite scroll

// /m/firma/personel/[id]/page.tsx
// fetch: GET /api/mobile/firma/personel/[id]

// /m/firma/personel-performans/page.tsx
// fetch: GET /api/mobile/firma/personel (tüm ustalar + metrikler)

// /m/firma/vardiya/page.tsx
// fetch: GET /api/mobile/firma/personel (shiftStart/shiftEnd/workDays)

// /m/firma/gelir-raporu/page.tsx
// fetch: GET /api/mobile/firma/finans/gelir-raporu?month=YYYY-MM
// PDF: jsPDF export

// /m/firma/servis-raporu/page.tsx
// fetch: GET /api/mobile/firma/finans/servis-raporu?period=week|month

// /m/firma/raporlar/page.tsx
// Statik liste + PDF indirme linkleri

// /m/firma/tahsilat-ekle/page.tsx
// fetch: GET /api/mobile/musteri/panel (müşteri listesi için)
// Action: POST /api/mobile/firma/finans/tahsilat

// /m/firma/tahsilatlar/page.tsx
// fetch: GET /api/mobile/firma/finans/tahsilatlar?page=1&limit=20

// /m/firma/tahsilat/[id]/page.tsx
// fetch: GET /api/mobile/firma/finans/tahsilat/[id]
// PDF: makbuz export

// /m/firma/fatura/[id]/page.tsx
// fetch: GET /api/mobile/firma/finans/fatura/[id]
// PDF: fatura export

// /m/firma/bildirimler/page.tsx
// fetch: GET /api/mobile/firma/bildirimler
// Action: PATCH /api/mobile/firma/bildirimler/[id]/oku

// /m/firma/mesajlar/page.tsx
// fetch: GET /api/mobile/firma/mesajlar
// SSE: /api/events/[tenantId] (gerçek zamanlı)
// Action: POST /api/mobile/firma/mesajlar

// /m/firma/hizmetler/page.tsx
// fetch: GET /api/mobile/firma/hizmetler

// /m/firma/destek/page.tsx
// Statik SSS + Action: POST /api/mobile/firma/destek
```

---

### Bölüm 3: Web Müşteri Portalı — Yeni Ekranlar

```typescript
// /m/musteri/servis/[id]/page.tsx
// fetch: GET /api/mobile/musteri/servis/[id]
// Action: POST /api/mobile/musteri/servis/[id]/rating
// Koşul: customerId doğrulaması

// /m/musteri/odeme/page.tsx
// fetch: GET /api/musteri/odeme (bekleyen fatura)
// Action: POST /api/musteri/odeme

// /m/musteri/odeme-taksit/page.tsx
// Statik taksit seçenekleri (2/3/6/12)
// Action: POST /api/musteri/odeme-taksit

// /m/musteri/makbuz/[id]/page.tsx
// fetch: GET /api/musteri/makbuz/[id]
// PDF: makbuz export

// /m/musteri/kartlar/page.tsx
// fetch: GET /api/musteri/kartlar (Stripe)
// Stripe Elements: kart ekleme
// Action: DELETE /api/musteri/kartlar/[id]

// /m/musteri/odemeler/page.tsx
// fetch: GET /api/musteri/odemeler?page=1&limit=20

// /m/musteri/onboarding/page.tsx
// Client-only: localStorage kontrolü
// Slayt bileşeni (4 özellik tanıtımı)

// /m/musteri/bildirimler/page.tsx
// fetch: GET /api/musteri/bildirimler
// Action: PATCH /api/musteri/bildirimler/[id]/oku
```

---

### Bölüm 4: Yeni API Endpoint'leri

#### Dashboard API'leri

```typescript
// GET /api/dashboard/ratings
// Response:
interface RatingsListResponse {
  ratings: Array<{
    id: string;
    serviceOrderId: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

// GET /api/dashboard/ratings/stats
interface RatingStatsResponse {
  average: number;
  total: number;
  distribution: Record<1|2|3|4|5, number>;
  period: "last30days";
}

// DELETE /api/dashboard/ratings/[id]
// 204 No Content — yalnızca TENANT_ADMIN

// GET /api/dashboard/maintenance-plans?vehicleId={id}
interface MaintenancePlansResponse {
  plans: Array<{
    id: string;
    vehicleId: string;
    title: string;
    dueDate: string | null;
    dueMileage: number | null;
    isCompleted: boolean;
    isOverdue: boolean; // computed: dueDate < now && !isCompleted
    createdAt: string;
  }>;
}

// POST /api/dashboard/maintenance-plans
interface CreateMaintenancePlanBody {
  vehicleId: string;
  title: string;
  dueDate?: string; // ISO 8601
  dueMileage?: number;
}

// PATCH /api/dashboard/maintenance-plans/[id]
interface UpdateMaintenancePlanBody {
  isCompleted?: boolean;
  dueDate?: string;
  dueMileage?: number;
  title?: string;
}

// DELETE /api/dashboard/maintenance-plans/[id]
// 204 No Content
```

#### Firma Portal Finans API'leri

```typescript
// GET /api/mobile/firma/finans/gelir-raporu?month=YYYY-MM
interface GelirRaporuResponse {
  month: string;
  total: number;
  breakdown: {
    labor: number;   // İşçilik
    parts: number;   // Parça
    other: number;   // Diğer
  };
}

// GET /api/mobile/firma/finans/tahsilatlar?page=1&limit=20
interface TahsilatlarResponse {
  payments: Array<{
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMethod: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER";
    paymentDate: string;
    serviceOrderId: string | null;
    notes: string | null;
  }>;
  total: number;
  page: number;
}

// POST /api/mobile/firma/finans/tahsilat
interface CreateTahsilatBody {
  customerId: string;
  amount: number;        // > 0
  paymentMethod: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER";
  serviceOrderId?: string;
  notes?: string;
}

// GET /api/mobile/firma/finans/tahsilat/[id]
// GET /api/mobile/firma/finans/fatura/[id]
```

#### Firma Portal Yardımcı API'leri

```typescript
// GET /api/mobile/firma/bildirimler
interface BildirimlerResponse {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    link: string | null;
  }>;
}

// PATCH /api/mobile/firma/bildirimler/[id]/oku
// 200 OK

// GET /api/mobile/firma/hizmetler
interface HizmetlerResponse {
  services: Array<{
    id: string;
    name: string;
    price: number;
    estimatedDuration: number; // dakika
  }>;
}

// POST /api/mobile/firma/destek
interface DestekBody {
  subject: string;
  description: string;
}

// GET /api/mobile/firma/mesajlar
// POST /api/mobile/firma/mesajlar
interface MesajBody {
  recipientId: string;
  content: string;
  serviceOrderId?: string;
}
```

#### Müşteri Portal API'leri

```typescript
// GET /api/musteri/odemeler?page=1&limit=20
interface OdemelerResponse {
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    serviceOrderId: string | null;
  }>;
  total: number;
}

// GET /api/musteri/makbuz/[id]
interface MakbuzResponse {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  customerName: string;
  serviceOrderNumber: number | null;
  tenantName: string;
}

// GET /api/musteri/kartlar
// DELETE /api/musteri/kartlar/[id]
// Stripe PaymentMethod API

// GET /api/musteri/bildirimler
// PATCH /api/musteri/bildirimler/[id]/oku
```

---

## Veri Modelleri

### Mevcut Modeller — Yeni Alanlar

Tüm migration'lar zaten uygulanmıştır. Aşağıdaki alanlar Prisma şemasında mevcuttur:

```typescript
// Vehicle (mevcut modele eklendi)
interface VehicleExtended {
  imageUrl: string | null;  // S3 URL
}

// Mechanic (mevcut modele eklendi)
interface MechanicExtended {
  avatarUrl: string | null;
  shiftStart: string | null;  // "HH:MM" formatı
  shiftEnd: string | null;    // "HH:MM" formatı
  workDays: string[];         // ["MON","TUE","WED","THU","FRI"]
  dailyTarget: number | null;
}

// ServiceOrder (mevcut modele eklendi)
interface ServiceOrderExtended {
  qualityCheckNotes: string | null;
  qualityCheckedAt: Date | null;
  qualityCheckedBy: string | null;
}
```

### Yeni Modeller

```typescript
// MaintenancePlan
interface MaintenancePlan {
  id: string;
  tenantId: string;
  vehicleId: string;
  title: string;
  dueDate: Date | null;
  dueMileage: number | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ServiceRating
interface ServiceRating {
  id: string;
  tenantId: string;
  serviceOrderId: string;
  customerId: string;
  rating: number;       // 1-5 arası integer
  comment: string | null;
  createdAt: Date;
}
```

### Zod Doğrulama Şemaları

```typescript
// lib/validations/maintenance-plan.ts
export const createMaintenancePlanSchema = z.object({
  vehicleId: z.string().uuid(),
  title: z.string().min(1).max(255),
  dueDate: z.string().datetime().nullable().optional(),
  dueMileage: z.number().int().positive().nullable().optional(),
})

export const updateMaintenancePlanSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dueMileage: z.number().int().positive().nullable().optional(),
  isCompleted: z.boolean().optional(),
})

// lib/validations/mechanic.ts (mevcut şemaya eklenir)
export const shiftUpdateSchema = z.object({
  shiftStart: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli")
    .nullable()
    .optional(),
  shiftEnd: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatı gerekli")
    .nullable()
    .optional(),
  workDays: z.array(
    z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])
  ).optional(),
  dailyTarget: z.number().int().positive().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

// lib/validations/payment.ts (tahsilat için)
export const createTahsilatSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER"]),
  serviceOrderId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})
```

### Dizin Yapısı — Yeni Dosyalar

```
apps/web/
├── app/
│   ├── (dashboard)/dashboard/
│   │   ├── vehicles/[id]/
│   │   │   └── MaintenancePlansTab.tsx          # YENİ
│   │   ├── mechanics/[id]/
│   │   │   └── ShiftSection.tsx                 # YENİ
│   │   ├── services/[id]/
│   │   │   ├── QualityControlSection.tsx        # YENİ
│   │   │   └── ServiceRatingSection.tsx         # YENİ
│   │   ├── analytics/
│   │   │   └── RatingMetricsSection.tsx         # YENİ
│   │   ├── staff/
│   │   │   └── ShiftCalendarView.tsx            # YENİ
│   │   └── inventory/
│   │       └── StockMovementsTab.tsx            # YENİ
│   ├── api/
│   │   ├── dashboard/
│   │   │   ├── ratings/
│   │   │   │   ├── route.ts                     # GET, (stats ayrı)
│   │   │   │   ├── stats/route.ts               # GET stats
│   │   │   │   └── [id]/route.ts                # DELETE
│   │   │   └── maintenance-plans/
│   │   │       ├── route.ts                     # GET, POST
│   │   │       └── [id]/route.ts                # PATCH, DELETE
│   │   └── mobile/
│   │       ├── firma/
│   │       │   ├── finans/
│   │       │   │   ├── gelir-raporu/route.ts    # YENİ
│   │       │   │   ├── tahsilatlar/route.ts     # YENİ
│   │       │   │   ├── tahsilat/
│   │       │   │   │   ├── route.ts             # YENİ POST
│   │       │   │   │   └── [id]/route.ts        # YENİ GET
│   │       │   │   └── fatura/[id]/route.ts     # YENİ
│   │       │   ├── bildirimler/
│   │       │   │   ├── route.ts                 # YENİ GET
│   │       │   │   └── [id]/oku/route.ts        # YENİ PATCH
│   │       │   ├── hizmetler/route.ts           # YENİ
│   │       │   ├── destek/route.ts              # YENİ
│   │       │   └── mesajlar/route.ts            # YENİ GET, POST
│   │       └── musteri/
│   │           ├── odemeler/route.ts            # YENİ
│   │           ├── makbuz/[id]/route.ts         # YENİ
│   │           ├── kartlar/
│   │           │   ├── route.ts                 # YENİ GET, POST
│   │           │   └── [id]/route.ts            # YENİ DELETE
│   │           └── bildirimler/
│   │               ├── route.ts                 # YENİ GET
│   │               └── [id]/oku/route.ts        # YENİ PATCH
│   └── m/
│       ├── firma/
│       │   ├── servis-detay/[id]/page.tsx       # YENİ
│       │   ├── is-kapat/[id]/page.tsx           # YENİ
│       │   ├── onay/page.tsx                    # YENİ
│       │   ├── barkod/page.tsx                  # YENİ
│       │   ├── depolar/page.tsx                 # YENİ
│       │   ├── depo/[id]/page.tsx               # YENİ
│       │   ├── parca-talep/page.tsx             # YENİ
│       │   ├── stok-guncelle/[id]/page.tsx      # YENİ
│       │   ├── stok-hareketler/page.tsx         # YENİ
│       │   ├── personel/[id]/page.tsx           # YENİ
│       │   ├── personel-performans/page.tsx     # YENİ
│       │   ├── vardiya/page.tsx                 # YENİ
│       │   ├── gelir-raporu/page.tsx            # YENİ
│       │   ├── servis-raporu/page.tsx           # YENİ
│       │   ├── raporlar/page.tsx                # YENİ
│       │   ├── tahsilat-ekle/page.tsx           # YENİ
│       │   ├── tahsilatlar/page.tsx             # YENİ
│       │   ├── tahsilat/[id]/page.tsx           # YENİ
│       │   ├── fatura/[id]/page.tsx             # YENİ
│       │   ├── bildirimler/page.tsx             # YENİ
│       │   ├── mesajlar/page.tsx                # YENİ
│       │   ├── hizmetler/page.tsx               # YENİ
│       │   └── destek/page.tsx                  # YENİ
│       └── musteri/
│           ├── servis/[id]/page.tsx             # YENİ
│           ├── odeme/page.tsx                   # YENİ
│           ├── odeme-taksit/page.tsx            # YENİ
│           ├── makbuz/[id]/page.tsx             # YENİ
│           ├── kartlar/page.tsx                 # YENİ
│           ├── odemeler/page.tsx                # YENİ
│           ├── onboarding/page.tsx              # YENİ
│           └── bildirimler/page.tsx             # YENİ
├── lib/
│   ├── actions/
│   │   ├── maintenance-plan.actions.ts          # YENİ
│   │   └── quality-check.actions.ts             # YENİ
│   └── validations/
│       ├── maintenance-plan.ts                  # YENİ
│       └── (mechanic.ts güncellenir)
└── components/
    ├── dashboard/
    │   ├── vehicles/
    │   │   └── MaintenancePlansTab.tsx           # YENİ
    │   ├── mechanics/
    │   │   └── ShiftSection.tsx                  # YENİ
    │   └── services/
    │       ├── QualityControlSection.tsx         # YENİ
    │       └── ServiceRatingSection.tsx          # YENİ
    └── mobile/
        └── (mevcut bileşenler genişletilir)
```

---

## Doğruluk Özellikleri

*Bir özellik (property), bir sistemin tüm geçerli çalışmalarında doğru olması gereken bir karakteristik veya davranıştır — temelde sistemin ne yapması gerektiğine dair biçimsel bir ifadedir. Özellikler, insan tarafından okunabilir spesifikasyonlar ile makine tarafından doğrulanabilir doğruluk garantileri arasındaki köprü görevi görür.*

### Özellik 1: Vardiya Saati Format Dönüşümü

*Herhangi bir* geçerli `shiftStart` ve `shiftEnd` değeri çifti için (HH:MM formatında), `formatShiftTime` fonksiyonu her zaman `"HH:MM – HH:MM"` pattern'ine uyan bir string döndürmelidir.

**Doğrular: Gereksinim 2.3**

### Özellik 2: Geçersiz Vardiya Formatı Reddi

*Herhangi bir* HH:MM formatına uymayan string için (sayı dışı karakterler, yanlış uzunluk, 00-23 dışı saat, 00-59 dışı dakika), `shiftUpdateSchema` Zod doğrulaması bu değeri reddetmeli ve hata mesajı döndürmelidir.

**Doğrular: Gereksinim 2.7**

### Özellik 3: ServiceRating Ortalama Hesaplama

*Herhangi bir* 1-5 arası integer değerlerden oluşan rating dizisi için, ortalama hesaplama fonksiyonu matematiksel olarak doğru sonucu döndürmeli ve sonuç her zaman [1, 5] aralığında olmalıdır.

**Doğrular: Gereksinim 4.3**

### Özellik 4: Puan Dağılımı Tutarlılığı

*Herhangi bir* ServiceRating kayıtları kümesi için, puan dağılımı fonksiyonunun döndürdüğü tüm kategorilerin (1-5 yıldız) toplamı, toplam kayıt sayısına eşit olmalıdır.

**Doğrular: Gereksinim 4.4**

### Özellik 5: Gecikmiş Bakım Planı Tespiti

*Herhangi bir* geçmiş tarihli `dueDate` değeri ve `isCompleted: false` kombinasyonu için, `isOverdue` hesaplama fonksiyonu `true` döndürmelidir. `isCompleted: true` olan veya gelecek tarihli `dueDate` olan planlar için `false` döndürmelidir.

**Doğrular: Gereksinim 5.6**

### Özellik 6: MaintenancePlan Zod Doğrulaması

*Herhangi bir* geçersiz `MaintenancePlan` giriş verisi için (eksik `vehicleId`, eksik `title`, negatif `dueMileage`, geçersiz tarih formatı), `createMaintenancePlanSchema` bu veriyi reddetmeli ve uygun hata mesajı döndürmelidir.

**Doğrular: Gereksinim 40.2**

---

## Hata Yönetimi

### API Katmanı Hata Stratejisi

Tüm yeni API endpoint'leri aşağıdaki standart hata yanıt formatını kullanır:

```typescript
// Başarılı yanıt
{ data: T, success: true }

// Hata yanıtı
{ error: string, success: false }
```

**HTTP Durum Kodları:**

| Durum | Açıklama |
|-------|----------|
| `200 OK` | Başarılı GET/PATCH |
| `201 Created` | Başarılı POST |
| `204 No Content` | Başarılı DELETE |
| `400 Bad Request` | Zod doğrulama hatası |
| `401 Unauthorized` | Geçersiz/eksik oturum |
| `403 Forbidden` | Yetersiz rol (örn: TENANT_ADMIN gerektiren işlem) |
| `404 Not Found` | Kayıt bulunamadı veya farklı tenant'a ait |
| `500 Internal Server Error` | Beklenmeyen sunucu hatası |

**Tenant İzolasyonu Hata Kuralı:**
Farklı bir `tenantId`'ye ait kayıt sorgulandığında `404` döndürülür (bilgi sızdırmamak için `403` yerine).

### Server Action Hata Stratejisi

```typescript
// Tüm Server Action'lar bu pattern'i kullanır
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Örnek
export async function createMaintenancePlan(
  data: CreateMaintenancePlanInput
): Promise<ActionResult<MaintenancePlan>> {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return { success: false, error: "Oturum geçersiz" }
    }
    const validated = createMaintenancePlanSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }
    // ... Prisma işlemi
    return { success: true, data: plan }
  } catch (error) {
    return { success: false, error: "Beklenmeyen bir hata oluştu" }
  }
}
```

### UI Hata Yönetimi

- **Yükleme durumu**: Skeleton bileşenleri (Tailwind `animate-pulse`)
- **Hata durumu**: Kırmızı uyarı kartı + yeniden dene butonu
- **Form gönderimi**: Buton `disabled` + spinner
- **404 sayfaları**: İlgili liste sayfasına yönlendirme linki
- **Ağ hatası**: "Bağlantı hatası, lütfen tekrar deneyin" toast mesajı

### Özel Hata Durumları

| Senaryo | Davranış |
|---------|----------|
| S3 yükleme başarısız | Mevcut `imageUrl` korunur, hata toast gösterilir |
| Kalite notu boş gönderim | Form submit engellenir, "Kalite notu zorunludur" uyarısı |
| Yetersiz stok (parça talep) | "Yetersiz stok" uyarısı, form submit engellenir |
| Geçersiz tutar (tahsilat) | "Geçersiz tutar" hatası, form submit engellenir |
| Servis emri bulunamadı | "Servis emri bulunamadı" + kuyruk sayfasına link |
| Müşteri sahipliği ihlali | "Erişim reddedildi" + müşteri paneline yönlendirme |

---

## Test Stratejisi

### Birim Testleri

Aşağıdaki saf fonksiyonlar için birim testleri yazılır:

```typescript
// __tests__/utils/shift-format.test.ts
describe("formatShiftTime", () => {
  it("geçerli saatleri doğru formatlar", () => {
    expect(formatShiftTime("08:00", "18:00")).toBe("08:00 – 18:00")
  })
  it("null değerleri 'Tanımlanmamış' döndürür", () => {
    expect(formatShiftTime(null, null)).toBe("Tanımlanmamış")
  })
})

// __tests__/utils/rating-stats.test.ts
describe("calculateRatingAverage", () => {
  it("boş dizi için 0 döndürür", () => {
    expect(calculateRatingAverage([])).toBe(0)
  })
  it("tek elemanlı dizi için elemanı döndürür", () => {
    expect(calculateRatingAverage([4])).toBe(4)
  })
})

// __tests__/utils/maintenance-plan.test.ts
describe("isOverdue", () => {
  it("geçmiş tarih ve tamamlanmamış plan için true döndürür", () => {
    const pastDate = new Date(Date.now() - 86400000)
    expect(isOverdue(pastDate, false)).toBe(true)
  })
  it("tamamlanmış plan için false döndürür", () => {
    const pastDate = new Date(Date.now() - 86400000)
    expect(isOverdue(pastDate, true)).toBe(false)
  })
})
```

### Property-Based Testler

`fast-check` kütüphanesi kullanılır. Her test minimum 100 iterasyon çalıştırır.

```typescript
// __tests__/properties/shift-validation.property.test.ts
// Feature: web-mobile-sync, Property 1: Vardiya saati format dönüşümü
// Feature: web-mobile-sync, Property 2: Geçersiz vardiya formatı reddi

// __tests__/properties/rating-stats.property.test.ts
// Feature: web-mobile-sync, Property 3: ServiceRating ortalama hesaplama
// Feature: web-mobile-sync, Property 4: Puan dağılımı tutarlılığı

// __tests__/properties/maintenance-plan.property.test.ts
// Feature: web-mobile-sync, Property 5: Gecikmiş bakım planı tespiti
// Feature: web-mobile-sync, Property 6: MaintenancePlan Zod doğrulaması
```

### Entegrasyon Testleri

```typescript
// __tests__/api/dashboard/ratings.test.ts
// Mock Prisma ile:
// - GET /api/dashboard/ratings → sayfalandırılmış liste
// - GET /api/dashboard/ratings/stats → ortalama + dağılım
// - DELETE /api/dashboard/ratings/[id] → TENANT_ADMIN kontrolü

// __tests__/api/dashboard/maintenance-plans.test.ts
// Mock Prisma ile:
// - POST /api/dashboard/maintenance-plans → Zod doğrulama
// - PATCH /api/dashboard/maintenance-plans/[id] → güncelleme
// - GET → vehicleId filtresi + tenantId izolasyonu

// __tests__/api/mobile/firma-finans.test.ts
// Mock Prisma ile:
// - POST /api/mobile/firma/finans/tahsilat → Payment kaydı
// - GET /api/mobile/firma/finans/tahsilatlar → sayfalandırma
```

### Test Konfigürasyonu

```typescript
// jest.config.ts (mevcut, değişmez)
// fast-check minimum iterasyon: 100
// Her property test tag formatı:
// "Feature: web-mobile-sync, Property {N}: {property_text}"
```
