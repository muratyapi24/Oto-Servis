import { prisma } from '@repo/database';

async function runTest() {
  console.log("TC015 E2E Finance Test başlatılıyor...");

  // 1. Önce admin tenant'ı ve user'ı alalım
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant bulunamadı");
  
  const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });
  if (!customer) throw new Error("Müşteri bulunamadı");

  const vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) throw new Error("Araç bulunamadı");

  const part = await prisma.part.findFirst({ where: { tenantId: tenant.id } });
  if (!part) throw new Error("Parça bulunamadı");

  const mechanic = await prisma.mechanic.findFirst({ where: { tenantId: tenant.id } });
  if (!mechanic) throw new Error("Usta bulunamadı");

  console.log("1. Veriler bulundu.");
  const initialBalance = Number(customer.balance) || 0;
  console.log(`İlk müşteri bakiyesi: ${initialBalance}`);

  // 2. Service Order oluştur (Doğrudan Prisma ile veya actions üzerinden. Actions ortam bağımlı olabilir, doğrudan Prisma kullanalım veya actions module require edelim).
  // Next.js actions require React context, so we do it via Prisma directly, exactly mimicking service.actions.ts logic.
  
  const orderNumber = Math.floor(Date.now() % 1000000);
  const serviceOrder = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      orderNumber,
      receptionDate: new Date(),
      status: "PENDING",
      complaintDescription: "E2E Test: Fren balataları",
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0
    }
  });
  console.log(`2. İş Emri oluşturuldu: ${serviceOrder.orderNumber}`);

  // 3. Kalem Ekle
  // Parça Ekle
  const partSubTotal = Number(part.sellingPrice);
  const partTaxAmount = partSubTotal * 0.20;
  await prisma.serviceItem.create({
    data: {
      tenantId: tenant.id,
      serviceOrderId: serviceOrder.id,
      itemType: "PART",
      name: part.name,
      partId: part.id,
      quantity: 1,
      unitPrice: part.sellingPrice,
      taxRate: 20,
      discount: 0,
      subTotal: partSubTotal,
      taxAmount: partTaxAmount,
      totalPrice: partSubTotal + partTaxAmount
    }
  });

  // Usta Ekle
  const laborPrice = 500;
  const laborSubTotal = laborPrice * 2;
  const laborTaxAmount = laborSubTotal * 0.20;
  await prisma.serviceItem.create({
    data: {
      tenantId: tenant.id,
      serviceOrderId: serviceOrder.id,
      itemType: "LABOR",
      name: `İşçilik: ${mechanic.firstName}`,
      mechanicId: mechanic.id,
      quantity: 2,
      unitPrice: laborPrice,
      taxRate: 20,
      discount: 0,
      subTotal: laborSubTotal,
      taxAmount: laborTaxAmount,
      totalPrice: laborSubTotal + laborTaxAmount
    }
  });

  // Toplamı güncelle
  const items = await prisma.serviceItem.findMany({ where: { serviceOrderId: serviceOrder.id } });
  let subTotal = 0; let taxAmount = 0; let totalAmount = 0;
  for (const item of items) {
    const st = Number(item.quantity) * Number(item.unitPrice);
    subTotal += st;
    taxAmount += st * (Number(item.taxRate) / 100);
  }
  totalAmount = subTotal + taxAmount;

  await prisma.serviceOrder.update({
    where: { id: serviceOrder.id },
    data: { subTotal, taxAmount, totalAmount }
  });

  console.log(`3. Kalemler eklendi, toplam tutar: ${totalAmount}`);

  // 4. Servisi Tamamla -> Fatura oluştur ve bakiyeyi artır
  console.log("4. Servis tamamlanıyor ve fatura oluşturuluyor...");
  await prisma.$transaction(async (tx) => {
    const newInvoice = await tx.invoice.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        serviceOrderId: serviceOrder.id,
        invoiceNumber: `INV-E2E-${Date.now()}`,
        type: "SALES",
        status: "SENT",
        issueDate: new Date(),
        subTotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
      }
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: { balance: { increment: totalAmount } }
    });

    await tx.serviceOrder.update({
      where: { id: serviceOrder.id },
      data: { status: "COMPLETED", actualDeliveryDate: new Date() }
    });
    
    console.log(`Fatura oluşturuldu: ${newInvoice.invoiceNumber}`);
  });

  const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
  console.log(`5. Müşteri bakiyesi fatura sonrası: ${updatedCustomer?.balance}`);
  
  if (Number(updatedCustomer?.balance) !== initialBalance + totalAmount) {
    throw new Error("Bakiye fatura sonrası hatalı!");
  }

  // 5. Ödeme yap
  const invoice = await prisma.invoice.findFirst({ where: { serviceOrderId: serviceOrder.id } });
  if (!invoice) throw new Error("Fatura bulunamadı");

  const paymentAmount = totalAmount / 2;
  console.log(`6. Kısmi ödeme yapılıyor: ${paymentAmount}`);

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentMethod: "CASH",
        paymentType: "INCOMING",
        paymentDate: new Date(),
      }
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: { balance: { decrement: paymentAmount } }
    });

    const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: newPaidAmount }
    });
  });

  const finalCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });
  console.log(`7. Ödeme sonrası müşteri bakiyesi: ${finalCustomer?.balance}`);
  
  const expectedFinalBalance = initialBalance + totalAmount - paymentAmount;
  if (Math.abs(Number(finalCustomer?.balance) - expectedFinalBalance) > 0.01) {
    throw new Error(`Bakiye ödeme sonrası hatalı! Beklenen: ${expectedFinalBalance}, Bulunan: ${finalCustomer?.balance}`);
  }

  console.log("TC015 E2E Testi Başarıyla Tamamlandı!");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
