import {
  PrismaClient,
  UserRole,
  CustomerType,
  ServiceOrderStatus,
  ServiceItemType,
  InvoiceType,
  InvoiceStatus,
  PaymentMethod,
  PaymentType,
  AppointmentStatus,
  QuoteStatus,
  NotificationType,
  NotificationStatus,
  LoyaltyTransactionType,
  CommissionRuleType,
  StockCountStatus,
  StockTransferStatus,
  PurchaseOrderStatus,
  NotificationSeverity,
  InvoiceItemType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Yardımcı Fonksiyonlar
// ---------------------------------------------------------------------------

/**
 * Servis kalemi / teklif kalemi için matematiksel tutarlı değerleri hesaplar.
 * Tüm Decimal alanlar doğrudan number olarak döner — Prisma otomatik dönüştürür.
 */
function calcItem(qty: number, unitPrice: number, taxRate: number, discount = 0) {
  const subTotal = qty * unitPrice - discount;
  const taxAmount = (subTotal * taxRate) / 100;
  const totalPrice = subTotal + taxAmount;
  return { subTotal, taxAmount, totalPrice };
}

/**
 * FAT-2026-XXXX formatında fatura numarası üretir.
 * Örnek: invoiceNumber(1) → "FAT-2026-0001"
 */
function invoiceNumber(seq: number): string {
  return `FAT-2026-${String(seq).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Ana Fonksiyon
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seed başlatılıyor...');

  // -------------------------------------------------------------------------
  // Görev 2.1 — Temizlik: tüm tablolar ters bağımlılık sırasıyla siliniyor
  // -------------------------------------------------------------------------
  console.log('Veritabanı temizleniyor...');

  // Seviye 5 — En derin yapraklar (önce silinir)
  await prisma.checkPayment.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.parasutSyncLog.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockCountItem.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.serviceRating.deleteMany();
  await prisma.workLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.inspectionForm.deleteMany();
  await prisma.document.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.kvkkConsent.deleteMany();
  await prisma.dataSubjectRequest.deleteMany();

  // Seviye 4
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.stockCount.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.bulkNotificationCampaign.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.customerNotificationPreference.deleteMany();

  // Seviye 3
  await prisma.serviceOrder.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.maintenancePlan.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemNotification.deleteMany();

  // Seviye 3 — Yeni tenant düzeyinde modeller
  await prisma.automationWorkflow.deleteMany();
  await prisma.nPSResponse.deleteMany();
  await prisma.supportTicket.deleteMany();

  // Seviye 2
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.location.deleteMany();
  // Not: WebhookEvent, AccountingIntegration, NotificationProvider, PushSubscription
  // tabloları migration'larda henüz oluşturulmamış olabilir — atlanıyor.

  // Seviye 0 — Platform düzeyinde modeller (tenant bağımlılığı yok)
  await prisma.deployment.deleteMany();
  await prisma.infraNode.deleteMany();
  await prisma.capacitySnapshot.deleteMany();
  await prisma.cloudCostRecord.deleteMany();
  await prisma.backupRecord.deleteMany();
  await prisma.kMSKey.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.reportTemplate.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.addon.deleteMany();

  // Seviye 1 — Kök tablolar (en son silinir)
  await prisma.user.deleteMany({ where: { role: { not: UserRole.SUPER_ADMIN } } });
  await prisma.subscription.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  console.log('Veritabanı temizlendi.');

  // -------------------------------------------------------------------------
  // Görev 2.2 — SUPER_ADMIN upsert
  // -------------------------------------------------------------------------
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'superadmin@msotoservis.com' },
    update: { password: superAdminPassword, role: UserRole.SUPER_ADMIN, isActive: true },
    create: {
      name: 'Super Admin',
      email: 'superadmin@msotoservis.com',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
  });
  console.log('SUPER_ADMIN upsert tamamlandı.');

  // -------------------------------------------------------------------------
  // Görev 3 — Abonelik planları
  // -------------------------------------------------------------------------
  console.log('Abonelik planları oluşturuluyor...');

  const planStarter = await prisma.subscriptionPlan.create({
    data: {
      name: 'Başlangıç',
      slug: 'starter',
      description: 'Küçük oto servisler için temel özellikler.',
      priceMonthly: 799,
      priceYearly: 7990,
      trialDays: 14,
      features: {
        serviceOrders: true,
        appointments: true,
        basicReports: true,
        stockManagement: false,
        customerPortal: false,
        whiteLabel: false,
        apiAccess: false,
        multiLocation: false,
      },
      limits: { users: 1, vehicles: 50 },
      sortOrder: 1,
      isActive: true,
    },
  });

  const planProfessional = await prisma.subscriptionPlan.create({
    data: {
      name: 'Profesyonel',
      slug: 'professional',
      description: 'Orta ölçekli servisler için gelişmiş özellikler.',
      priceMonthly: 1499,
      priceYearly: 14990,
      trialDays: 14,
      features: {
        serviceOrders: true,
        appointments: true,
        advancedReports: true,
        stockManagement: true,
        customerPortal: true,
        whiteLabel: false,
        apiAccess: false,
        multiLocation: false,
      },
      limits: { users: 5, vehicles: -1 },
      sortOrder: 2,
      isActive: true,
    },
  });

  const planEnterprise = await prisma.subscriptionPlan.create({
    data: {
      name: 'Kurumsal',
      slug: 'enterprise',
      description: 'Büyük servis zincirleri için sınırsız özellikler.',
      priceMonthly: 2999,
      priceYearly: 29990,
      trialDays: 30,
      features: {
        serviceOrders: true,
        appointments: true,
        advancedReports: true,
        stockManagement: true,
        customerPortal: true,
        whiteLabel: true,
        apiAccess: true,
        multiLocation: true,
      },
      limits: { users: 15, vehicles: -1 },
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('Abonelik planları oluşturuldu.');
  // =========================================================================
  // TENANT A — MS Oto Servis A.Ş.
  // =========================================================================
  console.log('Tenant A oluşturuluyor: MS Oto Servis A.Ş....');

  // --- 4.1 Tenant ve Subscription ---
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'MS Oto Servis A.Ş.',
      slug: 'ms-oto-servis',
      taxNumber: '1234567890',
      taxOffice: 'Maslak Vergi Dairesi',
      email: 'info@msotoservis.com',
      phone: '02122345678',
      address: 'Maslak Oto Sanayi Sitesi, A Blok No:12, Sarıyer',
      city: 'İstanbul',
      website: 'https://www.msotoservis.com',
      slogan: 'Aracınıza Güvenle Bakıyoruz',
      status: 'ACTIVE',
    },
  });

  const subscriptionA = await prisma.subscription.create({
    data: {
      tenantId: tenantA.id,
      planId: planProfessional.id,
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-12-31'),
    },
  });

  console.log('Tenant A ve Subscription oluşturuldu.');

  // --- 4.2 Lokasyonlar ---
  const locMaslak = await prisma.location.create({
    data: {
      tenantId: tenantA.id,
      name: 'Maslak Şubesi',
      address: 'Maslak Oto Sanayi Sitesi, A Blok No:12',
      city: 'İstanbul',
      phone: '02122345678',
      email: 'maslak@msotoservis.com',
      isActive: true,
      isDefault: true,
    },
  });

  const locLevent = await prisma.location.create({
    data: {
      tenantId: tenantA.id,
      name: 'Levent Şubesi',
      address: 'Levent Oto Sanayi, B Blok No:5',
      city: 'İstanbul',
      phone: '02122345679',
      email: 'levent@msotoservis.com',
      isActive: true,
      isDefault: false,
    },
  });

  console.log('Tenant A lokasyonları oluşturuldu.');

  // --- 4.3 Kullanıcılar ---
  const pwAdmin = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const pwResepsiyon = await bcrypt.hash('Resepsiyon123!', SALT_ROUNDS);
  const pwMuhasebe = await bcrypt.hash('Muhasebe123!', SALT_ROUNDS);
  const pwUsta = await bcrypt.hash('Usta123!', SALT_ROUNDS);

  await prisma.user.create({
    data: {
      name: 'MS Admin',
      email: 'admin@msotoservis.com',
      password: pwAdmin,
      role: UserRole.TENANT_ADMIN,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Resepsiyon MS',
      email: 'resepsiyon@msotoservis.com',
      password: pwResepsiyon,
      role: UserRole.RECEPTIONIST,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Muhasebe MS',
      email: 'muhasebe@msotoservis.com',
      password: pwMuhasebe,
      role: UserRole.ACCOUNTANT,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  // 3 MECHANIC kullanıcısı
  const ustaUser1A = await prisma.user.create({
    data: {
      name: 'Ahmet Yılmaz',
      email: 'usta1@msotoservis.com',
      password: pwUsta,
      role: UserRole.MECHANIC,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  const ustaUser2A = await prisma.user.create({
    data: {
      name: 'Mehmet Kaya',
      email: 'usta2@msotoservis.com',
      password: pwUsta,
      role: UserRole.MECHANIC,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  const ustaUser3A = await prisma.user.create({
    data: {
      name: 'Hüseyin Demir',
      email: 'usta3@msotoservis.com',
      password: pwUsta,
      role: UserRole.MECHANIC,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  console.log('Tenant A kullanıcıları oluşturuldu.');

  // --- 4.4 Mechanic profilleri ve CommissionRule ---
  const mechanic1A = await prisma.mechanic.create({
    data: {
      tenantId: tenantA.id,
      userId: ustaUser1A.id,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '05321112233',
      email: 'usta1@msotoservis.com',
      specialties: ['Motor', 'Mekanik'],
      hourlyRate: 250,
      isActive: true,
    },
  });

  const mechanic2A = await prisma.mechanic.create({
    data: {
      tenantId: tenantA.id,
      userId: ustaUser2A.id,
      firstName: 'Mehmet',
      lastName: 'Kaya',
      phone: '05332223344',
      email: 'usta2@msotoservis.com',
      specialties: ['Elektrik', 'Elektronik'],
      hourlyRate: 280,
      isActive: true,
    },
  });

  const mechanic3A = await prisma.mechanic.create({
    data: {
      tenantId: tenantA.id,
      userId: ustaUser3A.id,
      firstName: 'Hüseyin',
      lastName: 'Demir',
      phone: '05343334455',
      email: 'usta3@msotoservis.com',
      specialties: ['Kaporta', 'Boya'],
      hourlyRate: 300,
      isActive: true,
    },
  });

  // CommissionRule — her usta için PERCENTAGE
  await prisma.commissionRule.create({
    data: { tenantId: tenantA.id, mechanicId: mechanic1A.id, ruleType: CommissionRuleType.PERCENTAGE, value: 8, isActive: true },
  });
  await prisma.commissionRule.create({
    data: { tenantId: tenantA.id, mechanicId: mechanic2A.id, ruleType: CommissionRuleType.PERCENTAGE, value: 9, isActive: true },
  });
  await prisma.commissionRule.create({
    data: { tenantId: tenantA.id, mechanicId: mechanic3A.id, ruleType: CommissionRuleType.PERCENTAGE, value: 10, isActive: true },
  });

  console.log('Tenant A mechanic profilleri ve komisyon kuralları oluşturuldu.');
  // =========================================================================
  // TENANT A — Tedarikçiler, Parça Kategorileri ve Parçalar
  // =========================================================================
  console.log('Tenant A tedarikçiler ve parçalar oluşturuluyor...');

  // --- 5.1 Tedarikçiler ---
  const supplierA1 = await prisma.supplier.create({
    data: {
      tenantId: tenantA.id,
      name: 'Bosch Otomotiv Parçaları A.Ş.',
      contactPerson: 'Kemal Arslan',
      email: 'satis@boschoto.com.tr',
      phone: '02123456789',
      taxOffice: 'Şişli Vergi Dairesi',
      taxNumber: '1111111111',
      address: 'Şişli Sanayi Sitesi No:45, İstanbul',
    },
  });

  const supplierA2 = await prisma.supplier.create({
    data: {
      tenantId: tenantA.id,
      name: 'Meka Yedek Parça Ltd. Şti.',
      contactPerson: 'Serkan Çelik',
      email: 'info@mekayedek.com',
      phone: '02124567890',
      taxOffice: 'Bağcılar Vergi Dairesi',
      taxNumber: '2222222222',
      address: 'Bağcılar Oto Sanayi, C Blok No:8, İstanbul',
    },
  });

  const supplierA3 = await prisma.supplier.create({
    data: {
      tenantId: tenantA.id,
      name: 'Türk Lastik ve Jant Tic. A.Ş.',
      contactPerson: 'Fatih Yıldız',
      email: 'siparis@turklastik.com',
      phone: '02125678901',
      taxOffice: 'Kadıköy Vergi Dairesi',
      taxNumber: '3333333333',
      address: 'Kadıköy Oto Sanayi No:22, İstanbul',
    },
  });

  // --- 5.2 Parça Kategorileri ---
  const catMotorA = await prisma.partCategory.create({
    data: { tenantId: tenantA.id, name: 'Motor Parçaları', description: 'Motor ve mekanik sistem parçaları', isActive: true },
  });
  const catFrenA = await prisma.partCategory.create({
    data: { tenantId: tenantA.id, name: 'Fren Sistemi', description: 'Fren balataları, diskler ve hidrolik parçalar', isActive: true },
  });
  const catElektrikA = await prisma.partCategory.create({
    data: { tenantId: tenantA.id, name: 'Elektrik & Elektronik', description: 'Akü, buji, sensörler ve elektronik parçalar', isActive: true },
  });
  const catFiltrelerA = await prisma.partCategory.create({
    data: { tenantId: tenantA.id, name: 'Filtreler', description: 'Hava, yağ, yakıt ve polen filtreleri', isActive: true },
  });
  const catLastikA = await prisma.partCategory.create({
    data: { tenantId: tenantA.id, name: 'Lastik & Jant', description: 'Lastikler, jantlar ve aksesuar parçaları', isActive: true },
  });

  // --- 5.3 Parçalar (10 adet, her kategoride 2) ---
  const partA1 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catMotorA.id, supplierId: supplierA1.id,
      partNumber: 'PRT-A-001', name: 'Motor Yağı 5W-40 (4L)', brand: 'Castrol',
      purchasePrice: 280, sellingPrice: 420, taxRate: 20,
      currentStock: 50, minStockLevel: 10, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA2 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catMotorA.id, supplierId: supplierA1.id,
      partNumber: 'PRT-A-002', name: 'Yağ Filtresi', brand: 'Mann Filter',
      purchasePrice: 45, sellingPrice: 85, taxRate: 20,
      currentStock: 80, minStockLevel: 20, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA3 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catFrenA.id, supplierId: supplierA2.id,
      partNumber: 'PRT-A-003', name: 'Ön Fren Balatası (Takım)', brand: 'Brembo',
      purchasePrice: 320, sellingPrice: 520, taxRate: 20,
      currentStock: 30, minStockLevel: 8, unit: 'takım', locationId: locMaslak.id,
    },
  });
  const partA4 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catFrenA.id, supplierId: supplierA2.id,
      partNumber: 'PRT-A-004', name: 'Fren Diski (Ön)', brand: 'Brembo',
      purchasePrice: 450, sellingPrice: 720, taxRate: 20,
      currentStock: 20, minStockLevel: 5, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA5 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catElektrikA.id, supplierId: supplierA1.id,
      partNumber: 'PRT-A-005', name: 'Akü 60Ah', brand: 'Varta',
      purchasePrice: 1200, sellingPrice: 1850, taxRate: 20,
      currentStock: 15, minStockLevel: 3, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA6 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catElektrikA.id, supplierId: supplierA1.id,
      partNumber: 'PRT-A-006', name: 'Ateşleme Bujisi (4\'lü)', brand: 'NGK',
      purchasePrice: 180, sellingPrice: 290, taxRate: 20,
      currentStock: 40, minStockLevel: 10, unit: 'set', locationId: locMaslak.id,
    },
  });
  const partA7 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catFiltrelerA.id, supplierId: supplierA2.id,
      partNumber: 'PRT-A-007', name: 'Hava Filtresi', brand: 'Mann Filter',
      purchasePrice: 65, sellingPrice: 110, taxRate: 20,
      currentStock: 60, minStockLevel: 15, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA8 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catFiltrelerA.id, supplierId: supplierA2.id,
      partNumber: 'PRT-A-008', name: 'Polen Filtresi', brand: 'Bosch',
      purchasePrice: 55, sellingPrice: 95, taxRate: 20,
      currentStock: 45, minStockLevel: 10, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA9 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catLastikA.id, supplierId: supplierA3.id,
      partNumber: 'PRT-A-009', name: 'Lastik 205/55 R16', brand: 'Michelin',
      purchasePrice: 850, sellingPrice: 1250, taxRate: 20,
      currentStock: 24, minStockLevel: 4, unit: 'adet', locationId: locMaslak.id,
    },
  });
  const partA10 = await prisma.part.create({
    data: {
      tenantId: tenantA.id, categoryId: catLastikA.id, supplierId: supplierA3.id,
      partNumber: 'PRT-A-010', name: 'Sibop Seti (4\'lü)', brand: 'Schrader',
      purchasePrice: 25, sellingPrice: 45, taxRate: 20,
      currentStock: 100, minStockLevel: 20, unit: 'set', locationId: locMaslak.id,
    },
  });

  console.log('Tenant A tedarikçiler ve parçalar oluşturuldu.');
  // =========================================================================
  // TENANT A — Müşteriler, Araçlar ve İlgili Kayıtlar
  // =========================================================================
  console.log('Tenant A müşteriler ve araçlar oluşturuluyor...');

  // --- 6.1 Müşteriler (4 bireysel, 1 kurumsal) ---
  const custA1 = await prisma.customer.create({
    data: {
      tenantId: tenantA.id, type: CustomerType.INDIVIDUAL,
      firstName: 'Fatma', lastName: 'Şahin',
      phone: '05321234567', email: 'fatma.sahin@gmail.com',
      city: 'İstanbul', rewardPoints: 150,
    },
  });
  const custA2 = await prisma.customer.create({
    data: {
      tenantId: tenantA.id, type: CustomerType.INDIVIDUAL,
      firstName: 'Ali', lastName: 'Çelik',
      phone: '05339876543', email: 'ali.celik@hotmail.com',
      city: 'İstanbul', rewardPoints: 80,
    },
  });
  const custA3 = await prisma.customer.create({
    data: {
      tenantId: tenantA.id, type: CustomerType.INDIVIDUAL,
      firstName: 'Zeynep', lastName: 'Arslan',
      phone: '05412223344', email: 'zeynep.arslan@gmail.com',
      city: 'İstanbul', rewardPoints: 200,
    },
  });
  const custA4 = await prisma.customer.create({
    data: {
      tenantId: tenantA.id, type: CustomerType.INDIVIDUAL,
      firstName: 'Mustafa', lastName: 'Öztürk',
      phone: '05554445566', email: 'mustafa.ozturk@yahoo.com',
      city: 'İstanbul', rewardPoints: 50,
    },
  });
  const custA5 = await prisma.customer.create({
    data: {
      tenantId: tenantA.id, type: CustomerType.CORPORATE,
      companyName: 'Kartal Lojistik A.Ş.',
      contactPerson: 'Serkan Kartal',
      taxNumber: '9876543210',
      taxOffice: 'Kadıköy Vergi Dairesi',
      phone: '02163334455', email: 'filo@kartallojistik.com',
      city: 'İstanbul', rewardPoints: 500,
    },
  });

  // --- 6.2 Araçlar ---
  const vehicleA1 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id, customerId: custA1.id,
      plate: '34 FŞ 4521', brand: 'Volkswagen', model: 'Golf',
      year: 2019, color: 'Beyaz', fuelType: 'Dizel', transmission: 'Manuel', mileage: 87500,
    },
  });
  const vehicleA2 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id, customerId: custA2.id,
      plate: '34 AÇ 7823', brand: 'Ford', model: 'Focus',
      year: 2020, color: 'Gri', fuelType: 'Benzin', transmission: 'Otomatik', mileage: 54200,
    },
  });
  const vehicleA3 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id, customerId: custA3.id,
      plate: '34 ZA 1190', brand: 'Renault', model: 'Clio',
      year: 2018, color: 'Kırmızı', fuelType: 'Benzin', transmission: 'Manuel', mileage: 112000,
    },
  });
  const vehicleA4 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id, customerId: custA4.id,
      plate: '34 MÖ 3344', brand: 'Toyota', model: 'Corolla',
      year: 2021, color: 'Siyah', fuelType: 'Hibrit', transmission: 'Otomatik', mileage: 31000,
    },
  });
  const vehicleA5 = await prisma.vehicle.create({
    data: {
      tenantId: tenantA.id, customerId: custA5.id,
      plate: '34 KL 9900', brand: 'Fiat', model: 'Egea',
      year: 2022, color: 'Mavi', fuelType: 'Dizel', transmission: 'Manuel', mileage: 18500,
    },
  });

  // --- 6.3 Müşteri bildirim tercihleri ve sadakat işlemleri ---
  const allCustsA = [custA1, custA2, custA3, custA4, custA5];
  for (const cust of allCustsA) {
    await prisma.customerNotificationPreference.create({
      data: { tenantId: tenantA.id, customerId: cust.id, smsEnabled: true, emailEnabled: true },
    });
    await prisma.loyaltyTransaction.create({
      data: {
        tenantId: tenantA.id, customerId: cust.id,
        type: LoyaltyTransactionType.EARN, points: 50,
        description: 'Servis sonrası kazanılan puan',
      },
    });
  }

  // --- 6.4 Araç başına MaintenancePlan ---
  const allVehiclesA = [vehicleA1, vehicleA2, vehicleA3, vehicleA4, vehicleA5];
  const maintenanceTitlesA = [
    'Yıllık Bakım', 'Periyodik Yağ Değişimi', 'Fren Sistemi Kontrolü',
    'Klima Bakımı', 'Lastik Rotasyonu',
  ];
  for (let i = 0; i < allVehiclesA.length; i++) {
    await prisma.maintenancePlan.create({
      data: {
        tenantId: tenantA.id,
        vehicleId: allVehiclesA[i].id,
        title: maintenanceTitlesA[i],
        dueDate: new Date(Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000),
        dueMileage: allVehiclesA[i].mileage + 10000,
      },
    });
  }

  console.log('Tenant A müşteriler, araçlar ve ilgili kayıtlar oluşturuldu.');
  // =========================================================================
  // TENANT A — Teklifler (Quotes)
  // =========================================================================
  console.log('Tenant A teklifler oluşturuluyor...');

  // Teklif 1 — DRAFT
  const qItem1Part = calcItem(1, 420, 20);   // Motor Yağı
  const qItem1Labor = calcItem(1, 200, 20);  // İşçilik
  const quoteA1 = await prisma.quote.create({
    data: {
      tenantId: tenantA.id, customerId: custA1.id, vehicleId: vehicleA1.id,
      status: QuoteStatus.DRAFT,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subTotal: qItem1Part.subTotal + qItem1Labor.subTotal,
      taxAmount: qItem1Part.taxAmount + qItem1Labor.taxAmount,
      totalAmount: qItem1Part.totalPrice + qItem1Labor.totalPrice,
      notes: 'Motor yağı değişimi ve işçilik teklifi',
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA1.id, itemType: ServiceItemType.PART,
      name: 'Motor Yağı 5W-40 (4L)', partId: partA1.id,
      quantity: 1, unitPrice: 420, taxRate: 20, discount: 0,
      ...qItem1Part,
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA1.id, itemType: ServiceItemType.LABOR,
      name: 'Yağ Değişimi İşçiliği',
      quantity: 1, unitPrice: 200, taxRate: 20, discount: 0,
      ...qItem1Labor,
    },
  });

  // Teklif 2 — SENT
  const qItem2Part = calcItem(1, 520, 20);   // Fren Balatası
  const qItem2Labor = calcItem(1, 350, 20);  // İşçilik
  const quoteA2 = await prisma.quote.create({
    data: {
      tenantId: tenantA.id, customerId: custA2.id, vehicleId: vehicleA2.id,
      status: QuoteStatus.SENT,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subTotal: qItem2Part.subTotal + qItem2Labor.subTotal,
      taxAmount: qItem2Part.taxAmount + qItem2Labor.taxAmount,
      totalAmount: qItem2Part.totalPrice + qItem2Labor.totalPrice,
      notes: 'Fren balata değişimi teklifi',
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA2.id, itemType: ServiceItemType.PART,
      name: 'Ön Fren Balatası (Takım)', partId: partA3.id,
      quantity: 1, unitPrice: 520, taxRate: 20, discount: 0,
      ...qItem2Part,
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA2.id, itemType: ServiceItemType.LABOR,
      name: 'Fren Balata Değişimi İşçiliği',
      quantity: 1, unitPrice: 350, taxRate: 20, discount: 0,
      ...qItem2Labor,
    },
  });

  // Teklif 3 — ACCEPTED
  const qItem3Part = calcItem(1, 1850, 20);  // Akü
  const qItem3Labor = calcItem(1, 150, 20);  // İşçilik
  const quoteA3 = await prisma.quote.create({
    data: {
      tenantId: tenantA.id, customerId: custA3.id, vehicleId: vehicleA3.id,
      status: QuoteStatus.ACCEPTED,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subTotal: qItem3Part.subTotal + qItem3Labor.subTotal,
      taxAmount: qItem3Part.taxAmount + qItem3Labor.taxAmount,
      totalAmount: qItem3Part.totalPrice + qItem3Labor.totalPrice,
      notes: 'Akü değişimi teklifi — müşteri onayladı',
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA3.id, itemType: ServiceItemType.PART,
      name: 'Akü 60Ah', partId: partA5.id,
      quantity: 1, unitPrice: 1850, taxRate: 20, discount: 0,
      ...qItem3Part,
    },
  });
  await prisma.quoteItem.create({
    data: {
      quoteId: quoteA3.id, itemType: ServiceItemType.LABOR,
      name: 'Akü Montaj İşçiliği',
      quantity: 1, unitPrice: 150, taxRate: 20, discount: 0,
      ...qItem3Labor,
    },
  });

  console.log('Tenant A teklifler oluşturuldu.');
  // =========================================================================
  // TENANT A — Randevular
  // =========================================================================
  console.log('Tenant A randevular oluşturuluyor...');

  const now = new Date();
  const future7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const future3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const past5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const past2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      tenantId: tenantA.id, customerId: custA1.id, vehicleId: vehicleA1.id,
      appointmentDate: future7,
      appointmentTime: '09:00',
      type: 'Periyodik Bakım',
      status: AppointmentStatus.PENDING,
      locationId: locMaslak.id,
      notes: 'Müşteri sabah erken saatte gelmek istiyor.',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenantA.id, customerId: custA2.id, vehicleId: vehicleA2.id,
      appointmentDate: future3,
      appointmentTime: '10:30',
      type: 'Fren Kontrolü',
      status: AppointmentStatus.CONFIRMED,
      locationId: locMaslak.id,
      notes: 'Fren sesi şikayeti var.',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenantA.id, customerId: custA3.id, vehicleId: vehicleA3.id,
      appointmentDate: past5,
      appointmentTime: '14:00',
      type: 'Lastik Değişimi',
      status: AppointmentStatus.COMPLETED,
      locationId: locMaslak.id,
      notes: 'Kış lastiği takıldı.',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenantA.id, customerId: custA4.id, vehicleId: vehicleA4.id,
      appointmentDate: past2,
      appointmentTime: '11:00',
      type: 'Klima Bakımı',
      status: AppointmentStatus.CANCELLED,
      locationId: locMaslak.id,
      notes: 'Müşteri iptal etti.',
    },
  });

  console.log('Tenant A randevular oluşturuldu.');
  // =========================================================================
  // TENANT A — Servis Emirleri ve İlgili Kayıtlar
  // =========================================================================
  console.log('Tenant A servis emirleri oluşturuluyor...');

  // --- Servis Emri 1: COMPLETED — VW Golf, Motor yağı sızıntısı ---
  const si1Part = calcItem(1, 420, 20);   // Motor Yağı
  const si1Part2 = calcItem(1, 85, 20);   // Yağ Filtresi
  const si1Labor = calcItem(1, 350, 20);  // İşçilik
  const so1SubTotal = si1Part.subTotal + si1Part2.subTotal + si1Labor.subTotal;
  const so1TaxAmount = si1Part.taxAmount + si1Part2.taxAmount + si1Labor.taxAmount;
  const so1TotalAmount = so1SubTotal + so1TaxAmount;

  const serviceOrderA1 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenantA.id, customerId: custA1.id, vehicleId: vehicleA1.id,
      status: ServiceOrderStatus.COMPLETED,
      complaintDescription: 'Motor yağı sızıntısı var, yağ filtresi değişimi gerekiyor.',
      assignedMechanicId: mechanic1A.id, locationId: locMaslak.id,
      receptionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      actualDeliveryDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      subTotal: so1SubTotal, taxAmount: so1TaxAmount, totalAmount: so1TotalAmount,
      completionPercentage: 100,
    },
  });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, itemType: ServiceItemType.PART, name: 'Motor Yağı 5W-40 (4L)', partId: partA1.id, mechanicId: mechanic1A.id, quantity: 1, unitPrice: 420, taxRate: 20, discount: 0, ...si1Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, itemType: ServiceItemType.PART, name: 'Yağ Filtresi', partId: partA2.id, mechanicId: mechanic1A.id, quantity: 1, unitPrice: 85, taxRate: 20, discount: 0, ...si1Part2 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, itemType: ServiceItemType.LABOR, name: 'Yağ Değişimi İşçiliği', mechanicId: mechanic1A.id, quantity: 1, unitPrice: 350, taxRate: 20, discount: 0, ...si1Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, mechanicId: mechanic1A.id, formData: { fren: 'iyi', yag: 'değiştirildi', lastik: 'normal', akü: 'iyi', klima: 'çalışıyor' }, completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) } });
  await prisma.workLog.create({ data: { tenantId: tenantA.id, mechanicId: mechanic1A.id, serviceOrderId: serviceOrderA1.id, startTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), durationMinutes: 120, notes: 'Yağ değişimi ve filtre değişimi tamamlandı.' } });
  await prisma.document.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, fileName: 'servis_raporu_001.pdf', fileUrl: 'https://storage.msotoservis.com/docs/servis_001.pdf', fileKey: 'docs/servis_001.pdf', fileType: 'application/pdf', fileSize: 245760, uploadedBy: 'Ahmet Yılmaz' } });
  await prisma.serviceRating.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA1.id, customerId: custA1.id, rating: 5, comment: 'Çok hızlı ve kaliteli servis, teşekkürler.' } });

  // --- Servis Emri 2: IN_PROGRESS — Ford Focus, Fren balataları ---
  const si2Part = calcItem(1, 520, 20);   // Fren Balatası
  const si2Part2 = calcItem(1, 720, 20);  // Fren Diski
  const si2Labor = calcItem(1, 400, 20);  // İşçilik
  const so2SubTotal = si2Part.subTotal + si2Part2.subTotal + si2Labor.subTotal;
  const so2TaxAmount = si2Part.taxAmount + si2Part2.taxAmount + si2Labor.taxAmount;
  const so2TotalAmount = so2SubTotal + so2TaxAmount;

  const serviceOrderA2 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenantA.id, customerId: custA2.id, vehicleId: vehicleA2.id,
      status: ServiceOrderStatus.IN_PROGRESS,
      complaintDescription: 'Fren balataları aşınmış, fren sesi geliyor. Fren diski de kontrol edilmeli.',
      assignedMechanicId: mechanic2A.id, locationId: locMaslak.id,
      receptionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      subTotal: so2SubTotal, taxAmount: so2TaxAmount, totalAmount: so2TotalAmount,
      completionPercentage: 50,
    },
  });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA2.id, itemType: ServiceItemType.PART, name: 'Ön Fren Balatası (Takım)', partId: partA3.id, mechanicId: mechanic2A.id, quantity: 1, unitPrice: 520, taxRate: 20, discount: 0, ...si2Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA2.id, itemType: ServiceItemType.PART, name: 'Fren Diski (Ön)', partId: partA4.id, mechanicId: mechanic2A.id, quantity: 1, unitPrice: 720, taxRate: 20, discount: 0, ...si2Part2 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA2.id, itemType: ServiceItemType.LABOR, name: 'Fren Sistemi Değişimi İşçiliği', mechanicId: mechanic2A.id, quantity: 1, unitPrice: 400, taxRate: 20, discount: 0, ...si2Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA2.id, mechanicId: mechanic2A.id, formData: { fren: 'değiştirilecek', yag: 'normal', lastik: 'normal', akü: 'iyi', klima: 'çalışıyor' } } });
  await prisma.workLog.create({ data: { tenantId: tenantA.id, mechanicId: mechanic2A.id, serviceOrderId: serviceOrderA2.id, startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), notes: 'Fren sistemi söküldü, parçalar bekleniyor.' } });
  await prisma.document.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA2.id, fileName: 'muayene_formu_002.pdf', fileUrl: 'https://storage.msotoservis.com/docs/muayene_002.pdf', fileKey: 'docs/muayene_002.pdf', fileType: 'application/pdf', fileSize: 184320, uploadedBy: 'Mehmet Kaya' } });

  // --- Servis Emri 3: WAITING_APPROVAL — Renault Clio, Akü ---
  const si3Part = calcItem(1, 1850, 20);  // Akü
  const si3Labor = calcItem(1, 150, 20);  // İşçilik
  const so3SubTotal = si3Part.subTotal + si3Labor.subTotal;
  const so3TaxAmount = si3Part.taxAmount + si3Labor.taxAmount;
  const so3TotalAmount = so3SubTotal + so3TaxAmount;

  const serviceOrderA3 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenantA.id, customerId: custA3.id, vehicleId: vehicleA3.id,
      status: ServiceOrderStatus.WAITING_APPROVAL,
      complaintDescription: 'Akü ölçümü yapıldı, değişim öneriliyor. Araç zor çalışıyor.',
      assignedMechanicId: mechanic1A.id, locationId: locMaslak.id,
      receptionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      subTotal: so3SubTotal, taxAmount: so3TaxAmount, totalAmount: so3TotalAmount,
      completionPercentage: 30,
    },
  });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA3.id, itemType: ServiceItemType.PART, name: 'Akü 60Ah', partId: partA5.id, mechanicId: mechanic1A.id, quantity: 1, unitPrice: 1850, taxRate: 20, discount: 0, ...si3Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA3.id, itemType: ServiceItemType.LABOR, name: 'Akü Montaj İşçiliği', mechanicId: mechanic1A.id, quantity: 1, unitPrice: 150, taxRate: 20, discount: 0, ...si3Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA3.id, mechanicId: mechanic1A.id, formData: { fren: 'iyi', yag: 'normal', lastik: 'normal', akü: 'değiştirilmeli', klima: 'çalışıyor' } } });
  await prisma.workLog.create({ data: { tenantId: tenantA.id, mechanicId: mechanic1A.id, serviceOrderId: serviceOrderA3.id, startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), durationMinutes: 60, notes: 'Akü testi yapıldı, müşteri onayı bekleniyor.' } });
  await prisma.document.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA3.id, fileName: 'aku_test_raporu_003.pdf', fileUrl: 'https://storage.msotoservis.com/docs/aku_003.pdf', fileKey: 'docs/aku_003.pdf', fileType: 'application/pdf', fileSize: 102400, uploadedBy: 'Ahmet Yılmaz' } });

  // --- Servis Emri 4: PENDING — Toyota Corolla, Periyodik bakım ---
  const si4Part = calcItem(1, 420, 20);   // Motor Yağı
  const si4Part2 = calcItem(1, 110, 20);  // Hava Filtresi
  const si4Labor = calcItem(1, 500, 20);  // İşçilik
  const so4SubTotal = si4Part.subTotal + si4Part2.subTotal + si4Labor.subTotal;
  const so4TaxAmount = si4Part.taxAmount + si4Part2.taxAmount + si4Labor.taxAmount;
  const so4TotalAmount = so4SubTotal + so4TaxAmount;

  const serviceOrderA4 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenantA.id, customerId: custA4.id, vehicleId: vehicleA4.id,
      status: ServiceOrderStatus.PENDING,
      complaintDescription: 'Periyodik bakım (15.000 km). Yağ, filtre ve genel kontrol.',
      assignedMechanicId: mechanic3A.id, locationId: locMaslak.id,
      receptionDate: new Date(),
      subTotal: so4SubTotal, taxAmount: so4TaxAmount, totalAmount: so4TotalAmount,
      completionPercentage: 0,
    },
  });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA4.id, itemType: ServiceItemType.PART, name: 'Motor Yağı 5W-40 (4L)', partId: partA1.id, mechanicId: mechanic3A.id, quantity: 1, unitPrice: 420, taxRate: 20, discount: 0, ...si4Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA4.id, itemType: ServiceItemType.PART, name: 'Hava Filtresi', partId: partA7.id, mechanicId: mechanic3A.id, quantity: 1, unitPrice: 110, taxRate: 20, discount: 0, ...si4Part2 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA4.id, itemType: ServiceItemType.LABOR, name: 'Periyodik Bakım İşçiliği', mechanicId: mechanic3A.id, quantity: 1, unitPrice: 500, taxRate: 20, discount: 0, ...si4Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA4.id, mechanicId: mechanic3A.id, formData: { fren: 'kontrol edilecek', yag: 'değiştirilecek', lastik: 'normal', akü: 'iyi', klima: 'kontrol edilecek' } } });
  await prisma.workLog.create({ data: { tenantId: tenantA.id, mechanicId: mechanic3A.id, serviceOrderId: serviceOrderA4.id, startTime: new Date(), notes: 'Araç teslim alındı, bakım sırası bekleniyor.' } });
  await prisma.document.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA4.id, fileName: 'teslim_belgesi_004.pdf', fileUrl: 'https://storage.msotoservis.com/docs/teslim_004.pdf', fileKey: 'docs/teslim_004.pdf', fileType: 'application/pdf', fileSize: 81920, uploadedBy: 'Resepsiyon MS' } });

  // --- Servis Emri 5: CANCELLED — Fiat Egea, Klima gazı ---
  const si5Labor = calcItem(1, 800, 20);  // Klima gazı dolumu
  const so5SubTotal = si5Labor.subTotal;
  const so5TaxAmount = si5Labor.taxAmount;
  const so5TotalAmount = so5SubTotal + so5TaxAmount;

  const serviceOrderA5 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenantA.id, customerId: custA5.id, vehicleId: vehicleA5.id,
      status: ServiceOrderStatus.CANCELLED,
      complaintDescription: 'Klima gazı dolumu talep edildi. Müşteri iptal etti.',
      assignedMechanicId: mechanic2A.id, locationId: locMaslak.id,
      receptionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      subTotal: so5SubTotal, taxAmount: so5TaxAmount, totalAmount: so5TotalAmount,
      completionPercentage: 0,
      internalNotes: 'Müşteri telefon ile iptal etti.',
    },
  });
  await prisma.serviceItem.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA5.id, itemType: ServiceItemType.LABOR, name: 'Klima Gazı Dolumu', mechanicId: mechanic2A.id, quantity: 1, unitPrice: 800, taxRate: 20, discount: 0, ...si5Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA5.id, mechanicId: mechanic2A.id, formData: { fren: 'iyi', yag: 'normal', lastik: 'normal', akü: 'iyi', klima: 'gaz dolumu gerekli' } } });
  await prisma.workLog.create({ data: { tenantId: tenantA.id, mechanicId: mechanic2A.id, serviceOrderId: serviceOrderA5.id, startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), durationMinutes: 30, notes: 'Araç teslim alındı, müşteri iptal etti.' } });
  await prisma.document.create({ data: { tenantId: tenantA.id, serviceOrderId: serviceOrderA5.id, fileName: 'iptal_belgesi_005.pdf', fileUrl: 'https://storage.msotoservis.com/docs/iptal_005.pdf', fileKey: 'docs/iptal_005.pdf', fileType: 'application/pdf', fileSize: 61440, uploadedBy: 'Resepsiyon MS' } });

  console.log('Tenant A servis emirleri oluşturuldu.');
  // =========================================================================
  // TENANT A — Faturalar ve Ödemeler
  // =========================================================================
  console.log('Tenant A faturalar ve ödemeler oluşturuluyor...');

  // 10.1 COMPLETED servis emri için PAID fatura (serviceOrderA1)
  const invoiceA1 = await prisma.invoice.create({
    data: {
      tenantId: tenantA.id,
      invoiceNumber: invoiceNumber(1),
      type: InvoiceType.SALES,
      status: InvoiceStatus.PAID,
      customerId: custA1.id,
      serviceOrderId: serviceOrderA1.id,
      issueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      subTotal: so1SubTotal,
      discountAmount: 0,
      taxAmount: so1TaxAmount,
      totalAmount: so1TotalAmount,
      paidAmount: so1TotalAmount,
    },
  });

  // 10.2 InvoiceItem for invoiceA1
  await prisma.invoiceItem.create({
    data: {
      tenantId: tenantA.id,
      invoiceId: invoiceA1.id,
      type: InvoiceItemType.PART,
      name: 'Motor Yağı 5W-40 (4L)',
      quantity: 1,
      unitPrice: 420,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 504,
      sortOrder: 1,
    },
  });
  await prisma.invoiceItem.create({
    data: {
      tenantId: tenantA.id,
      invoiceId: invoiceA1.id,
      type: InvoiceItemType.LABOR,
      name: 'Yağ Değişimi İşçiliği',
      quantity: 1,
      unitPrice: 350,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 420,
      sortOrder: 2,
    },
  });

  // 10.2 Payment for invoiceA1 (CASH)
  await prisma.payment.create({
    data: {
      tenantId: tenantA.id,
      customerId: custA1.id,
      invoiceId: invoiceA1.id,
      serviceOrderId: serviceOrderA1.id,
      amount: so1TotalAmount,
      paymentMethod: PaymentMethod.CASH,
      paymentType: PaymentType.INCOMING,
      paymentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      notes: 'Nakit ödeme alındı.',
    },
  });

  // 10.3 DRAFT fatura (serviceOrderA2 — IN_PROGRESS)
  const invoiceA2Draft = await prisma.invoice.create({
    data: {
      tenantId: tenantA.id,
      invoiceNumber: invoiceNumber(2),
      type: InvoiceType.SALES,
      status: InvoiceStatus.DRAFT,
      customerId: custA2.id,
      serviceOrderId: serviceOrderA2.id,
      issueDate: new Date(),
      subTotal: so2SubTotal,
      discountAmount: 0,
      taxAmount: so2TaxAmount,
      totalAmount: so2TotalAmount,
      paidAmount: 0,
      notes: 'Servis devam ediyor, taslak fatura.',
    },
  });

  await prisma.invoiceItem.create({
    data: {
      tenantId: tenantA.id,
      invoiceId: invoiceA2Draft.id,
      type: InvoiceItemType.PART,
      name: 'Ön Fren Balatası (Takım)',
      quantity: 1,
      unitPrice: 520,
      taxRate: 20,
      discountRate: 0,
      lineTotal: 624,
      sortOrder: 1,
    },
  });

  console.log('Tenant A faturalar ve ödemeler oluşturuldu.');
  // =========================================================================
  // TENANT A — Stok Yönetimi
  // =========================================================================
  console.log('Tenant A stok yönetimi oluşturuluyor...');

  // PurchaseOrder
  const poA1 = await prisma.purchaseOrder.create({
    data: {
      tenantId: tenantA.id,
      poNumber: 'PO-A-2026-001',
      supplierId: supplierA1.id,
      status: PurchaseOrderStatus.RECEIVED,
      expectedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      subTotal: 280 * 10 + 45 * 20,
      taxAmount: (280 * 10 + 45 * 20) * 0.2,
      totalAmount: (280 * 10 + 45 * 20) * 1.2,
      notes: 'Motor yağı ve yağ filtresi siparişi',
    },
  });
  await prisma.purchaseOrderItem.create({
    data: { purchaseOrderId: poA1.id, partId: partA1.id, quantity: 10, unitPrice: 280, taxRate: 20 },
  });
  await prisma.purchaseOrderItem.create({
    data: { purchaseOrderId: poA1.id, partId: partA2.id, quantity: 20, unitPrice: 45, taxRate: 20 },
  });

  // StockCount
  const scA1 = await prisma.stockCount.create({
    data: {
      tenantId: tenantA.id,
      locationId: locMaslak.id,
      status: StockCountStatus.COMPLETED,
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      notes: 'Aylık stok sayımı',
    },
  });
  await prisma.stockCountItem.create({
    data: { stockCountId: scA1.id, partId: partA1.id, systemQuantity: 52, actualQuantity: 50, difference: -2 },
  });
  await prisma.stockCountItem.create({
    data: { stockCountId: scA1.id, partId: partA3.id, systemQuantity: 30, actualQuantity: 30, difference: 0 },
  });

  // StockTransfer (Maslak → Levent)
  const stA1 = await prisma.stockTransfer.create({
    data: {
      tenantId: tenantA.id,
      fromLocationId: locMaslak.id,
      toLocationId: locLevent.id,
      status: StockTransferStatus.COMPLETED,
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: 'Levent şubesine stok transferi',
    },
  });
  await prisma.stockTransferItem.create({
    data: { stockTransferId: stA1.id, partId: partA7.id, quantity: 5 },
  });
  await prisma.stockTransferItem.create({
    data: { stockTransferId: stA1.id, partId: partA8.id, quantity: 3 },
  });

  console.log('Tenant A stok yönetimi oluşturuldu.');
  // =========================================================================
  // TENANT A — Bildirimler, Audit Loglar ve Sistem Bildirimleri
  // =========================================================================
  console.log('Tenant A bildirimler ve loglar oluşturuluyor...');

  // NotificationTemplate (4 tip × 2 kanal)
  const tmplServiceSMS_A = await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'SERVICE_STATUS', channel: 'SMS', name: 'Servis Durum SMS', body: 'Sayın {{musteriAdi}}, aracınız ({{plaka}}) {{durum}} durumuna geçti.', variables: ['musteriAdi', 'plaka', 'durum'], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'SERVICE_STATUS', channel: 'EMAIL', name: 'Servis Durum E-posta', body: 'Sayın {{musteriAdi}}, aracınızın servis durumu güncellendi.', variables: ['musteriAdi'], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'APPROVAL', channel: 'SMS', name: 'Onay Talebi SMS', body: 'Sayın {{musteriAdi}}, {{islemAdi}} için onayınız bekleniyor. Tutar: {{tutar}} TL.', variables: ['musteriAdi', 'islemAdi', 'tutar'], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'APPROVAL', channel: 'EMAIL', name: 'Onay Talebi E-posta', body: 'Aracınız için yapılacak işlemler onayınızı bekliyor.', variables: [], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'APPOINTMENT', channel: 'SMS', name: 'Randevu Hatırlatma SMS', body: 'Sayın {{musteriAdi}}, {{tarih}} {{saat}} randevunuzu hatırlatırız.', variables: ['musteriAdi', 'tarih', 'saat'], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'APPOINTMENT', channel: 'EMAIL', name: 'Randevu Hatırlatma E-posta', body: 'Randevunuz yaklaşıyor.', variables: [], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'REMINDER', channel: 'SMS', name: 'Bakım Hatırlatma SMS', body: 'Sayın {{musteriAdi}}, aracınızın bakım zamanı geldi.', variables: ['musteriAdi'], isActive: true },
  });
  await prisma.notificationTemplate.create({
    data: { tenantId: tenantA.id, type: 'REMINDER', channel: 'EMAIL', name: 'Bakım Hatırlatma E-posta', body: 'Periyodik bakım zamanınız geldi.', variables: [], isActive: true },
  });

  // Notifications (5 adet)
  await prisma.notification.create({ data: { tenantId: tenantA.id, customerId: custA1.id, type: NotificationType.SMS, channel: 'SMS', recipient: custA1.phone, body: 'Aracınız teslime hazır.', status: NotificationStatus.DELIVERED, sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), notificationTemplateId: tmplServiceSMS_A.id } });
  await prisma.notification.create({ data: { tenantId: tenantA.id, customerId: custA2.id, type: NotificationType.SMS, channel: 'SMS', recipient: custA2.phone, body: 'Fren sistemi değişimi için onayınız bekleniyor.', status: NotificationStatus.SENT, sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } });
  await prisma.notification.create({ data: { tenantId: tenantA.id, customerId: custA3.id, type: NotificationType.EMAIL, channel: 'EMAIL', recipient: custA3.email!, subject: 'Akü Değişimi Onay Talebi', body: 'Aracınız için akü değişimi önerilmektedir.', status: NotificationStatus.DELIVERED, sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } });
  await prisma.notification.create({ data: { tenantId: tenantA.id, customerId: custA4.id, type: NotificationType.SMS, channel: 'SMS', recipient: custA4.phone, body: 'Yarın saat 09:00 randevunuzu hatırlatırız.', status: NotificationStatus.PENDING } });
  await prisma.notification.create({ data: { tenantId: tenantA.id, customerId: custA5.id, type: NotificationType.EMAIL, channel: 'EMAIL', recipient: custA5.email!, subject: 'Filo Bakım Hatırlatması', body: 'Filo araçlarınızın bakım zamanı geldi.', status: NotificationStatus.SENT, sentAt: new Date() } });

  // AuditLog (3 adet)
  await prisma.auditLog.create({ data: { tenantId: tenantA.id, level: 'INFO', module: 'SERVICE-ORDER', message: 'Servis emri #1 tamamlandı ve fatura kesildi.', traceId: 'trace-001' } });
  await prisma.auditLog.create({ data: { tenantId: tenantA.id, level: 'INFO', module: 'PAYMENT', message: 'Ödeme alındı: FAT-2026-0001, tutar: ' + so1TotalAmount + ' TL', traceId: 'trace-002' } });
  await prisma.auditLog.create({ data: { tenantId: tenantA.id, level: 'WARN', module: 'STOCK', message: 'Stok sayımında Motor Yağı 5W-40 için -2 fark tespit edildi.', traceId: 'trace-003' } });

  // SystemNotification (2 adet)
  await prisma.systemNotification.create({ data: { tenantId: tenantA.id, category: 'BILLING', title: 'Abonelik Yenileme Yaklaşıyor', message: 'Profesyonel plan aboneliğiniz 30 gün içinde yenilenecek.', severity: NotificationSeverity.INFO } });
  await prisma.systemNotification.create({ data: { tenantId: tenantA.id, category: 'STOCK', title: 'Düşük Stok Uyarısı', message: 'Akü 60Ah stok seviyesi minimum limitin altına düştü.', severity: NotificationSeverity.WARNING } });

  console.log('Tenant A bildirimler ve loglar oluşturuldu.');
  console.log('=== Tenant A tamamlandı ===');
  // =========================================================================
  // TENANT B — Yıldız Garaj ve Oto Bakım Ltd. Şti.
  // =========================================================================
  console.log('Tenant B oluşturuluyor: Yıldız Garaj...');

  // --- 14.1 Tenant ve Subscription ---
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Yıldız Garaj ve Oto Bakım Ltd. Şti.',
      slug: 'yildiz-garaj',
      taxNumber: '9876543210',
      taxOffice: 'Çankaya Vergi Dairesi',
      email: 'info@yildizgaraj.com',
      phone: '03124567890',
      address: 'Ostim Oto Sanayi Sitesi, B Blok No:34, Yenimahalle',
      city: 'Ankara',
      website: 'https://www.yildizgaraj.com',
      slogan: 'Premium Araçlara Premium Servis',
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenantB.id,
      planId: planEnterprise.id,
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-12-31'),
    },
  });

  console.log('Tenant B ve Subscription oluşturuldu.');

  // --- 14.2 Lokasyonlar (3 adet, Ankara) ---
  const locOstim = await prisma.location.create({
    data: {
      tenantId: tenantB.id,
      name: 'Ostim Şubesi',
      address: 'Ostim Oto Sanayi Sitesi, B Blok No:34',
      city: 'Ankara',
      phone: '03124567890',
      email: 'ostim@yildizgaraj.com',
      isActive: true,
      isDefault: true,
    },
  });

  const locBaglica = await prisma.location.create({
    data: {
      tenantId: tenantB.id,
      name: 'Bağlıca Şubesi',
      address: 'Bağlıca Oto Sanayi, A Blok No:12',
      city: 'Ankara',
      phone: '03124567891',
      email: 'baglica@yildizgaraj.com',
      isActive: true,
      isDefault: false,
    },
  });

  const locSincan = await prisma.location.create({
    data: {
      tenantId: tenantB.id,
      name: 'Sincan Şubesi',
      address: 'Sincan Sanayi Sitesi No:8',
      city: 'Ankara',
      phone: '03124567892',
      email: 'sincan@yildizgaraj.com',
      isActive: true,
      isDefault: false,
    },
  });

  console.log('Tenant B lokasyonları oluşturuldu.');

  // --- 14.3 Kullanıcılar ---
  const pwAdminB = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const pwUstaB = await bcrypt.hash('Usta123!', SALT_ROUNDS);

  await prisma.user.create({
    data: {
      name: 'Yıldız Admin',
      email: 'admin@yildizgaraj.com',
      password: pwAdminB,
      role: UserRole.TENANT_ADMIN,
      tenantId: tenantB.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Resepsiyon Yıldız',
      email: 'resepsiyon@yildizgaraj.com',
      password: await bcrypt.hash('Resepsiyon123!', SALT_ROUNDS),
      role: UserRole.RECEPTIONIST,
      tenantId: tenantB.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Muhasebe Yıldız',
      email: 'muhasebe@yildizgaraj.com',
      password: await bcrypt.hash('Muhasebe123!', SALT_ROUNDS),
      role: UserRole.ACCOUNTANT,
      tenantId: tenantB.id,
      isActive: true,
    },
  });

  const ustaUserB1 = await prisma.user.create({
    data: { name: 'Kadir Şahin', email: 'usta1@yildizgaraj.com', password: pwUstaB, role: UserRole.MECHANIC, tenantId: tenantB.id, isActive: true },
  });
  const ustaUserB2 = await prisma.user.create({
    data: { name: 'Emre Yıldız', email: 'usta2@yildizgaraj.com', password: pwUstaB, role: UserRole.MECHANIC, tenantId: tenantB.id, isActive: true },
  });
  const ustaUserB3 = await prisma.user.create({
    data: { name: 'Burak Arslan', email: 'usta3@yildizgaraj.com', password: pwUstaB, role: UserRole.MECHANIC, tenantId: tenantB.id, isActive: true },
  });
  const ustaUserB4 = await prisma.user.create({
    data: { name: 'Serhat Koç', email: 'usta4@yildizgaraj.com', password: pwUstaB, role: UserRole.MECHANIC, tenantId: tenantB.id, isActive: true },
  });

  console.log('Tenant B kullanıcıları oluşturuldu.');

  // --- 14.4 Mechanic profilleri ---
  const mechanic1B = await prisma.mechanic.create({
    data: { tenantId: tenantB.id, userId: ustaUserB1.id, firstName: 'Kadir', lastName: 'Şahin', phone: '05321112244', email: 'usta1@yildizgaraj.com', specialties: ['Motor', 'Şanzıman'], hourlyRate: 320, isActive: true },
  });
  const mechanic2B = await prisma.mechanic.create({
    data: { tenantId: tenantB.id, userId: ustaUserB2.id, firstName: 'Emre', lastName: 'Yıldız', phone: '05332223355', email: 'usta2@yildizgaraj.com', specialties: ['Elektrik', 'Elektronik', 'Diagnostik'], hourlyRate: 350, isActive: true },
  });
  const mechanic3B = await prisma.mechanic.create({
    data: { tenantId: tenantB.id, userId: ustaUserB3.id, firstName: 'Burak', lastName: 'Arslan', phone: '05343334466', email: 'usta3@yildizgaraj.com', specialties: ['Kaporta', 'Boya', 'Detaylı Temizlik'], hourlyRate: 380, isActive: true },
  });
  const mechanic4B = await prisma.mechanic.create({
    data: { tenantId: tenantB.id, userId: ustaUserB4.id, firstName: 'Serhat', lastName: 'Koç', phone: '05354445577', email: 'usta4@yildizgaraj.com', specialties: ['Fren', 'Süspansiyon', 'Lastik'], hourlyRate: 300, isActive: true },
  });

  await prisma.commissionRule.create({ data: { tenantId: tenantB.id, mechanicId: mechanic1B.id, ruleType: CommissionRuleType.PERCENTAGE, value: 10, isActive: true } });
  await prisma.commissionRule.create({ data: { tenantId: tenantB.id, mechanicId: mechanic2B.id, ruleType: CommissionRuleType.PERCENTAGE, value: 11, isActive: true } });
  await prisma.commissionRule.create({ data: { tenantId: tenantB.id, mechanicId: mechanic3B.id, ruleType: CommissionRuleType.PERCENTAGE, value: 12, isActive: true } });
  await prisma.commissionRule.create({ data: { tenantId: tenantB.id, mechanicId: mechanic4B.id, ruleType: CommissionRuleType.PERCENTAGE, value: 9, isActive: true } });

  console.log('Tenant B mechanic profilleri oluşturuldu.');

  // =========================================================================
  // TENANT B — Tedarikçiler, Parça Kategorileri ve Parçalar
  // =========================================================================
  console.log('Tenant B tedarikçiler ve parçalar oluşturuluyor...');

  const supplierB1 = await prisma.supplier.create({
    data: { tenantId: tenantB.id, name: 'Mercedes-Benz Türk A.Ş.', contactPerson: 'Alper Doğan', email: 'yedekparca@mercedes-benz.com.tr', phone: '03125678901', taxOffice: 'Çankaya Vergi Dairesi', taxNumber: '4444444444', address: 'Ostim Sanayi, Ankara' },
  });
  const supplierB2 = await prisma.supplier.create({
    data: { tenantId: tenantB.id, name: 'BMW Yetkili Servis Parçaları', contactPerson: 'Caner Yılmaz', email: 'parts@bmwankara.com', phone: '03126789012', taxOffice: 'Yenimahalle Vergi Dairesi', taxNumber: '5555555555', address: 'Bağlıca Sanayi, Ankara' },
  });
  const supplierB3 = await prisma.supplier.create({
    data: { tenantId: tenantB.id, name: 'Avrupa Otomotiv Parçaları Ltd.', contactPerson: 'Deniz Kara', email: 'siparis@avrupaoto.com', phone: '03127890123', taxOffice: 'Sincan Vergi Dairesi', taxNumber: '6666666666', address: 'Sincan Sanayi, Ankara' },
  });

  const catMotorB = await prisma.partCategory.create({ data: { tenantId: tenantB.id, name: 'Motor ve Şanzıman', description: 'Motor, şanzıman ve aktarma organları', isActive: true } });
  const catFrenB = await prisma.partCategory.create({ data: { tenantId: tenantB.id, name: 'Fren ve Süspansiyon', description: 'Fren sistemi ve süspansiyon parçaları', isActive: true } });
  const catElektrikB = await prisma.partCategory.create({ data: { tenantId: tenantB.id, name: 'Elektrik ve Aydınlatma', description: 'Elektrik sistemi ve aydınlatma parçaları', isActive: true } });
  const catFiltrelerB = await prisma.partCategory.create({ data: { tenantId: tenantB.id, name: 'Filtre ve Sıvılar', description: 'Filtreler ve araç sıvıları', isActive: true } });
  const catKaporta = await prisma.partCategory.create({ data: { tenantId: tenantB.id, name: 'Kaporta ve Dış Aksam', description: 'Kaporta, tampon ve dış aksam parçaları', isActive: true } });

  const partB1 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catMotorB.id, supplierId: supplierB1.id, partNumber: 'PRT-B-001', name: 'Motor Yağı 0W-40 (5L) — Mercedes', brand: 'Mercedes-Benz', purchasePrice: 650, sellingPrice: 950, taxRate: 20, currentStock: 30, minStockLevel: 5, unit: 'adet', locationId: locOstim.id } });
  const partB2 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catMotorB.id, supplierId: supplierB2.id, partNumber: 'PRT-B-002', name: 'Şanzıman Yağı BMW', brand: 'BMW', purchasePrice: 480, sellingPrice: 720, taxRate: 20, currentStock: 20, minStockLevel: 4, unit: 'adet', locationId: locOstim.id } });
  const partB3 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catFrenB.id, supplierId: supplierB1.id, partNumber: 'PRT-B-003', name: 'Ön Fren Balatası — Mercedes C Serisi', brand: 'Brembo', purchasePrice: 850, sellingPrice: 1350, taxRate: 20, currentStock: 15, minStockLevel: 3, unit: 'takım', locationId: locOstim.id } });
  const partB4 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catFrenB.id, supplierId: supplierB2.id, partNumber: 'PRT-B-004', name: 'Amortisör BMW 3 Serisi (Çift)', brand: 'Bilstein', purchasePrice: 2200, sellingPrice: 3400, taxRate: 20, currentStock: 8, minStockLevel: 2, unit: 'çift', locationId: locOstim.id } });
  const partB5 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catElektrikB.id, supplierId: supplierB1.id, partNumber: 'PRT-B-005', name: 'Akü 80Ah AGM — Mercedes', brand: 'Varta', purchasePrice: 2800, sellingPrice: 4200, taxRate: 20, currentStock: 10, minStockLevel: 2, unit: 'adet', locationId: locOstim.id } });
  const partB6 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catElektrikB.id, supplierId: supplierB3.id, partNumber: 'PRT-B-006', name: 'Oksijen Sensörü Audi', brand: 'Bosch', purchasePrice: 680, sellingPrice: 1050, taxRate: 20, currentStock: 12, minStockLevel: 3, unit: 'adet', locationId: locOstim.id } });
  const partB7 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catFiltrelerB.id, supplierId: supplierB1.id, partNumber: 'PRT-B-007', name: 'Yağ Filtresi Mercedes', brand: 'Mann Filter', purchasePrice: 120, sellingPrice: 195, taxRate: 20, currentStock: 40, minStockLevel: 10, unit: 'adet', locationId: locOstim.id } });
  const partB8 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catFiltrelerB.id, supplierId: supplierB2.id, partNumber: 'PRT-B-008', name: 'Hava Filtresi BMW', brand: 'Mann Filter', purchasePrice: 180, sellingPrice: 280, taxRate: 20, currentStock: 25, minStockLevel: 5, unit: 'adet', locationId: locOstim.id } });
  const partB9 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catKaporta.id, supplierId: supplierB3.id, partNumber: 'PRT-B-009', name: 'Ön Tampon Volvo XC60', brand: 'Volvo', purchasePrice: 3500, sellingPrice: 5200, taxRate: 20, currentStock: 4, minStockLevel: 1, unit: 'adet', locationId: locOstim.id } });
  const partB10 = await prisma.part.create({ data: { tenantId: tenantB.id, categoryId: catKaporta.id, supplierId: supplierB3.id, partNumber: 'PRT-B-010', name: 'Yan Ayna Kapağı Porsche', brand: 'Porsche', purchasePrice: 1800, sellingPrice: 2800, taxRate: 20, currentStock: 6, minStockLevel: 1, unit: 'adet', locationId: locOstim.id } });

  console.log('Tenant B tedarikçiler ve parçalar oluşturuldu.');

  // =========================================================================
  // TENANT B — Müşteriler, Araçlar ve İlgili Kayıtlar
  // =========================================================================
  console.log('Tenant B müşteriler ve araçlar oluşturuluyor...');

  const custB1 = await prisma.customer.create({ data: { tenantId: tenantB.id, type: CustomerType.INDIVIDUAL, firstName: 'Ahmet', lastName: 'Kılıç', phone: '05321234568', email: 'ahmet.kilic@gmail.com', city: 'Ankara', rewardPoints: 300 } });
  const custB2 = await prisma.customer.create({ data: { tenantId: tenantB.id, type: CustomerType.INDIVIDUAL, firstName: 'Selin', lastName: 'Yıldırım', phone: '05339876544', email: 'selin.yildirim@hotmail.com', city: 'Ankara', rewardPoints: 150 } });
  const custB3 = await prisma.customer.create({ data: { tenantId: tenantB.id, type: CustomerType.CORPORATE, companyName: 'Ankara Holding A.Ş.', contactPerson: 'Murat Demir', taxNumber: '1122334455', taxOffice: 'Çankaya Vergi Dairesi', phone: '03121234567', email: 'filo@ankaraholding.com', city: 'Ankara', rewardPoints: 1200 } });
  const custB4 = await prisma.customer.create({ data: { tenantId: tenantB.id, type: CustomerType.CORPORATE, companyName: 'Başkent Lojistik Ltd. Şti.', contactPerson: 'Özlem Çetin', taxNumber: '5566778899', taxOffice: 'Yenimahalle Vergi Dairesi', phone: '03122345678', email: 'arac@baskentlojistik.com', city: 'Ankara', rewardPoints: 800 } });
  const custB5 = await prisma.customer.create({ data: { tenantId: tenantB.id, type: CustomerType.INDIVIDUAL, firstName: 'Tolga', lastName: 'Aydın', phone: '05554445577', email: 'tolga.aydin@yahoo.com', city: 'Ankara', rewardPoints: 50 } });

  const vehicleB1 = await prisma.vehicle.create({ data: { tenantId: tenantB.id, customerId: custB1.id, plate: '06 AK 7821', brand: 'Mercedes-Benz', model: 'C 200', year: 2021, color: 'Siyah', fuelType: 'Benzin', transmission: 'Otomatik', mileage: 42000 } });
  const vehicleB2 = await prisma.vehicle.create({ data: { tenantId: tenantB.id, customerId: custB2.id, plate: '06 SY 3344', brand: 'BMW', model: '320i', year: 2020, color: 'Beyaz', fuelType: 'Benzin', transmission: 'Otomatik', mileage: 58000 } });
  const vehicleB3 = await prisma.vehicle.create({ data: { tenantId: tenantB.id, customerId: custB3.id, plate: '06 AH 9900', brand: 'Audi', model: 'A6', year: 2022, color: 'Gri', fuelType: 'Dizel', transmission: 'Otomatik', mileage: 28000 } });
  const vehicleB4 = await prisma.vehicle.create({ data: { tenantId: tenantB.id, customerId: custB4.id, plate: '06 BL 1122', brand: 'Volvo', model: 'XC60', year: 2023, color: 'Mavi', fuelType: 'Hibrit', transmission: 'Otomatik', mileage: 15000 } });
  const vehicleB5 = await prisma.vehicle.create({ data: { tenantId: tenantB.id, customerId: custB5.id, plate: '06 TA 5566', brand: 'Porsche', model: 'Cayenne', year: 2019, color: 'Kırmızı', fuelType: 'Benzin', transmission: 'Otomatik', mileage: 95000 } });

  for (const cust of [custB1, custB2, custB3, custB4, custB5]) {
    await prisma.customerNotificationPreference.create({ data: { tenantId: tenantB.id, customerId: cust.id, smsEnabled: true, emailEnabled: true } });
    await prisma.loyaltyTransaction.create({ data: { tenantId: tenantB.id, customerId: cust.id, type: LoyaltyTransactionType.EARN, points: 100, description: 'Premium servis puanı' } });
  }

  const maintenanceTitlesB = ['Yıllık Bakım', 'Periyodik Yağ Değişimi', 'Fren Sistemi Kontrolü', 'Klima Bakımı', 'Lastik Rotasyonu'];
  const allVehiclesB = [vehicleB1, vehicleB2, vehicleB3, vehicleB4, vehicleB5];
  for (let i = 0; i < allVehiclesB.length; i++) {
    await prisma.maintenancePlan.create({ data: { tenantId: tenantB.id, vehicleId: allVehiclesB[i].id, title: maintenanceTitlesB[i], dueDate: new Date(Date.now() + (20 + i * 10) * 24 * 60 * 60 * 1000), dueMileage: allVehiclesB[i].mileage + 15000 } });
  }

  console.log('Tenant B müşteriler, araçlar ve ilgili kayıtlar oluşturuldu.');

  // =========================================================================
  // TENANT B — Teklifler, Randevular, Servis Emirleri
  // =========================================================================
  console.log('Tenant B teklifler oluşturuluyor...');

  // Teklifler
  const qB1Part = calcItem(1, 950, 20); const qB1Labor = calcItem(1, 300, 20);
  const quoteB1 = await prisma.quote.create({ data: { tenantId: tenantB.id, customerId: custB1.id, vehicleId: vehicleB1.id, status: QuoteStatus.DRAFT, validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), subTotal: qB1Part.subTotal + qB1Labor.subTotal, taxAmount: qB1Part.taxAmount + qB1Labor.taxAmount, totalAmount: qB1Part.totalPrice + qB1Labor.totalPrice, notes: 'Mercedes motor yağı değişimi teklifi' } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB1.id, itemType: ServiceItemType.PART, name: 'Motor Yağı 0W-40 (5L)', partId: partB1.id, quantity: 1, unitPrice: 950, taxRate: 20, discount: 0, ...qB1Part } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB1.id, itemType: ServiceItemType.LABOR, name: 'Yağ Değişimi İşçiliği', quantity: 1, unitPrice: 300, taxRate: 20, discount: 0, ...qB1Labor } });

  const qB2Part = calcItem(1, 1350, 20); const qB2Labor = calcItem(1, 500, 20);
  const quoteB2 = await prisma.quote.create({ data: { tenantId: tenantB.id, customerId: custB2.id, vehicleId: vehicleB2.id, status: QuoteStatus.SENT, validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), subTotal: qB2Part.subTotal + qB2Labor.subTotal, taxAmount: qB2Part.taxAmount + qB2Labor.taxAmount, totalAmount: qB2Part.totalPrice + qB2Labor.totalPrice, notes: 'BMW fren balata değişimi teklifi' } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB2.id, itemType: ServiceItemType.PART, name: 'Ön Fren Balatası — Mercedes C Serisi', partId: partB3.id, quantity: 1, unitPrice: 1350, taxRate: 20, discount: 0, ...qB2Part } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB2.id, itemType: ServiceItemType.LABOR, name: 'Fren Balata Değişimi İşçiliği', quantity: 1, unitPrice: 500, taxRate: 20, discount: 0, ...qB2Labor } });

  const qB3Part = calcItem(1, 4200, 20); const qB3Labor = calcItem(1, 400, 20);
  const quoteB3 = await prisma.quote.create({ data: { tenantId: tenantB.id, customerId: custB3.id, vehicleId: vehicleB3.id, status: QuoteStatus.ACCEPTED, validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), subTotal: qB3Part.subTotal + qB3Labor.subTotal, taxAmount: qB3Part.taxAmount + qB3Labor.taxAmount, totalAmount: qB3Part.totalPrice + qB3Labor.totalPrice, notes: 'Audi akü değişimi teklifi — onaylandı' } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB3.id, itemType: ServiceItemType.PART, name: 'Akü 80Ah AGM', partId: partB5.id, quantity: 1, unitPrice: 4200, taxRate: 20, discount: 0, ...qB3Part } });
  await prisma.quoteItem.create({ data: { quoteId: quoteB3.id, itemType: ServiceItemType.LABOR, name: 'Akü Montaj İşçiliği', quantity: 1, unitPrice: 400, taxRate: 20, discount: 0, ...qB3Labor } });

  console.log('Tenant B teklifler oluşturuldu.');

  // Randevular
  const nowB = new Date();
  await prisma.appointment.create({ data: { tenantId: tenantB.id, customerId: custB1.id, vehicleId: vehicleB1.id, appointmentDate: new Date(nowB.getTime() + 5 * 24 * 60 * 60 * 1000), appointmentTime: '09:30', type: 'Periyodik Bakım', status: AppointmentStatus.PENDING, locationId: locOstim.id } });
  await prisma.appointment.create({ data: { tenantId: tenantB.id, customerId: custB2.id, vehicleId: vehicleB2.id, appointmentDate: new Date(nowB.getTime() + 2 * 24 * 60 * 60 * 1000), appointmentTime: '11:00', type: 'Fren Kontrolü', status: AppointmentStatus.CONFIRMED, locationId: locOstim.id } });
  await prisma.appointment.create({ data: { tenantId: tenantB.id, customerId: custB3.id, vehicleId: vehicleB3.id, appointmentDate: new Date(nowB.getTime() - 7 * 24 * 60 * 60 * 1000), appointmentTime: '14:30', type: 'Akü Değişimi', status: AppointmentStatus.COMPLETED, locationId: locOstim.id } });
  await prisma.appointment.create({ data: { tenantId: tenantB.id, customerId: custB4.id, vehicleId: vehicleB4.id, appointmentDate: new Date(nowB.getTime() - 3 * 24 * 60 * 60 * 1000), appointmentTime: '10:00', type: 'Genel Kontrol', status: AppointmentStatus.CANCELLED, locationId: locBaglica.id } });

  console.log('Tenant B randevular oluşturuldu.');

  // Servis Emirleri
  const sbSO1Part = calcItem(1, 950, 20); const sbSO1Part2 = calcItem(1, 195, 20); const sbSO1Labor = calcItem(1, 500, 20);
  const sbSO1Sub = sbSO1Part.subTotal + sbSO1Part2.subTotal + sbSO1Labor.subTotal;
  const sbSO1Tax = sbSO1Part.taxAmount + sbSO1Part2.taxAmount + sbSO1Labor.taxAmount;
  const sbSO1Total = sbSO1Sub + sbSO1Tax;

  const serviceOrderB1 = await prisma.serviceOrder.create({ data: { tenantId: tenantB.id, customerId: custB1.id, vehicleId: vehicleB1.id, status: ServiceOrderStatus.COMPLETED, complaintDescription: 'Periyodik bakım — motor yağı ve filtre değişimi.', assignedMechanicId: mechanic1B.id, locationId: locOstim.id, receptionDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), actualDeliveryDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), subTotal: sbSO1Sub, taxAmount: sbSO1Tax, totalAmount: sbSO1Total, completionPercentage: 100 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, itemType: ServiceItemType.PART, name: 'Motor Yağı 0W-40 (5L)', partId: partB1.id, mechanicId: mechanic1B.id, quantity: 1, unitPrice: 950, taxRate: 20, discount: 0, ...sbSO1Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, itemType: ServiceItemType.PART, name: 'Yağ Filtresi Mercedes', partId: partB7.id, mechanicId: mechanic1B.id, quantity: 1, unitPrice: 195, taxRate: 20, discount: 0, ...sbSO1Part2 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, itemType: ServiceItemType.LABOR, name: 'Periyodik Bakım İşçiliği', mechanicId: mechanic1B.id, quantity: 1, unitPrice: 500, taxRate: 20, discount: 0, ...sbSO1Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, mechanicId: mechanic1B.id, formData: { fren: 'iyi', yag: 'değiştirildi', lastik: 'normal', akü: 'iyi', klima: 'çalışıyor' }, completedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000) } });
  await prisma.workLog.create({ data: { tenantId: tenantB.id, mechanicId: mechanic1B.id, serviceOrderId: serviceOrderB1.id, startTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), durationMinutes: 180, notes: 'Bakım tamamlandı.' } });
  await prisma.document.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, fileName: 'servis_b_001.pdf', fileUrl: 'https://storage.yildizgaraj.com/docs/servis_b_001.pdf', fileKey: 'docs/servis_b_001.pdf', fileType: 'application/pdf', fileSize: 307200, uploadedBy: 'Kadir Şahin' } });
  await prisma.serviceRating.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB1.id, customerId: custB1.id, rating: 5, comment: 'Mükemmel servis, çok memnun kaldım.' } });

  const sbSO2Part = calcItem(1, 1350, 20); const sbSO2Labor = calcItem(1, 600, 20);
  const sbSO2Sub = sbSO2Part.subTotal + sbSO2Labor.subTotal;
  const sbSO2Tax = sbSO2Part.taxAmount + sbSO2Labor.taxAmount;
  const sbSO2Total = sbSO2Sub + sbSO2Tax;

  const serviceOrderB2 = await prisma.serviceOrder.create({ data: { tenantId: tenantB.id, customerId: custB2.id, vehicleId: vehicleB2.id, status: ServiceOrderStatus.IN_PROGRESS, complaintDescription: 'Fren balataları aşınmış, değişim gerekiyor.', assignedMechanicId: mechanic4B.id, locationId: locOstim.id, receptionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), subTotal: sbSO2Sub, taxAmount: sbSO2Tax, totalAmount: sbSO2Total, completionPercentage: 60 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB2.id, itemType: ServiceItemType.PART, name: 'Ön Fren Balatası', partId: partB3.id, mechanicId: mechanic4B.id, quantity: 1, unitPrice: 1350, taxRate: 20, discount: 0, ...sbSO2Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB2.id, itemType: ServiceItemType.LABOR, name: 'Fren Balata Değişimi', mechanicId: mechanic4B.id, quantity: 1, unitPrice: 600, taxRate: 20, discount: 0, ...sbSO2Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB2.id, mechanicId: mechanic4B.id, formData: { fren: 'değiştirilecek', yag: 'normal', lastik: 'normal', akü: 'iyi' } } });
  await prisma.workLog.create({ data: { tenantId: tenantB.id, mechanicId: mechanic4B.id, serviceOrderId: serviceOrderB2.id, startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), notes: 'Fren sistemi söküldü.' } });
  await prisma.document.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB2.id, fileName: 'muayene_b_002.pdf', fileUrl: 'https://storage.yildizgaraj.com/docs/muayene_b_002.pdf', fileKey: 'docs/muayene_b_002.pdf', fileType: 'application/pdf', fileSize: 204800, uploadedBy: 'Serhat Koç' } });

  const sbSO3Part = calcItem(1, 4200, 20); const sbSO3Labor = calcItem(1, 400, 20);
  const sbSO3Sub = sbSO3Part.subTotal + sbSO3Labor.subTotal;
  const sbSO3Tax = sbSO3Part.taxAmount + sbSO3Labor.taxAmount;
  const sbSO3Total = sbSO3Sub + sbSO3Tax;

  const serviceOrderB3 = await prisma.serviceOrder.create({ data: { tenantId: tenantB.id, customerId: custB3.id, vehicleId: vehicleB3.id, status: ServiceOrderStatus.WAITING_APPROVAL, complaintDescription: 'Akü ölçümü yapıldı, değişim öneriliyor.', assignedMechanicId: mechanic2B.id, locationId: locOstim.id, receptionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), subTotal: sbSO3Sub, taxAmount: sbSO3Tax, totalAmount: sbSO3Total, completionPercentage: 25 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB3.id, itemType: ServiceItemType.PART, name: 'Akü 80Ah AGM', partId: partB5.id, mechanicId: mechanic2B.id, quantity: 1, unitPrice: 4200, taxRate: 20, discount: 0, ...sbSO3Part } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB3.id, itemType: ServiceItemType.LABOR, name: 'Akü Montaj İşçiliği', mechanicId: mechanic2B.id, quantity: 1, unitPrice: 400, taxRate: 20, discount: 0, ...sbSO3Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB3.id, mechanicId: mechanic2B.id, formData: { fren: 'iyi', yag: 'normal', akü: 'değiştirilmeli' } } });
  await prisma.workLog.create({ data: { tenantId: tenantB.id, mechanicId: mechanic2B.id, serviceOrderId: serviceOrderB3.id, startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), durationMinutes: 60, notes: 'Akü testi yapıldı.' } });
  await prisma.document.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB3.id, fileName: 'aku_test_b_003.pdf', fileUrl: 'https://storage.yildizgaraj.com/docs/aku_b_003.pdf', fileKey: 'docs/aku_b_003.pdf', fileType: 'application/pdf', fileSize: 122880, uploadedBy: 'Emre Yıldız' } });

  const sbSO4Labor = calcItem(1, 1200, 20);
  const serviceOrderB4 = await prisma.serviceOrder.create({ data: { tenantId: tenantB.id, customerId: custB4.id, vehicleId: vehicleB4.id, status: ServiceOrderStatus.PENDING, complaintDescription: 'Periyodik bakım ve genel kontrol.', assignedMechanicId: mechanic1B.id, locationId: locBaglica.id, receptionDate: new Date(), subTotal: sbSO4Labor.subTotal, taxAmount: sbSO4Labor.taxAmount, totalAmount: sbSO4Labor.totalPrice, completionPercentage: 0 } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB4.id, itemType: ServiceItemType.LABOR, name: 'Genel Kontrol ve Bakım', mechanicId: mechanic1B.id, quantity: 1, unitPrice: 1200, taxRate: 20, discount: 0, ...sbSO4Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB4.id, mechanicId: mechanic1B.id, formData: { fren: 'kontrol edilecek', yag: 'kontrol edilecek', lastik: 'normal' } } });
  await prisma.workLog.create({ data: { tenantId: tenantB.id, mechanicId: mechanic1B.id, serviceOrderId: serviceOrderB4.id, startTime: new Date(), notes: 'Araç teslim alındı.' } });
  await prisma.document.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB4.id, fileName: 'teslim_b_004.pdf', fileUrl: 'https://storage.yildizgaraj.com/docs/teslim_b_004.pdf', fileKey: 'docs/teslim_b_004.pdf', fileType: 'application/pdf', fileSize: 81920, uploadedBy: 'Resepsiyon Yıldız' } });

  const sbSO5Labor = calcItem(1, 2500, 20);
  const serviceOrderB5 = await prisma.serviceOrder.create({ data: { tenantId: tenantB.id, customerId: custB5.id, vehicleId: vehicleB5.id, status: ServiceOrderStatus.CANCELLED, complaintDescription: 'Kaporta boyası talep edildi, müşteri iptal etti.', assignedMechanicId: mechanic3B.id, locationId: locOstim.id, receptionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), subTotal: sbSO5Labor.subTotal, taxAmount: sbSO5Labor.taxAmount, totalAmount: sbSO5Labor.totalPrice, completionPercentage: 0, internalNotes: 'Müşteri fiyat nedeniyle iptal etti.' } });
  await prisma.serviceItem.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB5.id, itemType: ServiceItemType.LABOR, name: 'Kaporta Boyası', mechanicId: mechanic3B.id, quantity: 1, unitPrice: 2500, taxRate: 20, discount: 0, ...sbSO5Labor } });
  await prisma.inspectionForm.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB5.id, mechanicId: mechanic3B.id, formData: { kaporta: 'boya gerekli', fren: 'iyi', yag: 'normal' } } });
  await prisma.workLog.create({ data: { tenantId: tenantB.id, mechanicId: mechanic3B.id, serviceOrderId: serviceOrderB5.id, startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), durationMinutes: 30, notes: 'Araç incelendi, müşteri iptal etti.' } });
  await prisma.document.create({ data: { tenantId: tenantB.id, serviceOrderId: serviceOrderB5.id, fileName: 'iptal_b_005.pdf', fileUrl: 'https://storage.yildizgaraj.com/docs/iptal_b_005.pdf', fileKey: 'docs/iptal_b_005.pdf', fileType: 'application/pdf', fileSize: 61440, uploadedBy: 'Resepsiyon Yıldız' } });

  console.log('Tenant B servis emirleri oluşturuldu.');

  // =========================================================================
  // TENANT B — Faturalar, Ödemeler ve Stok Yönetimi
  // =========================================================================
  console.log('Tenant B faturalar ve stok oluşturuluyor...');

  // PAID Invoice for serviceOrderB1
  const invoiceB1 = await prisma.invoice.create({
    data: {
      tenantId: tenantB.id, invoiceNumber: invoiceNumber(3), type: InvoiceType.SALES, status: InvoiceStatus.PAID,
      customerId: custB1.id, serviceOrderId: serviceOrderB1.id,
      issueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      subTotal: sbSO1Sub, discountAmount: 0, taxAmount: sbSO1Tax, totalAmount: sbSO1Total, paidAmount: sbSO1Total,
    },
  });
  await prisma.invoiceItem.create({ data: { tenantId: tenantB.id, invoiceId: invoiceB1.id, type: InvoiceItemType.PART, name: 'Motor Yağı 0W-40 (5L)', quantity: 1, unitPrice: 950, taxRate: 20, discountRate: 0, lineTotal: 1140, sortOrder: 1 } });
  await prisma.invoiceItem.create({ data: { tenantId: tenantB.id, invoiceId: invoiceB1.id, type: InvoiceItemType.LABOR, name: 'Periyodik Bakım İşçiliği', quantity: 1, unitPrice: 500, taxRate: 20, discountRate: 0, lineTotal: 600, sortOrder: 2 } });
  await prisma.payment.create({ data: { tenantId: tenantB.id, customerId: custB1.id, invoiceId: invoiceB1.id, serviceOrderId: serviceOrderB1.id, amount: sbSO1Total, paymentMethod: PaymentMethod.CREDIT_CARD, paymentType: PaymentType.INCOMING, paymentDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), notes: 'Kredi kartı ile ödeme.' } });

  // DRAFT Invoice for serviceOrderB2
  const invoiceB2Draft = await prisma.invoice.create({
    data: {
      tenantId: tenantB.id, invoiceNumber: invoiceNumber(4), type: InvoiceType.SALES, status: InvoiceStatus.DRAFT,
      customerId: custB2.id, serviceOrderId: serviceOrderB2.id,
      issueDate: new Date(), subTotal: sbSO2Sub, discountAmount: 0, taxAmount: sbSO2Tax, totalAmount: sbSO2Total, paidAmount: 0,
    },
  });
  await prisma.invoiceItem.create({ data: { tenantId: tenantB.id, invoiceId: invoiceB2Draft.id, type: InvoiceItemType.PART, name: 'Ön Fren Balatası', quantity: 1, unitPrice: 1350, taxRate: 20, discountRate: 0, lineTotal: 1620, sortOrder: 1 } });

  // PurchaseOrder
  const poB1 = await prisma.purchaseOrder.create({ data: { tenantId: tenantB.id, poNumber: 'PO-B-2026-001', supplierId: supplierB1.id, status: PurchaseOrderStatus.RECEIVED, expectedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), receivedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), subTotal: 650 * 5 + 120 * 10, taxAmount: (650 * 5 + 120 * 10) * 0.2, totalAmount: (650 * 5 + 120 * 10) * 1.2, notes: 'Mercedes yağ ve filtre siparişi' } });
  await prisma.purchaseOrderItem.create({ data: { purchaseOrderId: poB1.id, partId: partB1.id, quantity: 5, unitPrice: 650, taxRate: 20 } });
  await prisma.purchaseOrderItem.create({ data: { purchaseOrderId: poB1.id, partId: partB7.id, quantity: 10, unitPrice: 120, taxRate: 20 } });

  // StockCount
  const scB1 = await prisma.stockCount.create({ data: { tenantId: tenantB.id, locationId: locOstim.id, status: StockCountStatus.COMPLETED, startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), notes: 'Aylık stok sayımı' } });
  await prisma.stockCountItem.create({ data: { stockCountId: scB1.id, partId: partB1.id, systemQuantity: 32, actualQuantity: 30, difference: -2 } });
  await prisma.stockCountItem.create({ data: { stockCountId: scB1.id, partId: partB5.id, systemQuantity: 10, actualQuantity: 10, difference: 0 } });

  // StockTransfer (Ostim → Bağlıca)
  const stB1 = await prisma.stockTransfer.create({ data: { tenantId: tenantB.id, fromLocationId: locOstim.id, toLocationId: locBaglica.id, status: StockTransferStatus.COMPLETED, completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), notes: 'Bağlıca şubesine stok transferi' } });
  await prisma.stockTransferItem.create({ data: { stockTransferId: stB1.id, partId: partB7.id, quantity: 5 } });
  await prisma.stockTransferItem.create({ data: { stockTransferId: stB1.id, partId: partB8.id, quantity: 3 } });

  console.log('Tenant B faturalar ve stok oluşturuldu.');

  // =========================================================================
  // TENANT B — Bildirimler, Audit Loglar ve Sistem Bildirimleri
  // =========================================================================
  console.log('Tenant B bildirimler ve loglar oluşturuluyor...');

  const tmplServiceSMS_B = await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'SERVICE_STATUS', channel: 'SMS', name: 'Servis Durum SMS', body: 'Sayın {{musteriAdi}}, aracınız ({{plaka}}) {{durum}} durumuna geçti.', variables: ['musteriAdi', 'plaka', 'durum'], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'SERVICE_STATUS', channel: 'EMAIL', name: 'Servis Durum E-posta', body: 'Sayın {{musteriAdi}}, aracınızın servis durumu güncellendi.', variables: ['musteriAdi'], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'APPROVAL', channel: 'SMS', name: 'Onay Talebi SMS', body: 'Sayın {{musteriAdi}}, {{islemAdi}} için onayınız bekleniyor.', variables: ['musteriAdi', 'islemAdi'], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'APPROVAL', channel: 'EMAIL', name: 'Onay Talebi E-posta', body: 'Aracınız için yapılacak işlemler onayınızı bekliyor.', variables: [], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'APPOINTMENT', channel: 'SMS', name: 'Randevu Hatırlatma SMS', body: 'Sayın {{musteriAdi}}, {{tarih}} {{saat}} randevunuzu hatırlatırız.', variables: ['musteriAdi', 'tarih', 'saat'], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'APPOINTMENT', channel: 'EMAIL', name: 'Randevu Hatırlatma E-posta', body: 'Randevunuz yaklaşıyor.', variables: [], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'REMINDER', channel: 'SMS', name: 'Bakım Hatırlatma SMS', body: 'Sayın {{musteriAdi}}, aracınızın bakım zamanı geldi.', variables: ['musteriAdi'], isActive: true } });
  await prisma.notificationTemplate.create({ data: { tenantId: tenantB.id, type: 'REMINDER', channel: 'EMAIL', name: 'Bakım Hatırlatma E-posta', body: 'Periyodik bakım zamanınız geldi.', variables: [], isActive: true } });

  await prisma.notification.create({ data: { tenantId: tenantB.id, customerId: custB1.id, type: NotificationType.SMS, channel: 'SMS', recipient: custB1.phone, body: 'Aracınız teslime hazır.', status: NotificationStatus.DELIVERED, sentAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), notificationTemplateId: tmplServiceSMS_B.id } });
  await prisma.notification.create({ data: { tenantId: tenantB.id, customerId: custB2.id, type: NotificationType.SMS, channel: 'SMS', recipient: custB2.phone, body: 'Fren sistemi değişimi için onayınız bekleniyor.', status: NotificationStatus.SENT, sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) } });
  await prisma.notification.create({ data: { tenantId: tenantB.id, customerId: custB3.id, type: NotificationType.EMAIL, channel: 'EMAIL', recipient: custB3.email!, subject: 'Akü Değişimi Onay Talebi', body: 'Aracınız için akü değişimi önerilmektedir.', status: NotificationStatus.DELIVERED, sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } });
  await prisma.notification.create({ data: { tenantId: tenantB.id, customerId: custB4.id, type: NotificationType.SMS, channel: 'SMS', recipient: custB4.phone, body: 'Randevunuzu hatırlatırız.', status: NotificationStatus.PENDING } });
  await prisma.notification.create({ data: { tenantId: tenantB.id, customerId: custB5.id, type: NotificationType.EMAIL, channel: 'EMAIL', recipient: custB5.email!, subject: 'Bakım Hatırlatması', body: 'Aracınızın bakım zamanı geldi.', status: NotificationStatus.SENT, sentAt: new Date() } });

  await prisma.auditLog.create({ data: { tenantId: tenantB.id, level: 'INFO', module: 'SERVICE-ORDER', message: 'Servis emri #B1 tamamlandı ve fatura kesildi.', traceId: 'trace-b-001' } });
  await prisma.auditLog.create({ data: { tenantId: tenantB.id, level: 'INFO', module: 'PAYMENT', message: 'Ödeme alındı: FAT-2026-0003, kredi kartı.', traceId: 'trace-b-002' } });
  await prisma.auditLog.create({ data: { tenantId: tenantB.id, level: 'WARN', module: 'STOCK', message: 'Stok sayımında Motor Yağı 0W-40 için -2 fark tespit edildi.', traceId: 'trace-b-003' } });

  await prisma.systemNotification.create({ data: { tenantId: tenantB.id, category: 'BILLING', title: 'Kurumsal Plan Aktif', message: 'Kurumsal plan aboneliğiniz aktif ve tüm özellikler kullanılabilir.', severity: NotificationSeverity.INFO } });
  await prisma.systemNotification.create({ data: { tenantId: tenantB.id, category: 'STOCK', title: 'Düşük Stok Uyarısı', message: 'Akü 80Ah AGM stok seviyesi minimum limitin altına düştü.', severity: NotificationSeverity.WARNING } });

  console.log('Tenant B bildirimler ve loglar oluşturuldu.');
  console.log('=== Tenant B tamamlandı ===');

  // =========================================================================
  // TENANT C — Birlik Oto Servis (BOŞ FİRMA)
  // =========================================================================
  console.log('Tenant C oluşturuluyor: Birlik Oto Servis (Boş Firma)...');

  const tenantC = await prisma.tenant.create({
    data: {
      name: 'Birlik Oto Servis',
      slug: 'birlik-oto-servis',
      taxNumber: '1122334455',
      taxOffice: 'Bursa Vergi Dairesi',
      email: 'info@birlikotoservis.com',
      phone: '02241234567',
      address: 'Nilüfer Oto Sanayi Sitesi',
      city: 'Bursa',
      status: 'ACTIVE',
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenantC.id,
      planId: planStarter.id,
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-12-31'),
    },
  });

  await prisma.location.create({
    data: {
      tenantId: tenantC.id,
      name: 'Merkez Şube',
      address: 'Nilüfer Oto Sanayi Sitesi',
      city: 'Bursa',
      phone: '02241234567',
      email: 'info@birlikotoservis.com',
      isActive: true,
      isDefault: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Birlik Admin',
      email: 'admin@birlikotoservis.com',
      password: await bcrypt.hash('Admin123!', SALT_ROUNDS),
      role: UserRole.TENANT_ADMIN,
      tenantId: tenantC.id,
      isActive: true,
    },
  });

  console.log('=== Tenant C tamamlandı ===');

  // =========================================================================
  // Tenant Düzeyinde Modeller — Yeni Seed Verileri
  // =========================================================================
  console.log('Tenant düzeyinde modeller oluşturuluyor...');

  // SupportTicket (5 kayıt)
  await prisma.supportTicket.createMany({
    data: [
      { tenantId: tenantA.id, title: 'Fatura PDF oluşturulmuyor', priority: 'HIGH', status: 'OPEN' },
      { tenantId: tenantA.id, title: 'Kullanıcı girişi yapılamıyor', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: 'superadmin@msotoservis.com' },
      { tenantId: tenantB.id, title: 'Stok sayımı hatalı', priority: 'MEDIUM', status: 'OPEN' },
      { tenantId: tenantB.id, title: 'SMS bildirimleri gelmiyor', priority: 'LOW', status: 'RESOLVED', resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { tenantId: tenantA.id, title: 'Randevu takvimi senkronize olmuyor', priority: 'MEDIUM', status: 'OPEN' },
    ],
  });

  // NPSResponse (10 kayıt)
  const npsScores = [9, 8, 10, 4, 7, 10, 6, 9, 8, 3];
  const npsComments = [
    'Çok kullanışlı, servis takibi artık çok kolay.',
    'Genel olarak memnunum, mobil uygulama daha iyi olabilir.',
    'Harika bir platform, kesinlikle tavsiye ederim.',
    'Fatura modülünde sorunlar var, düzeltilmeli.',
    'İyi ama yavaş bazen.',
    'Mükemmel destek ekibi!',
    'Bazı özellikler eksik.',
    'Çok hızlı ve güvenilir.',
    'Arayüz sezgisel, kullanımı kolay.',
    'Fiyat/performans dengesi iyi değil.',
  ];
  const tenantsForNPS = [tenantA, tenantB];
  for (let i = 0; i < 10; i++) {
    await prisma.nPSResponse.create({
      data: {
        tenantId: tenantsForNPS[i % 2].id,
        score: npsScores[i],
        comment: npsComments[i],
        createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      },
    });
  }

  // AutomationWorkflow (5 kayıt)
  await prisma.automationWorkflow.createMany({
    data: [
      { tenantId: tenantA.id, name: 'Deneme Süresi Bitiş Uyarısı', trigger: 'subscription.trial_ending', action: 'email.send_warning', isActive: true, runCount: 145, lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { tenantId: tenantA.id, name: 'Ödeme Başarısız Bildirimi', trigger: 'payment.failed', action: 'email.send_alert', isActive: true, runCount: 23, lastRunAt: new Date(Date.now() - 30 * 60 * 1000) },
      { tenantId: tenantB.id, name: 'Yeni Tenant Karşılama', trigger: 'tenant.created', action: 'email.send_welcome', isActive: true, runCount: 67, lastRunAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { tenantId: tenantB.id, name: 'Aylık Rapor Gönderimi', trigger: 'schedule.monthly', action: 'report.generate', isActive: false, runCount: 12, lastRunAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { tenantId: tenantA.id, name: 'Güvenlik Tehdidi Alarmı', trigger: 'security.threat_detected', action: 'notification.create', isActive: true, runCount: 8, lastRunAt: new Date(Date.now() - 10 * 60 * 1000) },
    ],
  });

  console.log('Tenant düzeyinde modeller oluşturuldu.');

  // =========================================================================
  // Platform Düzeyinde Modeller — Yeni Seed Verileri
  // =========================================================================
  console.log('Platform modelleri oluşturuluyor...');

  // Coupon (3 kayıt)
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME20', discountType: 'PERCENT', discountValue: 20, validUntil: new Date('2026-12-31'), usageLimit: 100, usedCount: 34, isActive: true },
      { code: 'FLAT100TL', discountType: 'FIXED', discountValue: 100, validUntil: new Date('2026-06-30'), usageLimit: 50, usedCount: 12, isActive: true },
      { code: 'SUMMER30', discountType: 'PERCENT', discountValue: 30, validUntil: new Date('2025-09-01'), usageLimit: 200, usedCount: 200, isActive: false },
    ],
    skipDuplicates: true,
  });

  // Addon (4 kayıt)
  await prisma.addon.createMany({
    data: [
      { name: 'SMS Paketi', description: 'Aylık 500 SMS gönderimi', price: 99, isActive: true, subscriberCount: 42 },
      { name: 'Gelişmiş Raporlama', description: 'Özel rapor şablonları ve PDF export', price: 149, isActive: true, subscriberCount: 28 },
      { name: 'Çoklu Şube', description: 'Sınırsız şube yönetimi', price: 299, isActive: true, subscriberCount: 15 },
      { name: 'API Erişimi', description: 'REST API ve webhook desteği', price: 199, isActive: false, subscriberCount: 0 },
    ],
    skipDuplicates: true,
  });

  // APIKey (3 kayıt — demo hash)
  const demoKeyHash = await bcrypt.hash('sk_live_demo_key_for_seed_only_12345678', SALT_ROUNDS);
  await prisma.aPIKey.createMany({
    data: [
      { name: 'Production Key', keyHash: demoKeyHash, keyPrefix: 'sk_live_a', createdBy: 'superadmin', isActive: true, lastUsedAt: new Date(Date.now() - 5 * 60 * 1000) },
      { name: 'Staging Key', keyHash: demoKeyHash, keyPrefix: 'sk_test_b', createdBy: 'superadmin', isActive: true, lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { name: 'Mobile App Key', keyHash: demoKeyHash, keyPrefix: 'sk_live_c', createdBy: 'superadmin', isActive: false, revokedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    ],
    skipDuplicates: true,
  });

  // KMSKey (4 kayıt)
  await prisma.kMSKey.createMany({
    data: [
      { name: 'Database Encryption Key', algorithm: 'AES-256-GCM', status: 'ACTIVE', lastRotatedAt: new Date('2026-01-01'), nextRotationAt: new Date('2026-07-01') },
      { name: 'Session Secret Key', algorithm: 'HMAC-SHA256', status: 'ACTIVE', lastRotatedAt: new Date('2026-02-15'), nextRotationAt: new Date('2026-08-15') },
      { name: 'S3 Encryption Key', algorithm: 'AES-256-CBC', status: 'ROTATING', lastRotatedAt: new Date('2025-12-01'), nextRotationAt: new Date('2026-06-01') },
      { name: 'Legacy API Key', algorithm: 'RSA-2048', status: 'EXPIRED', lastRotatedAt: new Date('2025-06-01'), nextRotationAt: new Date('2025-12-01') },
    ],
    skipDuplicates: true,
  });

  // BackupRecord (son 7 gün, 7 kayıt)
  const backupData = [
    { daysAgo: 0, sizeBytes: BigInt(2_576_980_377), status: 'SUCCESS', durationSeconds: 342, type: 'FULL' },
    { daysAgo: 1, sizeBytes: BigInt(2_469_606_195), status: 'SUCCESS', durationSeconds: 318, type: 'INCREMENTAL' },
    { daysAgo: 2, sizeBytes: BigInt(0), status: 'FAILED', durationSeconds: 0, type: 'FULL' },
    { daysAgo: 3, sizeBytes: BigInt(2_362_232_013), status: 'SUCCESS', durationSeconds: 305, type: 'INCREMENTAL' },
    { daysAgo: 4, sizeBytes: BigInt(2_254_857_830), status: 'SUCCESS', durationSeconds: 298, type: 'INCREMENTAL' },
    { daysAgo: 5, sizeBytes: BigInt(2_362_232_013), status: 'SUCCESS', durationSeconds: 310, type: 'FULL' },
    { daysAgo: 6, sizeBytes: BigInt(2_147_483_648), status: 'SUCCESS', durationSeconds: 285, type: 'INCREMENTAL' },
  ];
  for (const b of backupData) {
    await prisma.backupRecord.create({
      data: {
        date: new Date(Date.now() - b.daysAgo * 24 * 60 * 60 * 1000),
        sizeBytes: b.sizeBytes,
        status: b.status,
        durationSeconds: b.durationSeconds,
        type: b.type,
      },
    });
  }

  // CloudCostRecord (son 6 ay)
  const nowSeed = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(nowSeed.getFullYear(), nowSeed.getMonth() - i, 1);
    await prisma.cloudCostRecord.upsert({
      where: { month_year: { month: d.getMonth() + 1, year: d.getFullYear() } },
      update: {},
      create: {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        totalCost: 2600 + i * 50,
        byService: {
          'EC2 / Compute': 1200 + i * 20,
          'RDS / Database': 850 + i * 10,
          'S3 / Storage': 300 + i * 5,
          'CloudFront / CDN': 170 + i * 3,
          'SES / Email': 40 + i,
          'Diğer': 120 + i * 2,
        },
      },
    });
  }

  // CapacitySnapshot (son 7 gün, günlük)
  for (let i = 6; i >= 0; i--) {
    await prisma.capacitySnapshot.create({
      data: {
        recordedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        cpuPercent: 40 + (i % 3) * 10 + 5,
        ramPercent: 55 + (i % 4) * 5,
        diskPercent: 45 + i,
        networkMbps: 20 + (i % 5) * 5,
      },
    });
  }

  // InfraNode (7 düğüm)
  await prisma.infraNode.createMany({
    data: [
      { name: 'web-app-01', type: 'WEB_SERVER', status: 'ONLINE', region: 'eu-central-1', cpuPercent: 45, ramPercent: 62 },
      { name: 'web-app-02', type: 'WEB_SERVER', status: 'ONLINE', region: 'eu-central-1', cpuPercent: 38, ramPercent: 58 },
      { name: 'db-primary', type: 'DATABASE', status: 'ONLINE', region: 'eu-central-1', cpuPercent: 72, ramPercent: 85 },
      { name: 'db-replica', type: 'DATABASE', status: 'ONLINE', region: 'eu-west-1', cpuPercent: 25, ramPercent: 40 },
      { name: 'cache-01', type: 'CACHE', status: 'ONLINE', region: 'eu-central-1', cpuPercent: 15, ramPercent: 30 },
      { name: 'worker-01', type: 'WORKER', status: 'DEGRADED', region: 'eu-central-1', cpuPercent: 90, ramPercent: 78 },
      { name: 'cdn-edge', type: 'CDN', status: 'ONLINE', region: 'global', cpuPercent: 10, ramPercent: 20 },
    ],
    skipDuplicates: true,
  });

  // Deployment (5 kayıt)
  await prisma.deployment.createMany({
    data: [
      { version: 'v2.4.1', status: 'SUCCESS', environment: 'production', deployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), deployedBy: 'CI/CD Pipeline', notes: 'Hotfix: ödeme akışı düzeltmesi' },
      { version: 'v2.4.0', status: 'SUCCESS', environment: 'production', deployedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), deployedBy: 'admin@msotoservis.com', notes: 'Yeni abonelik modülü' },
      { version: 'v2.3.9', status: 'ROLLBACK', environment: 'production', deployedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), deployedBy: 'CI/CD Pipeline', notes: 'Performans sorunu nedeniyle geri alındı' },
      { version: 'v2.3.8', status: 'SUCCESS', environment: 'staging', deployedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deployedBy: 'admin@msotoservis.com', notes: 'Güvenlik yamaları' },
      { version: 'v2.3.7', status: 'FAILED', environment: 'production', deployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), deployedBy: 'CI/CD Pipeline', notes: 'Build hatası' },
    ],
  });

  // ReportTemplate (4 şablon)
  await prisma.reportTemplate.createMany({
    data: [
      { name: 'Aylık Gelir Raporu', description: 'MRR, yeni abonelikler ve churn analizi', metrics: ['mrr', 'newSubscriptions', 'churnRate', 'arpu'], lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { name: 'Tenant Performans Raporu', description: 'Aktif tenant sayısı, servis emirleri ve kullanım metrikleri', metrics: ['activeTenants', 'serviceOrders', 'userActivity', 'retention'], lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { name: 'Güvenlik Özet Raporu', description: 'Tehdit tespitleri, başarısız girişler ve güvenlik olayları', metrics: ['threats', 'failedLogins', 'blockedIPs', 'auditEvents'] },
      { name: 'Altyapı Sağlık Raporu', description: 'CPU, RAM, disk kullanımı ve uptime metrikleri', metrics: ['cpuUsage', 'ramUsage', 'diskUsage', 'uptime', 'responseTime'], lastUsedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    ],
    skipDuplicates: true,
  });

  console.log('Platform modelleri oluşturuldu.');

  console.log('Seed tamamlandı!');
}

// ---------------------------------------------------------------------------
// Çalıştırma
// ---------------------------------------------------------------------------

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // P2002: Unique constraint ihlali
    // P2003: Foreign key constraint ihlali
    if (e.code === 'P2002') {
      console.error('Unique constraint hatası (P2002):', e.meta);
    } else if (e.code === 'P2003') {
      console.error('Foreign key constraint hatası (P2003):', e.meta);
    } else {
      console.error(e);
    }
    await prisma.$disconnect();
    process.exit(1);
  });
