# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier_invoice_integration.test.ts >> Firma Platformu Entegrasyon Testleri >> Test 3: Kısmi Ödeme
- Location: testsprite_tests\integration\supplier_invoice_integration.test.ts:78:7

# Error details

```
TimeoutError: page.selectOption: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('select[name="supplierId"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e6]: precision_manufacturing
        - generic [ref=e7]:
          - heading "Yükleniyor..." [level=1] [ref=e8]
          - paragraph [ref=e9]: ...
      - navigation [ref=e10]
      - generic [ref=e11]:
        - link "ABONELİK Paketinizi Yönetin upgrade Planı Yükselt" [ref=e12] [cursor=pointer]:
          - /url: /dashboard/settings/billing
          - paragraph [ref=e13]: ABONELİK
          - paragraph [ref=e14]: Paketinizi Yönetin
          - generic [ref=e15]:
            - generic [ref=e16]: upgrade
            - text: Planı Yükselt
        - generic [ref=e17]:
          - link "credit_card Abonelik & Fatura" [ref=e18] [cursor=pointer]:
            - /url: /dashboard/settings/billing
            - generic [ref=e19]: credit_card
            - text: Abonelik & Fatura
          - link "help Yardım Merkezi" [ref=e20] [cursor=pointer]:
            - /url: "#"
            - generic [ref=e21]: help
            - text: Yardım Merkezi
          - button "logout Çıkış Yap" [ref=e22]:
            - generic [ref=e23]: logout
            - text: Çıkış Yap
    - main [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]: search
            - textbox "Search orders, customers, license plates..." [ref=e29]
          - generic [ref=e30]:
            - link "Dashboard" [ref=e31] [cursor=pointer]:
              - /url: /dashboard
            - link "Inventory" [ref=e32] [cursor=pointer]:
              - /url: /dashboard/inventory
            - link "Customers" [ref=e33] [cursor=pointer]:
              - /url: /dashboard/customers
            - link "Reports" [ref=e34] [cursor=pointer]:
              - /url: "#"
        - generic [ref=e35]:
          - generic [ref=e36]:
            - button "notifications" [ref=e37]:
              - generic [ref=e38]: notifications
            - link "settings" [ref=e40] [cursor=pointer]:
              - /url: /dashboard/settings
              - generic [ref=e41]: settings
          - generic [ref=e42]:
            - generic [ref=e43]: AD
            - generic [ref=e44]:
              - paragraph [ref=e45]: Ahmet Bey
              - paragraph [ref=e46]: Servis Müdürü
      - generic [ref=e47]:
        - generic [ref=e48]: error
        - heading "Veri Yükleme Hatası" [level=2] [ref=e49]
        - paragraph [ref=e50]: Yetkisiz erişim.
  - alert [ref=e51]
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]:
    - img [ref=e58]
```

# Test source

```ts
  21  |   }
  22  | }
  23  | 
  24  | export class SupplierPage {
  25  |   constructor(private page: Page) {}
  26  | 
  27  |   async goto() {
  28  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/suppliers`);
  29  |     await this.page.waitForLoadState('networkidle');
  30  |   }
  31  | 
  32  |   async createSupplier(supplierData: any) {
  33  |     await this.page.click('button:has-text("Yeni Tedarikçi Ekle")');
  34  |     await this.page.fill('input[name="name"]', supplierData.name);
  35  |     await this.page.fill('input[name="contactPerson"]', supplierData.contactPerson);
  36  |     await this.page.fill('input[name="email"]', supplierData.email);
  37  |     await this.page.fill('input[name="phone"]', supplierData.phone);
  38  |     await this.page.click('button:has-text("Kaydet"), button:has-text("Tanımla")');
  39  |     await this.page.waitForLoadState('networkidle');
  40  |   }
  41  | 
  42  |   async verifySupplierCreated(supplierName: string) {
  43  |     await expect(this.page.locator(`text=${supplierName}`).first()).toBeVisible();
  44  |   }
  45  | }
  46  | 
  47  | export class StockPage {
  48  |   constructor(private page: Page) {}
  49  | 
  50  |   async goto() {
  51  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory`);
  52  |     await this.page.waitForLoadState('networkidle');
  53  |   }
  54  | 
  55  |   async createPart(partData: any) {
  56  |     await this.page.click('button:has-text("Stok Kartı Aç")');
  57  |     
  58  |     // Kategori seçimi
  59  |     const categorySelect = this.page.locator('select[name="categoryId"]');
  60  |     if (await categorySelect.isVisible()) {
  61  |       await categorySelect.selectOption({ index: 1 });
  62  |     }
  63  |     
  64  |     await this.page.fill('input[name="partNumber"]', partData.partNumber);
  65  |     await this.page.fill('input[name="name"]', partData.name);
  66  |     await this.page.fill('input[name="purchasePrice"]', partData.purchasePrice.toString());
  67  |     await this.page.fill('input[name="sellingPrice"]', partData.sellingPrice.toString());
  68  |     
  69  |     await this.page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
  70  |     await this.page.waitForLoadState('networkidle');
  71  |   }
  72  | 
  73  |   async verifyPartCreated(partNumber: string) {
  74  |     await expect(this.page.locator(`text=${partNumber}`).first()).toBeVisible();
  75  |   }
  76  | }
  77  | 
  78  | export class InvoicePage {
  79  |   constructor(private page: Page) {}
  80  | 
  81  |   async goto() {
  82  |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory/purchases`);
  83  |     await this.page.waitForLoadState('networkidle');
  84  |   }
  85  | 
  86  |   async createPurchaseInvoice(invoiceData: any) {
  87  |     await this.page.click('button:has-text("Stok Alımı Yap")');
  88  |     
  89  |     // Tedarikçi seçimi
  90  |     await this.page.selectOption('select', { label: invoiceData.supplierName });
  91  |     
  92  |     // Kalemleri ekle
  93  |     for (let i = 0; i < invoiceData.items.length; i++) {
  94  |       if (i > 0) await this.page.click('button:has-text("Ekle")');
  95  |       const item = invoiceData.items[i];
  96  |       
  97  |       // nth index ile select ve inputları hedefle
  98  |       await this.page.locator('select').nth(i + 1).selectOption({ label: item.partName });
  99  |       await this.page.locator('input[type="number"]').nth(i * 2).fill(item.quantity.toString());
  100 |     }
  101 |     
  102 |     await this.page.click('button:has-text("Kaydet"), button:has-text("Oluştur")');
  103 |     await this.page.waitForLoadState('networkidle');
  104 |   }
  105 | 
  106 |   async verifyInvoiceCreated() {
  107 |     await expect(this.page.locator('text=Başarıyla oluşturuldu, text=İşlem başarılı').first()).toBeVisible();
  108 |   }
  109 | }
  110 | 
  111 | export class PaymentPage {
  112 |   constructor(private page: Page) {}
  113 | 
  114 |   async goto() {
  115 |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/finance/payments/new`);
  116 |     await this.page.waitForLoadState('networkidle');
  117 |   }
  118 | 
  119 |   async makePartialPayment(supplierName: string, amount: number, notes: string) {
  120 |     // Tedarikçi seçimi
> 121 |     await this.page.selectOption('select[name="supplierId"]', { label: supplierName });
      |                     ^ TimeoutError: page.selectOption: Timeout 10000ms exceeded.
  122 |     
  123 |     await this.page.fill('input[name="amount"]', amount.toString());
  124 |     await this.page.fill('textarea[name="notes"]', notes);
  125 |     await this.page.click('button:has-text("Kaydet"), button:has-text("Ödeme Yap")');
  126 |   }
  127 | }
  128 | 
  129 | export class StockMovementPage {
  130 |   constructor(private page: Page) {}
  131 | 
  132 |   async goto() {
  133 |     await this.page.goto(`${testData.test_environment.base_url}/dashboard/inventory/movements`);
  134 |     await this.page.waitForLoadState('networkidle');
  135 |   }
  136 | }
```