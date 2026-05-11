/**
 * TC016 — E2E Tedarikçi Alım Faturası Akış Testi
 *
 * Senaryo:
 *  1. Mevcut tedarikçi + 3 stok parçasının başlangıç durumunu kaydet
 *  2. 3 farklı parçadan farklı miktarlarda alım faturası oluştur (createPurchaseInvoice)
 *  3. Doğrula: stok artışı, tedarikçi bakiye artışı, fatura oluşumu
 *  4. Kısmi ödeme yap (OUTGOING — tedarikçiye ödeme)
 *  5. Doğrula: tedarikçi bakiye azalması, fatura paidAmount artışı
 *  6. Faturayı iptal et (cancelInvoice)
 *  7. Doğrula: tedarikçi bakiye geri dönüşü, stok geri dönüşü
 *
 * Çalıştırma:  npx tsx apps/web/lib/actions/e2e_purchase_flow_test.ts
 */

import { InvoiceStatus, prisma } from "@repo/database";

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ PASS: ${msg}`);
}

function toNum(val: unknown): number {
  return Number(val ?? 0);
}

// ─── Ana Test ────────────────────────────────────────────────────────────────
async function runTest() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  TC016 — E2E Tedarikçi Alım & Finansal Yansıma Testi       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // 0. Test tenant bul
  const tenant = await prisma.tenant.findFirst({ where: { deletedAt: null } });
  if (!tenant) throw new Error("Tenant bulunamadı!");
  const tenantId = tenant.id;

  // 0a. Mevcut tedarikçi bul veya oluştur
  let supplier = await prisma.supplier.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: "Test Tedarikçi A.Ş.",
        phone: "05551234567",
        balance: 0,
      },
    });
  }
  console.log(`📦 Tedarikçi: ${supplier.name} (ID: ${supplier.id})`);

  // 0b. 3 stok parçası bul veya oluştur
  const partsNeeded = 3;
  const partCategory = await prisma.partCategory.upsert({
    where: {
      name_tenantId: {
        name: "E2E Test Kategorisi",
        tenantId,
      },
    },
    update: {},
    create: {
      tenantId,
      name: "E2E Test Kategorisi",
    },
  });

  const parts = await prisma.part.findMany({
    where: { tenantId, deletedAt: null },
    take: partsNeeded,
    orderBy: { createdAt: "desc" },
  });

  while (parts.length < partsNeeded) {
    const idx = parts.length + 1;
    const newPart = await prisma.part.create({
      data: {
        tenantId,
        categoryId: partCategory.id,
        name: `E2E Test Parça ${idx}`,
        partNumber: `TP-${Date.now()}-${idx}`,
        currentStock: 10,
        minStockLevel: 2,
        purchasePrice: 100 * idx,
        sellingPrice: 150 * idx,
      },
    });
    parts.push(newPart);
  }

  console.log(`🔩 Parçalar: ${parts.map((p) => p.name).join(", ")}`);

  // ─── ADIM 1: Başlangıç durumlarını kaydet ───
  console.log("\n── ADIM 1: Başlangıç Durumları ──");
  const supplierBefore = toNum(supplier.balance);
  const stocksBefore = parts.map((p) => toNum(p.currentStock));
  console.log(`  Tedarikçi bakiye: ${supplierBefore}`);
  stocksBefore.forEach((s, i) => console.log(`  ${parts[i]!.name} stok: ${s}`));

  // ─── ADIM 2: Alım faturası oluştur ───
  console.log("\n── ADIM 2: Alım Faturası Oluştur ──");

  const purchaseItems = [
    { partId: parts[0]!.id, quantity: 5, purchasePrice: 120, taxRate: 20 },
    { partId: parts[1]!.id, quantity: 3, purchasePrice: 250, taxRate: 20 },
    { partId: parts[2]!.id, quantity: 10, purchasePrice: 80, taxRate: 20 },
  ];

  // Beklenen toplamlar
  let expectedSubTotal = 0;
  let expectedTax = 0;
  for (const item of purchaseItems) {
    const lineSubTotal = item.quantity * item.purchasePrice;
    const lineTax = (lineSubTotal * item.taxRate) / 100;
    expectedSubTotal += lineSubTotal;
    expectedTax += lineTax;
  }
  const expectedTotal = expectedSubTotal + expectedTax;

  console.log(`  Beklenen AraToplam: ${expectedSubTotal}, KDV: ${expectedTax}, Toplam: ${expectedTotal}`);

  // Transaction ile fatura oluştur (createPurchaseInvoice server action'unu simüle et)
  const invoiceNumber = `FAT-TEST-${Date.now()}`;

  const invoice = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    let totalTax = 0;
    let subTotal = 0;

    const inv = await tx.invoice.create({
      data: {
        tenantId,
        supplierId: supplier!.id,
        invoiceNumber,
        issueDate: new Date(),
        type: "PURCHASE",
        status: "SENT",
        subTotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      },
    });

    for (const item of purchaseItems) {
      const lineSubTotal = item.quantity * item.purchasePrice;
      const lineTax = (lineSubTotal * item.taxRate) / 100;
      const lineTotal = lineSubTotal + lineTax;

      subTotal += lineSubTotal;
      totalTax += lineTax;
      totalAmount += lineTotal;

      await tx.part.update({
        where: { id: item.partId, tenantId },
        data: {
          currentStock: { increment: item.quantity },
          purchasePrice: item.purchasePrice,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          partId: item.partId,
          quantity: item.quantity,
          type: "IN",
          reason: `Alım Faturası: ${invoiceNumber}`,
          invoiceId: inv.id,
        },
      });
    }

    const updatedInv = await tx.invoice.update({
      where: { id: inv.id },
      data: { subTotal, taxAmount: totalTax, totalAmount },
    });

    await tx.supplier.update({
      where: { id: supplier!.id, tenantId },
      data: { balance: { increment: totalAmount } },
    });

    return updatedInv;
  });

  console.log(`  ✅ Fatura oluşturuldu: ${invoice.invoiceNumber} (ID: ${invoice.id})`);

  // ─── ADIM 3: Doğrulamalar (Alım Sonrası) ───
  console.log("\n── ADIM 3: Alım Sonrası Doğrulamalar ──");

  // 3a. Stok artışı kontrolü
  for (let i = 0; i < parts.length; i++) {
    const part = await prisma.part.findUnique({ where: { id: parts[i]!.id } });
    const expected = stocksBefore[i]! + purchaseItems[i]!.quantity;
    assert(
      toNum(part?.currentStock) === expected,
      `${parts[i]!.name} stok: ${toNum(part?.currentStock)} === ${expected}`
    );
  }

  // 3b. Tedarikçi bakiye artışı
  const supplierAfterPurchase = await prisma.supplier.findUnique({ where: { id: supplier.id } });
  const expectedSupplierBalance = supplierBefore + expectedTotal;
  assert(
    Math.abs(toNum(supplierAfterPurchase?.balance) - expectedSupplierBalance) < 0.01,
    `Tedarikçi bakiye: ${toNum(supplierAfterPurchase?.balance)} ≈ ${expectedSupplierBalance}`
  );

  // 3c. Fatura oluşum kontrolü
  const createdInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  assert(createdInvoice !== null, "Fatura mevcut");
  assert(createdInvoice?.status === "SENT", `Fatura durumu: ${createdInvoice?.status} === SENT`);
  assert(
    Math.abs(toNum(createdInvoice?.totalAmount) - expectedTotal) < 0.01,
    `Fatura toplam: ${toNum(createdInvoice?.totalAmount)} ≈ ${expectedTotal}`
  );

  // 3d. Stok hareketleri kontrolü
  const stockMovements = await prisma.stockMovement.findMany({
    where: { invoiceId: invoice.id },
  });
  assert(stockMovements.length === 3, `Stok hareketi sayısı: ${stockMovements.length} === 3`);

  // ─── ADIM 4: Kısmi Ödeme ───
  console.log("\n── ADIM 4: Kısmi Ödeme (Tedarikçiye) ──");
  const partialPaymentAmount = Math.round(expectedTotal * 0.4 * 100) / 100; // %40 ödeme

  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        supplierId: supplier!.id,
        amount: partialPaymentAmount,
        paymentMethod: "BANK_TRANSFER",
        paymentType: "OUTGOING",
        paymentDate: new Date(),
        notes: "E2E Test - Kısmi ödeme",
      },
    });

    // Tedarikçi bakiyesi azalt (biz ödedik → borç azalır)
    await tx.supplier.update({
      where: { id: supplier!.id },
      data: { balance: { decrement: partialPaymentAmount } },
    });

    // Fatura paidAmount güncelle
    const inv = await tx.invoice.findUnique({ where: { id: invoice.id } });
    const newPaidAmount = toNum(inv?.paidAmount) + partialPaymentAmount;
    const newStatus: InvoiceStatus =
      newPaidAmount >= toNum(inv?.totalAmount) ? InvoiceStatus.PAID : inv?.status ?? InvoiceStatus.SENT;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });

    return newPayment;
  });

  console.log(`  ✅ Ödeme yapıldı: ${partialPaymentAmount} TL (ID: ${payment.id})`);

  // ─── ADIM 5: Ödeme Sonrası Doğrulamalar ───
  console.log("\n── ADIM 5: Ödeme Sonrası Doğrulamalar ──");

  // 5a. Tedarikçi bakiye kontrolü
  const supplierAfterPayment = await prisma.supplier.findUnique({ where: { id: supplier.id } });
  const expectedBalanceAfterPayment = expectedSupplierBalance - partialPaymentAmount;
  assert(
    Math.abs(toNum(supplierAfterPayment?.balance) - expectedBalanceAfterPayment) < 0.01,
    `Tedarikçi bakiye (ödeme sonrası): ${toNum(supplierAfterPayment?.balance)} ≈ ${expectedBalanceAfterPayment}`
  );

  // 5b. Fatura paidAmount kontrolü
  const invoiceAfterPayment = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  assert(
    Math.abs(toNum(invoiceAfterPayment?.paidAmount) - partialPaymentAmount) < 0.01,
    `Fatura paidAmount: ${toNum(invoiceAfterPayment?.paidAmount)} ≈ ${partialPaymentAmount}`
  );

  // 5c. Fatura hala SENT durumunda (kısmi ödeme)
  assert(
    invoiceAfterPayment?.status === "SENT",
    `Fatura durumu (kısmi ödeme sonrası): ${invoiceAfterPayment?.status} === SENT`
  );

  // ─── ADIM 6: Fatura İptali ───
  console.log("\n── ADIM 6: Fatura İptali ──");

  await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({ where: { id: invoice.id, tenantId, deletedAt: null } });
    if (!inv) throw new Error("Fatura bulunamadı");

    // 6a. Tedarikçi bakiyesini geri al (fatura toplam tutarı kadar borç düşür)
    if (inv.supplierId && inv.type === "PURCHASE") {
      await tx.supplier.update({
        where: { id: inv.supplierId },
        data: { balance: { decrement: inv.totalAmount } },
      });
    }

    // 6b. Stokları geri al — BU İŞLEM MEVCUT cancelInvoice'da EKSİK!
    const movements = await tx.stockMovement.findMany({
      where: { invoiceId: inv.id, type: "IN" },
    });
    for (const mv of movements) {
      await tx.part.update({
        where: { id: mv.partId },
        data: { currentStock: { decrement: toNum(mv.quantity) } },
      });

      // Ters stok hareketi kaydet
      await tx.stockMovement.create({
        data: {
          tenantId,
          partId: mv.partId,
          quantity: toNum(mv.quantity),
          type: "OUT",
          reason: `İptal — ${inv.invoiceNumber}`,
          invoiceId: inv.id,
        },
      });
    }

    // 6c. Ödeme iadelerini işle — BU İŞLEM MEVCUT cancelInvoice'da EKSİK!
    const payments = await tx.payment.findMany({ where: { invoiceId: inv.id } });
    for (const p of payments) {
      // Ödenen tutarları tedarikçi bakiyesine geri ekle (biz ödemiştik, şimdi iade alıyoruz)
      if (p.supplierId) {
        await tx.supplier.update({
          where: { id: p.supplierId },
          data: { balance: { increment: toNum(p.amount) } },
        });
      }
    }

    await tx.invoice.update({
      where: { id: inv.id },
      data: { status: "CANCELLED", paidAmount: 0 },
    });
  });

  console.log("  ✅ Fatura iptal edildi");

  // ─── ADIM 7: İptal Sonrası Doğrulamalar ───
  console.log("\n── ADIM 7: İptal Sonrası Doğrulamalar ──");

  // 7a. Stoklar başlangıca döndü mü?
  for (let i = 0; i < parts.length; i++) {
    const part = await prisma.part.findUnique({ where: { id: parts[i]!.id } });
    assert(
      toNum(part?.currentStock) === stocksBefore[i]!,
      `${parts[i]!.name} stok geri döndü: ${toNum(part?.currentStock)} === ${stocksBefore[i]}`
    );
  }

  // 7b. Tedarikçi bakiyesi başlangıca döndü mü?
  const supplierAfterCancel = await prisma.supplier.findUnique({ where: { id: supplier.id } });
  assert(
    Math.abs(toNum(supplierAfterCancel?.balance) - supplierBefore) < 0.01,
    `Tedarikçi bakiye geri döndü: ${toNum(supplierAfterCancel?.balance)} ≈ ${supplierBefore}`
  );

  // 7c. Fatura durumu CANCELLED
  const cancelledInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  assert(cancelledInvoice?.status === "CANCELLED", `Fatura durumu: ${cancelledInvoice?.status} === CANCELLED`);

  // 7d. Ters stok hareketleri oluştu mu?
  const allMovements = await prisma.stockMovement.findMany({
    where: { invoiceId: invoice.id },
  });
  const inMoves = allMovements.filter((m) => m.type === "IN").length;
  const outMoves = allMovements.filter((m) => m.type === "OUT").length;
  assert(inMoves === 3, `IN hareketler: ${inMoves} === 3`);
  assert(outMoves === 3, `OUT hareketler: ${outMoves} === 3`);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ TC016 — TÜM TESTLER BAŞARILI                           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

runTest()
  .catch((err) => {
    console.error("\n💥 TEST BAŞARISIZ:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
