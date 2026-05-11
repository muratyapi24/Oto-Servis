# Server Action Patterns — BST Otoservis

## Pattern 1: Simple CRUD with Guard

```typescript
"use server";

import { guardTenant } from "@/lib/guards";
import { prisma } from "@repo/database";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createSchema, type CreateInput } from "@/lib/validations/module";

// CREATE
export async function createRecord(data: CreateInput) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const validated = createSchema.parse(data);

    const record = await prisma.model.create({
      data: { tenantId, ...validated },
    });

    revalidatePath("/dashboard/module");
    return { success: "Kayıt oluşturuldu", id: record.id };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Kayıt oluşturulurken hata oluştu." };
  }
}

// READ (List)
export async function getRecords() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const records = await prisma.model.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serialized = records.map(r => ({
      ...r,
      amount: Number(r.amount.toString()),
    }));

    return { records: serialized };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Kayıtlar yüklenemedi." };
  }
}

// READ (Single)
export async function getRecordById(id: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const record = await prisma.model.findFirst({
      where: { id, tenantId },
    });

    if (!record) return { error: "Kayıt bulunamadı." };

    return {
      record: {
        ...record,
        amount: Number(record.amount.toString()),
      }
    };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Kayıt detayı yüklenemedi." };
  }
}

// UPDATE
export async function updateRecord(id: string, data: Partial<CreateInput>) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    await prisma.model.update({
      where: { id, tenantId },
      data: { ...data },
    });

    revalidatePath("/dashboard/module");
    return { success: "Kayıt güncellendi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Güncelleme sırasında hata oluştu." };
  }
}

// SOFT DELETE
export async function deleteRecord(id: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    await prisma.model.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/module");
    return { success: "Kayıt silindi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Silme sırasında hata oluştu." };
  }
}
```

## Pattern 2: Role-Restricted Actions

```typescript
export async function manageStaff(data: StaffInput) {
  try {
    const g = await guardTenantRole(["TENANT_ADMIN"]);
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // Only TENANT_ADMIN can manage staff
    // ... business logic
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Hata oluştu." };
  }
}
```

## Pattern 3: Transactional Operations (Stock + Order + Invoice)

```typescript
export async function completeServiceOrder(orderId: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const order = await tx.serviceOrder.update({
        where: { id: orderId },
        data: { status: "COMPLETED", actualDeliveryDate: new Date() },
        include: { items: true },
      });

      // 2. Create invoice from service items
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId: order.customerId,
          serviceOrderId: order.id,
          type: "SALES",
          status: "SENT",
          totalAmount: order.totalAmount,
          // ...
        }
      });

      // 3. Update customer balance
      await tx.customer.update({
        where: { id: order.customerId },
        data: { balance: { increment: order.totalAmount } },
      });
    });

    revalidatePath("/dashboard/services");
    return { success: "İş emri tamamlandı." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "İşlem sırasında hata oluştu." };
  }
}
```

## Pattern 4: Dashboard Aggregation (Consolidated Data Fetch)

```typescript
export async function getModuleDashboard() {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // Parallel fetch for performance
    const [records, lookupA, lookupB] = await Promise.all([
      prisma.model.findMany({
        where: { tenantId, deletedAt: null },
        include: { relation: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lookupA.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.lookupB.findMany({
        where: { tenantId },
        select: { id: true, label: true },
      }),
    ]);

    // Serialize + map
    const serialized = records.map(r => ({
      ...r,
      amount: Number(r.amount.toString()),
    }));

    return {
      records: serialized,
      lookupA: lookupA.map(a => ({ id: a.id, name: a.name })),
      lookupB: lookupB.map(b => ({ id: b.id, label: b.label })),
    };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Dashboard verileri yüklenemedi." };
  }
}
```

## Pattern 5: Feature-Gated Action

```typescript
export async function sendBulkNotification(data: BulkNotifInput) {
  try {
    // Feature gate: only available in Pro+ plans
    const { session, tenantId } = await requireFeature("bulkNotifications");

    // Also check monthly limit
    await requireLimit("maxSmsPerMonth");

    // ... send notifications
  } catch (error) {
    Sentry.captureException(error);
    return { error: error instanceof Error ? error.message : "Hata oluştu." };
  }
}
```

## Pattern 6: Super Admin Action

```typescript
export async function getAllTenants() {
  try {
    const session = await requireSuperAdmin();

    // No tenantId filter — super admin sees all
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, serviceOrders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { tenants };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Tenant listesi yüklenemedi." };
  }
}
```

## Pattern 7: With SSE + Push Notification

```typescript
import { publishSSEEvent } from "@/lib/sse";
import { sendPushToTenant } from "@/lib/push";

export async function updateStatus(id: string, status: string) {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    // ... update logic

    // Real-time SSE broadcast
    publishSSEEvent({
      type: "STATUS_UPDATED",
      payload: { id, status },
      tenantId,
    });

    // Push notification (fire-and-forget)
    sendPushToTenant(tenantId, {
      title: "Durum Güncellendi",
      body: `Kayıt durumu: ${status}`,
      url: `/dashboard/module/${id}`,
    }).catch(() => {});

    return { success: "Durum güncellendi." };
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Güncelleme hatası." };
  }
}
```
