import { inngest } from "@/lib/inngest/client";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Demo Kiracısı Günlük Sıfırlama
// Her gün 03:00 UTC'de çalışır.
// DEMO_TENANT_SLUG env değişkeni zorunlu; yoksa çalışmaz.
// ---------------------------------------------------------------------------

export const demoResetFunction = inngest.createFunction(
  {
    id: "demo-reset-daily",
    name: "Demo Kiracısı Günlük Sıfırlama",
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }: { step: any }) => {
    const slug = process.env.DEMO_TENANT_SLUG;
    if (!slug) {
      console.info("[demo-reset] DEMO_TENANT_SLUG tanımlı değil — atlandı.");
      return { skipped: true };
    }

    const tenant = await step.run("find-demo-tenant", async () => {
      return prisma.tenant.findUnique({ where: { slug } });
    });

    if (!tenant) {
      console.warn(`[demo-reset] Demo kiracısı bulunamadı: ${slug}`);
      return { skipped: true };
    }

    const tenantId = tenant.id;

    // 1) Günlük üretilen verileri temizle
    await step.run("clear-service-orders", async () => {
      await prisma.serviceOrder.deleteMany({ where: { tenantId } });
    });

    await step.run("clear-invoices", async () => {
      await prisma.invoice.deleteMany({ where: { tenantId } });
    });

    await step.run("clear-payments", async () => {
      await prisma.payment.deleteMany({ where: { tenantId } });
    });

    await step.run("clear-appointments", async () => {
      await prisma.appointment.deleteMany({ where: { tenantId } });
    });

    await step.run("clear-stock-movements", async () => {
      await prisma.stockMovement.deleteMany({ where: { tenantId } });
    });

    // 2) Stok miktarlarını başlangıç değerlerine sıfırla
    await step.run("reset-stock-quantities", async () => {
      await prisma.part.updateMany({
        where: { tenantId },
        data: { currentStock: 50 },
      });
    });

    // 3) Müşteri bakiyelerini sıfırla
    await step.run("reset-customer-balances", async () => {
      await prisma.customer.updateMany({
        where: { tenantId },
        data: { balance: 0 },
      });
    });

    // 4) Demo admin şifresini sıfırla
    await step.run("reset-demo-password", async () => {
      const demoPassword = process.env.DEMO_PASSWORD ?? "Demo1234!";
      const hashed = await bcrypt.hash(demoPassword, 10);
      await prisma.user.updateMany({
        where: { tenantId, role: "TENANT_ADMIN" },
        data: { password: hashed },
      });
    });

    return { tenantId, reset: true, at: new Date().toISOString() };
  }
);
