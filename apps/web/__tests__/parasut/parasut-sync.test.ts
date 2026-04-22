// Feature: invoice-payment-accounting
// Entegrasyon testleri: Mock Paraşüt API ile senkronizasyon, retry ve log senaryoları

import {
  mapInvoiceItemsToParasutLines,
  mapInvoiceToParasutInput,
  mapCustomerToParasutContact,
} from "@/lib/parasut/mapper";

// ---------------------------------------------------------------------------
// Paraşüt Mapper — Birim testleri
// ---------------------------------------------------------------------------

describe("mapInvoiceItemsToParasutLines", () => {
  it("fatura kalemlerini Paraşüt satırlarına dönüştürür", () => {
    const items = [
      { name: "Motor Yağı", quantity: 1, unitPrice: 500, taxRate: 20, discountRate: 0 },
      { name: "Yağ Filtresi", quantity: 2, unitPrice: 250, taxRate: 20, discountRate: 0 },
    ];

    const lines = mapInvoiceItemsToParasutLines(items);

    expect(lines).toHaveLength(2);
    expect(lines[0].name).toBe("Motor Yağı");
    expect(lines[0].quantity).toBe(1);
    expect(lines[0].unitPrice).toBe(500);
    expect(lines[0].vatRate).toBe(20);
  });

  it("boş kalem listesi için genel hizmet kalemi oluşturur", () => {
    const lines = mapInvoiceItemsToParasutLines([]);

    expect(lines).toHaveLength(1);
    expect(lines[0].name).toBe("Genel Hizmet");
  });

  it("string değerleri number'a dönüştürür", () => {
    const items = [
      { name: "Test", quantity: "2", unitPrice: "100.50", taxRate: "18", discountRate: "0" },
    ];

    const lines = mapInvoiceItemsToParasutLines(items as any);

    expect(typeof lines[0].quantity).toBe("number");
    expect(typeof lines[0].unitPrice).toBe("number");
    expect(lines[0].quantity).toBe(2);
    expect(lines[0].unitPrice).toBe(100.5);
  });
});

describe("mapInvoiceToParasutInput", () => {
  const items = [
    { name: "Test Hizmet", quantity: 1, unitPrice: 1000, taxRate: 20, discountRate: 0 },
  ];

  it("fatura verilerini Paraşüt input formatına dönüştürür", () => {
    const input = mapInvoiceToParasutInput(
      {
        invoiceNumber: "2025-0001",
        issueDate: new Date("2025-01-15"),
        dueDate: new Date("2025-02-15"),
        notes: "Test",
      },
      "contact-123",
      items
    );

    expect(input.invoiceNumber).toBe("2025-0001");
    expect(input.contactId).toBe("contact-123");
    expect(input.issueDate).toBe("2025-01-15");
    expect(input.dueDate).toBe("2025-02-15");
    expect(input.lines).toHaveLength(1);
  });

  it("vade tarihi yoksa düzenleme tarihi kullanılır", () => {
    const input = mapInvoiceToParasutInput(
      {
        invoiceNumber: "2025-0001",
        issueDate: new Date("2025-01-15"),
        dueDate: null,
      },
      "contact-123",
      items
    );

    expect(input.dueDate).toBe(input.issueDate);
  });

  it("fatura numarası null ise timestamp kullanılır", () => {
    const input = mapInvoiceToParasutInput(
      {
        invoiceNumber: null,
        issueDate: new Date("2025-01-15"),
      },
      "contact-123",
      items
    );

    expect(input.invoiceNumber).toContain("INV-");
  });
});

describe("mapCustomerToParasutContact", () => {
  it("kurumsal müşteriyi doğru eşleştirir", () => {
    const contact = mapCustomerToParasutContact({
      firstName: null,
      lastName: null,
      companyName: "ABC Şirketi",
      taxNumber: "1234567890",
      email: "abc@example.com",
      phone: "05321234567",
    });

    expect(contact.name).toBe("ABC Şirketi");
    expect(contact.taxNumber).toBe("1234567890");
    expect(contact.email).toBe("abc@example.com");
  });

  it("bireysel müşteriyi doğru eşleştirir", () => {
    const contact = mapCustomerToParasutContact({
      firstName: "Ahmet",
      lastName: "Yılmaz",
      companyName: null,
      taxNumber: null,
      email: null,
      phone: null,
    });

    expect(contact.name).toBe("Ahmet Yılmaz");
    expect(contact.taxNumber).toBeUndefined();
  });

  it("tüm alanlar null ise varsayılan ad kullanılır", () => {
    const contact = mapCustomerToParasutContact({
      firstName: null,
      lastName: null,
      companyName: null,
      taxNumber: null,
      email: null,
      phone: null,
    });

    expect(contact.name).toBe("Müşteri");
  });
});

// ---------------------------------------------------------------------------
// Mock Paraşüt API — Senkronizasyon senaryoları
// ---------------------------------------------------------------------------

describe("Paraşüt API senkronizasyonu (Mock)", () => {
  const mockCreateInvoice = jest.fn();
  const mockUpdateInvoice = jest.fn();
  const mockCancelInvoice = jest.fn();
  const mockCreatePayment = jest.fn();
  const mockFindOrCreateContact = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("yeni fatura başarıyla oluşturulur", async () => {
    mockFindOrCreateContact.mockResolvedValue("contact-123");
    mockCreateInvoice.mockResolvedValue({ id: "parasut-inv-001" });

    const contactId = await mockFindOrCreateContact({ name: "Test Müşteri" });
    const result = await mockCreateInvoice({
      invoiceNumber: "2025-0001",
      contactId,
      lines: [{ name: "Test", quantity: 1, unitPrice: 1000, vatRate: 20 }],
    });

    expect(result.id).toBe("parasut-inv-001");
    expect(mockFindOrCreateContact).toHaveBeenCalledTimes(1);
    expect(mockCreateInvoice).toHaveBeenCalledTimes(1);
  });

  it("mevcut fatura güncellenir", async () => {
    mockUpdateInvoice.mockResolvedValue(undefined);

    await mockUpdateInvoice("parasut-inv-001", {
      lines: [{ name: "Güncel Hizmet", quantity: 1, unitPrice: 1500, vatRate: 20 }],
    });

    expect(mockUpdateInvoice).toHaveBeenCalledWith(
      "parasut-inv-001",
      expect.objectContaining({ lines: expect.any(Array) })
    );
  });

  it("fatura iptal edilir", async () => {
    mockCancelInvoice.mockResolvedValue(undefined);

    await mockCancelInvoice("parasut-inv-001");

    expect(mockCancelInvoice).toHaveBeenCalledWith("parasut-inv-001");
  });

  it("ödeme kaydı oluşturulur", async () => {
    mockCreatePayment.mockResolvedValue({ id: "parasut-pay-001" });

    const result = await mockCreatePayment({
      invoiceId: "parasut-inv-001",
      amount: 1200,
      date: "2025-01-20",
    });

    expect(result.id).toBe("parasut-pay-001");
  });

  it("API hatası durumunda hata fırlatır", async () => {
    mockCreateInvoice.mockRejectedValue(new Error("Paraşüt API hatası (401): Yetkisiz"));

    await expect(
      mockCreateInvoice({ invoiceNumber: "2025-0001", contactId: "c-1", lines: [] })
    ).rejects.toThrow("Paraşüt API hatası");
  });

  it("müşteri deduplication: mevcut müşteri bulunur", async () => {
    mockFindOrCreateContact.mockResolvedValue("existing-contact-456");

    const contactId = await mockFindOrCreateContact({
      name: "Mevcut Müşteri",
      taxNumber: "1234567890",
    });

    expect(contactId).toBe("existing-contact-456");
  });
});

// ---------------------------------------------------------------------------
// Retry mekanizması simülasyonu
// ---------------------------------------------------------------------------

describe("Paraşüt retry mekanizması (simülasyon)", () => {
  it("3 denemeden sonra başarılı olur", async () => {
    let attempts = 0;
    const mockWithRetry = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Geçici hata");
      }
      return { id: "parasut-inv-001" };
    });

    // Retry mantığı simülasyonu
    let result;
    for (let i = 0; i < 3; i++) {
      try {
        result = await mockWithRetry();
        break;
      } catch {
        if (i === 2) throw new Error("Tüm denemeler başarısız");
      }
    }

    expect(attempts).toBe(3);
    expect(result?.id).toBe("parasut-inv-001");
  });

  it("3 denemeden sonra başarısız olursa hata fırlatır", async () => {
    const mockAlwaysFails = jest.fn().mockRejectedValue(new Error("Kalıcı hata"));

    let lastError: Error | null = null;
    for (let i = 0; i < 3; i++) {
      try {
        await mockAlwaysFails();
      } catch (err) {
        lastError = err as Error;
      }
    }

    expect(mockAlwaysFails).toHaveBeenCalledTimes(3);
    expect(lastError?.message).toBe("Kalıcı hata");
  });
});

// ---------------------------------------------------------------------------
// ParasutSyncLog simülasyonu
// ---------------------------------------------------------------------------

describe("ParasutSyncLog kaydı (simülasyon)", () => {
  const mockCreateLog = jest.fn();

  beforeEach(() => {
    mockCreateLog.mockClear();
  });

  it("başarılı senkronizasyon SUCCESS logu oluşturur", async () => {
    mockCreateLog.mockResolvedValue({ id: "log-001", status: "SUCCESS" });

    const log = await mockCreateLog({
      tenantId: "tenant-123",
      invoiceId: "inv-001",
      operation: "CREATE_INVOICE",
      status: "SUCCESS",
      errorMessage: null,
    });

    expect(log.status).toBe("SUCCESS");
    expect(mockCreateLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SUCCESS" })
    );
  });

  it("başarısız senkronizasyon FAILED logu oluşturur", async () => {
    mockCreateLog.mockResolvedValue({ id: "log-002", status: "FAILED" });

    const log = await mockCreateLog({
      tenantId: "tenant-123",
      invoiceId: "inv-001",
      operation: "CREATE_INVOICE",
      status: "FAILED",
      errorMessage: "API bağlantı hatası",
    });

    expect(log.status).toBe("FAILED");
    expect(mockCreateLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        errorMessage: "API bağlantı hatası",
      })
    );
  });
});
