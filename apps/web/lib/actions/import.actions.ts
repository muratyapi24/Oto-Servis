"use server";

import { prisma } from "@repo/database";
import { guardTenantRole, guardTenant } from "@/lib/guards";
import { checkLimit } from "@/lib/subscription-guard";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Tip tanımları
// ---------------------------------------------------------------------------

export interface CustomerImportRow {
  ad: string;
  soyad?: string;
  telefon: string;
  eposta?: string;
  firma_adi?: string;
  tip?: string; // "BİREYSEL" | "KURUMSAL"
}

export interface VehicleImportRow {
  plaka: string;
  marka: string;
  model: string;
  yil?: string | number;
  musteri_telefon: string;
}

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// importCustomers — CSV/Excel'den toplu müşteri aktarımı
// ---------------------------------------------------------------------------
export async function importCustomers(rows: CustomerImportRow[]): Promise<ImportResult | { error: string }> {
  const g = await guardTenant();
  if ("error" in g) return g;
  const { tenantId } = g;

  const result: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      const phone = row.telefon?.replace(/\s/g, "");
      if (!phone) {
        result.errors.push(`Telefon eksik: ${row.ad ?? "?"}`);
        result.skipped++;
        continue;
      }

      // Limit kontrolü (her ekleme öncesi)
      const limitCheck = await checkLimit(tenantId, "maxCustomers");
      if (!limitCheck.allowed) {
        result.errors.push("Müşteri limitine ulaşıldı. İçe aktarma durduruldu.");
        break;
      }

      // Zaten var mı?
      const existing = await prisma.customer.findFirst({
        where: { tenantId, phone },
        select: { id: true },
      });

      if (existing) {
        result.skipped++;
        continue;
      }

      const isCorporate = row.tip?.toUpperCase().includes("KURUMSAL");

      await prisma.customer.create({
        data: {
          tenantId,
          type: isCorporate ? "CORPORATE" : "INDIVIDUAL",
          firstName: row.ad || undefined,
          lastName: row.soyad || undefined,
          companyName: isCorporate ? (row.firma_adi || row.ad) : undefined,
          phone,
          email: row.eposta || null,
        },
      });

      result.created++;
    } catch (err) {
      result.errors.push(`Satır hatası (${row.ad}): ${(err instanceof Error ? err.message : String(err)) ?? "bilinmeyen hata"}`);
      result.skipped++;
    }
  }

  revalidatePath("/dashboard/customers");
  return result;
}

// ---------------------------------------------------------------------------
// importVehicles — CSV/Excel'den toplu araç aktarımı
// ---------------------------------------------------------------------------
export async function importVehicles(rows: VehicleImportRow[]): Promise<ImportResult | { error: string }> {
  const g = await guardTenant();
  if ("error" in g) return g;
  const { tenantId } = g;

  const result: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      const plate = row.plaka?.replace(/\s/g, "").toUpperCase();
      if (!plate) {
        result.errors.push(`Plaka eksik: satır atlandı`);
        result.skipped++;
        continue;
      }

      // Araç limiti
      const limitCheck = await checkLimit(tenantId, "maxVehicles");
      if (!limitCheck.allowed) {
        result.errors.push("Araç limitine ulaşıldı. İçe aktarma durduruldu.");
        break;
      }

      // Zaten var mı?
      const existingVehicle = await prisma.vehicle.findFirst({
        where: { tenantId, plate },
        select: { id: true },
      });
      if (existingVehicle) {
        result.skipped++;
        continue;
      }

      // Müşteriyi telefondan bul
      const phone = row.musteri_telefon?.replace(/\s/g, "");
      let customerId: string | null = null;

      if (phone) {
        const customer = await prisma.customer.findFirst({
          where: { tenantId, phone },
          select: { id: true },
        });
        customerId = customer?.id ?? null;
      }

      if (!customerId) {
        result.errors.push(`Müşteri bulunamadı (${plate}): telefon ${phone ?? "?"} kayıtlı değil. Araç atlandı.`);
        result.skipped++;
        continue;
      }

      const year = row.yil ? parseInt(String(row.yil)) : null;

      await prisma.vehicle.create({
        data: {
          tenantId,
          customerId,
          plate,
          brand: row.marka,
          model: row.model,
          year: year && !isNaN(year) ? year : null,
        },
      });

      result.created++;
    } catch (err) {
      result.errors.push(`Satır hatası (${row.plaka}): ${(err instanceof Error ? err.message : String(err)) ?? "bilinmeyen hata"}`);
      result.skipped++;
    }
  }

  revalidatePath("/dashboard/vehicles");
  return result;
}
