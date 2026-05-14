import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_QUICK_LINKS,
  MOBILE_WEB_NAV_ITEMS,
  flattenDashboardNavGroups,
  isDashboardNavItemActive,
} from "@/lib/dashboard-navigation";
import { CUSTOMER_WORKSPACE_TABS } from "@/lib/customer-workspace";
import { FINANCE_WORKSPACE_TABS } from "@/lib/finance-workspace";
import { INVENTORY_WORKSPACE_TABS } from "@/lib/inventory-workspace";
import { NOTIFICATION_WORKSPACE_TABS } from "@/lib/notification-workspace";
import { filterNavItems, resolveNavItemHref } from "@/lib/permissions";
import { REPORT_WORKSPACE_TABS } from "@/lib/report-workspace";
import { SERVICE_WORKSPACE_TABS } from "@/lib/service-workspace";
import { SETTINGS_WORKSPACE_TABS } from "@/lib/settings-workspace";
import { TEAM_WORKSPACE_TABS } from "@/lib/team-workspace";

describe("dashboard navigation contract", () => {
  const visibleSidebarItems = flattenDashboardNavGroups(DASHBOARD_NAV_GROUPS);
  const visibleHrefs = visibleSidebarItems.map((item) => item.href);

  it("uses one visible finance entry instead of splitting finance across sidebar modules", () => {
    expect(visibleHrefs).toContain("/dashboard/finances");
    expect(visibleHrefs).not.toContain("/dashboard/finance/invoices");
    expect(visibleHrefs).not.toContain("/dashboard/finance/payments");
    expect(visibleHrefs).not.toContain("/dashboard/finances/invoices");
    expect(visibleHrefs).not.toContain("/dashboard/finances/payments");
    expect(visibleHrefs).not.toContain("/dashboard/finances/payments/checks");
    expect(visibleHrefs).not.toContain("/dashboard/finances/reports");
  });

  it("keeps secondary workflows out of the top-level sidebar", () => {
    expect(visibleHrefs).not.toContain("/dashboard/crm");
    expect(visibleHrefs).not.toContain("/dashboard/appointments");
    expect(visibleHrefs).not.toContain("/dashboard/quotes");
    expect(visibleHrefs).not.toContain("/dashboard/customers/maintenance");
    expect(visibleHrefs).not.toContain("/dashboard/customers/import");
    expect(visibleHrefs).not.toContain("/dashboard/vehicles");
    expect(visibleHrefs).not.toContain("/dashboard/staff");
    expect(visibleHrefs).not.toContain("/dashboard/analytics/mechanics");
    expect(visibleHrefs).not.toContain("/dashboard/locations");
    expect(visibleHrefs).not.toContain("/dashboard/suppliers");
    expect(visibleHrefs).not.toContain("/dashboard/inventory/purchases");
    expect(visibleHrefs).not.toContain("/dashboard/inventory/purchase-orders");
    expect(visibleHrefs).not.toContain("/dashboard/inventory/transfers");
    expect(visibleHrefs).not.toContain("/dashboard/inventory/stock-counts");
    expect(visibleHrefs).not.toContain("/dashboard/inventory/reports");
    expect(visibleHrefs).not.toContain("/dashboard/notifications/bulk");
    expect(visibleHrefs).not.toContain("/dashboard/notifications/templates");
    expect(visibleHrefs).not.toContain("/dashboard/settings/locations");
    expect(visibleHrefs).not.toContain("/dashboard/settings/notifications");
    expect(visibleHrefs).not.toContain("/dashboard/settings/billing");
    expect(visibleHrefs).not.toContain("/dashboard/settings/e-invoice");
    expect(visibleHrefs).not.toContain("/dashboard/settings/parasut");
    expect(visibleHrefs).not.toContain("/dashboard/settings/referral");
  });

  it("derives header quick links from visible dashboard destinations", () => {
    const quickLinkHrefs = DASHBOARD_QUICK_LINKS.map((item) => item.href);

    expect(quickLinkHrefs).toEqual([
      "/dashboard",
      "/dashboard/services",
      "/dashboard/customers",
      "/dashboard/finances",
    ]);

    for (const href of quickLinkHrefs) {
      expect(visibleHrefs).toContain(href);
    }
  });

  it("keeps mobile web navigation focused on daily field workflows", () => {
    const mobileHrefs = MOBILE_WEB_NAV_ITEMS.map((item) => item.href);

    expect(mobileHrefs).toEqual([
      "/m/firma/panel",
      "/m/firma/kuyruk",
      "/m/firma/araclar",
      "/m/firma/stok",
      "/m/firma/finans",
      "/m/firma/ayarlar",
    ]);
  });

  it("uses one communication sidebar entry with a consistent notification workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/notifications");
    expect(NOTIFICATION_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/notifications",
      "/dashboard/notifications/bulk",
      "/dashboard/notifications/templates",
    ]);
  });

  it("uses one service sidebar entry with a consistent service workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/services");
    expect(SERVICE_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/services",
      "/dashboard/appointments",
      "/dashboard/quotes",
    ]);
  });

  it("uses one customer sidebar entry with a consistent customer workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/customers");
    expect(CUSTOMER_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/customers",
      "/dashboard/vehicles",
      "/dashboard/customers/maintenance",
      "/dashboard/customers/import",
    ]);
  });

  it("uses one team sidebar entry with a consistent team workspace", () => {
    const teamEntry = visibleSidebarItems.find((item) => item.name === "Personel");

    expect(teamEntry).toBeDefined();
    expect(teamEntry?.href).toBe("/dashboard/mechanics");
    expect(teamEntry?.relatedHrefs).toEqual(["/dashboard/analytics/mechanics"]);
    expect(visibleHrefs).toContain("/dashboard/mechanics");
    expect(TEAM_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/mechanics",
      "/dashboard/analytics/mechanics",
    ]);
  });

  it("uses one reports sidebar entry with a consistent report workspace", () => {
    const reportsEntry = visibleSidebarItems.find((item) => item.name === "Raporlar");

    expect(reportsEntry).toBeDefined();
    expect(reportsEntry?.href).toBe("/dashboard/analytics");
    expect(reportsEntry?.relatedHrefs).toEqual([
      "/dashboard/finances/reports",
      "/dashboard/inventory/reports",
    ]);
    expect(REPORT_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/analytics",
      "/dashboard/finances/reports",
      "/dashboard/inventory/reports",
    ]);
    expect(isDashboardNavItemActive(reportsEntry!, "/dashboard/finances/reports")).toBe(true);
  });

  it("keeps sidebar active state aligned with workspace route ownership", () => {
    const teamEntry = visibleSidebarItems.find((item) => item.name === "Personel");
    const reportsEntry = visibleSidebarItems.find((item) => item.name === "Raporlar");

    expect(teamEntry).toBeDefined();
    expect(reportsEntry).toBeDefined();
    expect(isDashboardNavItemActive(teamEntry!, "/dashboard/analytics/mechanics")).toBe(true);
    expect(isDashboardNavItemActive(reportsEntry!, "/dashboard/analytics/mechanics")).toBe(false);
  });

  it("routes role-limited users to the first accessible page in a consolidated workspace", () => {
    const customerEntry = visibleSidebarItems.find((item) => item.name === "Müşteri & Araç");

    expect(customerEntry).toBeDefined();
    expect(customerEntry?.href).toBe("/dashboard/customers");
    expect(customerEntry?.relatedHrefs).toContain("/dashboard/vehicles");
    expect(filterNavItems("MECHANIC", customerEntry ? [customerEntry] : [])).toHaveLength(1);
    expect(resolveNavItemHref("MECHANIC", customerEntry!)).toBe("/dashboard/vehicles");
    expect(resolveNavItemHref("RECEPTIONIST", customerEntry!)).toBe("/dashboard/customers");
    expect(isDashboardNavItemActive(customerEntry!, "/dashboard/vehicles/vehicle-001")).toBe(true);
  });

  it("uses one finance sidebar entry with a consistent finance workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/finances");
    expect(FINANCE_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/finances",
      "/dashboard/finances/invoices",
      "/dashboard/finances/payments",
      "/dashboard/finances/payments/checks",
      "/dashboard/finances/reports",
    ]);
  });

  it("uses one inventory sidebar entry with a consistent inventory workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/inventory");
    expect(INVENTORY_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/inventory",
      "/dashboard/inventory/purchases",
      "/dashboard/inventory/purchase-orders",
      "/dashboard/inventory/transfers",
      "/dashboard/inventory/stock-counts",
      "/dashboard/inventory/reports",
      "/dashboard/suppliers",
    ]);
  });

  it("uses one settings sidebar entry with a consistent settings workspace", () => {
    expect(visibleHrefs).toContain("/dashboard/settings");
    expect(SETTINGS_WORKSPACE_TABS.map((item) => item.href)).toEqual([
      "/dashboard/settings",
      "/dashboard/settings/locations",
      "/dashboard/settings/notifications",
      "/dashboard/settings/e-invoice",
      "/dashboard/settings/parasut",
      "/dashboard/settings/billing",
      "/dashboard/settings/referral",
    ]);
  });
});
