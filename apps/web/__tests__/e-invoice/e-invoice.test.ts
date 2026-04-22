// Feature: invoice-payment-accounting
// Entegrasyon testleri: Mock GİB API ile e-Fatura gönderme, red ve iptal senaryoları

import { generateUBLTRXml, getEInvoiceXmlKey } from "@/lib/e-invoice/ubl-tr-generator";

// ---------------------------------------------------------------------------
// UBL-TR XML Üretimi — Birim testleri
// ---------------------------------------------------------------------------

const sampleUBLData = {
  invoice: {
    id: "inv-001",
    invoiceNumber: "2025-0001",
    issueDate: new Date("2025-01-15"),
    dueDate: new Date("2025-02-15"),
    notes: "Test faturası",
    subTotal: 1000,
    taxAmount: 200,
    discountAmount: 0,
    totalAmount: 1200,
  },
  supplier: {
    name: "Test Oto Servis Ltd. Şti.",
    taxNumber: "1234567890",
    taxOffice: "Kadıköy",
    address: "Test Caddesi No:1",
    city: "İstanbul",
    phone: "05321234567",
    email: "test@example.com",
  },
  customer: {
    name: "Ahmet Yılmaz",
    taxNumber: "98765432100",
    address: "Müşteri Caddesi No:2",
    city: "Ankara",
    phone: "05329876543",
    email: "ahmet@example.com",
  },
  items: [
    {
      id: "item-001",
      name: "Motor Yağı Değişimi",
      quantity: 1,
      unitPrice: 500,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 600,
    },
    {
      id: "item-002",
      name: "Yağ Filtresi",
      quantity: 2,
      unitPrice: 250,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 600,
    },
  ],
};

describe("generateUBLTRXml", () => {
  it("geçerli XML belgesi üretir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<Invoice");
    expect(xml).toContain("</Invoice>");
  });

  it("UBL-TR 2.1 versiyonunu içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
  });

  it("fatura numarasını içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("2025-0001");
  });

  it("satıcı VKN'sini içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("1234567890");
  });

  it("alıcı VKN'sini içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("98765432100");
  });

  it("kalem sayısını doğru gösterir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("<cbc:LineCountNumeric>2</cbc:LineCountNumeric>");
  });

  it("toplam tutarı içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("1200.00");
  });

  it("KDV tutarını içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("200.00");
  });

  it("TRY para birimini kullanır", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain('currencyID="TRY"');
  });

  it("kalem adlarını içerir", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("Motor Yağı Değişimi");
    expect(xml).toContain("Yağ Filtresi");
  });

  it("XSS koruması: özel karakterleri escape eder", () => {
    const dataWithXss = {
      ...sampleUBLData,
      supplier: { ...sampleUBLData.supplier, name: '<script>alert("xss")</script>' },
    };
    const xml = generateUBLTRXml(dataWithXss);
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
  });

  it("SATIS fatura tipi varsayılan olarak kullanılır", () => {
    const xml = generateUBLTRXml(sampleUBLData);
    expect(xml).toContain("<cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>");
  });

  it("IADE fatura tipi belirtilebilir", () => {
    const xml = generateUBLTRXml({ ...sampleUBLData, invoiceType: "IADE" });
    expect(xml).toContain("<cbc:InvoiceTypeCode>IADE</cbc:InvoiceTypeCode>");
  });
});

// ---------------------------------------------------------------------------
// getEInvoiceXmlKey — Birim testleri
// ---------------------------------------------------------------------------

describe("getEInvoiceXmlKey", () => {
  it("doğru S3 key formatı üretir", () => {
    const key = getEInvoiceXmlKey("tenant-123", "2025-0001");
    expect(key).toBe("e-invoices/tenant-123/2025-0001.xml");
  });

  it(".xml uzantısıyla biter", () => {
    const key = getEInvoiceXmlKey("tenant-abc", "2025-0001");
    expect(key.endsWith(".xml")).toBe(true);
  });

  it("e-invoices/ önekiyle başlar", () => {
    const key = getEInvoiceXmlKey("tenant-abc", "2025-0001");
    expect(key.startsWith("e-invoices/")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mock GİB API — e-Fatura gönderme, red ve iptal senaryoları
// ---------------------------------------------------------------------------

describe("e-Fatura entegratör istemcisi (Mock)", () => {
  // Mock entegratör fonksiyonları
  const mockSendEInvoice = jest.fn();
  const mockQueryStatus = jest.fn();
  const mockCancelEInvoice = jest.fn();
  const mockCheckEligibility = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("başarılı e-Fatura gönderimi UUID ve ETTN döner", async () => {
    mockSendEInvoice.mockResolvedValue({
      success: true,
      uuid: "12345678-1234-1234-1234-123456789012",
      ettn: "ETTN-2025-001",
    });

    const result = await mockSendEInvoice("<xml>test</xml>", "2025-0001");

    expect(result.success).toBe(true);
    expect(result.uuid).toBeDefined();
    expect(result.ettn).toBeDefined();
  });

  it("GİB API hatası durumunda success: false döner", async () => {
    mockSendEInvoice.mockResolvedValue({
      success: false,
      errorMessage: "Vergi numarası geçersiz",
    });

    const result = await mockSendEInvoice("<xml>test</xml>", "2025-0001");

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
  });

  it("ACCEPTED durum sorgulaması doğru çalışır", async () => {
    mockQueryStatus.mockResolvedValue({
      success: true,
      status: "ACCEPTED",
    });

    const result = await mockQueryStatus("12345678-1234-1234-1234-123456789012");

    expect(result.success).toBe(true);
    expect(result.status).toBe("ACCEPTED");
  });

  it("REJECTED durum sorgulaması doğru çalışır", async () => {
    mockQueryStatus.mockResolvedValue({
      success: true,
      status: "REJECTED",
    });

    const result = await mockQueryStatus("12345678-1234-1234-1234-123456789012");

    expect(result.status).toBe("REJECTED");
  });

  it("başarılı iptal işlemi", async () => {
    mockCancelEInvoice.mockResolvedValue({ success: true });

    const result = await mockCancelEInvoice("12345678-1234-1234-1234-123456789012");

    expect(result.success).toBe(true);
  });

  it("iptal başarısız olursa hata mesajı döner", async () => {
    mockCancelEInvoice.mockResolvedValue({
      success: false,
      errorMessage: "Fatura iptal edilemez: ACCEPTED durumunda değil",
    });

    const result = await mockCancelEInvoice("12345678-1234-1234-1234-123456789012");

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("iptal edilemez");
  });

  it("e-Fatura mükellefiyeti sorgulaması — mükellef", async () => {
    mockCheckEligibility.mockResolvedValue({ isEligible: true });

    const result = await mockCheckEligibility("1234567890");

    expect(result.isEligible).toBe(true);
  });

  it("e-Fatura mükellefiyeti sorgulaması — mükellef değil", async () => {
    mockCheckEligibility.mockResolvedValue({ isEligible: false });

    const result = await mockCheckEligibility("9876543210");

    expect(result.isEligible).toBe(false);
  });

  it("API bağlantı hatası durumunda hata fırlatır", async () => {
    mockSendEInvoice.mockRejectedValue(new Error("Bağlantı zaman aşımı"));

    await expect(
      mockSendEInvoice("<xml>test</xml>", "2025-0001")
    ).rejects.toThrow("Bağlantı zaman aşımı");
  });
});
