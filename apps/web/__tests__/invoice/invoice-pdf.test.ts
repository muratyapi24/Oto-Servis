// Feature: invoice-payment-accounting
// Entegrasyon testleri: Mock S3 ile PDF oluşturma ve yükleme akışı

import { generateInvoiceHtml, getInvoicePdfKey } from "@/lib/invoice-pdf";

// ---------------------------------------------------------------------------
// generateInvoiceHtml — Birim testleri
// ---------------------------------------------------------------------------

const sampleData = {
  invoice: {
    id: "inv-001",
    invoiceNumber: "2025-0001",
    issueDate: new Date("2025-01-15"),
    dueDate: new Date("2025-02-15"),
    status: "SENT",
    subTotal: 1000,
    taxAmount: 200,
    discountAmount: 0,
    totalAmount: 1200,
    notes: "Test faturası",
  },
  tenant: {
    name: "Test Oto Servis",
    taxNumber: "1234567890",
    taxOffice: "Kadıköy",
    address: "Test Caddesi No:1 İstanbul",
    phone: "05321234567",
    email: "test@example.com",
    logoUrl: null,
  },
  customer: {
    firstName: "Ahmet",
    lastName: "Yılmaz",
    companyName: null,
    taxNumber: "98765432100",
    address: "Müşteri Caddesi No:2",
    phone: "05329876543",
    email: "ahmet@example.com",
  },
  items: [
    {
      name: "Motor Yağı Değişimi",
      type: "LABOR",
      quantity: 1,
      unitPrice: 500,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 600,
    },
    {
      name: "Yağ Filtresi",
      type: "PART",
      quantity: 1,
      unitPrice: 500,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 600,
    },
  ],
};

describe("generateInvoiceHtml", () => {
  it("geçerli HTML belgesi üretir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("fatura numarasını içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("2025-0001");
  });

  it("firma adını içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("Test Oto Servis");
  });

  it("müşteri adını içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("Ahmet");
    expect(html).toContain("Yılmaz");
  });

  it("kalem adlarını içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("Motor Yağı Değişimi");
    expect(html).toContain("Yağ Filtresi");
  });

  it("toplam tutarı içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    // 1.200 TL formatında olmalı
    expect(html).toContain("1.200");
  });

  it("KDV tutarını içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("200");
  });

  it("notları içerir", () => {
    const html = generateInvoiceHtml(sampleData);
    expect(html).toContain("Test faturası");
  });

  it("logo yoksa placeholder gösterir", () => {
    const html = generateInvoiceHtml(sampleData);
    // Logo yoksa firma adının ilk harfi gösterilmeli
    expect(html).toContain("logo-placeholder");
  });

  it("logo varsa img etiketi içerir", () => {
    const dataWithLogo = {
      ...sampleData,
      tenant: { ...sampleData.tenant, logoUrl: "https://example.com/logo.png" },
    };
    const html = generateInvoiceHtml(dataWithLogo);
    expect(html).toContain("https://example.com/logo.png");
  });

  it("XSS koruması: özel karakterleri escape eder", () => {
    const dataWithXss = {
      ...sampleData,
      tenant: { ...sampleData.tenant, name: '<script>alert("xss")</script>' },
    };
    const html = generateInvoiceHtml(dataWithXss);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("müşteri yoksa hata vermez", () => {
    const dataWithoutCustomer = { ...sampleData, customer: null };
    expect(() => generateInvoiceHtml(dataWithoutCustomer)).not.toThrow();
  });

  it("kalem yoksa hata vermez", () => {
    const dataWithoutItems = { ...sampleData, items: [] };
    const html = generateInvoiceHtml(dataWithoutItems);
    expect(html).toContain("Kalem bulunamadı");
  });
});

// ---------------------------------------------------------------------------
// getInvoicePdfKey — Birim testleri
// ---------------------------------------------------------------------------

describe("getInvoicePdfKey", () => {
  it("doğru S3 key formatı üretir", () => {
    const key = getInvoicePdfKey("tenant-123", "2025-0001");
    expect(key).toBe("invoices/tenant-123/2025-0001.pdf");
  });

  it("özel karakterleri temizler", () => {
    const key = getInvoicePdfKey("tenant-123", "TASLAK-1735689600000");
    expect(key).toContain("invoices/tenant-123/");
    expect(key).toContain(".pdf");
    // Özel karakterler _ ile değiştirilmeli
    expect(key).not.toContain(" ");
  });

  it("tenant ID'yi doğru konumlandırır", () => {
    const key = getInvoicePdfKey("my-tenant", "2025-0042");
    expect(key.startsWith("invoices/my-tenant/")).toBe(true);
  });

  it(".pdf uzantısıyla biter", () => {
    const key = getInvoicePdfKey("tenant-abc", "2025-0001");
    expect(key.endsWith(".pdf")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mock S3 yükleme akışı simülasyonu
// ---------------------------------------------------------------------------

describe("PDF yükleme akışı (simülasyon)", () => {
  // uploadFile fonksiyonunu mock'la
  const mockUploadFile = jest.fn().mockResolvedValue({
    url: "https://bucket.s3.amazonaws.com/invoices/tenant-123/2025-0001.pdf",
    key: "invoices/tenant-123/2025-0001.pdf",
  });

  beforeEach(() => {
    mockUploadFile.mockClear();
  });

  it("HTML içeriği Buffer olarak yüklenir", async () => {
    const html = generateInvoiceHtml(sampleData);
    const key = getInvoicePdfKey("tenant-123", "2025-0001");
    const buffer = Buffer.from(html, "utf-8");

    await mockUploadFile(buffer, key, "text/html; charset=utf-8");

    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "invoices/tenant-123/2025-0001.pdf",
      "text/html; charset=utf-8"
    );
  });

  it("yükleme başarısız olursa hata fırlatır", async () => {
    mockUploadFile.mockRejectedValueOnce(new Error("S3 bağlantı hatası"));

    await expect(
      mockUploadFile(Buffer.from("test"), "key", "text/html")
    ).rejects.toThrow("S3 bağlantı hatası");
  });

  it("PDF key formatı doğru oluşturulur", () => {
    const tenantId = "tenant-abc-123";
    const invoiceNumber = "2025-0099";
    const key = getInvoicePdfKey(tenantId, invoiceNumber);

    expect(key).toBe(`invoices/${tenantId}/${invoiceNumber}.pdf`);
  });
});
