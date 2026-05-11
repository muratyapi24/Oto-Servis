/**
 * Servis Emri Lifecycle E2E Testi
 *
 * PENDING → IN_PROGRESS → WAITING_APPROVAL → COMPLETED → fatura otomatik oluşur
 * COMPLETED → CANCELLED → stok iade, fatura iptal, müşteri bakiyesi geri alınır
 * addServiceItem → stok düşer
 * removeServiceItem → stok iade edilir
 */

// Prisma client mock
jest.mock("@repo/database", () => {
  const mockTx = {
    serviceOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceItem: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { subTotal: 0, taxAmount: 0, totalPrice: 0, discount: 0 } }),
    },
    invoice: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "561592e7-7a80-4448-8556-1a404468be8e" }),
      update: jest.fn(),
    },
    invoiceItem: {
      createMany: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    part: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    serviceOrder: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    serviceItem: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
    },
    part: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    _mockTx: mockTx,
  };

  return { prisma: mockPrisma };
});

jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "d81d4c9f-ab67-4dda-b4c5-f0798bf2bd3a", tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", role: "TENANT_ADMIN" },
  }),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));
jest.mock("@/lib/sse", () => ({ publishSSEEvent: jest.fn() }));
jest.mock("@/lib/push", () => ({ sendPushToTenant: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/subscription-guard", () => ({
  checkSubscriptionActive: jest.fn().mockResolvedValue({ active: true }),
}));

// Approval actions mock
jest.mock("@/lib/actions/approval.actions", () => ({
  generateApprovalToken: jest.fn().mockResolvedValue({ token: "test-token" }),
}));

// Cache mock
jest.mock("@/lib/cache", () => ({
  invalidateCache: jest.fn(),
  CacheKeys: { dashboardKpi: jest.fn().mockReturnValue("kpi") },
}));

const { prisma } = require("@repo/database");
const mockTx = (prisma as any)._mockTx;

import { addServiceItem, removeServiceItem, updateOrderStatus } from "@/lib/actions/service.actions";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORDER_PENDING = {
  id: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
  tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  orderNumber: 101,
  status: "PENDING",
  customerId: "e1aaeb33-1cd7-445d-af17-1f601c94fd5d",
  subTotal: 0,
  taxAmount: 0,
  totalAmount: 0,
  discountAmount: 0,
};

const ORDER_COMPLETED = {
  ...ORDER_PENDING,
  status: "COMPLETED",
  totalAmount: 1000,
};

const PART = {
  id: "537a6948-be3e-499c-9d1c-b8427b1c7fc3",
  tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Yağ Filtresi",
  currentStock: 10,
  unit: "adet",
};

// ---------------------------------------------------------------------------
// addServiceItem
// ---------------------------------------------------------------------------
describe("addServiceItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.serviceOrder.findFirst.mockResolvedValue(ORDER_PENDING);
    prisma.part.findFirst.mockResolvedValue(PART);
    mockTx.serviceItem.create.mockResolvedValue({ id: "d1c41384-b915-400a-a5a9-7efb0f054366" });
    mockTx.serviceOrder.update.mockResolvedValue({});
    mockTx.serviceItem.aggregate.mockResolvedValue({
      _sum: { subTotal: 500, taxAmount: 90, totalPrice: 590, discount: 0 },
    });
  });

  it("PART eklendiğinde stok düşer ve StockMovement OUT oluşur", async () => {
    const result = await addServiceItem({
      serviceOrderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      itemType: "PART",
      partId: "537a6948-be3e-499c-9d1c-b8427b1c7fc3",
      name: "Yağ Filtresi",
      quantity: 2,
      unitPrice: 250,
      taxRate: 18,
      discount: 0,
    });

    expect(result.error).toBeUndefined();
    expect(mockTx.part.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentStock: { decrement: 2 } },
      })
    );
    expect(mockTx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "OUT", quantity: -2 }),
      })
    );
  });

  it("LABOR eklendiğinde stok hareketi oluşmaz", async () => {
    const result = await addServiceItem({
      serviceOrderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      itemType: "LABOR",
      name: "Yağ değişimi işçiliği",
      quantity: 1,
      unitPrice: 200,
      taxRate: 18,
      discount: 0,
    });

    expect(result.error).toBeUndefined();
    expect(mockTx.part.update).not.toHaveBeenCalled();
    expect(mockTx.stockMovement.create).not.toHaveBeenCalled();
  });

  it("yetersiz stokta hata döner", async () => {
    prisma.part.findFirst.mockResolvedValue({ ...PART, currentStock: 1 });

    const result = await addServiceItem({
      serviceOrderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      itemType: "PART",
      partId: "537a6948-be3e-499c-9d1c-b8427b1c7fc3",
      name: "Yağ Filtresi",
      quantity: 5, // stok 1, istek 5
      unitPrice: 250,
      taxRate: 18,
      discount: 0,
    });

    expect(result.error).toMatch(/yetersiz stok/i);
    expect(mockTx.serviceItem.create).not.toHaveBeenCalled();
  });

  it("COMPLETED iş emrine kalem eklenemez", async () => {
    prisma.serviceOrder.findFirst.mockResolvedValue(ORDER_COMPLETED);

    const result = await addServiceItem({
      serviceOrderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      itemType: "LABOR",
      name: "Test",
      quantity: 1,
      unitPrice: 100,
      taxRate: 18,
      discount: 0,
    });

    expect(result.error).toMatch(/tamamlanmış|iptal/i);
  });
});

// ---------------------------------------------------------------------------
// removeServiceItem
// ---------------------------------------------------------------------------
describe("removeServiceItem", () => {
  const ITEM_PART = {
    id: "d1c41384-b915-400a-a5a9-7efb0f054366",
    tenantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    itemType: "PART",
    partId: "537a6948-be3e-499c-9d1c-b8427b1c7fc3",
    name: "Yağ Filtresi",
    quantity: 2,
    serviceOrderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
    serviceOrder: { ...ORDER_PENDING },
  };

  const ITEM_LABOR = {
    ...ITEM_PART,
    itemType: "LABOR",
    partId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx.serviceItem.delete.mockResolvedValue({});
    mockTx.serviceItem.aggregate.mockResolvedValue({
      _sum: { subTotal: 0, taxAmount: 0, totalPrice: 0, discount: 0 },
    });
    mockTx.serviceOrder.update.mockResolvedValue({});
  });

  it("PART kaldırıldığında stok iade edilir ve StockMovement IN oluşur", async () => {
    prisma.serviceItem.findFirst.mockResolvedValue(ITEM_PART);

    const result = await removeServiceItem("d1c41384-b915-400a-a5a9-7efb0f054366");

    expect(result.error).toBeUndefined();
    expect(mockTx.part.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentStock: { increment: 2 } },
      })
    );
    expect(mockTx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "IN", quantity: 2 }),
      })
    );
  });

  it("LABOR kaldırıldığında stok hareketi oluşmaz", async () => {
    prisma.serviceItem.findFirst.mockResolvedValue(ITEM_LABOR);

    const result = await removeServiceItem("d1c41384-b915-400a-a5a9-7efb0f054366");

    expect(result.error).toBeUndefined();
    expect(mockTx.part.update).not.toHaveBeenCalled();
    expect(mockTx.stockMovement.create).not.toHaveBeenCalled();
  });

  it("COMPLETED iş emrinden kalem kaldırılamaz", async () => {
    prisma.serviceItem.findFirst.mockResolvedValue({
      ...ITEM_PART,
      serviceOrder: { ...ORDER_COMPLETED },
    });

    const result = await removeServiceItem("d1c41384-b915-400a-a5a9-7efb0f054366");

    expect(result.error).toMatch(/tamamlanmış|iptal/i);
    expect(mockTx.serviceItem.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// updateOrderStatus — COMPLETED
// ---------------------------------------------------------------------------
describe("updateOrderStatus → COMPLETED", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const orderWithItems = {
      ...ORDER_PENDING,
      status: "IN_PROGRESS",
      totalAmount: 1180,
      subTotal: 1000,
      taxAmount: 180,
      discountAmount: 0,
      items: [],
    };

    prisma.serviceOrder.findFirst.mockResolvedValue(orderWithItems);
    mockTx.serviceOrder.findUnique.mockResolvedValue(orderWithItems);
    mockTx.invoice.findFirst.mockResolvedValue(null); // henüz fatura yok
    mockTx.serviceItem.findMany.mockResolvedValue([]);
    mockTx.invoice.create.mockResolvedValue({ id: "ccc7fbbd-22ef-4fb9-b87e-00452aa8fd20" });
    mockTx.serviceOrder.update.mockResolvedValue({});
    prisma.serviceOrder.findUnique = jest.fn().mockResolvedValue({
      id: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      status: "IN_PROGRESS",
      approvalToken: null,
    });
  });

  it("COMPLETED'a geçişte fatura otomatik oluşur", async () => {
    const result = await updateOrderStatus({
      orderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      status: "COMPLETED",
    });

    expect(result.error).toBeUndefined();
    // İnvoice create çağrıldı mı?
    expect(mockTx.invoice.create).toHaveBeenCalled();
  });

  it("zaten COMPLETED'sa fatura tekrar oluşmaz", async () => {
    // Zaten fatura var
    mockTx.invoice.findFirst.mockResolvedValue({ id: "07fc750d-59a8-4ad5-b14a-d652e5e2941f", status: "SENT", totalAmount: 1180 });

    const result = await updateOrderStatus({
      orderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      status: "COMPLETED",
    });

    expect(result.error).toBeUndefined();
    expect(mockTx.invoice.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// updateOrderStatus — CANCELLED (COMPLETED'dan geri alma)
// ---------------------------------------------------------------------------
describe("updateOrderStatus → CANCELLED (geri alma)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const completedOrder = {
      ...ORDER_COMPLETED,
      items: [{ id: "d1c41384-b915-400a-a5a9-7efb0f054366", itemType: "PART", partId: "537a6948-be3e-499c-9d1c-b8427b1c7fc3", quantity: 2, name: "Yağ Filtresi" }],
    };

    prisma.serviceOrder.findFirst.mockResolvedValue(completedOrder);
    mockTx.serviceOrder.findUnique.mockResolvedValue(completedOrder);
    mockTx.invoice.findFirst.mockResolvedValue({
      id: "561592e7-7a80-4448-8556-1a404468be8e",
      status: "SENT",
      totalAmount: 1180,
      customerId: "e1aaeb33-1cd7-445d-af17-1f601c94fd5d",
      type: "SALES",
    });
    mockTx.invoice.update.mockResolvedValue({});
    mockTx.customer.update.mockResolvedValue({});
    mockTx.part.update.mockResolvedValue({});
    mockTx.stockMovement.create.mockResolvedValue({});
    mockTx.serviceOrder.update.mockResolvedValue({});
  });

  it("COMPLETED → CANCELLED: fatura iptal edilir, bakiye geri alınır, stok iade edilir", async () => {
    const result = await updateOrderStatus({
      orderId: "d82e3dc2-5b19-41d8-9487-ebfa89ffae47",
      status: "CANCELLED",
    });

    expect(result.error).toBeUndefined();
    // Fatura iptal
    expect(mockTx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    );
    // Müşteri bakiyesi geri alındı
    expect(mockTx.customer.update).toHaveBeenCalled();
    // Stok iade
    expect(mockTx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "IN" }),
      })
    );
  });
});
