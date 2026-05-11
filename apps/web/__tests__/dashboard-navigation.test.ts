import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_QUICK_LINKS,
  MOBILE_WEB_NAV_ITEMS,
  flattenDashboardNavGroups,
} from "@/lib/dashboard-navigation";
import { FINANCE_WORKSPACE_TABS } from "@/lib/finance-workspace";
import { NOTIFICATION_WORKSPACE_TABS } from "@/lib/notification-workspace";
import { SETTINGS_WORKSPACE_TABS } from "@/lib/settings-workspace";

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
    expect(visibleHrefs).not.toContain("/dashboard/customers/maintenance");
    expect(visibleHrefs).not.toContain("/dashboard/locations");
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
      "/dashboard/settings/notifications",
    ]);
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
