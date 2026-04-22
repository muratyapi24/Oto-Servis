import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Super Admin additional data...");

  // Update existing SUPER_ADMIN users to have hasTwoFactor and isActive
  await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN" },
    data: {
      hasTwoFactor: true,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  console.log("Updated SUPER_ADMIN users.");

  // Clean up existing logs/notifications to prevent duplicate clutter if ran multiple times
  await prisma.auditLog.deleteMany();
  await prisma.systemNotification.deleteMany();
  await prisma.systemSetting.deleteMany();

  // Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { level: "INFO", module: "API-GATEWAY", message: "Incoming request GET /api/v1/tenants/042 [Client: 192.168.1.1]", traceId: "tr-8821-ab90" },
      { level: "WARN", module: "AUTH-SERVICE", message: "Slow authentication response (840ms) for user id: 9812", traceId: "tr-8821-ca12" },
      { level: "ERROR", module: "BILLING-ENGINE", message: "Database connection timeout while processing invoice #INV-2026-012", traceId: "tr-8820-fa44" },
      { level: "INFO", module: "DATA-SYNC", message: "Background synchronization worker [node-4] started. Batch: 4,000 records.", traceId: "tr-8819-ef01" },
      { level: "INFO", module: "UI-SERVER", message: "Dashboard static assets served from cache (CDN-Edge-Istanbul).", traceId: "tr-8818-bc12" },
      { level: "ERROR", module: "SECURITY-VAL", message: "Multiple failed login attempts from IP 45.12.3.x. Initiating temporary block.", traceId: "tr-8817-dd81" },
    ]
  });

  console.log("Created Audit Logs.");

  // Create System Notifications
  await prisma.systemNotification.createMany({
    data: [
      { category: "SECURITY", severity: "CRITICAL", title: "Multiple Failed Logins", message: "35 failed login attempts detected on root account from IP: 45.122.9.11", isRead: false },
      { category: "BILLING", severity: "WARNING", title: "API Quota Warning", message: "Tenant 'İstanbul Oto Servisi' is nearing their monthly AI analysis limit (92%).", isRead: false },
      { category: "SYSTEM", severity: "INFO", title: "Database Backup Completed", message: "Automated daily snapshot created successfully across all regions.", isRead: true },
    ]
  });

  console.log("Created System Notifications.");

  // Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: "autoScaling", value: { enabled: true } },
      { key: "multiAZ", value: { enabled: false } },
      { key: "shadowDBSync", value: { enabled: true } },
      { key: "twoFactorAuth", value: { requiredForSuperAdmin: true } },
      { key: "sessionTimeout", value: { minutes: 15 } },
      { key: "smtpGateway", value: { host: "relay.bstservis.com", port: 587, protocol: "STARTTLS" } },
    ]
  });

  console.log("Created System Settings.");

  console.log("Super Admin seed finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
