/**
 * RBAC Negatif Testleri — Tenant İzolasyonu ve Rol Kısıtlamaları
 *
 * Bu testler şunları kanıtlar:
 * 1. MECHANIC rolü finans işlemleri yapamaz (createInvoice, recordPayment)
 * 2. RECEPTIONIST rolü sadece izin verilen işlemleri yapabilir
 * 3. guardTenantRole oturum olmadığında erişimi reddeder
 * 4. guardTenant tenant bilgisi olmadığında erişimi reddeder
 */

import { guardTenantRole, guardTenant } from "@/lib/guards";
import { canAccess } from "@/lib/permissions";

// auth() mock
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "@/auth";
const mockAuth = auth as jest.Mock;

// ---------------------------------------------------------------------------
// Helper: mock session oluşturur
// ---------------------------------------------------------------------------
function mockSession(role: string, tenantId?: string) {
  return {
    user: {
      id: "user-001",
      email: "test@example.com",
      name: "Test User",
      role,
      tenantId: tenantId ?? "tenant-001",
    },
  };
}

describe("RBAC: guardTenantRole", () => {
  beforeEach(() => {
    mockAuth.mockClear();
  });

  // -------------------------------------------------------------------------
  // Oturum yok
  // -------------------------------------------------------------------------
  it("oturum yoksa erişimi reddeder", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await guardTenantRole(["TENANT_ADMIN"]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/oturum/i);
    }
  });

  it("tenantId yoksa erişimi reddeder", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "MECHANIC", tenantId: undefined } });

    const result = await guardTenantRole(["MECHANIC"]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/oturum/i);
    }
  });

  // -------------------------------------------------------------------------
  // MECHANIC rolü kısıtlamaları
  // -------------------------------------------------------------------------
  it("MECHANIC fatura oluşturamaz (TENANT_ADMIN/ACCOUNTANT gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC"));

    const result = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/yetkisiz/i);
    }
  });

  it("MECHANIC tahsilat kaydedemez (TENANT_ADMIN/ACCOUNTANT gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC"));

    const result = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);

    expect("error" in result).toBe(true);
  });

  it("MECHANIC iş emrini silemez (TENANT_ADMIN gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC"));

    const result = await guardTenantRole(["TENANT_ADMIN"]);

    expect("error" in result).toBe(true);
  });

  it("MECHANIC lokasyon oluşturamaz (TENANT_ADMIN gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC"));

    const result = await guardTenantRole(["TENANT_ADMIN"]);

    expect("error" in result).toBe(true);
  });

  // -------------------------------------------------------------------------
  // RECEPTIONIST rolü kısıtlamaları
  // -------------------------------------------------------------------------
  it("RECEPTIONIST fatura oluşturamaz (TENANT_ADMIN/ACCOUNTANT gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("RECEPTIONIST"));

    const result = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);

    expect("error" in result).toBe(true);
  });

  it("RECEPTIONIST randevu oluşturabilir (izin var)", async () => {
    mockAuth.mockResolvedValue(mockSession("RECEPTIONIST"));

    const result = await guardTenantRole(["TENANT_ADMIN", "RECEPTIONIST"]);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.tenantId).toBe("tenant-001");
      expect(result.role).toBe("RECEPTIONIST");
    }
  });

  it("RECEPTIONIST iş emri durumunu güncelleyebilir (izin var)", async () => {
    mockAuth.mockResolvedValue(mockSession("RECEPTIONIST"));

    const result = await guardTenantRole(["TENANT_ADMIN", "MECHANIC", "RECEPTIONIST"]);

    expect("error" in result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // ACCOUNTANT rolü kısıtlamaları
  // -------------------------------------------------------------------------
  it("ACCOUNTANT servis emrini silemez (TENANT_ADMIN gerekli)", async () => {
    mockAuth.mockResolvedValue(mockSession("ACCOUNTANT"));

    const result = await guardTenantRole(["TENANT_ADMIN"]);

    expect("error" in result).toBe(true);
  });

  it("ACCOUNTANT fatura görüntüleyebilir (izin var)", async () => {
    mockAuth.mockResolvedValue(mockSession("ACCOUNTANT"));

    const result = await guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.role).toBe("ACCOUNTANT");
    }
  });

  // -------------------------------------------------------------------------
  // TENANT_ADMIN tam erişim
  // -------------------------------------------------------------------------
  it("TENANT_ADMIN tüm işlemleri yapabilir", async () => {
    mockAuth.mockResolvedValue(mockSession("TENANT_ADMIN"));

    const [r1, r2, r3] = await Promise.all([
      guardTenantRole(["TENANT_ADMIN", "ACCOUNTANT"]),
      guardTenantRole(["TENANT_ADMIN"]),
      guardTenantRole(["TENANT_ADMIN", "MECHANIC", "RECEPTIONIST"]),
    ]);

    expect("error" in r1).toBe(false);
    expect("error" in r2).toBe(false);
    expect("error" in r3).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Rol bilgisi döndürülüyor
  // -------------------------------------------------------------------------
  it("başarılı guard tenantId ve role döndürür", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC", "tenant-xyz"));

    const result = await guardTenantRole(["MECHANIC"]);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.tenantId).toBe("tenant-xyz");
      expect(result.role).toBe("MECHANIC");
    }
  });

  // -------------------------------------------------------------------------
  // Boş rol listesi — herhangi bir tenant kullanıcısı geçer
  // -------------------------------------------------------------------------
  it("boş rol listesi tenant sahibi herkese izin verir", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC"));

    const result = await guardTenantRole([]);

    expect("error" in result).toBe(false);
  });
});

describe("RBAC: guardTenant", () => {
  beforeEach(() => {
    mockAuth.mockClear();
  });

  it("oturum yoksa erişimi reddeder", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await guardTenant();

    expect("error" in result).toBe(true);
  });

  it("tenantId yoksa erişimi reddeder (müşteri rolü farklı portal)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "CUSTOMER", tenantId: undefined } });

    const result = await guardTenant();

    expect("error" in result).toBe(true);
  });

  it("geçerli oturumda tenantId döndürür", async () => {
    mockAuth.mockResolvedValue(mockSession("MECHANIC", "tenant-abc"));

    const result = await guardTenant();

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.tenantId).toBe("tenant-abc");
    }
  });
});

describe("Tenant İzolasyonu: assertTenantIsolation", () => {
  it("farklı tenant kaydına erişim engellenir", async () => {
    const { assertTenantIsolation } = await import("@/lib/guards");

    await expect(assertTenantIsolation("tenant-A", "tenant-B")).rejects.toThrow(/farklı tenant/i);
  });

  it("aynı tenant kaydına erişim izin verilir", async () => {
    const { assertTenantIsolation } = await import("@/lib/guards");

    await expect(assertTenantIsolation("tenant-A", "tenant-A")).resolves.toBeUndefined();
  });

  it("null tenantId cross-tenant erişim engellenir", async () => {
    const { assertTenantIsolation } = await import("@/lib/guards");

    await expect(assertTenantIsolation(null, "tenant-A")).rejects.toThrow();
  });
});

describe("RBAC: route permission matrix", () => {
  it("izin verilen dashboard alt rotalarına erişim sağlar", () => {
    expect(canAccess("TENANT_ADMIN", "/dashboard/services/service-001")).toBe(true);
    expect(canAccess("RECEPTIONIST", "/dashboard/appointments/calendar")).toBe(true);
    expect(canAccess("ACCOUNTANT", "/dashboard/finances/invoices/inv-001")).toBe(true);
    expect(canAccess("ACCOUNTANT", "/dashboard/finance/invoices/inv-001")).toBe(true);
  });

  it("izin verilmeyen dashboard alt rotalarını reddeder", () => {
    expect(canAccess("MECHANIC", "/dashboard/finances/payments")).toBe(false);
    expect(canAccess("ACCOUNTANT", "/dashboard/services/service-001")).toBe(false);
    expect(canAccess("CUSTOMER", "/dashboard/services")).toBe(false);
  });
});
