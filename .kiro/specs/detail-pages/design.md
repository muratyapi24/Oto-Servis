# Design Document: Detail Pages

## Overview

MS Oto Servis uygulamasına 5 yeni detay sayfası eklenir: müşteri, araç, usta, fatura ve randevu. Her sayfa `/dashboard/{entity}/[id]` rotasında çalışır ve mevcut Next.js 15 Server Component mimarisini izler.

Temel tasarım kararları:
- Her sayfa bir **Server Component** `page.tsx` olarak başlar; veri çekme işlemi sunucu tarafında gerçekleşir.
- Interaktif bölümler (form, durum güncelleme) ayrı **Client Component** olarak izole edilir.
- Tüm veri erişimi `lib/actions/` altındaki server action'lar üzerinden yapılır.
- Multi-tenant izolasyonu action katmanında `tenantId` kontrolüyle sağlanır.
- Kayıt bulunamazsa veya tenant uyuşmazsa Next.js `notFound()` çağrılır.

---

## Architecture

```mermaid
flowchart TD
    Browser -->|GET /dashboard/customers/[id]| PageTSX[page.tsx\nServer Component]
    PageTSX -->|getCustomerById(id)| Action[Server Action\nlib/actions/]
    Action -->|prisma.findUnique + includes| DB[(PostgreSQL)]
    DB --> Action
    Action -->|tenantId check| Action
    Action -->|null → notFound()| PageTSX
    PageTSX -->|serialized data as props| ClientComp[Client Component\n*DetailClient.tsx]
    ClientComp -->|user interaction| ServerAction2[Server Action\nupdateX / recordPayment]
    ServerAction2 --> DB
```

Her detay sayfası aynı katmanlı yapıyı paylaşır:

```
app/(dashboard)/dashboard/{entity}/[id]/
  page.tsx              ← Server Component, veri çeker, PageShell sarar
  {Entity}DetailClient.tsx  ← Client Component (edit form, status update)
```

Server action'lar ilgili `lib/actions/*.actions.ts` dosyalarına eklenir; yeni dosya açılmaz.

---

## Components and Interfaces

### Server Action Signatures

```typescript
// customer.actions.ts
export async function getCustomerById(id: string): Promise<{
  customer: CustomerWithRelations | null;
  error?: string;
}>

// vehicle.actions.ts
export async function getVehicleById(id: string): Promise<{
  vehicle: VehicleWithRelations | null;
  error?: string;
}>

// mechanic.actions.ts
export async function getMechanicById(id: string): Promise<{
  mechanic: MechanicWithRelations | null;
  error?: string;
}>

// finance.actions.ts
export async function getInvoiceById(id: string): Promise<{
  invoice: InvoiceWithRelations | null;
  error?: string;
}>

// appointment.actions.ts
export async function getAppointmentById(id: string): Promise<{
  appointment: AppointmentWithRelations | null;
  error?: string;
}>
```

### Page Components

Her sayfa aynı pattern'i izler:

```typescript
// Örnek: page.tsx (Server Component)
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCustomerById(id);
  if (!result.customer) notFound();

  return (
    <PageShell title="Müşteri Detayı" sectionLabel="Müşteriler"
      actions={<BackButton href="/dashboard/customers" />}>
      <CustomerDetailClient customer={result.customer} />
    </PageShell>
  );
}
```

### Client Components

| Bileşen | Dosya | Sorumluluk |
|---|---|---|
| `CustomerDetailClient` | `customers/[id]/CustomerDetailClient.tsx` | Müşteri bilgi kartları, araç listesi, servis geçmişi, edit formu |
| `VehicleDetailClient` | `vehicles/[id]/VehicleDetailClient.tsx` | Teknik bilgi kartları, servis geçmişi, edit formu |
| `MechanicDetailClient` | `mechanics/[id]/MechanicDetailClient.tsx` | Usta bilgileri, aktif/tamamlanan işler, edit formu |
| `InvoiceDetailClient` | `finances/invoices/[id]/InvoiceDetailClient.tsx` | Fatura kalemleri, ödeme geçmişi, ödeme formu, yazdır |
| `AppointmentDetailClient` | `appointments/[id]/AppointmentDetailClient.tsx` | Randevu bilgileri, durum güncelleme, edit formu |

---

## Data Models

### getCustomerById — İlişkili Veri

```typescript
type CustomerWithRelations = {
  id: string;
  type: "INDIVIDUAL" | "CORPORATE";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string;
  secondaryPhone: string | null;
  taxOffice: string | null;
  taxNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  notes: string | null;
  balance: number; // Decimal → number serialize
  isBlacklisted: boolean;
  vehicles: {
    id: string; plate: string; brand: string; model: string; year: number | null;
  }[];
  serviceOrders: {
    id: string; orderNumber: number; status: string;
    receptionDate: Date; totalAmount: number;
    vehicle: { plate: string; brand: string; model: string };
  }[];
  payments: {
    id: string; amount: number; paymentMethod: string;
    paymentDate: Date; notes: string | null;
  }[]; // Son 10 kayıt
  _count: { invoices: number }; // Açık fatura sayısı için
};
```

### getVehicleById — İlişkili Veri

```typescript
type VehicleWithRelations = {
  id: string; plate: string; brand: string; model: string; year: number | null;
  chassisNo: string | null; engineNo: string | null; color: string | null;
  engineType: string | null; transmission: string | null; fuelType: string | null;
  mileage: number; driverName: string | null; driverPhone: string | null;
  insuranceCompany: string | null; policyNumber: string | null;
  registrationDate: Date | null; notes: string | null;
  customer: {
    id: string; type: string; firstName: string | null;
    lastName: string | null; companyName: string | null; phone: string;
  };
  serviceOrders: {
    id: string; orderNumber: number; status: string;
    receptionDate: Date; complaintDescription: string; totalAmount: number;
  }[];
  _count: { serviceOrders: number };
};
```

### getMechanicById — İlişkili Veri

```typescript
type MechanicWithRelations = {
  id: string; firstName: string; lastName: string;
  phone: string | null; email: string | null;
  specialties: string[]; experienceYears: number | null;
  hourlyRate: number | null; isActive: boolean;
  activeOrders: {  // PENDING | IN_PROGRESS
    id: string; orderNumber: number; status: string;
    receptionDate: Date; vehicle: { plate: string; brand: string; model: string };
    customer: { firstName: string | null; lastName: string | null; companyName: string | null; type: string };
  }[];
  completedOrders: {  // COMPLETED, desc sıralı
    id: string; orderNumber: number; receptionDate: Date;
    totalAmount: number;
    vehicle: { plate: string; brand: string; model: string };
  }[];
};
```

### getInvoiceById — İlişkili Veri

```typescript
type InvoiceWithRelations = {
  id: string; invoiceNumber: string | null;
  type: "SALES" | "PURCHASE"; status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: Date; dueDate: Date | null;
  subTotal: number; discountAmount: number; taxAmount: number;
  totalAmount: number; paidAmount: number; notes: string | null;
  customer: {
    id: string; type: string; firstName: string | null;
    lastName: string | null; companyName: string | null;
  } | null;
  serviceOrder: { id: string; orderNumber: number } | null;
  payments: {
    id: string; amount: number; paymentMethod: string;
    paymentDate: Date; notes: string | null;
  }[];
};
```

### getAppointmentById — İlişkili Veri

```typescript
type AppointmentWithRelations = {
  id: string; appointmentDate: Date; appointmentTime: string;
  type: string | null; status: string; notes: string | null;
  customer: {
    id: string; type: string; firstName: string | null;
    lastName: string | null; companyName: string | null; phone: string;
  };
  vehicle: {
    id: string; plate: string; brand: string; model: string;
  } | null;
};
```

### Tenant İzolasyon Paterni (Tüm Action'larda Ortak)

```typescript
// Her getById action'ında bu kontrol uygulanır:
const record = await prisma.entity.findUnique({
  where: { id, tenantId: session.user.tenantId }, // tenantId filtresi
  include: { /* ilişkiler */ }
});
if (!record || record.deletedAt) return { entity: null };
```

`deletedAt` dolu kayıtlar `null` döndürür → page.tsx `notFound()` çağırır.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tenant İzolasyonu ve Soft-Delete Koruması

*For any* `getById` action çağrısında, eğer istenen kaydın `tenantId`'si oturumdaki `tenantId` ile eşleşmiyorsa veya kaydın `deletedAt` alanı dolu ise, action `null` döndürmelidir.

**Validates: Requirements 1.1, 1.2, 1.4, 7.6**

---

### Property 2: Müşteri Detay Verisi Bütünlüğü

*For any* geçerli müşteri kaydı için `getCustomerById` çağrıldığında, döndürülen obje müşterinin tüm temel alanlarını (`id`, `type`, `phone`, `balance`), ilişkili araçlarını (`vehicles` dizisi) ve son 10 ödeme kaydını (`payments` dizisi, max 10 öğe) içermelidir.

**Validates: Requirements 2.1, 2.2, 2.5**

---

### Property 3: Servis Geçmişi Tarih Sıralaması

*For any* `getCustomerById`, `getVehicleById` veya `getMechanicById` çağrısında döndürülen `serviceOrders` / `completedOrders` dizisi, `receptionDate` alanına göre azalan sırada (en yeni önce) sıralanmış olmalıdır.

**Validates: Requirements 2.3, 3.3, 4.3**

---

### Property 4: Araç Detay Verisi Bütünlüğü

*For any* geçerli araç kaydı için `getVehicleById` çağrıldığında, döndürülen obje aracın tüm teknik alanlarını (`plate`, `brand`, `model`, `chassisNo`, `engineNo`, `fuelType`, `mileage` vb.) ve sahibi olan müşterinin bilgilerini (`customer.id`, `customer.phone`) içermelidir.

**Validates: Requirements 3.1, 3.2**

---

### Property 5: Araç Servis Özeti Tutarlılığı

*For any* araç kaydı için `getVehicleById` çağrıldığında, döndürülen `_count.serviceOrders` değeri `serviceOrders` dizisinin uzunluğuyla tutarlı olmalıdır; toplam servis tutarı ise `serviceOrders` dizisindeki `totalAmount` değerlerinin toplamına eşit olmalıdır.

**Validates: Requirements 3.6**

---

### Property 6: Usta Aktif/Tamamlanan İş Ayrımı

*For any* usta kaydı için `getMechanicById` çağrıldığında, `activeOrders` dizisi yalnızca `PENDING` veya `IN_PROGRESS` statüsündeki kayıtları içermeli; `completedOrders` dizisi yalnızca `COMPLETED` statüsündeki kayıtları içermelidir. Ayrıca özet sayılar (`activeCount`, `completedCount`) bu dizilerin uzunluklarıyla eşit olmalıdır.

**Validates: Requirements 4.2, 4.3, 4.4**

---

### Property 7: Fatura Finansal Tutar Invariantı

*For any* fatura kaydı için `getInvoiceById` çağrıldığında, döndürülen finansal alanlar şu invariantı sağlamalıdır: `subTotal - discountAmount + taxAmount = totalAmount` (ondalık hassasiyeti gözetilerek).

**Validates: Requirements 5.2**

---

### Property 8: Fatura Ödeme Geçmişi Sıralaması ve ServiceOrder İlişkisi

*For any* fatura kaydı için `getInvoiceById` çağrıldığında, `payments` dizisi `paymentDate` alanına göre azalan sırada sıralanmış olmalıdır. Eğer faturanın `serviceOrderId` alanı dolu ise, döndürülen `serviceOrder` objesi `null` olmamalıdır.

**Validates: Requirements 5.3, 5.4**

---

### Property 9: Randevu Detay Verisi Bütünlüğü

*For any* geçerli randevu kaydı için `getAppointmentById` çağrıldığında, döndürülen obje randevunun tüm alanlarını (`appointmentDate`, `appointmentTime`, `type`, `status`, `notes`), müşteri bilgilerini (`customer.id`, `customer.phone`) ve eğer araç atanmışsa araç bilgilerini (`vehicle.plate`, `vehicle.brand`, `vehicle.model`) içermelidir.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 10: COMPLETED Randevu → ServiceOrder Oluşturulur

*For any* araç atanmış randevu için `updateAppointmentStatus` action'ı `COMPLETED` statüsüyle çağrıldığında, aynı `tenantId`, `customerId` ve `vehicleId` ile yeni bir `ServiceOrder` kaydı oluşturulmuş olmalıdır.

**Validates: Requirements 6.5**

---

### Property 11: Navigasyon Link Doğruluğu

*For any* detay sayfasında listelenen araç, müşteri, servis veya fatura satırı için, render edilen bağlantının `href` değeri sırasıyla `/dashboard/vehicles/{id}`, `/dashboard/customers/{id}`, `/dashboard/services/{id}` veya `/dashboard/finances/invoices/{id}` formatında olmalıdır.

**Validates: Requirements 2.7, 2.8, 3.5, 4.6, 8.2, 8.3, 8.4, 8.5**

---

## Error Handling

### Action Katmanı

| Durum | Davranış |
|---|---|
| Oturum yoksa (`session?.user?.tenantId` falsy) | `{ error: "Yetkisiz erişim" }` döner |
| Kayıt bulunamazsa (tenantId uyuşmazlığı dahil) | `{ entity: null }` döner |
| Kayıt soft-delete edilmişse (`deletedAt` dolu) | `{ entity: null }` döner |
| Prisma hatası | `console.error` + `{ error: "..." }` döner |

### Page Katmanı

```typescript
const result = await getEntityById(id);
if (!result.entity) notFound(); // Next.js 404 sayfası
```

`notFound()` çağrısı Next.js'in yerleşik 404 mekanizmasını tetikler. Özel bir `not-found.tsx` dosyası isteğe bağlı olarak her route segmentine eklenebilir.

### Client Component Hataları

- Form submit hataları `toast` veya inline hata mesajı ile gösterilir.
- `updateAppointmentStatus` action'ı araç atanmamışsa `{ error: "Bu randevuya henüz bir araç atanmamış..." }` döndürür; bu mesaj kullanıcıya gösterilir.
- Fatura `PAID` veya `CANCELLED` durumundaysa ödeme formu `disabled` render edilir; bu kontrol client component'te `invoice.status` prop'una göre yapılır.

---

## Testing Strategy

### Dual Testing Yaklaşımı

Her iki test türü de tamamlayıcıdır ve birlikte kullanılmalıdır:

- **Unit testler**: Belirli örnekler, edge case'ler ve hata koşulları
- **Property testler**: Tüm geçerli girdiler için evrensel özellikler

### Unit Test Örnekleri

```typescript
// Örnek: Tenant izolasyonu — farklı tenant'ın kaydına erişim
it("farklı tenant'ın müşterisine erişim null döndürür", async () => {
  // Arrange: tenant A'nın müşterisi, tenant B'nin session'ı
  // Act: getCustomerById(customerA.id) with tenantB session
  // Assert: result.customer === null
});

// Örnek: Soft-delete koruması
it("deletedAt dolu müşteri null döndürür", async () => {
  // Arrange: deletedAt set edilmiş müşteri
  // Act: getCustomerById(deletedCustomer.id)
  // Assert: result.customer === null
});

// Örnek: notFound() çağrısı
it("null dönen action için notFound çağrılır", async () => {
  // page.tsx davranışı — mock getCustomerById → null
  // Assert: notFound() çağrıldı
});
```

### Property-Based Test Konfigürasyonu

**Kütüphane**: `fast-check` (TypeScript/JavaScript için)

```bash
npm install --save-dev fast-check
```

Her property testi minimum **100 iterasyon** çalıştırılmalıdır (`fc.assert` varsayılan olarak 100 çalıştırır).

Her test şu tag formatıyla yorumlanmalıdır:
```
// Feature: detail-pages, Property {N}: {property_text}
```

### Property Test Örnekleri

```typescript
// Feature: detail-pages, Property 1: Tenant izolasyonu ve soft-delete koruması
it("cross-tenant erişim her zaman null döndürür", async () => {
  await fc.assert(
    fc.asyncProperty(fc.uuid(), fc.uuid(), async (tenantA, tenantB) => {
      fc.pre(tenantA !== tenantB);
      // tenantA'ya ait kayıt oluştur, tenantB session'ıyla sorgula
      const result = await getCustomerByIdWithTenant(customerId, tenantB);
      return result.customer === null;
    })
  );
});

// Feature: detail-pages, Property 3: Servis geçmişi tarih sıralaması
it("serviceOrders her zaman receptionDate azalan sırada döner", async () => {
  await fc.assert(
    fc.asyncProperty(fc.array(fc.date(), { minLength: 2 }), async (dates) => {
      // Farklı tarihlerde servis emirleri oluştur
      const result = await getCustomerById(customerId);
      const orders = result.customer!.serviceOrders;
      for (let i = 0; i < orders.length - 1; i++) {
        if (new Date(orders[i].receptionDate) < new Date(orders[i + 1].receptionDate)) {
          return false;
        }
      }
      return true;
    })
  );
});

// Feature: detail-pages, Property 7: Fatura finansal tutar invariantı
it("subTotal - discountAmount + taxAmount = totalAmount", async () => {
  await fc.assert(
    fc.asyncProperty(fc.uuid(), async (invoiceId) => {
      const result = await getInvoiceById(invoiceId);
      if (!result.invoice) return true; // skip
      const { subTotal, discountAmount, taxAmount, totalAmount } = result.invoice;
      const calculated = subTotal - discountAmount + taxAmount;
      return Math.abs(calculated - totalAmount) < 0.01; // ondalık tolerans
    })
  );
});
```

### Test Dosya Yapısı

```
apps/web/
  __tests__/
    actions/
      customer.actions.test.ts   # Property 1, 2, 3, 11
      vehicle.actions.test.ts    # Property 1, 4, 5, 11
      mechanic.actions.test.ts   # Property 1, 6, 11
      finance.actions.test.ts    # Property 1, 7, 8, 11
      appointment.actions.test.ts # Property 1, 9, 10, 11
```

Her dosya hem unit testleri hem de property testlerini içerir. Property testleri `fast-check` ile, unit testler `vitest` ile çalıştırılır.
