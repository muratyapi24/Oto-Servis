import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Abonelik Paketleri ve Karşılaştırma Özellikleri yükleniyor...');

  // ─────────────────────────────────────────────────
  // 1. Subscription Plans (Upsert)
  // ─────────────────────────────────────────────────
  const plans = [
    {
      name: 'Starter',
      slug: 'starter-plan',
      description: 'Butik servisler ve yeni başlayan işletmeler için.',
      priceMonthly: 499,
      priceYearly: 4990,
      trialDays: 14,
      features: {
        eInvoice: false,
        whatsapp: false,
        bulkNotifications: false,
        advancedReporting: false,
        multiLocation: false,
        parasutIntegration: false,
        apiAccess: false,
        prioritySupport: false,
      },
      limits: {
        maxUsers: 1,
        maxMechanics: 2,
        maxVehicles: 500,
        maxCustomers: 200,
        maxLocations: 1,
        maxSmsPerMonth: 50,
        maxWhatsappPerMonth: 0,
        maxStorageMB: 100,
      },
      sortOrder: 1,
    },
    {
      name: 'Professional',
      slug: 'professional-plan',
      description: 'Büyüyen ve profesyonel hizmet veren servisler için.',
      priceMonthly: 999,
      priceYearly: 9990,
      trialDays: 14,
      features: {
        eInvoice: true,
        whatsapp: true,
        bulkNotifications: true,
        advancedReporting: true,
        multiLocation: false,
        parasutIntegration: false,
        apiAccess: false,
        prioritySupport: true,
      },
      limits: {
        maxUsers: 5,
        maxMechanics: 10,
        maxVehicles: 5000,
        maxCustomers: 2000,
        maxLocations: 1,
        maxSmsPerMonth: 500,
        maxWhatsappPerMonth: 200,
        maxStorageMB: 2048,
      },
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise-plan',
      description: 'Çok şubeli ve tam entegre sistem isteyen büyük işletmeler için.',
      priceMonthly: 1999,
      priceYearly: 19990,
      trialDays: 30,
      features: {
        eInvoice: true,
        whatsapp: true,
        bulkNotifications: true,
        advancedReporting: true,
        multiLocation: true,
        parasutIntegration: true,
        apiAccess: true,
        prioritySupport: true,
      },
      limits: {
        maxUsers: -1,        // sınırsız
        maxMechanics: -1,
        maxVehicles: -1,
        maxCustomers: -1,
        maxLocations: -1,
        maxSmsPerMonth: -1,
        maxWhatsappPerMonth: -1,
        maxStorageMB: -1,
      },
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    const result = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        trialDays: plan.trialDays,
        features: plan.features,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        trialDays: plan.trialDays,
        features: plan.features,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
      },
    });
    console.log(`  ✅ ${result.name} (${result.slug}): ₺${result.priceMonthly}/ay`);
  }

  // Eski slug'lara sahip planları deaktif et
  const oldSlugs = ['standart-plan', 'pro-plan', 'ent-plan'];
  for (const slug of oldSlugs) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { slug } });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { slug },
        data: { isActive: false },
      });
      console.log(`  ⚠️ Eski plan deaktif edildi: ${existing.name} (${slug})`);
    }
  }

  // ─────────────────────────────────────────────────
  // 2. Plan Features (Karşılaştırma Tablosu)
  // ─────────────────────────────────────────────────
  console.log('\n🔄 Karşılaştırma tablosu özellikleri yükleniyor...');

  // Önce mevcut PlanFeature'ları temizle (idempotent)
  await prisma.planFeature.deleteMany({});

  const features = [
    // ── Kullanıcı & Erişim ──
    { category: 'Kullanıcı & Erişim', featureName: 'Kullanıcı Sayısı', starterValue: '1 Kullanıcı', professionalValue: '5 Kullanıcı', enterpriseValue: 'Sınırsız', sortOrder: 10 },
    { category: 'Kullanıcı & Erişim', featureName: 'Yetkilendirme', starterValue: 'remove', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 20 },
    { category: 'Kullanıcı & Erişim', featureName: 'Mobil Uygulama Erişimi', starterValue: 'close', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 30 },
    { category: 'Kullanıcı & Erişim', featureName: 'Çoklu Şube Yönetimi', starterValue: 'close', professionalValue: 'close', enterpriseValue: 'check', sortOrder: 40 },

    // ── Müşteri & Servis ──
    { category: 'Müşteri & Servis', featureName: 'Müşteri Veritabanı', starterValue: 'Sınırsız', professionalValue: 'Sınırsız', enterpriseValue: 'Sınırsız', sortOrder: 50 },
    { category: 'Müşteri & Servis', featureName: 'Dijital İş Emri', starterValue: 'check', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 60 },
    { category: 'Müşteri & Servis', featureName: 'Gelişmiş Servis & İş Emri', starterValue: 'close', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 70 },
    { category: 'Müşteri & Servis', featureName: 'Fotoğraf & Video Ekleme', starterValue: '10MB Sınır', professionalValue: 'Sınırsız', enterpriseValue: 'Sınırsız', sortOrder: 80 },
    { category: 'Müşteri & Servis', featureName: 'Stok & Envanter Takibi', starterValue: 'close', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 90 },
    { category: 'Müşteri & Servis', featureName: 'SMS Bildirimleri', starterValue: 'close', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 100 },

    // ── Finans & Raporlama ──
    { category: 'Finans & Raporlama', featureName: 'Temel Raporlar', starterValue: 'check', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 110 },
    { category: 'Finans & Raporlama', featureName: 'e-Fatura Entegrasyonu', starterValue: 'close', professionalValue: 'Opsiyonel', enterpriseValue: 'Dahil', sortOrder: 120 },
    { category: 'Finans & Raporlama', featureName: 'Gelişmiş BI Paneli', starterValue: 'close', professionalValue: 'close', enterpriseValue: 'check', sortOrder: 130 },
    { category: 'Finans & Raporlama', featureName: 'Muhasebe Entegrasyonu', starterValue: 'close', professionalValue: 'close', enterpriseValue: 'check', sortOrder: 140 },

    // ── Destek ──
    { category: 'Destek', featureName: 'E-posta Desteği', starterValue: 'check', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 150 },
    { category: 'Destek', featureName: 'Öncelikli Destek', starterValue: 'close', professionalValue: 'check', enterpriseValue: 'check', sortOrder: 160 },
    { category: 'Destek', featureName: '7/24 Özel Danışman', starterValue: 'close', professionalValue: 'close', enterpriseValue: 'check', sortOrder: 170 },
  ];

  await prisma.planFeature.createMany({ data: features });
  console.log(`  ✅ ${features.length} özellik eklendi.`);

  console.log('\n🎉 Tüm veriler başarıyla yüklendi!');
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
