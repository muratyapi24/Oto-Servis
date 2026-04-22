import { PrismaClient, UserRole, CustomerType, ServiceOrderStatus, ServiceItemType, InvoiceType, InvoiceStatus, PaymentMethod, PaymentType, AppointmentStatus, StockMovementType, QuoteStatus, NotificationType, NotificationStatus, LoyaltyTransactionType, CommissionRuleType, StockCountStatus, StockTransferStatus, PurchaseOrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı temizleniyor (Eski veriler siliniyor)...');

  // İlişkilere göre ters sırayla silme işlemi
  await prisma.checkPayment.deleteMany({});
  await prisma.paymentAttempt.deleteMany({});
  await prisma.parasutSyncLog.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  
  await prisma.stockTransferItem.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockCountItem.deleteMany({});
  await prisma.stockCount.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  
  await prisma.stockMovement.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.serviceItem.deleteMany({});
  
  await prisma.inspectionForm.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.workLog.deleteMany({});
  await prisma.serviceRating.deleteMany({});
  await prisma.message.deleteMany({});
  
  await prisma.serviceOrder.deleteMany({});
  
  await prisma.appointment.deleteMany({});
  await prisma.quoteItem.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.maintenancePlan.deleteMany({});
  await prisma.vehicle.deleteMany({});
  
  await prisma.notification.deleteMany({});
  await prisma.bulkNotificationCampaign.deleteMany({});
  await prisma.notificationTemplate.deleteMany({});
  await prisma.customerNotificationPreference.deleteMany({});
  await prisma.loyaltyTransaction.deleteMany({});
  await prisma.customer.deleteMany({});
  
  await prisma.part.deleteMany({});
  await prisma.partCategory.deleteMany({});
  await prisma.supplier.deleteMany({});
  
  await prisma.commissionRule.deleteMany({});
  await prisma.mechanic.deleteMany({});
  await prisma.location.deleteMany({});
  
  await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } }); // Keep superadmin
  await prisma.tenant.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});

  console.log('Veritabanı temizlendi, yeni veriler ekleniyor...');

  // --- 0. ABONELIK PAKETLERI (SUBSCRIPTION PLANS) ---
  console.log('Abonelik paketleri oluşturuluyor...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Standart',
      slug: 'standart-plan',
      description: 'Küçük servisler için standart özellikler.',
      priceMonthly: 2500,
      priceYearly: 25000,
      trialDays: 14,
      features: { core: true, app: false },
      limits: { users: 3, vehicles: 500 },
      sortOrder: 1,
      isActive: true,
    }
  });

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Profesyonel (PRO)',
      slug: 'pro-plan',
      description: 'Orta ölçekli servisler için gelişmiş analizler.',
      priceMonthly: 8200,
      priceYearly: 82000,
      trialDays: 14,
      features: { core: true, app: true, advancedAnalytics: true },
      limits: { users: 15, vehicles: 5000 },
      sortOrder: 2,
      isActive: true,
    }
  });

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Kurumsal (ENT)',
      slug: 'ent-plan',
      description: 'Sınırsız kullanıcı ve araç desteği, markalaşma çözümleri.',
      priceMonthly: 20000,
      priceYearly: 200000,
      trialDays: 30,
      features: { core: true, app: true, whiteLabel: true },
      limits: { users: -1, vehicles: -1 },
      sortOrder: 3,
      isActive: true,
    }
  });

  // ============================================
  // --- 1. FIRMA A (MS Oto Servis) ---
  // ============================================
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'MS Oto Servis A.Ş.',
      slug: 'bst-oto',
      email: 'info@bstoto.com',
      phone: '02120001122',
      address: 'Maslak Oto Sanayi',
      status: 'ACTIVE',
    },
  });

  // Firma A Kullanıcılar
  await prisma.user.create({ data: { name: 'BST Admin', email: 'admin@bstoto.com', password: hashedPassword, role: UserRole.TENANT_ADMIN, tenantId: tenantA.id, isActive: true } });
  await prisma.user.create({ data: { name: 'Ayşe Yılmaz', email: 'ayse@bstoto.com', password: hashedPassword, role: UserRole.RECEPTIONIST, tenantId: tenantA.id, isActive: true } });
  await prisma.user.create({ data: { name: 'Mehmet Demir', email: 'mehmet@bstoto.com', password: hashedPassword, role: UserRole.ACCOUNTANT, tenantId: tenantA.id, isActive: true } });

  // Lokasyonlar (Şubeler)
  const locationsA = [];
  for (let i = 1; i <= 3; i++) {
    locationsA.push(await prisma.location.create({
      data: { tenantId: tenantA.id, name: `Şube A-${i}`, city: 'İstanbul', isActive: true, isDefault: i === 1 }
    }));
  }

  // Tedarikçiler
  const suppliersA = [];
  for (let i = 1; i <= 3; i++) {
    suppliersA.push(await prisma.supplier.create({
      data: { tenantId: tenantA.id, name: `Tedarikçi ${i} A.Ş.`, phone: `0500111223${i}`, email: `tedarikci${i}@firmaa.com`, balance: 1000 * i, notes: `Firma A tedarikçi #${i}` }
    }));
  }

  // Parça Kategorileri & Parçalar
  const allPartsA = [];
  for (let i = 1; i <= 3; i++) {
    const category = await prisma.partCategory.create({
      data: { tenantId: tenantA.id, name: `Kategori A-${i}`, description: `Parça kategorisi ${i}` }
    });
    const part = await prisma.part.create({
      data: {
        tenantId: tenantA.id, categoryId: category.id, partNumber: `PRT-A-${i}`, name: `Yedek Parça A-${i}`,
        purchasePrice: 100 * i, sellingPrice: 150 * i, currentStock: 10 + i, minStockLevel: 5,
        supplierId: suppliersA[0].id, brand: i % 2 === 0 ? 'Orijinal' : 'Yan Sanayi', locationId: locationsA[0].id
      }
    });
    allPartsA.push(part);
  }

  // Ustalar ve Komisyon Kuralları
  const mechanicsA = [];
  for (let i = 1; i <= 3; i++) {
    const userA = await prisma.user.create({
      data: { name: `Usta A-${i} Soyad ${i}`, email: `usta${i}@firmaa.com`, password: hashedPassword, role: UserRole.MECHANIC, tenantId: tenantA.id, isActive: true }
    });
    const mechanic = await prisma.mechanic.create({
      data: { tenantId: tenantA.id, userId: userA.id, firstName: `Usta A-${i}`, lastName: `Soyad ${i}`, specialties: [['Motor', 'Mekanik'], ['Elektrik', 'Elektronik'], ['Kaporta', 'Boya']][i - 1], phone: `0555000110${i}`, hourlyRate: 150 + (i * 20), isActive: true }
    });
    mechanicsA.push(mechanic);
    
    // Usta Komisyon Kuralı
    await prisma.commissionRule.create({
      data: { tenantId: tenantA.id, mechanicId: mechanic.id, ruleType: CommissionRuleType.PERCENTAGE, value: 5 + i, isActive: true }
    });
  }

  // Müşteriler, Araçlar, Müşteri Tercihleri ve Sadakat
  const customersA = [];
  const vehiclesA = [];
  for (let i = 1; i <= 3; i++) {
    const customer = await prisma.customer.create({
      data: { tenantId: tenantA.id, type: i === 2 ? CustomerType.CORPORATE : CustomerType.INDIVIDUAL, firstName: `MüşteriA-${i}`, lastName: `SoyadıA-${i}`, phone: `0500999887${i}`, email: `musteria${i}@firma.com`, rewardPoints: 100 * i }
    });
    customersA.push(customer);
    
    // Müşteri Tercihi
    await prisma.customerNotificationPreference.create({
      data: { tenantId: tenantA.id, customerId: customer.id, smsEnabled: true, emailEnabled: true }
    });

    // Sadakat Hareketi
    await prisma.loyaltyTransaction.create({
      data: { tenantId: tenantA.id, customerId: customer.id, type: LoyaltyTransactionType.EARN, points: 50 * i, description: `Hoşgeldin Puanı ${i}` }
    });

    const vehicle = await prisma.vehicle.create({
      data: { tenantId: tenantA.id, customerId: customer.id, plate: `34 A 10${i}`, brand: ['VW', 'Ford', 'Renault'][i - 1], model: ['Golf', 'Focus', 'Clio'][i - 1], year: 2018 + i }
    });
    vehiclesA.push(vehicle);

    // Bakım Planı
    await prisma.maintenancePlan.create({
      data: { tenantId: tenantA.id, vehicleId: vehicle.id, title: `Yıllık Bakım ${vehicle.plate}`, dueDate: new Date() }
    });
  }

  // Teklifler (Quotes)
  for (let i = 0; i < 3; i++) {
    const quote = await prisma.quote.create({
      data: { tenantId: tenantA.id, customerId: customersA[i].id, vehicleId: vehiclesA[i].id, status: QuoteStatus.DRAFT, totalAmount: 1500 + i * 100 }
    });
    await prisma.quoteItem.create({
      data: { quoteId: quote.id, itemType: ServiceItemType.PART, name: allPartsA[i].name, partId: allPartsA[i].id, unitPrice: Number(allPartsA[i].sellingPrice), subTotal: Number(allPartsA[i].sellingPrice), taxAmount: 0, totalPrice: Number(allPartsA[i].sellingPrice) }
    });
  }

  // İş Emirleri, Fatura, Ödemeler, Dokümanlar, İş Günlükleri, Mesajlar, Değerlendirmeler vb.
  const statusesA = [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.PENDING];
  for (let i = 0; i < 3; i++) {
    const order = await prisma.serviceOrder.create({
      data: { tenantId: tenantA.id, customerId: customersA[i].id, vehicleId: vehiclesA[i].id, status: statusesA[i], complaintDescription: `Şikayet A-${i + 1}`, assignedMechanicId: mechanicsA[i].id, estimatedCost: 500, subTotal: 650, taxAmount: 130, totalAmount: 780, locationId: locationsA[0].id }
    });

    await prisma.serviceItem.create({
      data: { tenantId: tenantA.id, serviceOrderId: order.id, itemType: ServiceItemType.PART, name: allPartsA[i].name, partId: allPartsA[i].id, quantity: 1, unitPrice: Number(allPartsA[i].sellingPrice), subTotal: Number(allPartsA[i].sellingPrice), taxAmount: 0, totalPrice: Number(allPartsA[i].sellingPrice) }
    });

    // Doküman & Ekspertiz
    await prisma.document.create({
      data: { tenantId: tenantA.id, serviceOrderId: order.id, fileName: `belge_${i}.pdf`, fileUrl: 'https://example.com/doc', fileKey: `doc_key_${i}`, fileType: 'pdf', fileSize: 1000, uploadedBy: 'Admin' }
    });

    await prisma.inspectionForm.create({
      data: { tenantId: tenantA.id, serviceOrderId: order.id, mechanicId: mechanicsA[i].id, formData: { "fren": "iyi", "yag": "degisti" } }
    });

    // İş Günlüğü & Mesaj
    await prisma.workLog.create({
      data: { tenantId: tenantA.id, mechanicId: mechanicsA[i].id, serviceOrderId: order.id, startTime: new Date(), notes: `İşlem ${i}` }
    });

    await prisma.message.create({
      data: { tenantId: tenantA.id, serviceOrderId: order.id, customerId: customersA[i].id, senderType: 'MECHANIC', senderName: mechanicsA[i].firstName, content: `Araç işlemleri ${i}` }
    });

    if (statusesA[i] === ServiceOrderStatus.COMPLETED) {
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantA.id, type: InvoiceType.SALES, status: InvoiceStatus.PAID, customerId: customersA[i].id, serviceOrderId: order.id, subTotal: 650, taxAmount: 130, totalAmount: 780, paidAmount: 780 }
      });
      await prisma.payment.create({
        data: { tenantId: tenantA.id, customerId: customersA[i].id, invoiceId: invoice.id, serviceOrderId: order.id, amount: 780, paymentMethod: PaymentMethod.CREDIT_CARD, paymentType: PaymentType.INCOMING }
      });
      await prisma.serviceRating.create({
        data: { tenantId: tenantA.id, serviceOrderId: order.id, customerId: customersA[i].id, rating: 4 + (i % 2) }
      });
    }
  }

  // Satın Alma Siparişleri
  for (let i = 0; i < 3; i++) {
    const po = await prisma.purchaseOrder.create({
      data: { tenantId: tenantA.id, poNumber: `PO-A-${i}`, supplierId: suppliersA[i].id, status: PurchaseOrderStatus.DRAFT }
    });
    await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: po.id, partId: allPartsA[i].id, quantity: 10, unitPrice: 100 }
    });
  }

  // Stok Sayımları (StockCounts)
  for (let i = 0; i < 3; i++) {
    const sc = await prisma.stockCount.create({
      data: { tenantId: tenantA.id, locationId: locationsA[0].id, status: StockCountStatus.COMPLETED }
    });
    await prisma.stockCountItem.create({
      data: { stockCountId: sc.id, partId: allPartsA[i].id, systemQuantity: 10, actualQuantity: 9, difference: -1 }
    });
  }

  // Stok Transferleri
  for (let i = 0; i < 3; i++) {
    const st = await prisma.stockTransfer.create({
      data: { tenantId: tenantA.id, fromLocationId: locationsA[0].id, toLocationId: locationsA[1].id, status: StockTransferStatus.PENDING }
    });
    await prisma.stockTransferItem.create({
      data: { stockTransferId: st.id, partId: allPartsA[i].id, quantity: 2 }
    });
  }

  const templateTypesA = ['SERVICE_STATUS', 'APPROVAL', 'REMINDER'];
  for (let i = 0; i < 3; i++) {
    const template = await prisma.notificationTemplate.create({
      data: { tenantId: tenantA.id, type: templateTypesA[i], channel: 'SMS', name: `Şablon A-${i}`, body: 'Sayın {{name}}, aracınızın durumu: {{status}}' }
    });
    await prisma.notification.create({
      data: { tenantId: tenantA.id, customerId: customersA[i].id, type: NotificationType.SMS, channel: 'SMS', recipient: customersA[i].phone, body: 'Aracınız hazır.', status: NotificationStatus.PENDING, notificationTemplateId: template.id }
    });
  }


  // ============================================
  // --- 2. FIRMA B (Garaj Motors) ---
  // ============================================
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Garaj Motors',
      slug: 'garaj-motors',
      email: 'info@garajmotors.com',
      phone: '04320002233',
      address: 'Bostancı Oto Sanayi',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({ data: { name: 'Garaj Admin', email: 'admin@garajmotors.com', password: hashedPassword, role: UserRole.TENANT_ADMIN, tenantId: tenantB.id, isActive: true } });

  const locationsB = [];
  for (let i = 1; i <= 3; i++) {
    locationsB.push(await prisma.location.create({
      data: { tenantId: tenantB.id, name: `Şube B-${i}`, city: 'Ankara', isActive: true, isDefault: i === 1 }
    }));
  }

  const suppliersB = [];
  for (let i = 1; i <= 3; i++) {
    suppliersB.push(await prisma.supplier.create({
      data: { tenantId: tenantB.id, name: `Tedarikçi B-${i}`, phone: `0500222334${i}`, email: `tedarikci${i}@firmab.com`, balance: 1500 * i }
    }));
  }

  const allPartsB = [];
  for (let i = 1; i <= 3; i++) {
    const category = await prisma.partCategory.create({
      data: { tenantId: tenantB.id, name: `Kategori B-${i}` }
    });
    const part = await prisma.part.create({
      data: {
        tenantId: tenantB.id, categoryId: category.id, partNumber: `PRT-B-${i}`, name: `Yedek Parça B-${i}`,
        purchasePrice: 120 * i, sellingPrice: 180 * i, currentStock: 15 + i, supplierId: suppliersB[0].id, locationId: locationsB[0].id
      }
    });
    allPartsB.push(part);
  }

  const mechanicsB = [];
  for (let i = 1; i <= 3; i++) {
    const userB = await prisma.user.create({
      data: { name: `Usta B-${i}`, email: `usta${i}@firmab.com`, password: hashedPassword, role: UserRole.MECHANIC, tenantId: tenantB.id, isActive: true }
    });
    const mechanic = await prisma.mechanic.create({
      data: { tenantId: tenantB.id, userId: userB.id, firstName: `Usta B-${i}`, lastName: `Demir ${i}`, specialties: ['Motor'], phone: `0555000220${i}`, hourlyRate: 180 + (i * 25), isActive: true }
    });
    mechanicsB.push(mechanic);
    
    await prisma.commissionRule.create({
      data: { tenantId: tenantB.id, mechanicId: mechanic.id, ruleType: CommissionRuleType.FIXED, value: 50 * i, isActive: true }
    });
  }

  const customersB = [];
  const vehiclesB = [];
  for (let i = 1; i <= 3; i++) {
    const customer = await prisma.customer.create({
      data: { tenantId: tenantB.id, type: CustomerType.INDIVIDUAL, firstName: `MüşteriB-${i}`, lastName: `SoyadıB`, phone: `0500111223${i}`, email: `musterib${i}@firmab.com` }
    });
    customersB.push(customer);
    
    await prisma.loyaltyTransaction.create({
      data: { tenantId: tenantB.id, customerId: customer.id, type: LoyaltyTransactionType.EARN, points: 100 * i, description: 'Kampanya' }
    });

    const vehicle = await prisma.vehicle.create({
      data: { tenantId: tenantB.id, customerId: customer.id, plate: `34 B 10${i}`, brand: ['Mercedes', 'BMW', 'Audi'][i - 1], model: ['C180', '320i', 'A4'][i - 1], year: 2020 + i }
    });
    vehiclesB.push(vehicle);
    
    await prisma.maintenancePlan.create({
      data: { tenantId: tenantB.id, vehicleId: vehicle.id, title: `Ağır Bakım ${vehicle.plate}`, dueDate: new Date() }
    });
  }

  for (let i = 0; i < 3; i++) {
    const quote = await prisma.quote.create({
      data: { tenantId: tenantB.id, customerId: customersB[i].id, vehicleId: vehiclesB[i].id, status: QuoteStatus.SENT, totalAmount: 2500 }
    });
    await prisma.quoteItem.create({
      data: { quoteId: quote.id, itemType: ServiceItemType.LABOR, name: 'İşçilik', unitPrice: 2500, subTotal: 2500, taxAmount: 0, totalPrice: 2500 }
    });
  }

  const statusesB = [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.WAITING_APPROVAL, ServiceOrderStatus.IN_PROGRESS];
  for (let i = 0; i < 3; i++) {
    const order = await prisma.serviceOrder.create({
      data: { tenantId: tenantB.id, customerId: customersB[i].id, vehicleId: vehiclesB[i].id, status: statusesB[i], complaintDescription: `Şikayet B-${i + 1}`, assignedMechanicId: mechanicsB[i].id, locationId: locationsB[0].id }
    });

    await prisma.serviceItem.create({
      data: { tenantId: tenantB.id, serviceOrderId: order.id, itemType: ServiceItemType.PART, name: allPartsB[i].name, partId: allPartsB[i].id, quantity: 1, unitPrice: Number(allPartsB[i].sellingPrice), subTotal: Number(allPartsB[i].sellingPrice), taxAmount: 0, totalPrice: Number(allPartsB[i].sellingPrice) }
    });
    
    await prisma.document.create({
      data: { tenantId: tenantB.id, serviceOrderId: order.id, fileName: `fatura_taslak_${i}.pdf`, fileUrl: 'https://ex.com/doc', fileKey: `doc_${i}`, fileType: 'pdf', fileSize: 500, uploadedBy: 'Admin' }
    });

    await prisma.inspectionForm.create({
      data: { tenantId: tenantB.id, serviceOrderId: order.id, mechanicId: mechanicsB[i].id, formData: { "motor": "sorunlu" } }
    });
    
    await prisma.workLog.create({
      data: { tenantId: tenantB.id, mechanicId: mechanicsB[i].id, serviceOrderId: order.id, startTime: new Date(), notes: `Garaj B İşlem ${i}` }
    });

    await prisma.message.create({
      data: { tenantId: tenantB.id, serviceOrderId: order.id, customerId: customersB[i].id, senderType: 'CUSTOMER', senderName: customersB[i].firstName!, content: `Aracımın durumu nedir? ${i}` }
    });

    if (statusesB[i] === ServiceOrderStatus.COMPLETED) {
      const invoice = await prisma.invoice.create({
        data: { tenantId: tenantB.id, type: InvoiceType.SALES, status: InvoiceStatus.PAID, customerId: customersB[i].id, serviceOrderId: order.id, subTotal: 800, taxAmount: 160, totalAmount: 960, paidAmount: 960 }
      });
      await prisma.payment.create({
        data: { tenantId: tenantB.id, customerId: customersB[i].id, invoiceId: invoice.id, serviceOrderId: order.id, amount: 960, paymentMethod: PaymentMethod.CASH, paymentType: PaymentType.INCOMING }
      });
      await prisma.serviceRating.create({
        data: { tenantId: tenantB.id, serviceOrderId: order.id, customerId: customersB[i].id, rating: 5 }
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    const po = await prisma.purchaseOrder.create({
      data: { tenantId: tenantB.id, poNumber: `PO-B-${i}`, supplierId: suppliersB[i].id, status: PurchaseOrderStatus.SENT }
    });
    await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: po.id, partId: allPartsB[i].id, quantity: 5, unitPrice: 120 }
    });
  }

  for (let i = 0; i < 3; i++) {
    const sc = await prisma.stockCount.create({
      data: { tenantId: tenantB.id, locationId: locationsB[0].id, status: StockCountStatus.DRAFT }
    });
    await prisma.stockCountItem.create({
      data: { stockCountId: sc.id, partId: allPartsB[i].id, systemQuantity: 15, actualQuantity: 15, difference: 0 }
    });
  }

  for (let i = 0; i < 3; i++) {
    const st = await prisma.stockTransfer.create({
      data: { tenantId: tenantB.id, fromLocationId: locationsB[0].id, toLocationId: locationsB[1].id, status: StockTransferStatus.COMPLETED, completedAt: new Date() }
    });
    await prisma.stockTransferItem.create({
      data: { stockTransferId: st.id, partId: allPartsB[i].id, quantity: 1 }
    });
  }

  const templateTypesB = ['SERVICE_STATUS', 'APPROVAL', 'REMINDER'];
  for (let i = 0; i < 3; i++) {
    const template = await prisma.notificationTemplate.create({
      data: { tenantId: tenantB.id, type: templateTypesB[i], channel: 'WHATSAPP', name: `Şablon B-${i}`, body: 'Sayın {{name}}, onayınızı bekliyoruz: {{link}}' }
    });
    await prisma.notification.create({
      data: { tenantId: tenantB.id, customerId: customersB[i].id, type: NotificationType.WHATSAPP, channel: 'WHATSAPP', recipient: customersB[i].phone, body: 'Onay linkiniz.', status: NotificationStatus.DELIVERED, notificationTemplateId: template.id }
    });
  }

  console.log('Seed başarıyla tamamlandı!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
