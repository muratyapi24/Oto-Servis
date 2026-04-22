import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Aktif planları getir
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        trialDays: true,
        features: true,
        limits: true,
        sortOrder: true,
      },
    });

    // Karşılaştırma tablosu özelliklerini getir
    const features = await prisma.planFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        category: true,
        featureName: true,
        starterValue: true,
        professionalValue: true,
        enterpriseValue: true,
        sortOrder: true,
      },
    });

    // Özellikleri kategorilere göre grupla
    const groupedFeatures: Record<string, typeof features> = {};
    for (const feature of features) {
      if (!groupedFeatures[feature.category]) {
        groupedFeatures[feature.category] = [];
      }
      groupedFeatures[feature.category]!.push(feature);
    }

    return NextResponse.json({
      plans,
      features: groupedFeatures,
    });
  } catch (error) {
    console.error('Pricing API Error:', error);
    return NextResponse.json(
      { error: 'Fiyatlandırma verileri alınamadı.' },
      { status: 500 }
    );
  }
}
